import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { FolderKanban, CheckCircle2, CheckCheck, Trash2, Undo2, Sparkles, Check } from 'lucide-react';

export default function DraftSidebar() {
  const {
    timetables, activeDraftId, setActiveDraftId, selectedDepartment,
    setSelectedSemester, setSelectedYear, setSelectedSection, approveTimetable, disapproveTimetable,
    approveAllDrafts, discardDraft
  } = useTimetable();
  const { isDark } = useTheme();

  const deptTimetables = timetables.filter(t => t.department === selectedDepartment);
  const draftCount = deptTimetables.filter(t => t.status === 'DRAFT').length;
  const approvedCount = deptTimetables.filter(t => t.status === 'APPROVED').length;

  return (
    <div className={`border rounded-2xl p-4 space-y-4 shadow-sm transition-colors ${
      isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
    }`}>

      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-blue-500" />
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Department Schedules
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`px-2 py-0.2 rounded text-[11px] font-semibold border ${
            isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {draftCount} Draft
          </span>
          <span className={`px-2 py-0.2 rounded text-[11px] font-semibold border ${
            isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {approvedCount} Published
          </span>
        </div>
      </div>

      {/* Approve All Button */}
      {draftCount > 0 && (
        <div className={`p-3 rounded-xl border space-y-2 ${
          isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {draftCount} Draft(s) Pending Approval
          </div>
          <button
            onClick={approveAllDrafts}
            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Approve & Publish All</span>
          </button>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
        {deptTimetables.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No schedules generated yet.
          </p>
        ) : deptTimetables.map(tt => {
          const isActive = (activeDraftId || deptTimetables[0]?.id) === tt.id;
          const isDraft = tt.status === 'DRAFT';
          return (
            <div
              key={tt.id}
              onClick={() => { 
                setActiveDraftId(tt.id); 
                setSelectedSemester(tt.semester || ((tt.year * 2) - 1));
                setSelectedYear(tt.year); 
                setSelectedSection(tt.section); 
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isActive 
                  ? isDark ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/40' : 'border-blue-400 bg-blue-50/60'
                  : isDark ? 'border-slate-800 bg-slate-900/30 hover:border-slate-700' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${
                    isDraft 
                      ? isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                      : isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    S{tt.semester || ((tt.year * 2) - 1)}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Sem {tt.semester || ((tt.year * 2) - 1)} • Sec {tt.section}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {isDraft ? 'Draft Schedule' : 'Published Active'}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                  isDraft 
                    ? isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                    : isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isDraft ? 'DRAFT' : 'LIVE'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 dark:border-slate-800/80 flex items-center justify-end gap-1.5">
                {isDraft ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); discardDraft(tt.id); }}
                      className="px-2 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-1 transition-colors"
                      title="Discard Draft"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Discard</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); approveTimetable(tt.id); }}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Check className="w-3 h-3" />
                      <span>Publish</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); disapproveTimetable(tt.id); }}
                    className="px-2 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1 transition-colors"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Revert to Draft</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
