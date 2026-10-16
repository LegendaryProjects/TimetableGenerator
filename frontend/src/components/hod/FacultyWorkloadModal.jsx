import React, { useState, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Users, BarChart3, Search, X, CheckCircle2, AlertTriangle, Clock, ArrowUpRight
} from 'lucide-react';

export default function FacultyWorkloadModal({ isOpen, onClose }) {
  const { timetables, selectedDepartment, professors, allProfessors, setSelectedFacultyId, setViewMode } = useTimetable();
  const { isDark } = useTheme();
  const [filterQuery, setFilterQuery] = useState('');

  const activeTimetables = useMemo(() => {
    return (timetables || []).filter(t => t.department === selectedDepartment);
  }, [timetables, selectedDepartment]);

  const workloadData = useMemo(() => {
    const profPool = (professors && professors.length > 0) ? professors : (allProfessors || []);
    const loadMap = {};

    profPool.forEach(p => {
      loadMap[p.id] = {
        id: p.id,
        name: p.name,
        designation: p.designation || 'Faculty Member',
        department: p.department || selectedDepartment,
        theoryHours: 0,
        labHours: 0,
        totalHours: 0,
        assignedCourses: new Set(),
        assignedCohorts: new Set()
      };
    });

    // Scan through all active timetables' periods
    activeTimetables.forEach(tt => {
      const cohort = `Sem ${tt.semester || (tt.year * 2 - 1)} Sec ${tt.section}`;
      const grid = tt.grid || {};

      Object.values(grid).forEach(daySlots => {
        Object.entries(daySlots || {}).forEach(([pStr, cell]) => {
          if (!cell || !cell.subjectCode) return;
          const facId = cell.facultyId;
          if (!facId) return;

          if (!loadMap[facId]) {
            loadMap[facId] = {
              id: facId,
              name: cell.facultyName || 'Faculty',
              designation: 'Faculty Member',
              department: selectedDepartment,
              theoryHours: 0,
              labHours: 0,
              totalHours: 0,
              assignedCourses: new Set(),
              assignedCohorts: new Set()
            };
          }

          if (cell.type === 'lab' || cell.isLab) {
            loadMap[facId].labHours += 1;
          } else {
            loadMap[facId].theoryHours += 1;
          }
          loadMap[facId].totalHours += 1;
          loadMap[facId].assignedCourses.add(cell.subjectCode);
          loadMap[facId].assignedCohorts.add(cohort);
        });
      });
    });

    return Object.values(loadMap).map(item => ({
      ...item,
      assignedCourses: Array.from(item.assignedCourses),
      assignedCohorts: Array.from(item.assignedCohorts)
    })).sort((a, b) => b.totalHours - a.totalHours);
  }, [activeTimetables, professors, allProfessors, selectedDepartment]);

  const filteredWorkload = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return workloadData;
    return workloadData.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.designation.toLowerCase().includes(q) ||
      item.assignedCourses.some(c => c.toLowerCase().includes(q))
    );
  }, [workloadData, filterQuery]);

  const stats = useMemo(() => {
    const totalFaculty = workloadData.length;
    const totalHours = workloadData.reduce((acc, curr) => acc + curr.totalHours, 0);
    const avgHours = totalFaculty ? (totalHours / totalFaculty).toFixed(1) : 0;
    const overloaded = workloadData.filter(w => w.totalHours > 16).length;
    return { totalFaculty, totalHours, avgHours, overloaded };
  }, [workloadData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 transition-all ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Faculty Teaching Workload Analyzer</h3>
              <p className="text-[11px] text-slate-400">Weekly teaching contact hours for {selectedDepartment} Department</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Analytics Snapshot Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className={`p-3 rounded-xl border text-center ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Faculty</span>
            <span className="text-lg font-bold text-blue-500">{stats.totalFaculty}</span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Hours</span>
            <span className="text-lg font-bold text-emerald-500">{stats.totalHours} hrs/wk</span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Load</span>
            <span className="text-lg font-bold text-indigo-400">{stats.avgHours} hrs/prof</span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">High Load (&gt;16h)</span>
            <span className={`text-lg font-bold ${stats.overloaded > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {stats.overloaded}
            </span>
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Filter by faculty name or assigned course code..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Faculty Workload Table */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {filteredWorkload.map(item => {
            const isOverloaded = item.totalHours > 16;
            const isLight = item.totalHours < 8 && item.totalHours > 0;
            const isOptimal = item.totalHours >= 8 && item.totalHours <= 16;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isDark ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isOverloaded 
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' 
                        : isOptimal 
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' 
                          : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isOverloaded ? 'Heavy Load' : isOptimal ? 'Optimal' : item.totalHours === 0 ? 'Unassigned' : 'Light Load'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                    <span>{item.designation}</span>
                    {item.assignedCourses.length > 0 && (
                      <>
                        <span>•</span>
                        <span>Courses: {item.assignedCourses.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <div className="font-bold text-blue-500 font-mono text-sm">{item.totalHours} hrs/wk</div>
                    <div className="text-[10px] text-slate-400">{item.theoryHours} Th + {item.labHours} Lab</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFacultyId(item.id);
                      setViewMode('faculty');
                      onClose();
                    }}
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all text-slate-400"
                    title="View Faculty Schedule"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          <span>UGC / AICTE Teaching Norms: 14–16 contact hours/week recommended</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
