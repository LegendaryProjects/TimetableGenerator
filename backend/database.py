"""
Database Configuration & Session Management for Automated College Timetable Generator
Compliant with SRS Data Dictionary & Relational Schema.
Supports PostgreSQL (Production: Neon, Supabase, Render) & SQLite (Local).
"""

import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


def init_db(app):
    """
    Configure database URI with PostgreSQL support and SQLite fallback.
    """
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        # Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Local SQLite database file stored in backend directory
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'timetable_system.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'nitk_autottgen_secret_key_2026')
    app.config['JWT_SECRET'] = os.environ.get('JWT_SECRET', 'nitk_jwt_signing_key_super_secure_2026')

    db.init_app(app)
    return db
