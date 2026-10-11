"""
SQLAlchemy Relational Database Models for Automated College Timetable Generator
Strictly mapped to SRS Section 8.2 Data Stores (D1: users, D2: academic_data, D3: timetables, D4: log_files).
"""

import uuid
from datetime import datetime
from backend.database import db


class User(db.Model):
    """
    D1: users table
    Stores user registration details and RBAC role assignments ('HoD' or 'VIEWER').
    """
    __tablename__ = 'users'

    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='VIEWER')  # 'HoD' or 'VIEWER'
    department = db.Column(db.String(10), nullable=False, default='IT')
    year = db.Column(db.Integer, nullable=True, default=3)
    semester = db.Column(db.Integer, nullable=True, default=5)
    section = db.Column(db.String(5), nullable=True, default='A')
    user_type = db.Column(db.String(20), nullable=True, default='Student')  # 'Student' or 'Faculty'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.user_id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'department': self.department,
            'year': self.year,
            'semester': self.semester or ((self.year * 2) - 1 if self.year else 5),
            'section': self.section or 'A',
            'userType': self.user_type,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class Department(db.Model):
    """
    D2: departments table
    """
    __tablename__ = 'departments'

    id = db.Column(db.String(10), primary_key=True)  # 'IT', 'CSE', 'ECE', 'AI'
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(10), nullable=False)
    hod_name = db.Column(db.String(100), nullable=False)
    hod_id = db.Column(db.String(50), nullable=False)

    subjects = db.relationship('Subject', backref='department', lazy=True, cascade="all, delete-orphan")
    professors = db.relationship('Professor', backref='department', lazy=True, cascade="all, delete-orphan")
    classrooms = db.relationship('Classroom', backref='department', lazy=True, cascade="all, delete-orphan")
    laboratories = db.relationship('Laboratory', backref='department', lazy=True, cascade="all, delete-orphan")
    timetables = db.relationship('Timetable', backref='department', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'hodName': self.hod_name,
            'hodId': self.hod_id
        }


class Professor(db.Model):
    """
    D2: professors table (Personnel data)
    """
    __tablename__ = 'professors'

    id = db.Column(db.String(20), primary_key=True)  # 'p1', 'p2', etc.
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.String(10), db.ForeignKey('departments.id'), nullable=False)
    designation = db.Column(db.String(100), nullable=False, default='Assistant Professor')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'department': self.department_id,
            'designation': self.designation
        }


class Subject(db.Model):
    """
    D2: subjects table (Academic constraints & course syllabus)
    """
    __tablename__ = 'subjects'

    id = db.Column(db.String(20), primary_key=True)  # 'it301', 'it302', etc.
    code = db.Column(db.String(20), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    department_id = db.Column(db.String(10), db.ForeignKey('departments.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False, default=3)
    semester = db.Column(db.Integer, nullable=False, default=5)
    credits = db.Column(db.Integer, nullable=False, default=3)
    ltp = db.Column(db.String(20), nullable=False, default='(3-0-0)')
    type = db.Column(db.String(20), nullable=False, default='theory')  # 'theory' or 'lab'
    requires_lab = db.Column(db.Boolean, nullable=False, default=False)
    default_faculty_id = db.Column(db.String(20), db.ForeignKey('professors.id'), nullable=True)
    classes_per_week = db.Column(db.Integer, nullable=False, default=3)

    default_faculty = db.relationship('Professor', foreign_keys=[default_faculty_id])

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'department': self.department_id,
            'year': self.year,
            'semester': self.semester or ((self.year * 2) - 1 if self.year else 5),
            'credits': self.credits,
            'ltp': self.ltp,
            'type': self.type,
            'requires_lab': self.requires_lab,
            'defaultFaculty': self.default_faculty_id,
            'facultyName': self.default_faculty.name if self.default_faculty else None,
            'classesPerWeek': self.classes_per_week
        }


class Classroom(db.Model):
    """
    D2: classrooms table (Physical rooms)
    """
    __tablename__ = 'classrooms'

    id = db.Column(db.String(20), primary_key=True)  # 'cr1', 'cr2'
    code = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    capacity = db.Column(db.Integer, nullable=False, default=90)
    department_id = db.Column(db.String(10), db.ForeignKey('departments.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'capacity': self.capacity,
            'department': self.department_id
        }


class Laboratory(db.Model):
    """
    D2: laboratories table (Specialized lab rooms)
    """
    __tablename__ = 'laboratories'

    id = db.Column(db.String(20), primary_key=True)  # 'lab1', 'lab2'
    code = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    capacity = db.Column(db.Integer, nullable=False, default=90)
    department_id = db.Column(db.String(10), db.ForeignKey('departments.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'capacity': self.capacity,
            'department': self.department_id
        }


class Timetable(db.Model):
    """
    D3: timetables table
    Stores generated schedule matrices and approval workflow statuses ('DRAFT' or 'APPROVED').
    """
    __tablename__ = 'timetables'

    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = db.Column(db.String(10), db.ForeignKey('departments.id'), nullable=False, index=True)
    year = db.Column(db.Integer, nullable=False)
    semester = db.Column(db.Integer, nullable=False, default=5)
    section = db.Column(db.String(5), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='DRAFT')  # 'DRAFT' or 'APPROVED'
    assigned_classroom = db.Column(db.String(150), nullable=True)
    assigned_labs = db.Column(db.JSON, nullable=True)  # list of lab location strings
    grid_data = db.Column(db.JSON, nullable=False)  # 5 days x 10 periods schedule matrix
    is_feasible = db.Column(db.Boolean, nullable=False, default=True)
    unplaced_sessions = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'department': self.department_id,
            'year': self.year,
            'semester': self.semester or ((self.year * 2) - 1 if self.year else 5),
            'section': self.section,
            'status': self.status,
            'assignedClassroom': self.assigned_classroom,
            'assignedLabs': self.assigned_labs or [],
            'grid': self.grid_data,
            'isFeasible': self.is_feasible,
            'unplacedSessions': self.unplaced_sessions or [],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class LogFile(db.Model):
    """
    D4: log-files table
    Storage for tracking system operations, generation statuses, and error messages.
    """
    __tablename__ = 'log_files'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    user_id = db.Column(db.String(36), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    status_code = db.Column(db.Integer, nullable=False, default=200)
    message = db.Column(db.Text, nullable=True)
    error_code = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'userId': self.user_id,
            'action': self.action,
            'statusCode': self.status_code,
            'message': self.message,
            'errorCode': self.error_code
        }


class PasswordResetOTP(db.Model):
    """
    Security OTP Store for Password Reset
    """
    __tablename__ = 'password_reset_otps'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    otp_hash = db.Column(db.String(64), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    used = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'attempts': self.attempts,
            'used': self.used
        }

