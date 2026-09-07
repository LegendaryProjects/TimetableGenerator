import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { DAYS, DEPARTMENTS } from '../../data/mockAcademicData';
import TimetableSlot from '../viewer/TimetableSlot';
import {
  ArrowLeftRight, CheckCircle2, Clock, X, Shuffle, Undo2, Layers, AlertCircle, Check, Trash2
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
    selectedDepartment, notify
  } = useTimetable();
  const { isDark } = useTheme();

  const [selectedSource, setSelectedSource] = useState(null);
  const [targetTimetableId, setTargetTimetableId] = useState(null);

  const timetable = currentHodTimetable;
  const deptObj = DEPARTMENTS.find(d => d.id === selectedDepartment) || DEPARTMENTS[0];
  const deptTimetables = timetables.filter(t => t.department === selectedDepartment);
  const displayedTimetable = targetTimetableId
    ? deptTimetables.find(t => t.id === targetTimetableId) || timetable
    : timetable;

  // Check if swapping with (targetDay, targetSlotId) will create a collision
  const checkSwapConflict = (targetDay, targetSlotId) => {
    if (!selectedSource) return false;
    const actualTargetTimetableId = targetTimetableId || displayedTimetable.id;

    if (selectedSource.timetableId === actualTargetTimetableId && selectedSource.day === targetDay && selectedSource.slotId === targetSlotId) {
      return false;
    }

    const sourceTT = timetables.find(t => t.id === selectedSource.timetableId);
    const targetTT = timetables.find(t => t.id === actualTargetTimetableId);
    if (!sourceTT || !targetTT) return false;

    const sourceData = selectedSource.data;
    const targetData = targetTT.grid?.[targetDay]?.[targetSlotId] || null;

    // Check if sourceData at (targetDay, targetSlotId) clashes with any other section
    if (sourceData) {
      for (const tt of timetables) {
        if (tt.department !== targetTT.department) continue;
        if (tt.id === selectedSource.timetableId) continue;

        const otherSlot = tt.grid?.[targetDay]?.[targetSlotId];
        if (otherSlot && tt.id !== actualTargetTimetableId) {
          if (otherSlot.facultyId === sourceData.facultyId || otherSlot.roomId === sourceData.roomId) {
            return true;
          }
        }
      }
    }

    // Check if targetData at (source.day, source.slotId) clashes with any other section
    if (targetData) {
      for (const tt of timetables) {
        if (tt.department !== sourceTT.department) continue;
        if (tt.id === actualTargetTimetableId) continue;

        const otherSlot = tt.grid?.[selectedSource.day]?.[selectedSource.slotId];
        if (otherSlot && tt.id !== selectedSource.timetableId) {
          if (otherSlot.facultyId === targetData.facultyId || otherSlot.roomId === targetData.roomId) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const handleSlotClick = (day, slotId) => {
    const clickedData = displayedTimetable?.grid?.[day]?.[slotId] || null;
    if (!selectedSource) {
      if (!clickedData) return;
      setSelectedSource({
        timetableId: displayedTimetable.id, year: displayedTimetable.year,
        section: displayedTimetable.section, day, slotId, data: clickedData
      });
      setTargetTimetableId(displayedTimetable.id);
    } else {
      const actualTarget = targetTimetableId || displayedTimetable.id;
      if (selectedSource.timetableId === actualTarget && selectedSource.day === day && selectedSource.slotId === slotId) {
        setSelectedSource(null); setTargetTimetableId(null); return;
      }

      const hasConflict = checkSwapConflict(day, slotId);
      if (hasConflict) {
        notify('Cannot swap here: Faculty or Classroom is already occupied in another section.', 'warning');
        return;
      }

      swapSlots(selectedSource.timetableId, { day: selectedSource.day, slotId: selectedSource.slotId }, actualTarget, { day, slotId });
      setSelectedSource(null); setTargetTimetableId(null);
    }
  };

  if (!timetable) {
    return (
      <div className={`border rounded-2xl p-8 text-center space-y-3 transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          No Timetable Selected
        </h3>
        <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
            <span>Zero-overlapping impossible with current constraints!</span>
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
                {deptObj.name} • Year {displayedTimetable.year} (Sec {displayedTimetable.section})
              </span>
              <span className={`text-xs font-semibold px-2 py-0.2 rounded border ${
                isDraft 
                  ? isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                  : isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {displayedTimetable.status}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isDraft ? 'Click any class then click target slot to swap' : 'Published Active Schedule'}
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
                (Year {selectedSource.year} Sec {selectedSource.section} • {selectedSource.day} Period {selectedSource.slotId})
              </span>
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
        <table className="w-full min-w-[1150px] table-fixed border-collapse">
          <colgroup>
            <col className="w-20" />
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
              <th className="p-2 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Day
              </th>
              {PERIODS.map(p => (
                <th key={p.id} className="p-2 text-center">
                  <div className={`text-xs font-bold ${
                    p.isBreak 
                      ? isDark ? 'text-amber-400' : 'text-amber-700'
                      : isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {p.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {p.time}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day} className={`border-b last:border-b-0 ${
                isDark ? 'border-slate-800/60' : 'border-slate-100'
              }`}>
                <td className="p-2 align-middle">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {day.slice(0, 3)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {day}
                  </span>
                </td>

                {/* Render Interactive Slots with Conflict Red Highlight & Merged Lab Support */}
                {PERIODS.map((p, idx) => {
                  if (p.isBreak) {
                    return (
                      <td key={p.id} className="p-1">
                        <div className={`h-[88px] w-full rounded-lg border border-dashed flex flex-col items-center justify-center text-center p-1 select-none ${
                          isDark 
                            ? 'bg-amber-950/25 border-amber-500/30 text-amber-300' 
                            : 'bg-amber-50/90 border-amber-200 text-amber-900'
                        }`}>
                          <Clock className="w-3.5 h-3.5 mb-1 text-amber-500 dark:text-amber-400" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-300">Lunch</span>
                          <span className="text-[9px] font-mono text-amber-600/80 dark:text-amber-400/80 mt-0.5">11:45-13:00</span>
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

                  const nextP = idx < PERIODS.length - 1 ? PERIODS[idx + 1] : null;
                  const nextSlot = nextP && !nextP.isBreak ? displayedTimetable?.grid?.[day]?.[nextP.id] : null;
                  const isLabStart = slot && (slot.isLab || slot.type === 'lab') && nextSlot &&
                    (nextSlot.isLab || nextSlot.type === 'lab') &&
                    (nextSlot.subjectCode === slot.subjectCode || (slot.labInstanceId && nextSlot.labInstanceId === slot.labInstanceId)) &&
                    (slot.isLabStart || !slot.isLabContinuation);

                  const colSpan = isLabStart ? 2 : 1;
                  const isSelected = selectedSource && selectedSource.timetableId === displayedTimetable.id && selectedSource.day === day && selectedSource.slotId === p.id;
                  
                  // Conflict checking: if swapping with this slot causes collision, highlight in RED
                  const isConflict = selectedSource && !isSelected && checkSwapConflict(day, p.id);
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
