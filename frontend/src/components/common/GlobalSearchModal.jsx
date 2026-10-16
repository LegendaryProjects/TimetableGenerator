import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Search, User, BookOpen, Building, X, ArrowRight, CornerDownLeft, Sparkles
} from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const { 
    subjects, 
    allProfessors, 
    professors, 
    classrooms, 
    laboratories, 
    setSelectedDepartment, 
    setSelectedSemester, 
    setSelectedFacultyId, 
    setViewMode,
    notify 
  } = useTimetable();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

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

  const profPool = (allProfessors && allProfessors.length > 0) ? allProfessors : professors;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { profs: [], subjs: [], rooms: [] };

    const matchedProfs = (profPool || [])
      .filter(p => p.name?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedSubjs = (subjects || [])
      .filter(s => s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedRooms = [
      ...(classrooms || []).map(c => ({ ...c, kind: 'Classroom' })),
      ...(laboratories || []).map(l => ({ ...l, kind: 'Laboratory' }))
    ]
      .filter(r => r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q))
      .slice(0, 4);

    return { profs: matchedProfs, subjs: matchedSubjs, rooms: matchedRooms };
  }, [query, profPool, subjects, classrooms, laboratories]);

  const hasResults = results.profs.length > 0 || results.subjs.length > 0 || results.rooms.length > 0;

  const handleSelectProf = (p) => {
    if (p.department) setSelectedDepartment(p.department);
    setSelectedFacultyId(p.id);
    setViewMode('faculty');
    notify(`Switched to ${p.name}'s Faculty Schedule`, 'info');
    onClose();
  };

  const handleSelectSubj = (s) => {
    if (s.department) setSelectedDepartment(s.department);
    if (s.semester) setSelectedSemester(Number(s.semester));
    setViewMode('section');
    notify(`Navigated to Semester ${s.semester || 5} for ${s.code}`, 'info');
    onClose();
  };

  const handleSelectRoom = (r) => {
    notify(`Room ${r.name || r.code} (${r.kind}) selected`, 'info');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-blue-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search faculty (e.g. Mohan), course (e.g. IT350), or room..."
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
              <p className="text-xs font-semibold">Quick search across all 278 NITK Faculty, Courses & Facilities</p>
              <p className="text-[11px] text-slate-500">Try typing a professor's name, course code like <code className="text-blue-400">IT350</code>, or <code className="text-blue-400">CR1</code></p>
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No matching faculty, courses, or rooms found for "{query}".
            </div>
          ) : (
            <>
              {/* Faculty Results */}
              {results.profs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    <span>Faculty Members</span>
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
                          <div className="text-[10px] text-slate-400">{p.designation || 'Faculty'} • {p.department} Dept</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Courses Results */}
              {results.subjs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-500" />
                    <span>Courses / Subjects</span>
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

              {/* Classrooms & Labs */}
              {results.rooms.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                    <Building className="w-3 h-3 text-amber-500" />
                    <span>Rooms & Labs</span>
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
          <span>Click any item to jump instantly</span>
        </div>
      </div>
    </div>
  );
}
