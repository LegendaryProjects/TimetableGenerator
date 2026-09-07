"""
Automated College Timetable Generator - Main Flask Application Server
Compliant with RESTful architecture, JWT RBAC, SQLAlchemy ORM, and modular routing.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from backend.database import db, init_db
from backend.models import Department
from backend.seed_data import seed_database
from backend.modules.user_auth.auth_routes import auth_bp
from backend.modules.capture_and_schedule.schedule_routes import schedule_bp
from backend.modules.review_and_approve.review_routes import review_bp
from backend.modules.export_pdf.pdf_service import pdf_bp


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    init_db(app)

    # Register Blueprints for all core DFD modules
    app.register_blueprint(auth_bp)
    app.register_blueprint(schedule_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(pdf_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'HEALTHY',
            'service': 'NITK AutoTTGen Backend Engine',
            'database': 'CONNECTED',
            'version': '1.0.0'
        }), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    # Auto-create tables & seed if empty
    with app.app_context():
        db.create_all()
        if Department.query.count() == 0:
            seed_database()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
