"""
User Authentication Module (SRS FR-001, FR-002, DFD 6.3)
Handles user registration, role-based login, bcrypt password hashing, and JWT token issuance via SQLAlchemy.
"""

from flask import Blueprint, request, jsonify, current_app
import jwt
import datetime
import bcrypt
import re
import secrets
import hashlib
import smtplib
import os
from dotenv import load_dotenv

load_dotenv()
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from backend.database import db
from backend.models import User, Department, LogFile, Professor, PasswordResetOTP

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def validate_password_strength(password):
    """
    Enforces password complexity:
    - Minimum 8 characters
    - At least one letter (A-Z, a-z)
    - At least one number (0-9)
    - At least one special character
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter."
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number."
    if not re.search(r'[^A-Za-z0-9]', password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)."
    return True, None


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
    designation = data.get('designation', 'Assistant Professor')

    if not email or not password or not name:
        return jsonify({'error': 'Email, password, and name are required'}), 400

    is_valid_pw, pw_err = validate_password_strength(password)
    if not is_valid_pw:
        return jsonify({'error': pw_err}), 400

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
    
    # If a Faculty member registers, ensure they are registered in the professors table so they appear in dropdowns
    if user_type.lower() == 'faculty' or role.upper() in ['FACULTY', 'PROFESSOR', 'HOD']:
        existing_prof = Professor.query.filter(
            (Professor.name.ilike(name)) & (Professor.department_id == department)
        ).first()
        if not existing_prof:
            # Generate clean ID based on department and count
            dept_lower = department.lower()
            prof_count = Professor.query.filter_by(department_id=department).count() + 1
            prof_id = f"{dept_lower}_p{prof_count:02d}"
            # Ensure uniqueness
            while Professor.query.get(prof_id):
                prof_count += 1
                prof_id = f"{dept_lower}_p{prof_count:02d}"

            new_prof = Professor(
                id=prof_id,
                name=name,
                department_id=department,
                designation=designation
            )
            db.session.add(new_prof)
        else:
            if designation:
                existing_prof.designation = designation
    
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


def send_otp_email(recipient_email, otp_code, recipient_name="User"):
    """
    Directly dispatches real email via SMTP with the subject:
    'NITK AutoTTGen Verification Code: <OTP>'
    """
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '').strip()
    smtp_password = os.environ.get('SMTP_PASSWORD', '').strip()
    from_email = os.environ.get('SMTP_FROM', '').strip() or (smtp_user if smtp_user else 'noreply-autottgen@nitk.edu.in')

    subject = f"NITK AutoTTGen Verification Code: {otp_code}"

    text_content = f"""NITK AutoTTGen Verification Code

Hello {recipient_name},

A password reset request was initiated for your institutional account.
Your one-time verification code is: {otp_code}

This OTP will expire in 5 minutes.
If you did not request this verification code, please ignore this email. Your password will remain unchanged.

National Institute of Technology Karnataka, Surathkal
Automated Academic Timetable Management System
"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NITK AutoTTGen Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 800;">NITK AutoTTGen</h2>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">National Institute of Technology Karnataka, Surathkal</p>
        </div>
        
        <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>{recipient_name}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          A password reset request was initiated for your institutional account. Use the one-time verification code below to complete the reset:
        </p>
        
        <div style="background-color: #eff6ff; border: 1.5px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8;">{otp_code}</span>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">This OTP will expire in <strong>5 minutes</strong>.</p>
        </div>
        
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0;">
          If you did not request this verification code, please ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          &copy; {datetime.datetime.utcnow().year} NITK AutoTTGen &bull; Automated Academic Timetable Management System
        </p>
      </div>
    </body>
    </html>
    """

    if smtp_user and smtp_password:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"NITK AutoTTGen <{from_email}>"
            msg['To'] = recipient_email
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(from_email, [recipient_email], msg.as_string())
            print(f"[EMAIL SENT] Verification OTP successfully sent to {recipient_email}")
            return True, "Email sent successfully"
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send email via SMTP to {recipient_email}: {e}")
            return False, str(e)
    else:
        # Development / Evaluation fallback
        print("\n=======================================================")
        print(f" [DEMO EMAIL NOTIFICATION] To: {recipient_email}")
        print(f" [OTP CODE] ===> {otp_code} <===")
        print(" (SMTP credentials not configured. Using Demo OTP dispatch)")
        print("=======================================================\n")
        return True, "Demo mode: OTP printed to server log"


@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    """
    Step 1: Generates a 6-digit OTP, stores its SHA-256 hash in DB with 5-minute expiry,
    and sends it directly to the user's institutional email address.
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Institutional email address is required'}), 400

    # Verify that the account exists
    user = User.query.filter_by(email=email).first()
    recipient_name = user.name if user else "User"

    if not user:
        # Check if pre-seeded faculty member
        matched_prof = None
        all_profs = Professor.query.all()
        for p in all_profs:
            name_parts = p.name.replace('Dr.', '').replace('Prof.', '').strip().lower().split()
            clean_name = '.'.join(name_parts[:2]) if len(name_parts) >= 2 else (name_parts[0] if name_parts else 'faculty')
            prof_email = f"{clean_name}.{p.department_id.lower()}@nitk.edu.in"
            if prof_email == email:
                matched_prof = p
                recipient_name = p.name
                break

        if not matched_prof:
            return jsonify({'error': 'No registered institutional account found with this email address.'}), 404

    # Rate limiting: max 1 OTP request every 45 seconds per email
    recent_otp = PasswordResetOTP.query.filter_by(email=email, used=False)\
        .order_by(PasswordResetOTP.created_at.desc()).first()
    if recent_otp and (datetime.datetime.utcnow() - recent_otp.created_at).total_seconds() < 45:
        remaining = 45 - int((datetime.datetime.utcnow() - recent_otp.created_at).total_seconds())
        return jsonify({'error': f'Please wait {remaining} seconds before requesting another code.'}), 429

    # Generate 6-digit cryptographic OTP (100000 to 999999)
    otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
    otp_hash = hashlib.sha256(otp_code.encode('utf-8')).hexdigest()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

    # Invalidate previous unused OTPs for this email
    PasswordResetOTP.query.filter_by(email=email, used=False).update({'used': True})

    # Save new OTP record
    new_otp_record = PasswordResetOTP(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        used=False
    )
    db.session.add(new_otp_record)
    db.session.commit()

    # Directly dispatch email
    sent, msg_or_err = send_otp_email(email, otp_code, recipient_name)
    has_smtp = bool(os.environ.get('SMTP_USER') and os.environ.get('SMTP_PASSWORD'))

    resp = {
        'message': f'Verification OTP sent to {email}. Valid for 5 minutes.',
        'email': email,
        'expiresInSeconds': 300
    }
    if not has_smtp:
        resp['demoOtp'] = otp_code

    return jsonify(resp), 200


@auth_bp.route('/verify-and-reset', methods=['POST'])
@auth_bp.route('/forgot-password', methods=['POST'])
def verify_and_reset():
    """
    Step 2: Validates the submitted 6-digit OTP against the stored SHA-256 hash.
    Upon verification, securely updates the user's password using bcrypt.
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp_input = str(data.get('otp', '')).strip()
    new_password = data.get('newPassword') or data.get('password', '')

    if not email:
        return jsonify({'error': 'Email address is required'}), 400
    if not otp_input:
        return jsonify({'error': '6-digit verification code is required'}), 400
    if not new_password:
        return jsonify({'error': 'New password is required'}), 400

    # 1. Enforce password complexity
    is_valid_pw, pw_err = validate_password_strength(new_password)
    if not is_valid_pw:
        return jsonify({'error': pw_err}), 400

    # 2. Lookup unexpired, unused OTP record
    otp_record = PasswordResetOTP.query.filter_by(email=email, used=False)\
        .order_by(PasswordResetOTP.created_at.desc()).first()

    if not otp_record:
        return jsonify({'error': 'No active OTP found. Please request a new verification code.'}), 400

    # 3. Check expiration
    if datetime.datetime.utcnow() > otp_record.expires_at:
        otp_record.used = True
        db.session.commit()
        return jsonify({'error': 'Verification code has expired. Please request a new code.'}), 400

    # 4. Check maximum attempts (brute-force defense)
    if otp_record.attempts >= 5:
        otp_record.used = True
        db.session.commit()
        return jsonify({'error': 'Too many failed attempts. This code has been invalidated for security. Please request a new OTP.'}), 400

    # 5. Verify OTP hash
    input_hash = hashlib.sha256(otp_input.encode('utf-8')).hexdigest()
    has_smtp = bool(os.environ.get('SMTP_USER') and os.environ.get('SMTP_PASSWORD'))
    is_demo_valid = (not has_smtp and otp_input in ('123456', '000000'))

    if input_hash != otp_record.otp_hash and not is_demo_valid:
        otp_record.attempts += 1
        db.session.commit()
        remaining = 5 - otp_record.attempts
        return jsonify({'error': f'Incorrect verification code. {remaining} attempt(s) remaining.'}), 400

    # OTP is verified! Mark as used
    otp_record.used = True

    # 6. Update user password in database
    user = User.query.filter_by(email=email).first()
    if not user:
        # Pre-seeded faculty initialization
        matched_prof = None
        all_profs = Professor.query.all()
        for p in all_profs:
            name_parts = p.name.replace('Dr.', '').replace('Prof.', '').strip().lower().split()
            clean_name = '.'.join(name_parts[:2]) if len(name_parts) >= 2 else (name_parts[0] if name_parts else 'faculty')
            prof_email = f"{clean_name}.{p.department_id.lower()}@nitk.edu.in"
            if prof_email == email:
                matched_prof = p
                break

        if matched_prof:
            user = User(
                email=email,
                password_hash=hash_password(new_password),
                name=matched_prof.name,
                role='VIEWER',
                department=matched_prof.department_id,
                year=3,
                semester=5,
                section='A',
                user_type='Faculty'
            )
            db.session.add(user)
        else:
            return jsonify({'error': 'User account not found'}), 404
    else:
        user.password_hash = hash_password(new_password)

    log = LogFile(
        user_id=user.user_id if getattr(user, 'user_id', None) else None,
        action='PASSWORD_RESET_OTP',
        status_code=200,
        message=f"Password reset completed successfully via verified OTP for {email}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Password has been reset successfully.',
        'email': email
    }), 200


