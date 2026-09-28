"""
NITK AutoTTGen - Interactive Database CLI Manager
Allows adding departments, faculty, rooms, courses, and user accounts directly via terminal.
"""

import sys
import bcrypt
from datetime import datetime
from backend.app import create_app
from backend.database import db
from backend.models import User, Department, Professor, Subject, Classroom, Laboratory, Timetable, LogFile


def hash_password(plain_text_password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_text_password.encode('utf-8'), salt).decode('utf-8')


def print_header(title: str):
    print("\n" + "=" * 60)
    print(f"  {title.upper()}")
    print("=" * 60)


def show_summary():
    print_header("Current Database Summary")
    print(f"  [-] Departments   : {Department.query.count()}")
    print(f"  [-] Professors    : {Professor.query.count()}")
    print(f"  [-] Classrooms    : {Classroom.query.count()}")
    print(f"  [-] Laboratories  : {Laboratory.query.count()}")
    print(f"  [-] Subjects      : {Subject.query.count()}")
    print(f"  [-] User Accounts : {User.query.count()}")
    print(f"  [-] Timetables    : {Timetable.query.count()}")
    print("-" * 60)

    depts = Department.query.all()
    if depts:
        print("\nExisting Departments:")
        for d in depts:
            print(f"  [{d.id}] {d.name} (HoD: {d.hod_name})")

    users = User.query.all()
    if users:
        print("\nRegistered Accounts:")
        for u in users:
            print(f"  [{u.role} - {u.user_type}] {u.name} ({u.email}) - Dept: {u.department}")


def add_department():
    print_header("Add New Department")
    dept_id = input("Department Code (e.g., IT, CSE, ECE, AI): ").strip().upper()
    if not dept_id:
        print("[ERROR] Department code is required.")
        return

    if db.session.get(Department, dept_id):
        print(f"[ERROR] Department '{dept_id}' already exists.")
        return

    name = input("Department Full Name (e.g., Information Technology): ").strip()
    hod_name = input("HoD Name (e.g., Dr. B. R. Mohan): ").strip()
    hod_id = input(f"HoD ID/Username (default: hod_{dept_id.lower()}): ").strip() or f"hod_{dept_id.lower()}"

    dept = Department(
        id=dept_id,
        name=name or dept_id,
        code=dept_id,
        hod_name=hod_name or "Head of Department",
        hod_id=hod_id
    )
    db.session.add(dept)
    db.session.commit()
    print(f"[SUCCESS] Department '{dept_id} - {dept.name}' added successfully!")


def add_hod_user():
    print_header("Add HoD Login Account")
    depts = Department.query.all()
    if not depts:
        print("[ERROR] No departments found. Please add a department first (Option 1).")
        return

    print("Available Departments:")
    for d in depts:
        print(f"  - {d.id} ({d.name})")

    dept_id = input("Select Department Code: ").strip().upper()
    dept = db.session.get(Department, dept_id)
    if not dept:
        print(f"[ERROR] Department '{dept_id}' not found.")
        return

    name = input(f"HoD Name [{dept.hod_name}]: ").strip() or dept.hod_name
    email = input(f"HoD Email (e.g., hod.{dept_id.lower()}@nitk.edu.in): ").strip()
    if not email:
        print("[ERROR] Email is required for login.")
        return

    password = input("Password [password123]: ").strip() or "password123"

    user = User.query.filter_by(email=email).first()
    if user:
        user.name = name
        user.role = 'HoD'
        user.department = dept_id
        user.user_type = 'Faculty'
        user.password_hash = hash_password(password)
        print(f"[UPDATED] Existing user '{email}' updated to HoD.")
    else:
        user = User(
            user_id=dept.hod_id,
            email=email,
            password_hash=hash_password(password),
            name=name,
            role='HoD',
            department=dept_id,
            year=3,
            section='A',
            user_type='Faculty'
        )
        db.session.add(user)

    db.session.commit()
    print(f"[SUCCESS] HoD account for '{name}' ({email}) created successfully!")


def add_professor():
    print_header("Add Professor / Faculty Member")
    depts = Department.query.all()
    if not depts:
        print("[ERROR] No departments found. Please add a department first (Option 1).")
        return

    dept_id = input(f"Department Code ({'/'.join(d.id for d in depts)}): ").strip().upper()
    if not db.session.get(Department, dept_id):
        print(f"[ERROR] Department '{dept_id}' not found.")
        return

    prof_id = input("Faculty ID (e.g., p1, prof_geetha): ").strip()
    if not prof_id:
        print("[ERROR] Faculty ID is required.")
        return

    name = input("Faculty Full Name (e.g., Dr. Geetha V.): ").strip()
    designation = input("Designation [Associate Professor]: ").strip() or "Associate Professor"

    prof = db.session.get(Professor, prof_id)
    if prof:
        prof.name = name
        prof.department_id = dept_id
        prof.designation = designation
        print(f"[UPDATED] Professor '{prof_id}' updated.")
    else:
        prof = Professor(
            id=prof_id,
            name=name,
            department_id=dept_id,
            designation=designation
        )
        db.session.add(prof)

    # Optional user login creation
    create_login = input("Create portal login account for this professor? (y/n) [y]: ").strip().lower() != 'n'
    if create_login:
        default_email = f"{prof_id.replace('prof_', '')}@{dept_id.lower()}.nitk.edu.in"
        email = input(f"Login Email [{default_email}]: ").strip() or default_email
        password = input("Login Password [password123]: ").strip() or "password123"

        usr = User.query.filter_by(email=email).first()
        if usr:
            usr.name = name
            usr.role = 'VIEWER'
            usr.department = dept_id
            usr.user_type = 'Faculty'
            usr.password_hash = hash_password(password)
        else:
            usr = User(
                user_id=f"user_{prof_id}",
                email=email,
                password_hash=hash_password(password),
                name=name,
                role='VIEWER',
                department=dept_id,
                year=3,
                section='A',
                user_type='Faculty'
            )
            db.session.add(usr)

    db.session.commit()
    print(f"[SUCCESS] Professor '{name}' registered successfully!")


def add_classroom():
    print_header("Add Classroom / Lecture Hall")
    depts = Department.query.all()
    if not depts:
        print("[ERROR] No departments found. Please add a department first.")
        return

    dept_id = input(f"Department Code ({'/'.join(d.id for d in depts)}): ").strip().upper()
    if not db.session.get(Department, dept_id):
        print(f"[ERROR] Department '{dept_id}' not found.")
        return

    cr_id = input("Classroom ID (e.g., cr_it1, CR101): ").strip()
    code = input("Short Code (e.g., CR 2.2 LHC-D): ").strip()
    name = input(f"Full Name [{code}, NITK Surathkal]: ").strip() or f"{code}, NITK Surathkal"
    capacity = input("Seating Capacity [70]: ").strip() or "70"

    cr = db.session.get(Classroom, cr_id)
    if cr:
        cr.code = code
        cr.name = name
        cr.capacity = int(capacity)
        cr.department_id = dept_id
        print(f"[UPDATED] Classroom '{cr_id}' updated.")
    else:
        cr = Classroom(
            id=cr_id,
            code=code,
            name=name,
            capacity=int(capacity),
            department_id=dept_id
        )
        db.session.add(cr)

    db.session.commit()
    print(f"[SUCCESS] Classroom '{code}' added successfully!")


def add_laboratory():
    print_header("Add Laboratory Facility")
    depts = Department.query.all()
    if not depts:
        print("[ERROR] No departments found. Please add a department first.")
        return

    dept_id = input(f"Department Code ({'/'.join(d.id for d in depts)}): ").strip().upper()
    if not db.session.get(Department, dept_id):
        print(f"[ERROR] Department '{dept_id}' not found.")
        return

    lab_id = input("Lab ID (e.g., lab_it1, UG-Lab-3): ").strip()
    code = input("Short Code (e.g., UG-Lab-3): ").strip()
    name = input(f"Full Name [{code}, NITK Surathkal]: ").strip() or f"{code}, NITK Surathkal"
    capacity = input("Lab Workstations/Capacity [40]: ").strip() or "40"

    lab = db.session.get(Laboratory, lab_id)
    if lab:
        lab.code = code
        lab.name = name
        lab.capacity = int(capacity)
        lab.department_id = dept_id
        print(f"[UPDATED] Laboratory '{lab_id}' updated.")
    else:
        lab = Laboratory(
            id=lab_id,
            code=code,
            name=name,
            capacity=int(capacity),
            department_id=dept_id
        )
        db.session.add(lab)

    db.session.commit()
    print(f"[SUCCESS] Laboratory '{code}' added successfully!")


def add_subject():
    print_header("Add Subject / Course")
    depts = Department.query.all()
    if not depts:
        print("[ERROR] No departments found. Please add a department first.")
        return

    dept_id = input(f"Department Code ({'/'.join(d.id for d in depts)}): ").strip().upper()
    if not db.session.get(Department, dept_id):
        print(f"[ERROR] Department '{dept_id}' not found.")
        return

    subj_id = input("Subject ID (e.g., it301, cse202): ").strip().lower()
    code = input("Course Code (e.g., IT301, CS202): ").strip().upper()
    name = input("Course Title (e.g., Operating Systems): ").strip()
    year = int(input("Year (1-4) [3]: ").strip() or "3")
    credits = int(input("Credits [3]: ").strip() or "3")
    ltp = input("L-T-P Structure [(3-0-0)]: ").strip() or "(3-0-0)"
    
    is_lab = input("Is this a Laboratory Course? (y/n) [n]: ").strip().lower() == 'y'
    course_type = 'lab' if is_lab else 'theory'
    classes_per_week = int(input("Classes / Periods per week [3]: ").strip() or "3")

    profs = Professor.query.filter_by(department_id=dept_id).all()
    default_faculty_id = None
    if profs:
        print("\nAvailable Professors in this department:")
        for p in profs:
            print(f"  [{p.id}] {p.name}")
        fac_input = input("Assign Default Faculty ID (optional): ").strip()
        if fac_input and db.session.get(Professor, fac_input):
            default_faculty_id = fac_input

    subj = db.session.get(Subject, subj_id)
    if subj:
        subj.code = code
        subj.name = name
        subj.department_id = dept_id
        subj.year = year
        subj.credits = credits
        subj.ltp = ltp
        subj.type = course_type
        subj.requires_lab = is_lab
        subj.default_faculty_id = default_faculty_id
        subj.classes_per_week = classes_per_week
        print(f"[UPDATED] Subject '{code}' updated.")
    else:
        subj = Subject(
            id=subj_id,
            code=code,
            name=name,
            department_id=dept_id,
            year=year,
            credits=credits,
            ltp=ltp,
            type=course_type,
            requires_lab=is_lab,
            default_faculty_id=default_faculty_id,
            classes_per_week=classes_per_week
        )
        db.session.add(subj)

    db.session.commit()
    print(f"[SUCCESS] Course '{code} - {name}' added successfully!")


def add_student_user():
    print_header("Add Student Account")
    depts = Department.query.all()
    if not depts:
        print("[ERROR] No departments found. Please add a department first.")
        return

    dept_id = input(f"Department Code ({'/'.join(d.id for d in depts)}): ").strip().upper()
    name = input("Student Full Name: ").strip()
    email = input("Student Email (e.g., student.it@nitk.edu.in): ").strip()
    if not email:
        print("[ERROR] Email is required.")
        return

    password = input("Password [password123]: ").strip() or "password123"
    year = int(input("Year of Study (1-4) [3]: ").strip() or "3")
    section = input("Section (A, B, C) [A]: ").strip().upper() or "A"

    usr = User.query.filter_by(email=email).first()
    if usr:
        usr.name = name
        usr.department = dept_id
        usr.year = year
        usr.section = section
        usr.password_hash = hash_password(password)
        print(f"[UPDATED] Student '{email}' updated.")
    else:
        usr = User(
            email=email,
            password_hash=hash_password(password),
            name=name,
            role='VIEWER',
            department=dept_id,
            year=year,
            section=section,
            user_type='Student'
        )
        db.session.add(usr)

    db.session.commit()
    print(f"[SUCCESS] Student account for '{name}' ({email}) registered successfully!")


def main_menu():
    app = create_app()
    with app.app_context():
        if '--summary' in sys.argv:
            show_summary()
            return

        while True:
            print("\n" + "=" * 60)
            print("  NITK AutoTTGen - Database Terminal Manager")
            print("=" * 60)
            print("  1. Add Department")
            print("  2. Add HoD Account")
            print("  3. Add Professor / Faculty Member")
            print("  4. Add Classroom / Lecture Hall")
            print("  5. Add Laboratory Facility")
            print("  6. Add Course / Subject")
            print("  7. Add Student Account")
            print("  8. View Current Database Summary")
            print("  0. Exit")
            print("-" * 60)

            choice = input("Select an option (0-8): ").strip()

            if choice == '1':
                add_department()
            elif choice == '2':
                add_hod_user()
            elif choice == '3':
                add_professor()
            elif choice == '4':
                add_classroom()
            elif choice == '5':
                add_laboratory()
            elif choice == '6':
                add_subject()
            elif choice == '7':
                add_student_user()
            elif choice == '8':
                show_summary()
            elif choice == '0':
                print("\nExiting Database Manager. Goodbye!\n")
                break
            else:
                print("[ERROR] Invalid choice, please choose between 0 and 8.")


if __name__ == '__main__':
    main_menu()
