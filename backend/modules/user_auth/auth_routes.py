"""
User Authentication Module (SRS FR-001, FR-002, DFD 6.3)
Handles user registration, role-based login, bcrypt password hashing, and JWT token issuance via SQLAlchemy.
"""

from flask import Blueprint, request, jsonify, current_app
import jwt
import datetime
import bcrypt
from functools import wraps
from backend.database import db
from backend.models import User, Department, LogFile

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def check_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return plain_password == hashed_password


def hash_password(plain_password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')


def generate_token(user):
    secret = current_app.config.get('JWT_SECRET', 'nitk_jwt_signing_key_super_secure_2026')
    payload = {
        'user_id': user.user_id,
        'email': user.email,
        'role': user.role,
        'name': user.name,
        'department': user.department,
        'year': user.year,
        'semester': getattr(user, 'semester', ((user.year * 2) - 1) if user.year else 5),
        'section': getattr(user, 'section', 'A'),
        'userType': user.user_type,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=3)  # 3-hour session timeout
    }
    return jwt.encode(payload, secret, algorithm='HS256')


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        secret = current_app.config.get('JWT_SECRET', 'nitk_jwt_signing_key_super_secure_2026')
        try:
            data = jwt.decode(token, secret, algorithms=['HS256'])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found in system'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired. Please sign in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid authentication token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated


def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role != required_role and current_user.role != 'HoD':
                # Log unauthorized attempt
                log = LogFile(
                    user_id=current_user.user_id,
                    action='UNAUTHORIZED_ACCESS_ATTEMPT',
                    status_code=403,
                    message=f"Viewer {current_user.email} attempted to access {request.path}",
                    error_code='HTTP_403_FORBIDDEN'
                )
                db.session.add(log)
                db.session.commit()
                return jsonify({'error': f'Access denied. Required role: {required_role}'}), 403
            return f(current_user, *args, **kwargs)
        return token_required(decorated_function)
    return decorator


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    role = data.get('role', 'VIEWER')
    department = data.get('department', 'IT')
    semester = data.get('semester')
    if semester is not None and str(semester).strip():
        semester = int(semester)
        year = (semester + 1) // 2
    else:
        year = int(data.get('year', 3))
        semester = (year * 2) - 1
    section = data.get('section', 'A')
    user_type = data.get('userType', 'Student')

    if not email or not password or not name:
        return jsonify({'error': 'Email, password, and name are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'A user with this email address already exists'}), 409

    hashed_pw = hash_password(password)
    new_user = User(
        email=email,
        password_hash=hashed_pw,
        name=name,
        role=role,
        department=department,
        year=year,
        semester=semester,
        section=section,
        user_type=user_type
    )
    db.session.add(new_user)
    
    # Audit log
    log = LogFile(
        user_id=new_user.user_id,
        action='USER_REGISTRATION',
        status_code=201,
        message=f"User {email} registered as {role}"
    )
    db.session.add(log)
    db.session.commit()

    token = generate_token(new_user)
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': new_user.to_dict()
    }), 201


@auth_bp.route('/hods', methods=['GET'])
def get_hods():
    """
    Returns verified HoD accounts for all departments from the database
    """
    hod_users = User.query.filter_by(role='HoD').all()
    departments = {d.id: d.name for d in Department.query.all()}
    
    result = []
    for u in hod_users:
        dept_name = departments.get(u.department, u.department)
        result.append({
            'id': u.user_id,
            'name': u.name,
            'department': u.department,
            'departmentName': dept_name,
            'designation': f"Professor & HoD ({dept_name})",
            'email': u.email,
            'hodId': u.user_id
        })
    # Sort by department id
    result.sort(key=lambda x: x['department'])
    return jsonify({'hods': result}), 200


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    hod_id = data.get('hodId')
    login_type = data.get('type', 'GENERAL')

    user = None
    if login_type == 'HOD' and hod_id:
        user = User.query.filter(
            (User.user_id == hod_id) |
            (User.department == hod_id) |
            (User.email == hod_id.lower())
        ).filter_by(role='HoD').first()

        if not user:
            dept = Department.query.filter((Department.hod_id == hod_id) | (Department.id == hod_id)).first()
            if dept:
                user = User.query.filter_by(department=dept.id, role='HoD').first()

        if user:
            email = user.email

    if not user and email:
        user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'Invalid credentials. User not found.'}), 401

    if not check_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password.'}), 401

    token = generate_token(user)

    # Log successful login
    log = LogFile(
        user_id=user.user_id,
        action='USER_LOGIN',
        status_code=200,
        message=f"User {user.email} signed in successfully"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Authentication successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'user': current_user.to_dict()
    }), 200
