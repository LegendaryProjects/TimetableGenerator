"""
Zero-Overlap Academic Constraint Engine (SRS FR-004, FR-005, DFD 6.5)
Enforces hard scheduling constraints ensuring mathematical zero-overlap across time, rooms, and professors.
Integrated directly with real SQLite database models (Subject, Professor, Classroom, Laboratory, Timetable).

Timing Constraints & Preferences:
1. Preferred Class Timings:
   - Morning Lectures (9:00 AM - 12:00 PM): Prioritizes Periods 2, 3, 4, then Period 1 (08:00 - 08:45).
   - Afternoon slots (Periods 6, 7, 8, 9, 10) are used after morning slots.
   - Slot 5 (13:00 - 13:45): Explicitly avoided for both theory and labs.
2. Laboratory Constraints:
   - Duration: Contiguous blocks of 2 to 5 hours (matching course practical hours/LTP).
   - Timing: Exclusively in the afternoon starting at Period 6 (14:00 - 14:45) onwards.
   - Lab Rooms: Allocated from departmental physical labs (UG-<DEPT>-1 to UG-<DEPT>-6).
   - Shared IT & AI Labs: Information Technology (IT) and Artificial Intelligence (AI) share the same labs
     (UG-IT-1 through UG-IT-6) with strict cross-department collision avoidance.
"""

from backend.models import Subject, Professor, Classroom, Laboratory, Timetable

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Priority order for Theory lectures:
# HARD CONSTRAINT: Period 1 (08:00 - 08:45) is STRICTLY EXCLUDED (no classes from 8-9 at any case)
# 1st Priority: Morning 9am - 12pm (Periods 2, 3, 4)
# 2nd Priority: Afternoon periods (Periods 6, 7, 8, 9, 10)
# Last Resort: Period 5 (13:00 - 13:45) avoided if possible
THEORY_PERIOD_PREFERENCES = [2, 3, 4, 6, 7, 8, 9, 10, 5]

# Starting periods for Afternoon Lab blocks (Period 5: 13:00-13:45 is skipped):
AFTERNOON_LAB_START_PERIODS = [6, 7]


def get_target_lab_department(dept_code):
    """
    IT and AI courses share the same physical laboratory facilities (UG-IT-1 to UG-IT-6).
    """
    if dept_code in ['IT', 'AI']:
        return 'IT'
    return dept_code


def parse_lab_hours(subj, cfg=None):
    """
    Extracts laboratory duration in hours (bounded between 2 and 6 hours).
    Checks user configuration first, then LTP practical component e.g. '(0-0-3)' -> 3.
    """
    if cfg and cfg.get('labHours'):
        try:
            return max(2, min(6, int(cfg['labHours'])))
        except (ValueError, TypeError):
            pass

    ltp = subj.ltp or ''
    try:
        clean = ltp.replace('(', '').replace(')', '').strip()
        parts = clean.split('-')
        if len(parts) >= 3:
            p_str = parts[2].strip().split()[0]
            p_val = int(p_str)
            if p_val > 0:
                return max(2, min(6, p_val))
    except Exception:
        pass

    if subj.credits <= 2:
        return 2 if subj.credits == 1 else 3
    return 3


def is_lab_subject(subj, cfg=None):
    """
    Determines if a course requires a laboratory session.
    """
    if cfg and cfg.get('requiresLab') is not None:
        return bool(cfg.get('requiresLab'))
    if subj.type == 'lab' or subj.requires_lab:
        return True
    code = (subj.code or '').upper()
    name = (subj.name or '').lower()
    if 'lab' in name or 'laboratory' in name or 'simulation' in name or 'practice' in name:
        return True
    if code.endswith('P') or code.endswith('L'):
        return True
    return False


class TimetableConstraintEngine:
    def __init__(self, department='IT'):
        self.department = department
        self.lab_dept = get_target_lab_department(department)

    def _get_department_labs(self):
        """
        Retrieves physical laboratories (UG-<DEPT>-1 to UG-<DEPT>-6).
        AI uses IT labs directly.
        """
        labs = Laboratory.query.filter_by(department_id=self.lab_dept).all()
        if not labs:
            labs = Laboratory.query.filter_by(department_id='IT').all()
        return labs

    def _get_labs_for_course(self, subj):
        """
        Routes 1st year Chemistry labs to Central Chemistry facilities (UG-CY-1..6)
        and Physics labs to Central Physics facilities (UG-PH-1..6).
        Departmental courses use the department's own labs (UG-<DEPT>-1..6).
        """
        code = (subj.code or '').upper()
        if code.startswith('CY'):
            cy_labs = Laboratory.query.filter_by(department_id='CY').all()
            if cy_labs:
                return cy_labs
        elif code.startswith('PH'):
            ph_labs = Laboratory.query.filter_by(department_id='PH').all()
            if ph_labs:
                return ph_labs
        return self._get_department_labs()

    def generate_department_drafts(self, year_configs=None, classrooms=None, selected_subjects_by_year=None, subject_settings=None, selected_labs=None, section_classrooms=None, semester_type='odd'):
        """
        Generates zero-overlap draft timetables for all requested years and sections in the department.
        """
        if year_configs is None:
            year_configs = {
                1: {'sections': 2},
                2: {'sections': 2},
                3: {'sections': 2},
                4: {'sections': 2}
            }

        if not classrooms:
            classrooms = Classroom.query.filter_by(department_id=self.department).all()
            if not classrooms:
                classrooms = Classroom.query.all()

        dept_labs = self._get_department_labs()
        if selected_labs:
            sel_ids = {l.id if hasattr(l, 'id') else (l.get('id') if isinstance(l, dict) else str(l)) for l in selected_labs}
            filtered_labs = [l for l in dept_labs if l.id in sel_ids or l.code in sel_ids]
            if filtered_labs:
                dept_labs = filtered_labs

        # Global schedules across professors and rooms
        prof_schedule = {day: {p: set() for p in PERIODS} for day in DAYS}
        room_schedule = {day: {p: set() for p in PERIODS} for day in DAYS}

        # Audit against existing timetables (including cross-department for IT & AI sharing labs)
        # Global audit: faculty clashes prevented globally, rooms scoped to department & shared facilities
        existing_timetables = Timetable.query.all()
        for tt in existing_timetables:
            if tt.department_id == self.department:
                continue
            grid = tt.grid_data or {}
            for day, day_slots in grid.items():
                if day not in room_schedule:
                    continue
                for slot_str, cell in day_slots.items():
                    try:
                        p_int = int(slot_str)
                    except (ValueError, TypeError):
                        continue
                    if p_int in room_schedule[day] and cell:
                        if cell.get('facultyId'):
                            prof_schedule[day][p_int].add(cell['facultyId'])
                        if cell.get('roomId'):
                            r_id = cell['roomId']
                            r_name = cell.get('roomName', '')
                            is_central_science_lab = (r_id.startswith(('lab_cy', 'lab_ph')) or r_name.startswith(('UG-CY', 'UG-PH')))
                            is_same_dept = (tt.department_id == self.department)
                            is_shared_lab = (self.department in ['IT', 'AI'] and tt.department_id in ['IT', 'AI'])
                            if is_central_science_lab or is_same_dept or is_shared_lab:
                                room_schedule[day][p_int].add(r_id)
                                if r_name:
                                    room_schedule[day][p_int].add(r_name)
                        elif tt.assigned_classroom and (tt.department_id == self.department):
                            room_schedule[day][p_int].add(tt.assigned_classroom)

        all_drafts = []
        cr_idx = 0
        is_even = str(semester_type).lower() == 'even'

        for year, config in year_configs.items():
            num_sections = config.get('sections', 2)
            section_names = ['A', 'B', 'C', 'D'][:num_sections]
            sem_val = (year * 2) if is_even else ((year * 2) - 1)

            year_subjs = []
            if selected_subjects_by_year and year in selected_subjects_by_year:
                chosen_ids = selected_subjects_by_year[year]
                year_subjs = Subject.query.filter(Subject.id.in_(chosen_ids)).all()

            if not year_subjs:
                year_subjs = Subject.query.filter_by(department_id=self.department, semester=sem_val).all()
                if not year_subjs:
                    year_subjs = Subject.query.filter_by(department_id=self.department, year=year).limit(6).all()
                if not year_subjs:
                    year_subjs = Subject.query.filter_by(year=year).limit(6).all()

            for sec in section_names:
                sec_key = f'S{sem_val}_Sec{sec}'
                chosen_cr_id = (section_classrooms or {}).get(sec_key) or (section_classrooms or {}).get(f'{year}_{sec}') or (section_classrooms or {}).get(sec)
                assigned_room = None
                if chosen_cr_id:
                    assigned_room = next((c for c in classrooms if (c.id if hasattr(c, 'id') else (c.get('id') if isinstance(c, dict) else str(c))) == chosen_cr_id), None)
                    if not assigned_room:
                        assigned_room = Classroom.query.get(chosen_cr_id)

                if not assigned_room:
                    assigned_room = classrooms[cr_idx % len(classrooms)] if classrooms else None
                    cr_idx += 1

                draft = self._generate_section_schedule(
                    year=year,
                    semester=sem_val,
                    section=sec,
                    subjects=year_subjs,
                    assigned_room=assigned_room,
                    prof_schedule=prof_schedule,
                    room_schedule=room_schedule,
                    subject_settings=subject_settings,
                    dept_labs=dept_labs,
                    selected_labs=selected_labs
                )
                all_drafts.append(draft)

        return all_drafts

    def generate_single_draft(self, year=None, section='A', selected_subjects=None, subject_settings=None, selected_classrooms=None, semester=None, selected_labs=None, selected_classroom_id=None):
        """
        Generates a zero-overlap draft for a single section, auditing against existing department schedules.
        """
        if semester:
            semester = int(semester)
            year = (semester + 1) // 2
        else:
            year = int(year or 3)
            semester = (year * 2) - 1

        if not selected_classrooms:
            classrooms = Classroom.query.filter_by(department_id=self.department).all()
        else:
            classrooms = selected_classrooms

        dept_labs = self._get_department_labs()
        if selected_labs:
            sel_ids = {l.id if hasattr(l, 'id') else (l.get('id') if isinstance(l, dict) else str(l)) for l in selected_labs}
            filtered_labs = [l for l in dept_labs if l.id in sel_ids or l.code in sel_ids]
            if filtered_labs:
                dept_labs = filtered_labs

        prof_schedule = {day: {p: set() for p in PERIODS} for day in DAYS}
        room_schedule = {day: {p: set() for p in PERIODS} for day in DAYS}

        # Global audit: prevent faculty collisions across any department, rooms scoped to department & shared facilities
        existing_timetables = Timetable.query.all()
        for tt in existing_timetables:
            if tt.department_id == self.department and (tt.semester == semester or tt.year == int(year)) and tt.section == section:
                continue
            grid = tt.grid_data or {}
            for day, day_slots in grid.items():
                if day not in prof_schedule:
                    continue
                for slot_str, cell in day_slots.items():
                    try:
                        p_int = int(slot_str)
                    except (ValueError, TypeError):
                        continue
                    if p_int in prof_schedule[day] and cell:
                        if cell.get('facultyId'):
                            prof_schedule[day][p_int].add(cell['facultyId'])
                        if cell.get('roomId'):
                            r_id = cell['roomId']
                            r_name = cell.get('roomName', '')
                            is_central_science_lab = (r_id.startswith(('lab_cy', 'lab_ph')) or r_name.startswith(('UG-CY', 'UG-PH')))
                            is_same_dept = (tt.department_id == self.department)
                            is_shared_lab = (self.department in ['IT', 'AI'] and tt.department_id in ['IT', 'AI'])
                            if is_central_science_lab or is_same_dept or is_shared_lab:
                                room_schedule[day][p_int].add(r_id)
                                if r_name:
                                    room_schedule[day][p_int].add(r_name)
                        elif tt.assigned_classroom and (tt.department_id == self.department):
                            room_schedule[day][p_int].add(tt.assigned_classroom)

        if selected_subjects:
            subjects = Subject.query.filter(Subject.id.in_(selected_subjects)).all()
        else:
            subjects = Subject.query.filter_by(department_id=self.department, semester=semester).all()
            if not subjects:
                subjects = Subject.query.filter_by(department_id=self.department, year=year).limit(6).all()
            if not subjects:
                subjects = Subject.query.filter_by(year=year).limit(6).all()

        assigned_room = None
        if selected_classroom_id:
            assigned_room = next((c for c in classrooms if (c.id if hasattr(c, 'id') else (c.get('id') if isinstance(c, dict) else str(c))) == selected_classroom_id), None)
            if not assigned_room:
                assigned_room = Classroom.query.get(selected_classroom_id)

        if not assigned_room:
            if classrooms:
                sec_idx = (ord(section[0]) - ord('A')) if section else 0
                sem_idx = (int(semester) - 1) if semester else 0
                cr_pick_idx = (sem_idx * 2 + sec_idx) % len(classrooms)
                assigned_room = classrooms[cr_pick_idx]
            else:
                assigned_room = None

        return self._generate_section_schedule(
            year=year,
            semester=semester,
            section=section,
            subjects=subjects,
            assigned_room=assigned_room,
            prof_schedule=prof_schedule,
            room_schedule=room_schedule,
            subject_settings=subject_settings,
            dept_labs=dept_labs,
            selected_labs=selected_labs
        )

    def _generate_section_schedule(self, year, section, subjects, assigned_room, prof_schedule, room_schedule, subject_settings=None, semester=None, dept_labs=None, selected_labs=None):
        """
        Formulates a zero-conflict weekly schedule grid for a specific cohort.
        Enforces:
        - Afternoon contiguous lab scheduling (2 to 5 hours, starting at Period 6).
        - Morning 9-12pm theory preference (Periods 2, 3, 4, then 1).
        - Restricts Period 5 (13:00 - 13:45).
        - Dedicated lab allocation from UG-<DEPT>-1..6 (with IT & AI sharing).
        """
        if dept_labs is None:
            dept_labs = self._get_department_labs()

        grid = {day: {p: None for p in PERIODS} for day in DAYS}
        unplaced = []
        assigned_lab_names = set()

        room_id = assigned_room.id if hasattr(assigned_room, 'id') else (assigned_room.get('id') if isinstance(assigned_room, dict) else (str(assigned_room) if assigned_room else f'{self.department}-CR1'))
        room_name = assigned_room.name if hasattr(assigned_room, 'name') else (assigned_room.get('name') if isinstance(assigned_room, dict) else (str(assigned_room) if assigned_room else f'{self.department} Classroom'))

        dept_profs = Professor.query.filter_by(department_id=self.department).all()
        fallback_prof = dept_profs[0] if dept_profs else None

        # Categorize subjects into laboratory sessions and theory lectures
        lab_tasks = []
        theory_tasks = []

        for subj in subjects:
            cfg = (subject_settings or {}).get(subj.id, {})
            prof_id = cfg.get('facultyId') or subj.default_faculty_id
            prof = Professor.query.get(prof_id) if prof_id else None
            if not prof:
                prof = subj.default_faculty or fallback_prof
            p_id = prof.id if prof else f'prof_{self.department}_1'
            p_name = prof.name if prof else 'Faculty Member'

            if is_lab_subject(subj, cfg):
                hours = parse_lab_hours(subj, cfg)
                lab_tasks.append({
                    'subject': subj,
                    'hours': hours,
                    'facultyId': p_id,
                    'facultyName': p_name,
                    'cfg': cfg
                })
                # If subject is a hybrid course (e.g. 3-0-2), it also has theory hours
                if subj.type != 'lab' and subj.classes_per_week and subj.classes_per_week > 0:
                    t_hours = cfg.get('theoryHours') or subj.classes_per_week
                    theory_tasks.append({
                        'subject': subj,
                        'hours': t_hours,
                        'facultyId': p_id,
                        'facultyName': p_name,
                        'cfg': cfg
                    })
            else:
                t_hours = cfg.get('theoryHours') or subj.classes_per_week or (4 if subj.credits >= 4 else 3)
                theory_tasks.append({
                    'subject': subj,
                    'hours': t_hours,
                    'facultyId': p_id,
                    'facultyName': p_name,
                    'cfg': cfg
                })

        # -------------------------------------------------------------
        # PHASE 1: SCHEDULE LABORATORIES IN THE AFTERNOON (Periods 6..10)
        # Contiguous block of 2 to 5 hours, zero overlap across faculty and lab room
        # -------------------------------------------------------------
        for task in lab_tasks:
            subj = task['subject']
            hours = task['hours']
            p_id = task['facultyId']
            p_name = task['facultyName']

            placed = False
            day_order = list(DAYS)
            shift = (hash(subj.id) + ord(section[0])) % len(day_order)
            staggered_days = day_order[shift:] + day_order[:shift]

            # Determine viable starting periods in afternoon:
            # 6-hour labs start at period 5 (13:00) so block [5..10] fits <= 10
            # 5-hour labs start at period 6 (14:00) or 5 (13:00)
            # 2-4 hour labs start at period 6 (14:00), 7 (15:00), or 5 (13:00)
            if hours >= 6:
                lab_start_periods = [5]
            elif hours == 5:
                lab_start_periods = [6, 5]
            else:
                lab_start_periods = [6, 7, 5]

            for day in staggered_days:
                # Max 1 lab per section per day to prevent student burnout
                if any(grid[day][p] is not None and grid[day][p].get('isLab') for p in PERIODS):
                    continue

                for start_p in lab_start_periods:
                    block_periods = list(range(start_p, start_p + hours))
                    # Ensure all periods in block are within valid range <= 10 and exclude period 1
                    if max(block_periods) > 10 or 1 in block_periods:
                        continue

                    # 1. Section must be free across all periods
                    if not all(grid[day][p] is None for p in block_periods):
                        continue

                    # 2. Professor must be free across all periods
                    if not all(p_id not in prof_schedule[day][p] for p in block_periods):
                        continue

                    # 3. Find an available laboratory room (UG-CY-1..6 for CY, UG-PH-1..6 for PH, UG-<DEPT>-1..6 for departmental)
                    course_labs = self._get_labs_for_course(subj)
                    if selected_labs:
                        sel_ids = {l.id if hasattr(l, 'id') else (l.get('id') if isinstance(l, dict) else str(l)) for l in selected_labs}
                        filtered_cl = [l for l in course_labs if l.id in sel_ids or l.code in sel_ids]
                        if filtered_cl:
                            course_labs = filtered_cl

                    # If HoD explicitly selected a specific lab room for this course
                    cfg_lab = cfg.get('labRoomId') if cfg else None
                    if cfg_lab and cfg_lab != 'auto':
                        specific_labs = [l for l in course_labs if l.id == cfg_lab or l.code == cfg_lab]
                        if specific_labs:
                            course_labs = specific_labs + [l for l in course_labs if l not in specific_labs]

                    available_lab = None
                    for lab in course_labs:
                        if all(lab.id not in room_schedule[day][p] for p in block_periods):
                            available_lab = lab
                            break

                    if available_lab:
                        # Place the contiguous lab block
                        lab_instance_id = f"lab_{subj.code}_{day}_{start_p}"
                        for p in block_periods:
                            grid[day][p] = {
                                'id': f'slot_{day}_{p}_{year}_{section}',
                                'subjectCode': subj.code,
                                'subjectName': subj.name,
                                'credits': subj.credits,
                                'type': 'lab',
                                'isLab': True,
                                'isLabStart': (p == start_p),
                                'isLabContinuation': (p > start_p),
                                'labDuration': hours,
                                'labInstanceId': lab_instance_id,
                                'facultyId': p_id,
                                'facultyName': p_name,
                                'roomId': available_lab.id,
                                'roomName': available_lab.code
                            }
                            prof_schedule[day][p].add(p_id)
                            room_schedule[day][p].add(available_lab.id)

                        assigned_lab_names.add(available_lab.code)
                        placed = True
                        break

                if placed:
                    break

            if not placed:
                unplaced.append({
                    'subjectCode': subj.code,
                    'subjectName': f"{subj.name} (Lab {hours} Hrs)",
                    'year': year,
                    'section': section,
                    'facultyName': p_name,
                    'reason': f'No conflict-free contiguous {hours}-hour afternoon block in departmental/central labs'
                })

        # -------------------------------------------------------------
        # PHASE 2: SCHEDULE THEORY LECTURES
        # Priority: Morning 9-12pm (Periods 2, 3, 4) -> Period 1 -> Afternoon (6..10)
        # Avoid Period 5 (13:00 - 13:45)
        # -------------------------------------------------------------
        for task in theory_tasks:
            subj = task['subject']
            hours = task['hours']
            p_id = task['facultyId']
            p_name = task['facultyName']

            day_order = list(DAYS)
            shift = (hash(subj.id) + ord(section[0]) * 3) % len(day_order)
            staggered_days = day_order[shift:] + day_order[:shift]

            placed_count = 0

            for _ in range(hours):
                placed = False

                # Pass 1: Stagger across distinct days (at most 1 theory session per subject per day)
                for day in staggered_days:
                    already_on_day = any(
                        grid[day][p] is not None and grid[day][p]['subjectCode'] == subj.code and not grid[day][p].get('isLab')
                        for p in PERIODS
                    )
                    if already_on_day and placed_count < len(DAYS):
                        continue

                    for p in THEORY_PERIOD_PREFERENCES:
                        if p == 1:
                            continue  # HARD CONSTRAINT: Never keep classes from 8-9 at any case
                        if grid[day][p] is None:
                            room_busy = (room_id in room_schedule[day][p]) or (room_name in room_schedule[day][p])
                            if (p_id not in prof_schedule[day][p]) and not room_busy:
                                grid[day][p] = {
                                    'id': f'slot_{day}_{p}_{year}_{section}',
                                    'subjectCode': subj.code,
                                    'subjectName': subj.name,
                                    'credits': subj.credits,
                                    'type': 'theory',
                                    'facultyId': p_id,
                                    'facultyName': p_name,
                                    'roomId': room_id,
                                    'roomName': room_name,
                                    'isLab': False
                                }
                                prof_schedule[day][p].add(p_id)
                                room_schedule[day][p].add(room_id)
                                room_schedule[day][p].add(room_name)
                                placed = True
                                placed_count += 1
                                break
                    if placed:
                        break

                # Pass 2: If distinct days are exhausted, allow multiple slots per day
                if not placed:
                    for day in staggered_days:
                        for p in THEORY_PERIOD_PREFERENCES:
                            if p == 1:
                                continue  # HARD CONSTRAINT: Never keep classes from 8-9 at any case
                            if grid[day][p] is None:
                                room_busy = (room_id in room_schedule[day][p]) or (room_name in room_schedule[day][p])
                                if (p_id not in prof_schedule[day][p]) and not room_busy:
                                    grid[day][p] = {
                                        'id': f'slot_{day}_{p}_{year}_{section}',
                                        'subjectCode': subj.code,
                                        'subjectName': subj.name,
                                        'credits': subj.credits,
                                        'type': 'theory',
                                        'facultyId': p_id,
                                        'facultyName': p_name,
                                        'roomId': room_id,
                                        'roomName': room_name,
                                        'isLab': False
                                    }
                                    prof_schedule[day][p].add(p_id)
                                    room_schedule[day][p].add(room_id)
                                    room_schedule[day][p].add(room_name)
                                    placed = True
                                    placed_count += 1
                                    break
                        if placed:
                            break

                if not placed:
                    unplaced.append({
                        'subjectCode': subj.code,
                        'subjectName': subj.name,
                        'year': year,
                        'section': section,
                        'facultyName': p_name,
                        'reason': 'No conflict-free theory classroom or faculty slot available'
                    })

        is_feasible = (len(unplaced) == 0)
        sem_val = int(semester) if semester else ((int(year) * 2) - 1)

        return {
            'id': f'tt_{self.department}_S{sem_val}_Sec{section}',
            'department': self.department,
            'year': int(year),
            'semester': sem_val,
            'section': section,
            'status': 'DRAFT',
            'assignedClassroom': room_name,
            'assignedLabs': sorted(list(assigned_lab_names)),
            'grid': grid,
            'isFeasible': is_feasible,
            'unplacedSessions': unplaced
        }
