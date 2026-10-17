import React, { useState, useRef, useEffect } from 'react';
import { Download, Check, Loader2, ChevronDown, FileText, Files, Users, BookOpen } from 'lucide-react';
import { 
  exportNoticeBoardPdf, 
  exportAllTimetablesAsPDF, 
  exportCourseFacultyRosterPdf 
} from '../../services/pdfExport';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';

export default function ExportPdfButton({ timetable }) {
  const [exportingType, setExportingType] = useState(null); // 'current' | 'all' | 'roster' | null
  const [successType, setSuccessType] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { 
    currentViewerTimetable, 
    timetables, 
    subjects, 
    departments, 
    selectedDepartment, 
    professors, 
    allProfessors, 
    workingDays, 
    notify 
  } = useTimetable();
  const { isDark } = useTheme();

  const activeTimetable = timetable || currentViewerTimetable;
  const deptTimetables = (timetables || []).filter(t => !selectedDepartment || t.department === selectedDepartment);
  const validTimetablesCount = deptTimetables.length;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Export Current Timetable
  const handleExportCurrent = async (e) => {
    e?.stopPropagation();
    setIsMenuOpen(false);
    if (!activeTimetable) {
      notify('No active timetable selected to export.', 'warning');
      return;
    }
    setExportingType('current');
    try {
      await exportNoticeBoardPdf(activeTimetable, { subjects, departments, workingDays });
      setSuccessType('current');
      notify(`Downloaded timetable for Sem ${activeTimetable.semester || activeTimetable.year} Sec ${activeTimetable.section}`, 'success');
      setTimeout(() => setSuccessType(null), 3000);
    } catch (e) {
      console.error('PDF Export Error:', e);
      notify('Failed to generate PDF: ' + (e.message || 'Unknown error'), 'warning');
    } finally {
      setExportingType(null);
    }
  };

  // 2. Export All Generated Timetables (Batch PDF)
  const handleExportAll = async (e) => {
    e?.stopPropagation();
    setIsMenuOpen(false);
    if (deptTimetables.length === 0) {
      notify(`No generated timetables found for ${selectedDepartment} department.`, 'warning');
      return;
    }
    setExportingType('all');
    try {
      await exportAllTimetablesAsPDF(deptTimetables, { 
        subjects, 
        departments, 
        department: selectedDepartment, 
        workingDays 
      });
      setSuccessType('all');
      notify(`Successfully generated Batch PDF for all ${deptTimetables.length} timetables`, 'success');
      setTimeout(() => setSuccessType(null), 3000);
    } catch (e) {
      console.error('Batch PDF Export Error:', e);
      notify('Failed to export all timetables: ' + (e.message || 'Unknown error'), 'warning');
    } finally {
      setExportingType(null);
    }
  };

  // 3. Export Course & Faculty Allocation Roster
  const handleExportCourseFacultyRoster = async (e) => {
    e?.stopPropagation();
    setIsMenuOpen(false);
    setExportingType('roster');
    try {
      await exportCourseFacultyRosterPdf({
        department: selectedDepartment,
        departments,
        subjects,
        professors,
        allProfessors,
        timetables: deptTimetables
      });
      setSuccessType('roster');
      notify('Course-Professor Allocation Roster downloaded successfully', 'success');
      setTimeout(() => setSuccessType(null), 3000);
    } catch (e) {
      console.error('Course-Professor PDF Error:', e);
      notify('Failed to generate Course-Professor Roster: ' + (e.message || 'Unknown error'), 'warning');
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="relative inline-flex items-center rounded-xl shadow-md shadow-blue-600/20" ref={menuRef}>
      {/* Primary Button: Exports Current View */}
      <button
        onClick={handleExportCurrent}
        disabled={!!exportingType || !activeTimetable}
        className="px-4 py-2.5 rounded-l-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border-r border-blue-700/60"
        title="Export current timetable as official NITK notice board PDF"
      >
        {exportingType === 'current' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : successType === 'current' ? (
          <>
            <Check className="w-4 h-4 text-blue-200" />
            <span>Downloaded</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </>
        )}
      </button>

      {/* Dropdown Menu Trigger Button */}
      <button
        onClick={() => setIsMenuOpen(prev => !prev)}
        disabled={!!exportingType}
        className="px-2.5 py-2.5 rounded-r-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center"
        title="More PDF export options (Export All Schedules, Course-Faculty Roster)"
        aria-label="Export Options Menu"
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {isMenuOpen && (
        <div className={`absolute right-0 bottom-full mb-2 w-72 sm:w-80 rounded-2xl border p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Institutional PDF Exports
            </span>
          </div>

          <div className="space-y-1">
            {/* Option 1: Current Timetable */}
            <button
              onClick={handleExportCurrent}
              disabled={!activeTimetable || !!exportingType}
              className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
              } disabled:opacity-40 cursor-pointer`}
            >
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Current Timetable</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 font-semibold">
                    1 Sheet
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Sem {activeTimetable?.semester || activeTimetable?.year} Sec {activeTimetable?.section || 'A'} notice board PDF
                </p>
              </div>
            </button>

            {/* Option 2: Export All Timetables (Batch PDF) */}
            <button
              onClick={handleExportAll}
              disabled={validTimetablesCount === 0 || !!exportingType}
              className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
              } disabled:opacity-40 cursor-pointer`}
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                <Files className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Export All Timetables</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                    {validTimetablesCount} Sheets
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Unified multi-page PDF of all department schedules
                </p>
              </div>
            </button>

            {/* Option 3: Course-Professor Allocation Roster */}
            <button
              onClick={handleExportCourseFacultyRoster}
              disabled={validTimetablesCount === 0 || !!exportingType}
              className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                isDark ? 'hover:bg-slate-800/70 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
              } disabled:opacity-40 cursor-pointer`}
            >
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Course-Professor</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-500 font-bold">
                    PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Course and assigned professor allocations from generated schedules
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
