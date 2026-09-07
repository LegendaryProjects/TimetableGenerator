import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  DEPARTMENTS, YEARS, SECTIONS, DEPARTMENT_CLASSROOMS, DEPARTMENT_LABS,
  SUBJECTS_BY_DEPT_YEAR, PROFESSORS
} from '../../data/mockAcademicData';
import {
  Building, FlaskConical, BookOpen, Sparkles, RotateCcw, Zap, Check, AlertOctagon, X, ShieldCheck
} from 'lucide-react';

export default function ConstraintForm({ onClose }) {
  const { currentUser } = useAuth();
  const {
    selectedDepartment, generateDraftsForDepartment, generateSingleSectionDraft,
    generationError, clearGenerationError, notify
  } = useTimetable();
  const { isDark } = useTheme();

  const department = currentUser?.department || selectedDepartment || 'IT';
  const deptObj = DEPARTMENTS.find(d => d.id === department) || DEPARTMENTS[0];

  const allClassrooms = DEPARTMENT_CLASSROOMS[department] || DEPARTMENT_CLASSROOMS['IT'];
  const allLabs = DEPARTMENT_LABS[department] || DEPARTMENT_LABS['IT'];

  const [selectedCRs, setSelectedCRs] = useState(() => allClassrooms.slice(0, 3).map(c => c.id));
  const [selectedLBs, setSelectedLBs] = useState(() => allLabs.slice(0, 2).map(l => l.id));
  const [labsPerSection, setLabsPerSection] = useState(2);
  const [selectedYear, setSelectedYear] = useState('3');
  const [targetSection, setTargetSection] = useState('A');
  const [sectionsCount] = useState(2);

  const subjects = SUBJECTS_BY_DEPT_YEAR[department]?.[selectedYear] || SUBJECTS_BY_DEPT_YEAR['IT'][3] || [];
  const [selectedSubjs, setSelectedSubjs] = useState(() => subjects.map(s => s.id));
  const [configs, setConfigs] = useState(() => {
    const o = {};
    subjects.forEach(s => {
      o[s.id] = { theoryHours: s.defaultTheoryHrs || 3, labHours: s.defaultLabHrs || (s.type === 'lab' ? 2 : 0), facultyId: s.defaultFaculty || '' };
    });
    return o;
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const ys = SUBJECTS_BY_DEPT_YEAR[department]?.[selectedYear] || [];
    setSelectedSubjs(ys.map(s => s.id));
    setConfigs(prev => {
      const u = { ...prev };
      ys.forEach(s => { if (!u[s.id]) u[s.id] = { theoryHours: s.defaultTheoryHrs || 3, labHours: s.defaultLabHrs || 0, facultyId: s.defaultFaculty || '' }; });
      return u;
    });
  }, [department, selectedYear]);

  const toggle = (list, set, id, min = 1) => {
    if (list.includes(id)) {
      if (list.length <= min) { notify('At least one must be selected.', 'warning'); return; }
      set(prev => prev.filter(x => x !== id));
    } else set(prev => [...prev, id]);
  };

  const handleGenSingle = () => {
    if (!selectedSubjs.length) { notify('Select at least one subject via checkboxes.', 'warning'); return; }
    setIsGenerating(true); clearGenerationError();
    setTimeout(() => {
      const r = generateSingleSectionDraft({
        department, year: Number(selectedYear), section: targetSection,
        selectedClassrooms: allClassrooms.filter(c => selectedCRs.includes(c.id)),
        selectedLabs: allLabs.filter(l => selectedLBs.includes(l.id)),
        labsPerSection, selectedSubjects: selectedSubjs, subjectSettings: configs
      });
      setIsGenerating(false);
      if (r && onClose) onClose();
    }, 500);
  };

  const handleGenAll = () => {
    if (!selectedSubjs.length) { notify('Select at least one subject via checkboxes.', 'warning'); return; }
    setIsGenerating(true); clearGenerationError();
    setTimeout(() => {
      const r = generateDraftsForDepartment({
        department,
        selectedClassrooms: allClassrooms.filter(c => selectedCRs.includes(c.id)),
        selectedLabs: allLabs.filter(l => selectedLBs.includes(l.id)),
        labsPerSection,
        sectionsPerYear: { 1: sectionsCount, 2: sectionsCount, 3: sectionsCount, 4: sectionsCount },
        selectedSubjectsByYear: { [selectedYear]: selectedSubjs }, subjectSettings: configs
      });
      setIsGenerating(false);
      if (r && onClose) onClose();
    }, 700);
  };

  const profs = PROFESSORS.filter(p => p.department === department);

  return (
    <div className={`border rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm transition-colors ${
      isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
    }`}>

      {/* Infeasibility Error Banner */}
      {generationError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertOctagon className="w-4 h-4 text-rose-400" /> {generationError.title}
            </span>
            <button onClick={clearGenerationError} className="text-slate-400 hover:text-white p-0.5 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-200 leading-relaxed">
            Zero-overlapping is mathematically impossible with the current constraint inputs. As per institutional protocol, <strong className="text-white">no timetable was generated</strong>.
          </p>
          {generationError.unplaced?.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
              {generationError.unplaced.map((u, i) => (
                <div key={i} className="font-mono text-[11px] text-rose-300 bg-rose-950/60 p-1.5 rounded border border-rose-800/40 flex items-center justify-between">
                  <span>• {u.subjectCode} ({u.subjectName}) — Faculty: {u.facultyName}</span>
                  <span className="text-rose-400 text-[10px]">{u.reason}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-slate-300 text-[11px] pt-1 border-t border-rose-800/40">
            Suggestion: Add more classrooms/labs or re-assign faculty in Step 4 to balance weekly teaching hours.
          </p>
        </div>
      )}

      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between pb-4 border-b gap-3 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Constraint Configuration
            </h3>
            <span className={`px-2 py-0.2 rounded text-xs font-semibold border ${
              isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {deptObj.name}
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          HoD In-Charge: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{currentUser?.name}</span>
        </div>
      </div>

      {/* Step 1: Classrooms Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Building className="w-3.5 h-3.5 text-blue-500" />
            <span>Department Classrooms ({selectedCRs.length} Selected)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {allClassrooms.map(cr => {
            const checked = selectedCRs.includes(cr.id);
            return (
              <div 
                key={cr.id} 
                onClick={() => toggle(selectedCRs, setSelectedCRs, cr.id)}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  checked
                    ? isDark ? 'border-blue-500/60 bg-blue-950/20 text-white' : 'border-blue-400 bg-blue-50/50 text-slate-900'
                    : isDark ? 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  checked ? 'bg-blue-600 border-blue-500 text-white' : isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'
                }`}>
                  {checked && <Check className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cr.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Capacity: {cr.capacity}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Labs Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
            <span>Department Laboratories ({selectedLBs.length} Selected)</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Labs / Section:</span>
            <select 
              value={labsPerSection} 
              onChange={e => setLabsPerSection(Number(e.target.value))}
              className={`px-2 py-1 border rounded-md text-xs font-semibold focus:outline-none ${
                isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value={1}>1 Lab / Section</option>
              <option value={2}>2 Labs / Section</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {allLabs.map(lab => {
            const checked = selectedLBs.includes(lab.id);
            return (
              <div 
                key={lab.id} 
                onClick={() => toggle(selectedLBs, setSelectedLBs, lab.id)}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  checked
                    ? isDark ? 'border-emerald-500/60 bg-emerald-950/20 text-white' : 'border-emerald-400 bg-emerald-50/50 text-slate-900'
                    : isDark ? 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  checked ? 'bg-emerald-600 border-emerald-500 text-white' : isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'
                }`}>
                  {checked && <Check className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{lab.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Capacity: {lab.capacity}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Target Cohort (Year & Section) */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
        isDark ? 'bg-[#090d16]/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Year:</span>
            <div className={`flex rounded-md p-0.5 border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              {YEARS.map(y => (
                <button
                  key={y.id}
                  onClick={() => setSelectedYear(y.value)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    Number(selectedYear) === y.value 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Section:</span>
            <div className={`flex rounded-md p-0.5 border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              {SECTIONS.slice(0, 3).map(s => (
                <button
                  key={s}
                  onClick={() => setTargetSection(s)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    targetSection === s 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sec {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Subject Allocation */}
      <div className="space-y-2.5">
        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
          <span>Course Allocation and Weekly Hours</span>
        </span>
        <div className="space-y-2">
          {subjects.map(s => {
            const on = selectedSubjs.includes(s.id);
            const cfg = configs[s.id] || { theoryHours: 3, labHours: 0, facultyId: '' };
            return (
              <div 
                key={s.id} 
                className={`p-3 rounded-xl border transition-all ${
                  on 
                    ? isDark ? 'border-slate-700 bg-[#141d30]' : 'border-slate-200 bg-white shadow-sm'
                    : isDark ? 'border-slate-800/60 bg-slate-900/20 opacity-40' : 'border-slate-100 bg-slate-50 opacity-40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div 
                    className="flex items-center gap-2.5 cursor-pointer select-none" 
                    onClick={() => toggle(selectedSubjs, setSelectedSubjs, s.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      on ? 'bg-blue-600 border-blue-500 text-white' : isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'
                    }`}>
                      {on && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      {s.code}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {s.name}
                    </span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-bold ${
                      s.type === 'lab' 
                        ? isDark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isDark ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {s.type}
                    </span>
                  </div>

                  {on && (
                    <div className="flex flex-wrap items-center gap-3 pl-6 md:pl-0">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Theory:</span>
                        <select 
                          value={cfg.theoryHours} 
                          onChange={e => setConfigs(p => ({ ...p, [s.id]: { ...p[s.id], theoryHours: e.target.value } }))}
                          className={`px-2 py-1 border rounded-md text-xs font-semibold focus:outline-none ${
                            isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v} Hrs</option>)}
                        </select>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Lab:</span>
                        <select 
                          value={cfg.labHours} 
                          onChange={e => setConfigs(p => ({ ...p, [s.id]: { ...p[s.id], labHours: e.target.value } }))}
                          className={`px-2 py-1 border rounded-md text-xs font-semibold focus:outline-none ${
                            isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {[0,2,4,6].map(v => <option key={v} value={v}>{v} Hrs</option>)}
                        </select>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Instructor:</span>
                        <select 
                          value={cfg.facultyId || s.defaultFaculty} 
                          onChange={e => setConfigs(p => ({ ...p, [s.id]: { ...p[s.id], facultyId: e.target.value } }))}
                          className={`px-2 py-1 border rounded-md text-xs font-semibold max-w-[150px] truncate focus:outline-none ${
                            isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {profs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generation Action Buttons */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="text-xs text-slate-400">
          Selected: <span className="font-semibold text-blue-400">{selectedCRs.length} Classrooms</span> • <span className="font-semibold text-emerald-400">{selectedLBs.length} Labs</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleGenSingle} 
            disabled={isGenerating}
            className={`px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
              isDark ? 'bg-[#162032] hover:bg-[#1e2d47] text-slate-200 border-[#1e293b]' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>Generate Year {selectedYear} Sec {targetSection}</span>
          </button>
          <button 
            onClick={handleGenAll} 
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {isGenerating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isGenerating ? 'Computing...' : 'Generate All Department Drafts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
