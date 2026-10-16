"""
Schedule Capture and Generation Blueprint (SRS FR-003, FR-004, DFD 6.4)
Handles fetching academic entity options from SQL database, generating zero-overlap schedules, and retrieving timetables.
"""

import uuid
import re
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models import Department, Subject, Professor, Classroom, Laboratory, Timetable, LogFile, User
from backend.modules.user_auth.auth_routes import token_required, role_required
from backend.modules.genetic_algorithm.engine import TimetableConstraintEngine

schedule_bp = Blueprint('schedule', __name__, url_prefix='/api/schedule')


@schedule_bp.route('/options', methods=['GET'])
def get_options():
    """
    Returns valid academic dropdown constraints from D2: academic-data store (SRS FR-003)
    """
    dept_code = request.args.get('department')
    year_num = request.args.get('year', type=int)
    sem_num = request.args.get('semester', type=int)

    departments = Department.query.all()
    # Map HoDs from users table to departments
    hod_map = {u.department: u for u in User.query.filter_by(role='HoD').all()}
    dept_list = []
    for d in departments:
        d_dict = d.to_dict()
        hod = hod_map.get(d.id)
        if hod:
            d_dict['hodEmail'] = hod.email
            d_dict['hodName'] = hod.name
            d_dict['hodUserId'] = hod.user_id
        dept_list.append(d_dict)

    professors = Professor.query.filter_by(department_id=dept_code).all() if dept_code else Professor.query.all()
    classrooms = Classroom.query.filter_by(department_id=dept_code).all() if dept_code else Classroom.query.all()
    lab_dept = 'IT' if dept_code == 'AI' else dept_code
    laboratories = Laboratory.query.filter_by(department_id=lab_dept).all() if lab_dept else Laboratory.query.all()

    # Central Science Laboratories (Chemistry UG-CY-1..6 and Physics UG-PH-1..6)
    central_labs = Laboratory.query.filter(Laboratory.department_id.in_(['CY', 'PH'])).all()
    if sem_num in [1, 2] or year_num == 1 or not (sem_num or year_num):
        existing_lab_ids = {l.id for l in laboratories}
        for cl in central_labs:
            if cl.id not in existing_lab_ids:
                laboratories.append(cl)

    subject_query = Subject.query
    if dept_code:
        subject_query = subject_query.filter_by(department_id=dept_code)
    if sem_num:
        subject_query = subject_query.filter_by(semester=sem_num)
    subjects = subject_query.all()

    # Foundation professors for 1st & 2nd sem courses (Science: Physics/Chemistry, MACS: Maths, HSSM, CS: CSE/IT)
    foundation_depts = ['PH', 'CY', 'HSSM', 'MACS', 'CSE', 'IT']
    foundation_profs = Professor.query.filter(Professor.department_id.in_(foundation_depts)).all()
    all_profs = Professor.query.all()

    # Merge faculty users from User table so any newly registered professor appears seamlessly
    faculty_users = User.query.filter(
        (User.user_type == 'Faculty') | (User.role.in_(['HoD', 'FACULTY', 'PROFESSOR']))
    ).all()
    user_email_map = {(u.name.lower(), u.department): u.email for u in faculty_users}
    user_name_only_email_map = {u.name.lower(): u.email for u in faculty_users}

    prof_list = []
    seen_prof_emails = set()
    for p in professors:
        p_dict = p.to_dict()
        # Find matching email from registered users or formulate standard academic email
        matched_email = user_email_map.get((p.name.lower(), p.department_id)) or user_name_only_email_map.get(p.name.lower())
        if not matched_email:
            # Clean name for fallback email format: firstname.dept@nitk.edu.in
            name_clean = re.sub(r'[^a-z0-9\s]', '', p.name.lower().replace('dr.', '').replace('prof.', ''))
            parts = name_clean.split()
            clean_name = '.'.join(parts[:2]) if len(parts) >= 2 else (parts[0] if parts else 'faculty')
            matched_email = f"{clean_name}.{p.department_id.lower()}@nitk.edu.in"
        p_dict['email'] = matched_email
        prof_list.append(p_dict)
        seen_prof_emails.add(matched_email.lower())

    # Include any registered faculty user in this department who might not be in the pre-seeded professors table
    for fu in faculty_users:
        if fu.email.lower() not in seen_prof_emails:
            if not dept_code or fu.department == dept_code:
                prof_rec = Professor.query.filter(
                    (Professor.name.ilike(fu.name)) & (Professor.department_id == fu.department)
                ).first()
                prof_desig = prof_rec.designation if prof_rec else ('Professor & HoD' if fu.role == 'HoD' else 'Assistant Professor')
                prof_list.append({
                    'id': prof_rec.id if prof_rec else fu.user_id,
                    'name': fu.name,
                    'department': fu.department,
                    'designation': prof_desig,
                    'email': fu.email
                })
                seen_prof_emails.add(fu.email.lower())

    return jsonify({
        'departments': dept_list,
        'professors': prof_list,
        'foundationProfessors': [p.to_dict() for p in foundation_profs],
        'allProfessors': [p.to_dict() for p in all_profs],
        'classrooms': [c.to_dict() for c in classrooms],
        'laboratories': [l.to_dict() for l in laboratories],
        'centralLaboratories': [l.to_dict() for l in central_labs],
        'subjects': [s.to_dict() for s in subjects],
        'years': [1, 2, 3, 4],
        'semesters': [1, 2, 3, 4, 5, 6, 7, 8],
        'sections': ['A', 'B', 'C', 'D'],
        'workingDays': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'timeSlots': [
            {'id': 1, 'time': '08:00 - 08:45', 'label': 'Period 1'},
            {'id': 2, 'time': '09:00 - 09:45', 'label': 'Period 2'},
            {'id': 3, 'time': '10:00 - 10:45', 'label': 'Period 3'},
            {'id': 4, 'time': '11:00 - 11:45', 'label': 'Period 4'},
            {'id': 'lunch', 'time': '11:45 - 13:00', 'label': 'Lunch Break', 'isBreak': True},
            {'id': 5, 'time': '13:00 - 13:45', 'label': 'Period 5'},
            {'id': 6, 'time': '14:00 - 14:45', 'label': 'Period 6'},
            {'id': 7, 'time': '15:00 - 15:45', 'label': 'Period 7'},
            {'id': 8, 'time': '16:00 - 16:45', 'label': 'Period 8'},
            {'id': 9, 'time': '17:00 - 17:45', 'label': 'Period 9'},
            {'id': 10, 'time': '18:00 - 18:45', 'label': 'Period 10'}
        ]
    }), 200


@schedule_bp.route('/timetables', methods=['GET'])
def get_timetables():
    """
    Fetch timetables from D3: timetables store (SRS FR-007)
    Filtered by department, year, section, and approval status.
    """
    department = request.args.get('department')
    year = request.args.get('year', type=int)
    section = request.args.get('section')
    status = request.args.get('status')

    query = Timetable.query
    if department:
        query = query.filter_by(department_id=department)
    if year:
        query = query.filter_by(year=year)
    if section:
        query = query.filter_by(section=section)
    if status:
        query = query.filter_by(status=status)

    timetables = query.all()
    return jsonify({
        'timetables': [t.to_dict() for t in timetables]
    }), 200


@schedule_bp.route('/generate', methods=['POST'])
@role_required('HoD')
def generate_drafts(current_user):
    """
    Generates draft timetables with backend zero-overlap validation and saves to D3 store (SRS FR-004, FR-005)
    """
    data = request.get_json() or {}
    department = data.get('department', current_user.department or 'IT')
    year = data.get('year')
    semester = data.get('semester')
    if semester and not year:
        year = (int(semester) + 1) // 2
    section = data.get('section')
    sections_count = data.get('sectionsCount', 2)
    selected_subjects = data.get('selectedSubjects', [])
    selected_subjects_by_year = data.get('selectedSubjectsByYear')
    subject_settings = data.get('subjectSettings', {})
    sections_per_year = data.get('sectionsPerYear')
    sections_per_semester = data.get('sectionsPerSemester')
    selected_classrooms = data.get('selectedClassrooms')
    selected_labs = data.get('selectedLabs')
    section_classrooms = data.get('sectionClassrooms', {})
    semester_type = data.get('semesterType', 'odd')
    selected_classroom_id = data.get('selectedClassroomId') or data.get('selected_classroom_id')

    engine = TimetableConstraintEngine(department=department)

    if (year or semester) and section:
        draft = engine.generate_single_draft(
            year=year,
            semester=semester,
            section=section,
            selected_subjects=selected_subjects,
            subject_settings=subject_settings,
            selected_classrooms=selected_classrooms,
            selected_labs=selected_labs,
            selected_classroom_id=selected_classroom_id
        )
        drafts = [draft] if draft else []
    else:
        if sections_per_semester:
            is_even = str(semester_type).lower() == 'even'
            year_configs = {
                1: {'sections': int(sections_per_semester.get('2' if is_even else '1', sections_per_semester.get(2 if is_even else 1, 2)))},
                2: {'sections': int(sections_per_semester.get('4' if is_even else '3', sections_per_semester.get(4 if is_even else 3, 2)))},
                3: {'sections': int(sections_per_semester.get('6' if is_even else '5', sections_per_semester.get(6 if is_even else 5, 2)))},
                4: {'sections': int(sections_per_semester.get('8' if is_even else '7', sections_per_semester.get(8 if is_even else 7, 2)))},
            }
        elif sections_per_year:
            year_configs = {int(y): {'sections': int(s)} for y, s in sections_per_year.items()}
        else:
            year_configs = {y: {'sections': sections_count} for y in [1, 2, 3, 4]}

        subjs_by_yr = None
        if selected_subjects_by_year:
            subjs_by_yr = {int(y): s_list for y, s_list in selected_subjects_by_year.items()}

        drafts = engine.generate_department_drafts(
            year_configs=year_configs,
            classrooms=selected_classrooms,
            selected_subjects_by_year=subjs_by_yr,
            subject_settings=subject_settings,
            selected_labs=selected_labs,
            section_classrooms=section_classrooms,
            semester_type=semester_type
        )

    infeasible_drafts = [d for d in drafts if not d.get('isFeasible', True)]
    if not drafts or len(infeasible_drafts) > 0:
        unplaced_all = []
        for d in infeasible_drafts:
            unplaced_all.extend(d.get('unplacedSessions', []))
        log = LogFile(
            user_id=current_user.user_id,
            action='GENERATION_FAILED_INFEASIBLE',
            status_code=422,
            message=f"Constraint solver could not find zero-overlap schedule for {department}",
            error_code='INFEASIBLE_CONSTRAINTS'
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({
            'error': 'Generation Aborted: Mathematically impossible to achieve zero-overlapping with current constraints.',
            'isFeasible': False,
            'unplaced': unplaced_all
        }), 422

    # Save generated draft schedules into D3: timetables database
    saved_timetables = []
    for d in drafts:
        tt_id = d.get('id') or f"tt_{department}_{d['year']}_{d['section']}_{uuid.uuid4().hex[:6]}"
        sem_val = d.get('semester') or ((d['year'] * 2) - 1)
        existing = db.session.get(Timetable, tt_id)
        if existing:
            existing.grid_data = d.get('grid', {})
            existing.status = 'DRAFT'
            existing.semester = sem_val
            existing.assigned_classroom = d.get('assignedClassroom')
            existing.assigned_labs = d.get('assignedLabs', [])
            saved_timetables.append(existing)
        else:
            new_tt = Timetable(
                id=tt_id,
                department_id=department,
                year=d['year'],
                semester=sem_val,
                section=d['section'],
                status='DRAFT',
                assigned_classroom=d.get('assignedClassroom'),
                assigned_labs=d.get('assignedLabs', []),
                grid_data=d.get('grid', {}),
                is_feasible=d.get('isFeasible', True)
            )
            db.session.add(new_tt)
            saved_timetables.append(new_tt)

    log = LogFile(
        user_id=current_user.user_id,
        action='GENERATION_SUCCESS',
        status_code=200,
        message=f"Successfully formulated {len(drafts)} zero-overlap draft timetables for {department}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f'Successfully generated and saved {len(drafts)} draft timetables.',
        'drafts': [t.to_dict() for t in saved_timetables]
    }), 200


@schedule_bp.route('/subjects', methods=['POST'])
def add_subject():
    """
    Creates or updates a course/subject in the academic curriculum (D2 store).
    """
    data = request.get_json() or {}
    code = (data.get('code') or '').strip().upper()
    name = (data.get('name') or '').strip()
    if not code:
        return jsonify({'error': 'Course code is required'}), 400
    if not name:
        name = f"Course {code}"

    department_id = data.get('department') or data.get('department_id') or 'IT'
    semester = int(data.get('semester') or 5)
    year = int(data.get('year') or max(1, (semester + 1) // 2))
    credits = int(data.get('credits') or 3)
    l_hours = int(data.get('l_hours') if data.get('l_hours') is not None else (data.get('l') or 3))
    t_hours = int(data.get('t_hours') if data.get('t_hours') is not None else (data.get('t') or 0))
    p_hours = int(data.get('p_hours') if data.get('p_hours') is not None else (data.get('p') or 0))

    ltp = f"({l_hours}-{t_hours}-{p_hours})"
    subj_type = 'lab' if (p_hours > 0 and l_hours == 0) else 'theory'
    requires_lab = p_hours > 0
    default_faculty_id = data.get('defaultFacultyId') or data.get('default_faculty_id') or None
    classes_per_week = l_hours + t_hours

    # Standard clean ID
    base_id = re.sub(r'[^a-zA-Z0-9]', '', code).lower()
    subject_id = f"{department_id.lower()}_{base_id}" if not base_id.startswith(department_id.lower()) else base_id

    existing = Subject.query.filter(
        (Subject.id == subject_id) | 
        ((Subject.code == code) & (Subject.department_id == department_id))
    ).first()

    if existing:
        existing.name = name
        existing.credits = credits
        existing.ltp = ltp
        existing.year = year
        existing.semester = semester
        existing.type = subj_type
        existing.requires_lab = requires_lab
        existing.classes_per_week = classes_per_week
        if default_faculty_id:
            existing.default_faculty_id = default_faculty_id
        db.session.commit()
        return jsonify({
            'message': f'Course {code} updated successfully',
            'subject': existing.to_dict()
        }), 200

    new_subj = Subject(
        id=subject_id,
        code=code,
        name=name,
        department_id=department_id,
        year=year,
        semester=semester,
        credits=credits,
        ltp=ltp,
        type=subj_type,
        requires_lab=requires_lab,
        default_faculty_id=default_faculty_id,
        classes_per_week=classes_per_week
    )
    db.session.add(new_subj)
    db.session.commit()

    return jsonify({
        'message': f'Course {code} added successfully',
        'subject': new_subj.to_dict()
    }), 201
