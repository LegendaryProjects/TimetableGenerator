import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import TimetableSlot from '../viewer/TimetableSlot';
import {
  ArrowLeftRight, CheckCircle2, Clock, X, Shuffle, Undo2, Layers, AlertCircle, Check, Trash2, Calendar
} from 'lucide-react';

const PERIODS = [
  { id: 1, label: 'Period 1', time: '08:00 - 08:45' },
  { id: 2, label: 'Period 2', time: '09:00 - 09:45' },
  { id: 3, label: 'Period 3', time: '10:00 - 10:45' },
  { id: 4, label: 'Period 4', time: '11:00 - 11:45' },
  { id: 'lunch', label: 'Lunch Break', time: '11:45 - 13:00', isBreak: true },
  { id: 5, label: 'Period 5', time: '13:00 - 13:45' },
  { id: 6, label: 'Period 6', time: '14:00 - 14:45' },
  { id: 7, label: 'Period 7', time: '15:00 - 15:45' },
  { id: 8, label: 'Period 8', time: '16:00 - 16:45' },
  { id: 9, label: 'Period 9', time: '17:00 - 17:45' },
  { id: 10, label: 'Period 10', time: '18:00 - 18:45' }
];

export default function InteractiveGrid() {
  const {
    timetables, currentHodTimetable, swapSlots, approveTimetable, revertTimetable, deleteTimetable,
    selectedDepartment, notify, departments, workingDays, classrooms
  } = useTimetable();
  const { isDark } = useTheme();

  const [selectedSource, setSelectedSource] = useState(null);
  const [targetTimetableId, setTargetTimetableId] = useState(null);

  const timetable = currentHodTimetable;
  const deptObj = departments.find(d => d.id === selectedDepartment) || { id: selectedDepartment, name: selectedDepartment };
  const deptTimetables = timetables.filter(t => t.department === selectedDepartment);
  const displayedTimetable = targetTimetableId
    ? deptTimetables.find(t => t.id === targetTimetableId) || timetable
    : timetable;

  const assignedCRId = displayedTimetable?.assignedClassroom || displayedTimetable?.assigned_classroom;
  const assignedCRName = assignedCRId
    ? (classrooms?.find(c => c.id === assignedCRId || c.name === assignedCRId)?.name || assignedCRId)
    : null;

  // Helper to extract a contiguous laboratory block around a given slot
  const getSlotLabBlock = (tt, day, slotId) => {
    if (!tt?.grid?.[day]) return null;
    const numSlotId = Number(slotId);
    if (isNaN(numSlotId)) return null;

    const cell = tt.grid[day][numSlotId];
    if (!cell || (!cell.isLab && cell.type !== 'lab')) return null;

    const validPeriods = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    const isMatchingLab = (other) => {
      if (!other || (!other.isLab && other.type !== 'lab')) return false;
      if (cell.labInstanceId && other.labInstanceId) {
        return cell.labInstanceId === other.labInstanceId;
      }
      return cell.subjectCode === other.subjectCode;
    };

    let startP = numSlotId;
    while (validPeriods.includes(startP - 1) && isMatchingLab(tt.grid[day][startP - 1])) {
      startP--;
    }
    let endP = numSlotId;
    while (validPeriods.includes(endP + 1) && isMatchingLab(tt.grid[day][endP + 1])) {
      endP++;
    }

    const periods = [];
    for (let p = startP; p <= endP; p++) {
      periods.push(p);
    }

    return {
      isLab: true,
      day,
      startSlot: startP,
      endSlot: endP,
      duration: periods.length,
      periods,
      subjectCode: cell.subjectCode,
      subjectName: cell.subjectName || cell.title || cell.subjectCode,
      labInstanceId: cell.labInstanceId,
      cell
    };
  };

  // Check if swapping with (targetDay, targetSlotId) will create a collision
  const checkSwapConflict = (targetDay, targetSlotId) => {
    if (!selectedSource) return { conflict: false };
    const numTargetSlot = Number(targetSlotId);
    if (isNaN(numTargetSlot)) return { conflict: true, reason: 'Invalid slot' };

    // HARD CONSTRAINT: Institutional policy strictly forbids classes between 08:00 - 09:00 AM (Period 1)
    if (numTargetSlot === 1) {
      return { conflict: true, reason: 'Classes from 08:00 - 09:00 AM (Period 1) are strictly prohibited.' };
    }

    const actualTargetTimetableId = targetTimetableId || displayedTimetable?.id;
    const sourceTT = timetables.find(t => t.id === selectedSource.timetableId);
    const targetTT = timetables.find(t => t.id === actualTargetTimetableId);
    if (!sourceTT || !targetTT) return { conflict: false };

    const isSourceLab = !!selectedSource.labBlock;
    const duration = isSourceLab ? selectedSource.duration : 1;
    const sourcePeriods = selectedSource.periods || [Number(selectedSource.slotId)];
    const targetPeriods = Array.from({ length: duration }, (_, i) => numTargetSlot + i);

    // 1. Check if same exact slot/block is selected
    if (selectedSource.timetableId === actualTargetTimetableId && selectedSource.day === targetDay) {
      if (sourcePeriods.includes(numTargetSlot)) {
        return { conflict: false };
      }
    }

    // 2. Check block boundaries
    if (Math.max(...targetPeriods) > 10) {
      return { conflict: true, reason: `A ${duration}-hour laboratory block cannot extend past Period 10 (18:45).` };
    }
    if (targetPeriods.includes(1)) {
      return { conflict: true, reason: 'Classes in Period 1 are strictly prohibited.' };
    }

    // 3. Check Lunch Break boundary (Periods <= 4 vs Periods >= 5)
    const hasMorning = targetPeriods.some(p => p <= 4);
    const hasAfternoon = targetPeriods.some(p => p >= 5);
    if (hasMorning && hasAfternoon) {
      return { conflict: true, reason: 'A laboratory block cannot cross the 11:45-13:00 lunch break.' };
    }

    // 4. Lab integrity checks
    if (!isSourceLab) {
      // Source is a single theory slot. Target cannot be part of a multi-hour lab block!
      const targetLab = getSlotLabBlock(targetTT, targetDay, numTargetSlot);
      if (targetLab && targetLab.duration > 1) {
        return {
          conflict: true,
          reason: `Cannot swap a 1-hour lecture with a ${targetLab.duration}-hour laboratory block (${targetLab.subjectCode}). Either move the whole lab block or swap individual lectures.`
        };
      }
    } else {
      // Source is a lab block. Target must NOT partially split any existing lab block!
      for (const tp of targetPeriods) {
        const tLab = getSlotLabBlock(targetTT, targetDay, tp);
        if (tLab) {
          const allInside = tLab.periods.every(p => targetPeriods.includes(p));
          if (!allInside) {
            return {
              conflict: true,
              reason: `Cannot split existing ${tLab.duration}-hour laboratory block (${tLab.subjectCode}) at Period ${tp}.`
            };
          }
        }
      }
    }

    // 5. Zero-collision verification across other timetables
    for (let i = 0; i < duration; i++) {
      const sp = sourcePeriods[i];
      const tp = targetPeriods[i];
      const sourceData = sourceTT.grid?.[selectedSource.day]?.[sp] || null;
      const targetData = targetTT.grid?.[targetDay]?.[tp] || null;

      if (sourceData) {
        for (const tt of timetables) {
          if (tt.department !== targetTT.department) continue;
          if (tt.id === selectedSource.timetableId && selectedSource.day === targetDay && sourcePeriods.includes(tp)) continue;

          const otherSlot = tt.grid?.[targetDay]?.[tp];
          if (otherSlot && tt.id !== actualTargetTimetableId) {
            if (sourceData.facultyId && otherSlot.facultyId === sourceData.facultyId) {
              return { conflict: true, reason: `Faculty Conflict: ${sourceData.facultyName} is occupied in Sec ${tt.section} at Period ${tp}.` };
            }
            if (sourceData.roomId && otherSlot.roomId === sourceData.roomId) {
              return { conflict: true, reason: `Room Conflict: ${sourceData.roomName || 'Lab'} is occupied by Sec ${tt.section} at Period ${tp}.` };
            }
          }
        }
      }

      if (targetData) {
        for (const tt of timetables) {
          if (tt.department !== sourceTT.department) continue;
          if (tt.id === actualTargetTimetableId && selectedSource.day === targetDay && targetPeriods.includes(sp)) continue;

          const otherSlot = tt.grid?.[selectedSource.day]?.[sp];
          if (otherSlot && tt.id !== selectedSource.timetableId) {
            if (targetData.facultyId && otherSlot.facultyId === targetData.facultyId) {
              return { conflict: true, reason: `Faculty Conflict: ${targetData.facultyName} is occupied in Sec ${tt.section} on ${selectedSource.day} Period ${sp}.` };
            }
            if (targetData.roomId && otherSlot.roomId === targetData.roomId) {
              return { conflict: true, reason: `Room Conflict: ${targetData.roomName || 'Lab'} is occupied by Sec ${tt.section} on ${selectedSource.day} Period ${sp}.` };
            }
          }
        }
      }
    }

    return { conflict: false };
  };

  const handleSlotClick = (day, slotId) => {
    const numSlotId = Number(slotId);
    if (numSlotId === 1) {
      notify('Classes from 08:00 - 09:00 AM (Period 1) are strictly prohibited.', 'warning');
      return;
    }
    const clickedData = displayedTimetable?.grid?.[day]?.[numSlotId] || null;

    if (!selectedSource) {
      if (!clickedData) return;
      const labBlock = getSlotLabBlock(displayedTimetable, day, numSlotId);
      setSelectedSource({
        timetableId: displayedTimetable?.id,
        year: displayedTimetable?.year,
        section: displayedTimetable?.section,
        day,
        slotId: labBlock ? labBlock.startSlot : numSlotId,
        data: clickedData,
        labBlock,
        periods: labBlock ? labBlock.periods : [numSlotId],
        duration: labBlock ? labBlock.duration : 1
      });
      setTargetTimetableId(displayedTimetable?.id);
    } else {
      const actualTarget = targetTimetableId || displayedTimetable?.id;
      const isSameSource = selectedSource.timetableId === actualTarget && selectedSource.day === day && (
        selectedSource.periods ? selectedSource.periods.includes(numSlotId) : selectedSource.slotId === numSlotId
      );

      if (isSameSource) {
        setSelectedSource(null);
        setTargetTimetableId(null);
        return;
      }

      const conflictCheck = checkSwapConflict(day, numSlotId);
      if (conflictCheck.conflict) {
        notify(conflictCheck.reason || 'Cannot swap here: Collision or invalid block configuration.', 'warning');
        return;
      }

      const isSourceLab = !!selectedSource.labBlock;
      const duration = isSourceLab ? selectedSource.duration : 1;
      const targetPeriods = Array.from({ length: duration }, (_, i) => numSlotId + i);

      swapSlots(
        selectedSource.timetableId,
        {
          day: selectedSource.day,
          slotId: selectedSource.slotId,
          periods: selectedSource.periods,
          duration: selectedSource.duration
        },
        actualTarget,
        {
          day,
          slotId: numSlotId,
          periods: targetPeriods,
          duration
        }
      );

      setSelectedSource(null);
      setTargetTimetableId(null);
    }
  };

  if (!timetable) {
    return (
      <div className={`border rounded-2xl p-8 text-center space-y-3 transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          No Timetable Selected
        </h3>
        <p className={`text-xs whitespace-nowrap mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Select or generate a draft schedule to start editing and swapping slots.
        </p>
      </div>
    );
  }

  const isDraft = timetable.status === 'DRAFT';
  const isApproved = timetable.status === 'APPROVED';
  const hasUnplaced = displayedTimetable?.unplacedSessions?.length > 0;

  return (
    <div className="space-y-4">

      {/* Infeasibility Alert */}
      {hasUnplaced && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs shadow-sm">
          <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Scheduling conflict detected with current constraints</span>
          </div>
          <div className="pl-6 space-y-1">
            {displayedTimetable.unplacedSessions.map((u, i) => (
              <div key={i} className="text-rose-300 font-mono text-[11px] bg-rose-950/60 p-1.5 rounded border border-rose-800/40">
                • {u.subjectCode} — {u.facultyName}: {u.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {deptObj.name} • Semester {displayedTimetable.semester || ((displayedTimetable.year * 2) - 1) || 5} (Sec {displayedTimetable.section})
              </span>
              <span className={`text-xs font-semibold px-2 py-0.2 rounded border ${
                isDraft 
                  ? isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                  : isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {displayedTimetable.status}
              </span>
            </div>
            {assignedCRName && (
              <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Classroom: {assignedCRName}
              </p>
            )}
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isDraft ? 'Click to swap' : 'Published Schedule'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <button 
                onClick={() => deleteTimetable(timetable.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                title="Permanently delete this draft from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Draft</span>
              </button>
              <button 
                onClick={() => approveTimetable(timetable.id)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Publish Schedule</span>
              </button>
            </>
          )}
          {isApproved && (
            <>
              <button 
                onClick={() => deleteTimetable(timetable.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                title="Permanently delete this timetable from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button 
                onClick={() => revertTimetable(timetable.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  isDark 
                    ? 'bg-[#162032] hover:bg-[#1e2d47] text-slate-200 border-[#1e293b]' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
                }`}
                title="Revert back to DRAFT status in database"
              >
                <Undo2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Revert to Draft</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cross-Section & Cross-Year Swap Toolbar */}
      {selectedSource && (
        <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-colors ${
          isDark ? 'bg-blue-950/20 border-blue-500/40' : 'bg-blue-50/70 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-500">Selected Source:</span>
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedSource.data?.subjectCode}</span>
              <span className="text-slate-400">
                (Sem {selectedSource.data?.semester || ((selectedSource.year * 2) - 1)} Sec {selectedSource.section} • {selectedSource.day} Period {selectedSource.slotId})
              </span>
              {selectedSource.labBlock && (
                <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {selectedSource.duration}-Hour Laboratory Block (Periods {selectedSource.labBlock.startSlot}–{selectedSource.labBlock.endSlot})
                </span>
              )}
            </div>
            <button 
              onClick={() => { setSelectedSource(null); setTargetTimetableId(null); }}
              className="px-2 py-0.5 rounded text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> <span>Cancel</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-500/20">
            <div className="flex flex-wrap items-center gap-2">
              <Shuffle className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-slate-300">Target Timetable:</span>
              <div className="flex flex-wrap gap-1">
                {deptTimetables.map(tt => (
                  <button 
                    key={tt.id}
                    onClick={() => setTargetTimetableId(tt.id)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${
                      (targetTimetableId || displayedTimetable.id) === tt.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                        : isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Year {tt.year} Sec {tt.section}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Green = Allowed
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Red = Collision (Blocked)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Grid Table */}
      <div className={`border rounded-2xl p-3 sm:p-4 overflow-x-auto shadow-sm transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>
        <table className="w-full min-w-[1450px] table-fixed border-collapse">
          <colgroup>
            <col className="w-24" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[9%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
          </colgroup>
          <thead>
            <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <th className="p-2.5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
                Day
              </th>
              {PERIODS.map(p => (
                <th key={p.id} className="p-2.5 text-center">
                  <div className={`text-xs sm:text-sm font-bold ${
                    p.isBreak 
                      ? isDark ? 'text-blue-400' : 'text-blue-700'
                      : isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {p.label}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {p.time}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workingDays.map(day => (
              <tr key={day} className={`border-b last:border-b-0 ${
                isDark ? 'border-slate-800/60' : 'border-slate-100'
              }`}>
                <td className="p-2.5 align-middle">
                  <span className={`text-sm font-bold tracking-wide block ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {day}
                  </span>
                </td>

                {/* Render Interactive Slots with Conflict Red Highlight & Merged Lab Support */}
                {PERIODS.map((p, idx) => {
                  if (p.isBreak) {
                    return (
                      <td key={p.id} className="p-1">
                        <div className={`min-h-[105px] h-full w-full rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-1.5 select-none ${
                          isDark 
                            ? 'bg-blue-950/20 border-blue-900/40 text-blue-300' 
                            : 'bg-slate-100/90 border-slate-300 text-slate-700'
                        }`}>
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">LUNCH BREAK</span>
                          <span className="text-[11px] font-mono text-slate-400 mt-0.5">11:45-13:00</span>
                        </div>
                      </td>
                    );
                  }

                  const slot = displayedTimetable?.grid?.[day]?.[p.id];
                  const prevP = idx > 0 ? PERIODS[idx - 1] : null;
                  const prevSlot = prevP && !prevP.isBreak ? displayedTimetable?.grid?.[day]?.[prevP.id] : null;

                  const isContinuation = slot && (slot.isLab || slot.type === 'lab') && prevSlot &&
                    (prevSlot.isLab || prevSlot.type === 'lab') &&
                    (prevSlot.subjectCode === slot.subjectCode || (slot.labInstanceId && prevSlot.labInstanceId === slot.labInstanceId)) &&
                    (slot.isLabContinuation || prevSlot.isLabStart);

                  if (isContinuation) {
                    return null;
                  }

                  let colSpan = 1;
                  if (slot && (slot.isLab || slot.type === 'lab')) {
                    for (let k = idx + 1; k < PERIODS.length; k++) {
                      const forwardP = PERIODS[k];
                      if (forwardP.isBreak) break;
                      const forwardSlot = displayedTimetable?.grid?.[day]?.[forwardP.id];
                      if (
                        forwardSlot &&
                        (forwardSlot.isLab || forwardSlot.type === 'lab') &&
                        (forwardSlot.subjectCode === slot.subjectCode || (slot.labInstanceId && forwardSlot.labInstanceId === slot.labInstanceId))
                      ) {
                        colSpan++;
                      } else {
                        break;
                      }
                    }
                  }
                  const isSelected = selectedSource && selectedSource.timetableId === displayedTimetable.id && selectedSource.day === day && (
                    selectedSource.periods ? selectedSource.periods.includes(p.id) : selectedSource.slotId === p.id
                  );
                  
                  // Conflict checking: if swapping with this slot causes collision, highlight in RED
                  const conflictCheck = selectedSource && !isSelected ? checkSwapConflict(day, p.id) : null;
                  const isConflict = conflictCheck ? conflictCheck.conflict : false;
                  const isSwapTarget = selectedSource && !isSelected && !isConflict;

                  return (
                    <td key={p.id} colSpan={colSpan} className="p-1">
                      <TimetableSlot
                        slot={slot}
                        day={day}
                        slotInfo={p.id}
                        isInteractive={true}
                        isSelected={isSelected}
                        isSwapTarget={isSwapTarget}
                        isInvalidTarget={isConflict}
                        isExpandedLab={colSpan > 1}
                        onClick={() => handleSlotClick(day, p.id)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
