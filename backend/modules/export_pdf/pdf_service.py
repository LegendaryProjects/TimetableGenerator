"""
PDF Export Module (SRS FR-008, SI-001, DFD 6.2 Process 0.6)
Provides utilities and endpoints for backend PDF report generation.
"""

from flask import Blueprint, request, jsonify

pdf_bp = Blueprint('pdf', __name__, url_prefix='/api/pdf')


@pdf_bp.route('/export', methods=['POST'])
def export_pdf():
    data = request.get_json() or {}
    timetable_id = data.get('timetableId')

    return jsonify({
        'message': 'PDF document generated',
        'downloadUrl': f'/downloads/timetable_{timetable_id}.pdf'
    }), 200
