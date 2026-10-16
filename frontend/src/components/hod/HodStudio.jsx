import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import ConstraintForm from './ConstraintForm';
import DraftSidebar from './DraftSidebar';
import InteractiveGrid from './InteractiveGrid';
import FacultyWorkloadModal from './FacultyWorkloadModal';
import { Sliders, ArrowLeft, ChevronUp, ChevronDown, BarChart3 } from 'lucide-react';

export default function HodStudio() {
  const { 
    setIsEditingHodStudio, 
    draftTimetables, 
    selectedDepartment 
  } = useTimetable();
  const { isDark } = useTheme();
  const [showConstraints, setShowConstraints] = useState(draftTimetables.length === 0);
  const [showWorkload, setShowWorkload] = useState(false);

  return (
    <div className="space-y-4">

      {/* Top Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 border rounded-2xl shadow-sm transition-colors w-full ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditingHodStudio(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isDark 
                ? 'bg-[#162032] hover:bg-[#1e2d47] text-slate-200 border-[#1e293b]' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Back to Timetable</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                HoD Dashboard
              </h1>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {selectedDepartment} Dept
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowWorkload(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isDark 
                ? 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-800/60 text-blue-300' 
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
            }`}
            title="Faculty Workload & Contact Hours Analyzer (DBIM Section 10.5 Analytics)"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Workload Analytics</span>
          </button>

          <button
            onClick={() => setShowConstraints(!showConstraints)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showConstraints 
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                : isDark 
                  ? 'bg-[#162032] hover:bg-[#1e2d47] border-[#1e293b] text-slate-200' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showConstraints ? 'Hide Constraints' : 'Show Constraints'}</span>
            {showConstraints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Constraint Form Drawer */}
      {showConstraints && <ConstraintForm onClose={() => setShowConstraints(false)} />}

      {/* Faculty Workload Modal */}
      <FacultyWorkloadModal isOpen={showWorkload} onClose={() => setShowWorkload(false)} />

      {/* Main Studio Workspace: Sidebar + Interactive Timetable Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-4 xl:col-span-3">
          <DraftSidebar />
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          <InteractiveGrid />
        </div>
      </div>
    </div>
  );
}
