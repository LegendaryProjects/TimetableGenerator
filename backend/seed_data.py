"""
Database Seeding Script for Automated College Timetable Generator
Pre-populates NITK Departments, Faculty, Courses, Classrooms, Labs, Users, and Baseline Schedules.
"""

import bcrypt
from datetime import datetime
from backend.database import db
from backend.models import User, Department, Professor, Subject, Classroom, Laboratory, Timetable


def hash_password(plain_text_password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_text_password.encode('utf-8'), salt).decode('utf-8')


def seed_database():
    """Seed the database with complete NITK institutional entities."""

    # 1. Departments
    departments_data = [
        {
            'id': 'IT',
            'name': 'Information Technology',
            'code': 'IT',
            'hod_name': 'Dr. B. R. Mohan',
            'hod_id': 'hod_it'
        },
        {
            'id': 'CSE',
            'name': 'Computer Science and Engineering',
            'code': 'CSE',
            'hod_name': 'Dr. Subhash Babu',
            'hod_id': 'hod_cse'
        },
        {
            'id': 'ECE',
            'name': 'Electronics and Communication Engineering',
            'code': 'ECE',
            'hod_name': 'Dr. Deepu Vijayasenan',
            'hod_id': 'hod_ece'
        },
        {
            'id': 'AI',
            'name': 'Artificial Intelligence',
            'code': 'AI',
            'hod_name': 'Dr. Sowmya Kamath S',
            'hod_id': 'hod_ai'
        }
    ]

    for d in departments_data:
        if not db.session.get(Department, d['id']):
            dept = Department(**d)
            db.session.add(dept)

    db.session.commit()

    # 2. Professors
    professors_data = [
        # IT Professors
        {'id': 'p1', 'name': 'Dr. Geetha V', 'department_id': 'IT', 'designation': 'Associate Professor', 'cabin': 'IT-302'},
        {'id': 'p2', 'name': 'Dr. B. R. Mohan', 'department_id': 'IT', 'designation': 'Professor & HoD', 'cabin': 'IT-HoD'},
        {'id': 'p3', 'name': 'Dr. Sourav Kanti Addya', 'department_id': 'IT', 'designation': 'Assistant Professor', 'cabin': 'IT-305'},
        {'id': 'p4', 'name': 'Dr. Dinesh Naik', 'department_id': 'IT', 'designation': 'Associate Professor', 'cabin': 'IT-308'},
        {'id': 'p5', 'name': 'Dr. Nagamma Patil', 'department_id': 'IT', 'designation': 'Associate Professor', 'cabin': 'IT-310'},
        {'id': 'p6', 'name': 'Dr. Jaidhar C. D.', 'department_id': 'IT', 'designation': 'Associate Professor', 'cabin': 'IT-312'},
        {'id': 'p7', 'name': 'Dr. Bhawana Rudra', 'department_id': 'IT', 'designation': 'Assistant Professor', 'cabin': 'IT-315'},
        {'id': 'p8', 'name': 'Dr. Anand Kumar M', 'department_id': 'IT', 'designation': 'Assistant Professor', 'cabin': 'IT-318'},
        
        # CSE Professors
        {'id': 'p9', 'name': 'Dr. Subhash Babu', 'department_id': 'CSE', 'designation': 'Professor & HoD', 'cabin': 'CSE-HoD'},
        {'id': 'p10', 'name': 'Dr. Alwyn R. Pais', 'department_id': 'CSE', 'designation': 'Professor', 'cabin': 'CSE-202'},
        {'id': 'p11', 'name': 'Dr. Basavaraj Talawar', 'department_id': 'CSE', 'designation': 'Associate Professor', 'cabin': 'CSE-205'},
        {'id': 'p12', 'name': 'Dr. Mohit P. Tahiliani', 'department_id': 'CSE', 'designation': 'Associate Professor', 'cabin': 'CSE-208'},

        # ECE Professors
        {'id': 'p13', 'name': 'Dr. Deepu Vijayasenan', 'department_id': 'ECE', 'designation': 'Professor & HoD', 'cabin': 'ECE-HoD'},
        {'id': 'p14', 'name': 'Dr. Sumam David S', 'department_id': 'ECE', 'designation': 'Professor', 'cabin': 'ECE-101'},
        {'id': 'p15', 'name': 'Dr. M. S. Bhat', 'department_id': 'ECE', 'designation': 'Professor', 'cabin': 'ECE-104'},

        # AI Professors
        {'id': 'p16', 'name': 'Dr. Sowmya Kamath S', 'department_id': 'AI', 'designation': 'Associate Professor & HoD', 'cabin': 'AI-HoD'},
        {'id': 'p17', 'name': 'Dr. Shreeranga Bhat', 'department_id': 'AI', 'designation': 'Assistant Professor', 'cabin': 'AI-201'}
    ]

    for p in professors_data:
        if not db.session.get(Professor, p['id']):
            prof = Professor(**p)
            db.session.add(prof)

    db.session.commit()

    # 3. Classrooms
    classrooms_data = [
        {'id': 'cr_it1', 'code': 'CR 2.2 LHC-D', 'name': 'CR 2.2 LHC-D, NITK Surathkal', 'capacity': 120, 'department_id': 'IT'},
        {'id': 'cr_it2', 'code': 'CR 2.3 LHC-D', 'name': 'CR 2.3 LHC-D, NITK Surathkal', 'capacity': 120, 'department_id': 'IT'},
        {'id': 'cr_cse1', 'code': 'CR 1.1 LHC-C', 'name': 'CR 1.1 LHC-C, NITK Surathkal', 'capacity': 108, 'department_id': 'CSE'},
        {'id': 'cr_cse2', 'code': 'CR 1.2 LHC-C', 'name': 'CR 1.2 LHC-C, NITK Surathkal', 'capacity': 108, 'department_id': 'CSE'},
        {'id': 'cr_ece1', 'code': 'CR 3.1 LHC-B', 'name': 'CR 3.1 LHC-B, NITK Surathkal', 'capacity': 90, 'department_id': 'ECE'},
        {'id': 'cr_ai1', 'code': 'CR 4.1 LHC-A', 'name': 'CR 4.1 LHC-A, NITK Surathkal', 'capacity': 90, 'department_id': 'AI'}
    ]

    for cr in classrooms_data:
        if not db.session.get(Classroom, cr['id']):
            room = Classroom(**cr)
            db.session.add(room)

    # 4. Laboratories
    labs_data = [
        {'id': 'lab_it1', 'code': 'UG-Lab-3', 'name': 'UG-Lab-3, 6th Floor IT Dept, NITK Surathkal', 'capacity': 90, 'department_id': 'IT'},
        {'id': 'lab_it2', 'code': 'UG-Lab-2', 'name': 'UG-Lab-2, 6th Floor IT Dept, NITK Surathkal', 'capacity': 90, 'department_id': 'IT'},
        {'id': 'lab_cse1', 'code': 'CSE-Lab-1', 'name': 'CSE Software Lab 1, 3rd Floor CSE Dept, NITK Surathkal', 'capacity': 90, 'department_id': 'CSE'},
        {'id': 'lab_ece1', 'code': 'DSP-Lab', 'name': 'DSP & Communication Lab, ECE Dept, NITK Surathkal', 'capacity': 90, 'department_id': 'ECE'},
        {'id': 'lab_ai1', 'code': 'AI-Lab-1', 'name': 'Deep Learning & AI Lab, CS/AI Dept, NITK Surathkal', 'capacity': 90, 'department_id': 'AI'}
    ]

    for lb in labs_data:
        if not db.session.get(Laboratory, lb['id']):
            lab = Laboratory(**lb)
            db.session.add(lab)

    db.session.commit()

    # 5. Core Subjects for IT (Year 3)
    subjects_data = [
        {'id': 'it301', 'code': 'IT301', 'name': 'Design & Analysis of Algorithms', 'department_id': 'IT', 'year': 3, 'credits': 4, 'ltp': '(3-0-2)', 'type': 'theory', 'requires_lab': False, 'default_faculty_id': 'p1', 'classes_per_week': 3},
        {'id': 'it302', 'code': 'IT302', 'name': 'Database Systems', 'department_id': 'IT', 'year': 3, 'credits': 4, 'ltp': '(3-0-2)', 'type': 'theory', 'requires_lab': False, 'default_faculty_id': 'p2', 'classes_per_week': 3},
        {'id': 'it303', 'code': 'IT303', 'name': 'Operating Systems', 'department_id': 'IT', 'year': 3, 'credits': 4, 'ltp': '(3-0-2)', 'type': 'theory', 'requires_lab': False, 'default_faculty_id': 'p3', 'classes_per_week': 3},
        {'id': 'it304', 'code': 'IT304', 'name': 'Software Engineering', 'department_id': 'IT', 'year': 3, 'credits': 3, 'ltp': '(3-0-0)', 'type': 'theory', 'requires_lab': False, 'default_faculty_id': 'p4', 'classes_per_week': 3},
        {'id': 'it305', 'code': 'IT305', 'name': 'Computer Networks', 'department_id': 'IT', 'year': 3, 'credits': 4, 'ltp': '(3-0-2)', 'type': 'theory', 'requires_lab': False, 'default_faculty_id': 'p5', 'classes_per_week': 3},
        {'id': 'it306', 'code': 'IT306', 'name': 'Information Assurance & Security', 'department_id': 'IT', 'year': 3, 'credits': 3, 'ltp': '(3-0-0)', 'type': 'theory', 'requires_lab': False, 'default_faculty_id': 'p6', 'classes_per_week': 3},
        {'id': 'it351', 'code': 'IT351', 'name': 'Database Systems Lab', 'department_id': 'IT', 'year': 3, 'credits': 2, 'ltp': '(0-0-3)', 'type': 'lab', 'requires_lab': True, 'default_faculty_id': 'p2', 'classes_per_week': 2},
        {'id': 'it352', 'code': 'IT352', 'name': 'Operating Systems Lab', 'department_id': 'IT', 'year': 3, 'credits': 2, 'ltp': '(0-0-3)', 'type': 'lab', 'requires_lab': True, 'default_faculty_id': 'p3', 'classes_per_week': 2}
    ]

    for s in subjects_data:
        if not db.session.get(Subject, s['id']):
            subj = Subject(**s)
            db.session.add(subj)

    db.session.commit()

    # 6. Users (HoD & Viewer Student)
    default_pw_hash = hash_password('password123')
    
    users_data = [
        # HoDs
        {
            'user_id': 'user_hod_it',
            'email': 'hod.it@nitk.edu.in',
            'password_hash': default_pw_hash,
            'name': 'Dr. B. R. Mohan (HoD IT)',
            'role': 'HoD',
            'department': 'IT',
            'year': 3,
            'section': 'A',
            'user_type': 'Faculty'
        },
        {
            'user_id': 'user_hod_cse',
            'email': 'hod.cse@nitk.edu.in',
            'password_hash': default_pw_hash,
            'name': 'Dr. Subhash Babu (HoD CSE)',
            'role': 'HoD',
            'department': 'CSE',
            'year': 3,
            'section': 'A',
            'user_type': 'Faculty'
        },
        {
            'user_id': 'user_hod_ece',
            'email': 'hod.ece@nitk.edu.in',
            'password_hash': default_pw_hash,
            'name': 'Dr. Deepu Vijayasenan (HoD ECE)',
            'role': 'HoD',
            'department': 'ECE',
            'year': 3,
            'section': 'A',
            'user_type': 'Faculty'
        },
        {
            'user_id': 'user_hod_ai',
            'email': 'hod.ai@nitk.edu.in',
            'password_hash': default_pw_hash,
            'name': 'Dr. Sowmya Kamath S (HoD AI)',
            'role': 'HoD',
            'department': 'AI',
            'year': 3,
            'section': 'A',
            'user_type': 'Faculty'
        },
        # Students (Restricted strictly to their Department, Year, and Section)
        {
            'user_id': 'user_student_it3a',
            'email': 'student.it@nitk.edu.in',
            'password_hash': default_pw_hash,
            'name': 'Sankalp S Kunthe',
            'role': 'VIEWER',
            'department': 'IT',
            'year': 3,
            'section': 'A',
            'user_type': 'Student'
        },
        {
            'user_id': 'user_student_it3b',
            'email': 'student.it3b@nitk.edu.in',
            'password_hash': default_pw_hash,
            'name': 'Abhishek M',
            'role': 'VIEWER',
            'department': 'IT',
            'year': 3,
            'section': 'B',
            'user_type': 'Student'
        },
        {
            'user_id': 'user_student_cse2a',
            'email': 'student.cse2a@nitk.edu.in',
            'password_hash': default_pw_hash,
            'name': 'Ravi Prakash',
            'role': 'VIEWER',
            'department': 'CSE',
            'year': 2,
            'section': 'A',
            'user_type': 'Student'
        },
        # IT Professors
        { 'user_id': 'user_prof_geetha', 'email': 'geethav@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Geetha V.', 'role': 'VIEWER', 'department': 'IT', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_jaidhar', 'email': 'jaidharcd@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Jaidhar C. D.', 'role': 'VIEWER', 'department': 'IT', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_dinesh', 'email': 'dineshnaik@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Dinesh Naik', 'role': 'VIEWER', 'department': 'IT', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_anand', 'email': 'm_anandkumar@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Anand Kumar M.', 'role': 'VIEWER', 'department': 'IT', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_bhawana', 'email': 'bhawanarudra@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Bhawana Rudra', 'role': 'VIEWER', 'department': 'IT', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_suprabha', 'email': 'suprabhak@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Suprabha K.', 'role': 'VIEWER', 'department': 'IT', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        
        # CSE Professors
        { 'user_id': 'user_prof_alwyn', 'email': 'alwyn@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Alwyn R. Pais', 'role': 'VIEWER', 'department': 'CSE', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_koolagudi', 'email': 'koolagudi@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Shashidhar G. Koolagudi', 'role': 'VIEWER', 'department': 'CSE', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_basavaraj', 'email': 'basavaraj@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Basavaraj Talawar', 'role': 'VIEWER', 'department': 'CSE', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },

        # ECE Professors
        { 'user_id': 'user_prof_sumam', 'email': 'sumam@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Sumam David S.', 'role': 'VIEWER', 'department': 'ECE', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_bhat', 'email': 'bhat@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. M. S. Bhat', 'role': 'VIEWER', 'department': 'ECE', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },

        # AI Professors
        { 'user_id': 'user_prof_sowmya', 'email': 'sowmyakamath@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Sowmya Kamath S.', 'role': 'VIEWER', 'department': 'AI', 'year': 3, 'section': 'A', 'user_type': 'Faculty' },
        { 'user_id': 'user_prof_jeny', 'email': 'jeny@nitk.edu.in', 'password_hash': default_pw_hash, 'name': 'Dr. Jeny Rajan', 'role': 'VIEWER', 'department': 'AI', 'year': 3, 'section': 'A', 'user_type': 'Faculty' }
    ]

    for u in users_data:
        existing = User.query.filter_by(email=u['email']).first()
        if existing:
            existing.password_hash = u['password_hash']
            existing.name = u['name']
            existing.role = u['role']
            existing.department = u['department']
            existing.year = u['year']
            existing.section = u['section']
            existing.user_type = u['user_type']
        else:
            usr = User(**u)
            db.session.add(usr)

    db.session.commit()
    print("[SUCCESS] Database successfully seeded with NITK institutional entities and default users!")


if __name__ == '__main__':
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed_database()
