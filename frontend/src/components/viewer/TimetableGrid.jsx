import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import TimetableSlot from './TimetableSlot';
import ExportPdfButton from './ExportPdfButton';
import { Clock, Calendar, AlertCircle, Users, Sliders, CalendarX, BookOpen, Layers } from 'lucide-react';

const PERIODS = [
  { id: 1, label: 'P1', time: '08:00 - 08:45' },
  { id: 2, label: 'P2', time: '09:00 - 09:45' },
  { id: 3, label: 'P3', time: '10:00 - 10:45' },
  { id: 4, label: 'P4', time: '11:00 - 11:45' },
  { id: 'lunch', label: 'Lunch', time: '11:45 - 13:00', isBreak: true },
  { id: 5, label: 'P5', time: '13:00 - 13:45' },
  { id: 6, label: 'P6', time: '14:00 - 14:45' },
  { id: 7, label: 'P7', time: '15:00 - 15:45' },
  { id: 8, label: 'P8', time: '16:00 - 16:45' },
  { id: 9, label: 'P9', time: '17:00 - 17:45' },
  { id: 10, label: 'P10', time: '18:00 - 18:45' }
];

export default function TimetableGrid() {
  const { 
    currentViewerTimetable, 
    selectedDepartment, 
    selectedSemester,
    selectedYear, 
    selectedSection, 
    selectedFacultyId,
    viewMode,
    setIsEditingHodStudio,
    departments,
    professors,
    workingDays
  } = useTimetable();
  const { isHod } = useAuth();
  const { isDark } = useTheme();

  const timetable = currentViewerTimetable;
  const deptObj = departments.find(d => d.id === selectedDepartment) || { id: selectedDepartment, name: selectedDepartment };
  const facultyObj = professors.find(p => p.id === selectedFacultyId);
  const isFacultyView = viewMode === 'faculty';

  if (!timetable) {
    return (
      <div className={`border rounded-2xl p-10 text-center max-w-lg mx-auto my-8 space-y-4 transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mx-auto">
          <CalendarX className="w-6 h-6" />
        </div>
        <div>
          <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No Timetable Available
          </h2>
          <p className={`text-sm max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isHod
              ? `Configure constraints in HoD Studio to generate schedules for ${deptObj.name}.`
              : `The academic timetable for Semester ${selectedSemester || 5} Section ${selectedSection} is not published yet.`}
          </p>
        </div>
        {isHod && (
          <button
            onClick={() => setIsEditingHodStudio(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-all"
          >
            <Sliders className="w-4 h-4" />
            <span>Open HoD Studio</span>
          </button>
        )}
      </div>
    );
  }

  const hasUnplaced = timetable.unplacedSessions?.length > 0;

  return (
    <div className="space-y-4">

      {/* Infeasibility Alert Banner */}
      {hasUnplaced && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Resource Constraint Collision: Over-constrained Requirements</span>
          </div>
          <p className="text-slate-300 pl-6 text-xs leading-relaxed">
            The following <span className="font-semibold text-white">{timetable.unplacedSessions.length} session(s)</span> could not find a conflict-free slot. No invalid timetable was generated.
          </p>
          <div className="pl-6 space-y-1 pt-1">
            {timetable.unplacedSessions.map((u, i) => (
              <div key={i} className="text-rose-300 font-mono text-xs bg-rose-950/60 p-1.5 rounded border border-rose-800/40">
                • {u.subjectCode} ({u.subjectName}) — Faculty: {u.facultyName} [{u.reason}]
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Timetable Card */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>

        {/* Timetable Header */}
        <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#090d16]/60 border-[#1e293b]' : 'bg-slate-50/70 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              {isFacultyView ? <Users className="w-6 h-6 text-emerald-400" /> : <Calendar className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isFacultyView ? facultyObj?.name : deptObj.name}
                </h2>
                <span className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-md border ${
                  isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isFacultyView ? facultyObj?.designation : `Semester ${timetable.semester || selectedSemester || 5} • Section ${selectedSection}`}
                </span>
                <span className={`text-xs sm:text-sm font-medium px-2.5 py-0.5 rounded-md border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  Odd Sem 2026-2027
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isFacultyView
                  ? `Teaching Schedule • Department of ${deptObj.name}`
                  : `Department of ${deptObj.name} • Class Timetable`}
              </p>
            </div>
          </div>

          {isHod && (
            <button
              onClick={() => setIsEditingHodStudio(true)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-colors ${
                isDark 
                  ? 'bg-[#162032] hover:bg-[#1e2d47] text-slate-200 border-[#1e293b]' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>HoD Studio</span>
            </button>
          )}
        </div>

        {/* Timetable Table Grid with Strict Mathematically Fixed Columns */}
        <div className="p-3 sm:p-5 overflow-x-auto">
          <table className="w-full min-w-[1200px] table-fixed border-collapse">
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
                <th className="p-2.5 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                  Day
                </th>
                {PERIODS.map(p => (
                  <th key={p.id} className="p-2.5 text-center">
                    <div className={`text-xs sm:text-sm font-black ${
                      p.isBreak 
                        ? isDark ? 'text-amber-400' : 'text-amber-700'
                        : isDark ? 'text-slate-100' : 'text-slate-800'
                    }`}>
                      {p.label}
                      {p.id === 1 && (
                        <span className="text-[9px] font-medium text-amber-500 block">No Classes</span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 font-medium">
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
                    <span className={`text-sm font-black uppercase tracking-wider block ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {day.slice(0, 3)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {day}
                    </span>
                  </td>

                  {/* Render Cells */}
                  {PERIODS.map((p, idx) => {
                    if (p.isBreak) {
                      return (
                        <td key={p.id} className="p-1">
                          <div className={`min-h-[94px] h-full w-full rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-1.5 select-none ${
                            isDark 
                              ? 'bg-amber-950/25 border-amber-500/30 text-amber-300' 
                              : 'bg-amber-50/90 border-amber-200 text-amber-900'
                          }`}>
                            <Clock className="w-4 h-4 mb-1 text-amber-500 dark:text-amber-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">Lunch</span>
                            <span className="text-[10px] font-mono text-amber-700/80 dark:text-amber-400/80 mt-0.5 font-medium">11:45-13:00</span>
                          </div>
                        </td>
                      );
                    }

                    const slot = timetable?.grid?.[day]?.[p.id];
                    const prevP = idx > 0 ? PERIODS[idx - 1] : null;
                    const prevSlot = prevP && !prevP.isBreak ? timetable?.grid?.[day]?.[prevP.id] : null;

                    const isLab = slot?.isLab || slot?.type === 'lab';
                    const isContinuation = isLab && prevSlot && (prevSlot.isLab || prevSlot.type === 'lab') && prevSlot.subjectCode === slot.subjectCode;

                    if (isContinuation) {
                      return null; // The parent cell expands across with dynamic colSpan
                    }

                    let labColSpan = 1;
                    if (isLab) {
                      for (let k = idx + 1; k < PERIODS.length; k++) {
                        const forwardP = PERIODS[k];
                        if (forwardP.isBreak) break;
                        const forwardSlot = timetable?.grid?.[day]?.[forwardP.id];
                        if (forwardSlot && (forwardSlot.isLab || forwardSlot.type === 'lab') && forwardSlot.subjectCode === slot.subjectCode) {
                          labColSpan++;
                        } else {
                          break;
                        }
                      }
                    }

                    return (
                      <td key={p.id} colSpan={labColSpan} className="p-1">
                        <TimetableSlot
                          slot={slot}
                          day={day}
                          slotInfo={p}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timetable Bottom Action Bar: Export PDF Button */}
        <div className={`px-4 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm ${
          isDark ? 'bg-[#090d16]/80 border-[#1e293b] text-slate-400' : 'bg-slate-50/80 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="font-medium">Theory Lecture</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-medium">Practical Laboratory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="font-medium">Lunch Break</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ExportPdfButton timetable={timetable} />
          </div>
        </div>
      </div>
    </div>
  );
}
