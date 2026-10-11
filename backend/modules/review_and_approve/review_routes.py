"""
Review and Approve Blueprint (SRS FR-006, DFD 6.6)
Handles manual slot swapping, schedule approval, and status publishing via SQLAlchemy.
"""

from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models import Timetable, LogFile
from backend.modules.user_auth.auth_routes import token_required, role_required

review_bp = Blueprint('review', __name__, url_prefix='/api/review')


@review_bp.route('/swap', methods=['POST'])
@role_required('HoD')
def manual_swap(current_user):
    """
    Processes manual slot swaps and validates zero-overlap across sections (SRS FR-006, DFD 6.6)
    """
    data = request.get_json() or {}
    source_tt_id = data.get('sourceTimetableId')
    target_tt_id = data.get('targetTimetableId') or source_tt_id
    source = data.get('source')  # { day: 'Monday', slotId: 2 }
    target = data.get('target')  # { day: 'Tuesday', slotId: 3 }

    if not source_tt_id or not source or not target:
        return jsonify({'error': 'Missing required swap parameters'}), 400

    source_tt = db.session.get(Timetable, source_tt_id)
    target_tt = db.session.get(Timetable, target_tt_id)

    if not source_tt or not target_tt:
        return jsonify({'error': 'Timetable record not found'}), 404

    # Swap in grid data
    source_grid = dict(source_tt.grid_data)
    target_grid = dict(target_tt.grid_data) if target_tt_id != source_tt_id else source_grid

    s_day = source.get('day')
    t_day = target.get('day')
    s_periods = source.get('periods')
    t_periods = target.get('periods')

    if not s_periods:
        s_slot = source.get('slotId')
        s_cell = source_grid.get(s_day, {}).get(str(s_slot))
        # If source is a lab, find all contiguous lab slots automatically
        if s_cell and (s_cell.get('isLab') or s_cell.get('type') == 'lab'):
            candidate_p = [2, 3, 4, 5, 6, 7, 8, 9, 10]
            s_inst = s_cell.get('labInstanceId')
            s_code = s_cell.get('subjectCode')

            def is_same_lab(c):
                if not c or not (c.get('isLab') or c.get('type') == 'lab'):
                    return False
                if s_inst and c.get('labInstanceId'):
                    return c.get('labInstanceId') == s_inst
                return c.get('subjectCode') == s_code

            num_s = int(s_slot)
            start_p = num_s
            while (start_p - 1) in candidate_p and is_same_lab(source_grid.get(s_day, {}).get(str(start_p - 1))):
                start_p -= 1
            end_p = num_s
            while (end_p + 1) in candidate_p and is_same_lab(source_grid.get(s_day, {}).get(str(end_p + 1))):
                end_p += 1
            s_periods = list(range(start_p, end_p + 1))
            t_slot_num = int(target.get('slotId'))
            t_periods = [t_slot_num + i for i in range(len(s_periods))]
        else:
            s_periods = [int(s_slot)]
            t_periods = [int(target.get('slotId'))]
    else:
        if not t_periods:
            t_slot_num = int(target.get('slotId'))
            t_periods = [t_slot_num + i for i in range(len(s_periods))]

    # Snapshot cells to prevent in-place overwrites
    s_cells = [source_grid.get(s_day, {}).get(str(p)) for p in s_periods]
    t_cells = [target_grid.get(t_day, {}).get(str(p)) for p in t_periods]

    for idx, (sp, tp) in enumerate(zip(s_periods, t_periods)):
        sc = s_cells[idx]
        tc = t_cells[idx]

        # Update lab continuation flags for source cell moving to target
        if sc and (sc.get('isLab') or sc.get('type') == 'lab'):
            sc = dict(sc)
            sc['isLabStart'] = (idx == 0)
            sc['isLabContinuation'] = (idx > 0)
            sc['labInstanceId'] = f"lab_{sc.get('subjectCode')}_{t_day}_{t_periods[0]}"
            sc['id'] = f"slot_{t_day}_{tp}_{target_tt.year}_{target_tt.section}"

        # Update lab continuation flags for target cell moving to source
        if tc and (tc.get('isLab') or tc.get('type') == 'lab'):
            tc = dict(tc)
            tc['isLabStart'] = (idx == 0)
            tc['isLabContinuation'] = (idx > 0)
            tc['labInstanceId'] = f"lab_{tc.get('subjectCode')}_{s_day}_{s_periods[0]}"
            tc['id'] = f"slot_{s_day}_{sp}_{source_tt.year}_{source_tt.section}"

        if s_day in source_grid:
            source_grid[s_day][str(sp)] = tc
        if t_day in target_grid:
            target_grid[t_day][str(tp)] = sc

    source_tt.grid_data = source_grid
    if target_tt_id != source_tt_id:
        target_tt.grid_data = target_grid

    # Log action
    log = LogFile(
        user_id=current_user.user_id,
        action='SLOT_SWAP',
        status_code=200,
        message=f"HoD swapped {len(s_periods)}-hour block ({s_day} P{s_periods}) with ({t_day} P{t_periods})"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Slot swapped successfully in database.',
        'status': 'SUCCESS',
        'sourceTimetable': source_tt.to_dict(),
        'targetTimetable': target_tt.to_dict()
    }), 200


@review_bp.route('/approve', methods=['PUT'])
@role_required('HoD')
def approve_schedule(current_user):
    """
    Transitions schedule status from 'DRAFT' to 'APPROVED' (SRS FR-006)
    """
    data = request.get_json() or {}
    timetable_id = data.get('timetableId')

    if not timetable_id:
        return jsonify({'error': 'Timetable ID is required'}), 400

    timetable = db.session.get(Timetable, timetable_id)
    if not timetable:
        return jsonify({'error': 'Timetable record not found'}), 404

    timetable.status = 'APPROVED'

    log = LogFile(
        user_id=current_user.user_id,
        action='SCHEDULE_APPROVED',
        status_code=200,
        message=f"HoD published timetable {timetable_id} to Viewers"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f'Timetable {timetable_id} approved and published to Viewers!',
        'timetable': timetable.to_dict()
    }), 200


@review_bp.route('/disapprove', methods=['PUT', 'POST'])
@review_bp.route('/revert', methods=['PUT', 'POST'])
@role_required('HoD')
def revert_schedule(current_user):
    """
    Reverts a timetable back to 'DRAFT' status in the database (D3: timetables).
    It remains in the database with status='DRAFT'.
    """
    data = request.get_json() or {}
    timetable_id = data.get('timetableId') or request.args.get('timetableId')

    if not timetable_id:
        return jsonify({'error': 'Timetable ID is required'}), 400

    timetable = db.session.get(Timetable, timetable_id)
    if not timetable:
        return jsonify({'error': 'Timetable record not found in database'}), 404

    # Keep in database and update status to DRAFT
    timetable.status = 'DRAFT'

    log = LogFile(
        user_id=current_user.user_id,
        action='TIMETABLE_REVERTED_TO_DRAFT',
        status_code=200,
        message=f"HoD reverted timetable {timetable_id} back to DRAFT in database"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f'Timetable {timetable_id} reverted back to DRAFT.',
        'status': 'DRAFT',
        'timetable': timetable.to_dict()
    }), 200


@review_bp.route('/delete', methods=['DELETE', 'POST'])
@role_required('HoD')
def delete_timetable(current_user):
    """
    Permanently deletes a timetable from the database (D3: timetables).
    """
    data = request.get_json() or {}
    timetable_id = data.get('timetableId') or request.args.get('timetableId')

    if not timetable_id:
        return jsonify({'error': 'Timetable ID is required'}), 400

    timetable = db.session.get(Timetable, timetable_id)
    if not timetable:
        return jsonify({'error': 'Timetable record not found in database'}), 404

    # Execute SQL DELETE command to remove from database
    db.session.delete(timetable)

    log = LogFile(
        user_id=current_user.user_id,
        action='TIMETABLE_DELETED',
        status_code=200,
        message=f"HoD deleted timetable {timetable_id} from database"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f'Timetable {timetable_id} successfully deleted from database.',
        'status': 'DELETED',
        'timetableId': timetable_id
    }), 200

