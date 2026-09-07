"""
Zero-Overlap Academic Constraint Engine (SRS FR-004, FR-005, DFD 6.5)
Enforces hard scheduling constraints ensuring mathematical zero-overlap across time, rooms, and professors.
"""

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
PERIODS = [1, 2, 3, 4, 5, 6, 7]


class TimetableConstraintEngine:
    def __init__(self, department='IT'):
        self.department = department

    def generate_department_drafts(self, year_configs=None, classrooms=None, labs=None, labs_per_section=2):
        """
        Generates draft timetables for Years 1, 2, 3, 4 with selected sections ensuring zero cross-section conflict.
        """
        if year_configs is None:
            year_configs = {
                1: {'sections': 2},
                2: {'sections': 2},
                3: {'sections': 2},
                4: {'sections': 2}
            }

        # Track global professor and room occupancies across all cohorts
        professor_schedule = {day: {p: set() for p in PERIODS} for day in DAYS}
        room_schedule = {day: {p: set() for p in PERIODS} for day in DAYS}

        all_drafts = []
        available_classrooms = classrooms or [
            f'{self.department}-LH101', f'{self.department}-LH102', 
            f'{self.department}-LH201', f'{self.department}-LH202'
        ]
        available_labs = labs or [
            f'{self.department}-LAB1', f'{self.department}-LAB2', f'{self.department}-LAB3'
        ]

        cr_idx = 0
        lab_idx = 0

        for year, config in year_configs.items():
            num_sections = config.get('sections', 2)
            section_names = ['A', 'B', 'C', 'D'][:num_sections]

            for sec in section_names:
                assigned_cr = available_classrooms[cr_idx % len(available_classrooms)]
                cr_idx += 1

                assigned_l1 = available_labs[lab_idx % len(available_labs)]
                assigned_l2 = available_labs[(lab_idx + 1) % len(available_labs)]
                lab_idx += labs_per_section

                draft = self._generate_single_section_schedule(
                    year, sec, professor_schedule, room_schedule, assigned_cr, [assigned_l1, assigned_l2], labs_per_section
                )
                all_drafts.append(draft)

        return all_drafts

    def _generate_single_section_schedule(self, year, section, prof_schedule, room_schedule, classroom, labs, labs_per_section):
        grid = {day: {p: None for p in PERIODS} for day in DAYS}

        subjects = [
            {'code': f'{self.department}{year}01', 'name': f'Core Subject 1', 'type': 'theory', 'profId': f'prof_{self.department.lower()}_1', 'profName': f'Dr. Faculty A', 'roomId': classroom},
            {'code': f'{self.department}{year}02', 'name': f'Core Subject 2', 'type': 'theory', 'profId': f'prof_{self.department.lower()}_2', 'profName': f'Dr. Faculty B', 'roomId': classroom},
            {'code': f'{self.department}{year}03', 'name': f'Core Subject 3', 'type': 'theory', 'profId': f'prof_{self.department.lower()}_3', 'profName': f'Dr. Faculty C', 'roomId': classroom},
            {'code': f'{self.department}{year}04', 'name': f'Core Subject 4', 'type': 'theory', 'profId': f'prof_{self.department.lower()}_4', 'profName': f'Dr. Faculty D', 'roomId': classroom},
            {'code': f'{self.department}{year}05L', 'name': f'Laboratory 1', 'type': 'lab', 'profId': f'prof_{self.department.lower()}_1', 'profName': f'Dr. Faculty A', 'roomId': labs[0]},
            {'code': f'{self.department}{year}06L', 'name': f'Laboratory 2', 'type': 'lab', 'profId': f'prof_{self.department.lower()}_2', 'profName': f'Dr. Faculty B', 'roomId': labs[1] if labs_per_section > 1 else labs[0]},
        ]

        # Allocate 2-hour labs first
        lab_period_pairs = [(5, 6), (3, 4), (1, 2)]
        for subj in [s for s in subjects if s['type'] == 'lab']:
            placed = False
            for day in DAYS:
                if placed:
                    break
                for p1, p2 in lab_period_pairs:
                    if grid[day][p1] is None and grid[day][p2] is None:
                        if (subj['profId'] not in prof_schedule[day][p1]) and (subj['profId'] not in prof_schedule[day][p2]) and \
                           (subj['roomId'] not in room_schedule[day][p1]) and (subj['roomId'] not in room_schedule[day][p2]):
                            grid[day][p1] = {
                                'id': f'slot_{day}_{p1}_{year}_{section}',
                                'subjectCode': subj['code'],
                                'subjectName': subj['name'],
                                'type': subj['type'],
                                'facultyId': subj['profId'],
                                'facultyName': subj['profName'],
                                'roomId': subj['roomId'],
                                'roomName': subj['roomId'],
                                'isLab': True
                            }
                            grid[day][p2] = {
                                'id': f'slot_{day}_{p2}_{year}_{section}',
                                'subjectCode': subj['code'],
                                'subjectName': subj['name'],
                                'type': subj['type'],
                                'facultyId': subj['profId'],
                                'facultyName': subj['profName'],
                                'roomId': subj['roomId'],
                                'roomName': subj['roomId'],
                                'isLab': True
                            }
                            prof_schedule[day][p1].add(subj['profId'])
                            prof_schedule[day][p2].add(subj['profId'])
                            room_schedule[day][p1].add(subj['roomId'])
                            room_schedule[day][p2].add(subj['roomId'])
                            placed = True
                            break

        # Allocate 1-hour theory lectures
        for subj in [s for s in subjects if s['type'] == 'theory']:
            # 3 to 4 hours per theory subject
            for _ in range(3):
                placed = False
                for day in DAYS:
                    if placed:
                        break
                    for p in PERIODS:
                        if grid[day][p] is None:
                            if (subj['profId'] not in prof_schedule[day][p]) and (subj['roomId'] not in room_schedule[day][p]):
                                grid[day][p] = {
                                    'id': f'slot_{day}_{p}_{year}_{section}',
                                    'subjectCode': subj['code'],
                                    'subjectName': subj['name'],
                                    'type': subj['type'],
                                    'facultyId': subj['profId'],
                                    'facultyName': subj['profName'],
                                    'roomId': subj['roomId'],
                                    'roomName': subj['roomId'],
                                    'isLab': False
                                }
                                prof_schedule[day][p].add(subj['profId'])
                                room_schedule[day][p].add(subj['roomId'])
                                placed = True
                                break

        return {
            'id': f'tt_{self.department}_Y{year}_S{section}',
            'department': self.department,
            'year': year,
            'section': section,
            'academicYear': '2026-2027',
            'status': 'DRAFT',
            'assignedClassroom': classroom,
            'assignedLabs': labs[:labs_per_section],
            'grid': grid
        }
