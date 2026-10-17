import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Search, User, BookOpen, Building, X, ArrowRight, CornerDownLeft, Sparkles, Shield
} from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const { 
    subjects, 
    allProfessors, 
    professors, 
    classrooms, 
    laboratories, 
    selectedDepartment,
    setSelectedDepartment, 
    setSelectedSemester, 
    setSelectedFacultyId, 
    setViewMode,
    notify 
  } = useTimetable();
  const { currentUser, isHod } = useAuth();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Department strictly bound to HoD's jurisdiction
  const hodDept = currentUser?.department || selectedDepartment || 'IT';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard shortcut listener for Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Pool of professors: strictly departmental
  const profPool = (professors && professors.length > 0) ? professors : (allProfessors || []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { profs: [], subjs: [], rooms: [] };

    // 1. Matched Professors: Strictly from HoD's department
    const matchedProfs = (profPool || [])
      .filter(p => {
        const pDept = p.department || p.department_id;
        return pDept === hodDept;
      })
      .filter(p => p.name?.toLowerCase().includes(q) || p.designation?.toLowerCase().includes(q))
      .slice(0, 5);

    // 2. Matched Subjects: Strictly courses from HoD's department
    const matchedSubjs = (subjects || [])
      .filter(s => {
        const sDept = s.department || s.department_id;
        return !sDept || sDept === hodDept || s.code?.toUpperCase().startsWith(hodDept.toUpperCase());
      })
      .filter(s => s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q))
      .slice(0, 5);

    // 3. Matched Rooms: Departmental classrooms and assigned laboratories
    const deptRooms = [
      ...(classrooms || [])
        .filter(c => !c.department || c.department === hodDept || c.department_id === hodDept)
        .map(c => ({ ...c, kind: 'Classroom' })),
      ...(laboratories || [])
        .filter(l => !l.department || l.department === hodDept || l.department_id === hodDept || l.name?.toLowerCase().includes(hodDept.toLowerCase()))
        .map(l => ({ ...l, kind: 'Laboratory' }))
    ];

    const matchedRooms = deptRooms
      .filter(r => r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q))
      .slice(0, 4);

    return { profs: matchedProfs, subjs: matchedSubjs, rooms: matchedRooms };
  }, [query, profPool, subjects, classrooms, laboratories, hodDept]);

  const hasResults = results.profs.length > 0 || results.subjs.length > 0 || results.rooms.length > 0;

  const handleSelectProf = (p) => {
    setSelectedDepartment(hodDept);
    setSelectedFacultyId(p.id);
    setViewMode('faculty');
    notify(`Switched to ${p.name}'s Schedule (${hodDept} Dept)`, 'info');
    onClose();
  };

  const handleSelectSubj = (s) => {
    setSelectedDepartment(hodDept);
    if (s.semester) setSelectedSemester(Number(s.semester));
    setViewMode('student');
    notify(`Navigated to Sem ${s.semester || 5} for course ${s.code}`, 'info');
    onClose();
  };

  const handleSelectRoom = (r) => {
    notify(`Room ${r.name || r.code} (${r.kind}) selected`, 'info');
    onClose();
  };

  // Strictly disabled if not HoD
  if (!isOpen || !isHod) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Department Scope Banner */}
        <div className={`px-4 py-2 border-b text-[11px] font-bold flex items-center justify-between ${
          isDark ? 'bg-blue-950/40 border-[#1e293b] text-blue-300' : 'bg-blue-50/70 border-slate-200 text-blue-700'
        }`}>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>HoD Departmental Search • Dept. of {hodDept}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">
            Internal Scope
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-blue-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${hodDept} faculty (e.g. Mohan), course (e.g. ${hodDept}301), or room...`}
            className="w-full bg-transparent text-sm font-semibold focus:outline-none placeholder:text-slate-400"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">
              ESC
            </span>
          )}
        </div>

        {/* Results Body */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-3">
          {!query.trim() ? (
            <div className="p-6 text-center space-y-2 text-slate-400">
              <Sparkles className="w-6 h-6 mx-auto text-blue-500/60" />
              <p className="text-xs font-semibold">Departmental Search for Dept. of {hodDept}</p>
              <p className="text-[11px] text-slate-500">
                Quick search across {hodDept} professors, curriculum courses, and departmental classrooms/labs.
              </p>
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No matching {hodDept} faculty, courses, or rooms found for "{query}".
            </div>
          ) : (
            <>
              {/* Department Faculty Results */}
              {results.profs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    <span>{hodDept} Faculty Members</span>
                  </span>
                  {results.profs.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProf(p)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isDark ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:border-blue-500/50' : 'border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.designation || 'Faculty'} • {hodDept} Dept</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Department Courses Results */}
              {results.subjs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-500" />
                    <span>{hodDept} Department Courses</span>
                  </span>
                  {results.subjs.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSubj(s)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isDark ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:border-emerald-500/50' : 'border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-blue-400 shrink-0">{s.code}</span>
                        <div>
                          <div className="text-xs font-semibold">{s.name}</div>
                          <div className="text-[10px] text-slate-400">Sem {s.semester || 5} • {s.credits} Credits • {s.ltp || '(3-0-0)'}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Department Rooms & Labs */}
              {results.rooms.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                    <Building className="w-3 h-3 text-amber-500" />
                    <span>{hodDept} Facilities & Laboratories</span>
                  </span>
                  {results.rooms.map(r => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRoom(r)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isDark ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:border-amber-500/50' : 'border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold">{r.name}</span>
                        <span className="text-[10px] text-slate-400">({r.kind} - Cap: {r.capacity || 60})</span>
                      </div>
                      <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
          <span>Tip: Press <strong>ESC</strong> to close</span>
          <span>Click any item to jump directly</span>
        </div>
      </div>
    </div>
  );
}
