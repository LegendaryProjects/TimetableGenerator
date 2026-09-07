"""
Schedule Capture and Generation Blueprint (SRS FR-003, FR-004, DFD 6.4)
Handles fetching academic entity options from SQL database, generating zero-overlap schedules, and retrieving timetables.
"""

import uuid
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models import Department, Subject, Professor, Classroom, Laboratory, Timetable, LogFile
from backend.modules.user_auth.auth_routes import token_required, role_required
from backend.modules.genetic_algorithm.engine import TimetableConstraintEngine

schedule_bp = Blueprint('schedule', __name__, url_prefix='/api/schedule')


@schedule_bp.route('/options', methods=['GET'])
def get_options():
    """
    Returns valid academic dropdown constraints from D2: academic-data store (SRS FR-003)
    """
    dept_code = request.args.get('department', 'IT')
    year_num = request.args.get('year', type=int)

    departments = Department.query.all()
    professors = Professor.query.filter_by(department_id=dept_code).all() if dept_code else Professor.query.all()
    classrooms = Classroom.query.filter_by(department_id=dept_code).all() if dept_code else Classroom.query.all()
    laboratories = Laboratory.query.filter_by(department_id=dept_code).all() if dept_code else Laboratory.query.all()

    subject_query = Subject.query.filter_by(department_id=dept_code)
    if year_num:
        subject_query = subject_query.filter_by(year=year_num)
    subjects = subject_query.all()

    return jsonify({
        'departments': [d.to_dict() for d in departments],
        'professors': [p.to_dict() for p in professors],
        'classrooms': [c.to_dict() for c in classrooms],
        'laboratories': [l.to_dict() for l in laboratories],
        'subjects': [s.to_dict() for s in subjects],
        'years': [1, 2, 3, 4],
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
    sections_count = data.get('sectionsCount', 2)

    engine = TimetableConstraintEngine(department=department)
    year_configs = {
        y: {'sections': sections_count} for y in [1, 2, 3, 4]
    }
    drafts = engine.generate_department_drafts(year_configs)

    if not drafts:
        log = LogFile(
            user_id=current_user.user_id,
            action='GENERATION_FAILED_INFEASIBLE',
            status_code=422,
            message=f"Constraint solver could not find a zero-overlap schedule for department {department}",
            error_code='INFEASIBLE_CONSTRAINTS'
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({
            'error': 'Generation Aborted: Mathematically impossible to achieve zero-overlapping with current constraints.',
            'isFeasible': False
        }), 422

    # Save generated draft schedules into D3: timetables database
    saved_timetables = []
    for d in drafts:
        tt_id = d.get('id') or f"tt_{department}_{d['year']}_{d['section']}_{uuid.uuid4().hex[:6]}"
        existing = db.session.get(Timetable, tt_id)
        if existing:
            existing.grid_data = d.get('grid', {})
            existing.status = 'DRAFT'
            existing.assigned_classroom = d.get('assignedClassroom')
            existing.assigned_labs = d.get('assignedLabs', [])
            saved_timetables.append(existing)
        else:
            new_tt = Timetable(
                id=tt_id,
                department_id=department,
                year=d['year'],
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
