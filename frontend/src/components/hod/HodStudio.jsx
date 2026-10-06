import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import ConstraintForm from './ConstraintForm';
import DraftSidebar from './DraftSidebar';
import InteractiveGrid from './InteractiveGrid';
import { Sliders, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';

export default function HodStudio() {
  const { 
    setIsEditingHodStudio, 
    draftTimetables, 
    selectedDepartment 
  } = useTimetable();
  const { isDark } = useTheme();
  const [showConstraints, setShowConstraints] = useState(draftTimetables.length === 0);

  return (
    <div className="space-y-4">

      {/* Top Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 border rounded-2xl shadow-sm transition-colors w-full ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setIsEditingHodStudio(false)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-colors ${
              isDark 
                ? 'bg-[#162032] hover:bg-[#1e2d47] text-slate-200 border-[#1e293b]' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-blue-500" />
            <span>Back to Timetable</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                HoD Scheduling Privilege
              </h1>
              <span className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-lg border ${
                isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {selectedDepartment} Dept
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConstraints(!showConstraints)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
              showConstraints 
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                : isDark 
                  ? 'bg-[#162032] hover:bg-[#1e2d47] border-[#1e293b] text-slate-200' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{showConstraints ? 'Hide Constraints' : 'Show Constraints'}</span>
            {showConstraints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Constraint Form Drawer */}
      {showConstraints && <ConstraintForm onClose={() => setShowConstraints(false)} />}

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
