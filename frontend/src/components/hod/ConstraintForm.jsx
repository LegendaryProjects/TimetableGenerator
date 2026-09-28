import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Building, BookOpen, Sparkles, RotateCcw, Zap, Check, AlertOctagon, X, FlaskConical
} from 'lucide-react';

const SEMESTERS = [
  { id: '1', label: 'Sem 1', value: 1 },
  { id: '2', label: 'Sem 2', value: 2 },
  { id: '3', label: 'Sem 3', value: 3 },
  { id: '4', label: 'Sem 4', value: 4 },
  { id: '5', label: 'Sem 5', value: 5 },
  { id: '6', label: 'Sem 6', value: 6 },
  { id: '7', label: 'Sem 7', value: 7 },
  { id: '8', label: 'Sem 8', value: 8 }
];

const SECTIONS = ['A', 'B', 'C', 'D'];

export default function ConstraintForm({ onClose }) {
  const { currentUser } = useAuth();
  const {
    timetables,
    selectedDepartment,
    departments,
    classrooms,
    laboratories,
    subjects,
    professors,
    foundationProfessors,
    generateDraftsForDepartment,
    generateSingleSectionDraft,
    generationError,
    clearGenerationError,
    notify,
    selectedSemester,
    setSelectedSemester,
    selectedYear,
    setSelectedYear
  } = useTimetable();
  const { isDark } = useTheme();

  const department = currentUser?.department || selectedDepartment || 'IT';
  const deptObj = departments.find(d => d.id === department) || { id: department, name: department };

  const [selectedCRs, setSelectedCRs] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [numSections, setNumSections] = useState(2);
  const [targetSection, setTargetSection] = useState('A');

  // Filter subjects for the selected semester
  const semSubjects = subjects.filter(s => 
    s.semester ? Number(s.semester) === Number(selectedSemester) : Number(s.year) === Math.ceil(Number(selectedSemester) / 2)
  );
  const [selectedSubjs, setSelectedSubjs] = useState([]);
  const [configs, setConfigs] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [sectionClassrooms, setSectionClassrooms] = useState({});

  // Sync classrooms: select all department classrooms by default
  useEffect(() => {
    if (classrooms && classrooms.length > 0) {
      setSelectedCRs(classrooms.map(c => c.id));
    }
  }, [classrooms]);

  // Sync laboratories
  useEffect(() => {
    if (laboratories && laboratories.length > 0) {
      setSelectedLabs(laboratories.map(l => l.id));
    }
  }, [laboratories]);

  const currentCohortKey = `S${selectedSemester}_Sec${targetSection}`;

  const isClassroomOccupied = (crId) => {
    // Check if assigned to another cohort in current form session
    const otherEntry = Object.entries(sectionClassrooms).find(
      ([k, id]) => id === crId && k !== currentCohortKey
    );
    if (otherEntry) return true;

    // Check if in use by an active timetable in the department
    const crObj = classrooms?.find(c => c.id === crId);
    const crName = crObj?.name || '';
    const otherTT = timetables?.find(
      t => t.department === department &&
           !(Number(t.semester || ((t.year * 2) - 1)) === Number(selectedSemester) && t.section === targetSection) &&
           (t.assignedClassroom === crId || (crName && t.assignedClassroom === crName) ||
            (t.grid && Object.values(t.grid).some(day =>
              day && Object.values(day).some(cell => cell && (cell.roomId === crId || (crName && cell.roomName === crName)))
            )))
    );
    return Boolean(otherTT);
  };

  const currentClassroomId = sectionClassrooms[currentCohortKey] || (() => {
    if (!classrooms || classrooms.length === 0) return '';
    const freeCR = classrooms.find(cr => !isClassroomOccupied(cr.id));
    if (freeCR) return freeCR.id;
    return classrooms[0]?.id || '';
  })();

  const handleClassroomChange = (crId) => {
    setSectionClassrooms(prev => ({
      ...prev,
      [currentCohortKey]: crId
    }));
  };

  // Handle number of sections selection (1 -> A, 2 -> A,B, 3 -> A,B,C, 4 -> A,B,C,D)
  const handleNumSectionsChange = (count) => {
    setNumSections(count);
    const validSections = SECTIONS.slice(0, count);
    if (!validSections.includes(targetSection)) {
      setTargetSection('A');
    }
  };

  // Helper to identify 1st and 2nd semester foundation courses in Physics, Chemistry, Maths, HSSM, CS
  const isScienceMathOrFoundation = (subj) => {
    const sem = Number(subj.semester || selectedSemester);
    if (sem !== 1 && sem !== 2) return false;
    const code = (subj.code || '').toUpperCase();
    const name = (subj.name || '').toLowerCase();
    return (
      code.startsWith('PH') ||
      code.startsWith('CY') ||
      code.startsWith('MA') ||
      code.startsWith('SM') ||
      code.startsWith('CS') ||
      /physics|chemistry|math|calculus|algebra|ethics|communication|python/i.test(name)
    );
  };

  const isLabSubject = (subject) => {
    if (!subject) return false;
    return subject.type === 'lab' || subject.requires_lab || (subject.name && subject.name.toLowerCase().includes('lab'));
  };

  // Sync subjects when semester changes
  useEffect(() => {
    const currentSemSubjs = subjects.filter(s => 
      s.semester ? Number(s.semester) === Number(selectedSemester) : Number(s.year) === Math.ceil(Number(selectedSemester) / 2)
    );
    // Select top 6 subjects by default
    const initialSelected = currentSemSubjs.slice(0, 6).map(s => s.id);
    setSelectedSubjs(initialSelected);

    const initialConfigs = {};
    currentSemSubjs.forEach(s => {
      let defaultFac = s.defaultFaculty;
      if (!defaultFac && isScienceMathOrFoundation(s) && foundationProfessors && foundationProfessors.length > 0) {
        const code = (s.code || '').toUpperCase();
        if (code.startsWith('PH')) {
          defaultFac = foundationProfessors.find(p => p.department === 'PH')?.id;
        } else if (code.startsWith('CY')) {
          defaultFac = foundationProfessors.find(p => p.department === 'CY')?.id;
        } else if (code.startsWith('MA')) {
          defaultFac = foundationProfessors.find(p => p.department === 'MACS')?.id;
        } else if (code.startsWith('CS')) {
          defaultFac = foundationProfessors.find(p => ['CSE', 'IT'].includes(p.department))?.id;
        } else if (code.startsWith('SM')) {
          defaultFac = foundationProfessors.find(p => p.department === 'HSSM')?.id;
        }
      }

      const isLab = isLabSubject(s);
      initialConfigs[s.id] = {
        theoryHours: isLab ? 0 : (s.classesPerWeek || (s.credits >= 4 ? 4 : 3)),
        labHours: isLab ? 3 : 0,
        requiresLab: isLab,
        facultyId: defaultFac || (professors[0]?.id || ''),
        labRoomId: 'auto'
      };
    });
    setConfigs(initialConfigs);
  }, [subjects, selectedSemester, professors, foundationProfessors]);

  const toggle = (list, set, id, min = 1) => {
    if (list.includes(id)) {
      if (list.length <= min) {
        notify('At least one must be selected.', 'warning');
        return;
      }
      set(prev => prev.filter(x => x !== id));
    } else {
      set(prev => [...prev, id]);
    }
  };

  const handleGenSingle = async () => {
    if (!selectedSubjs.length) {
      notify('Select at least one subject via checkboxes.', 'warning');
      return;
    }
    setIsGenerating(true);
    clearGenerationError();
    try {
      const res = await generateSingleSectionDraft({
        department,
        year: Math.ceil(Number(selectedSemester) / 2),
        semester: Number(selectedSemester),
        section: targetSection,
        selectedClassrooms: classrooms.filter(c => selectedCRs.includes(c.id)),
        selectedClassroomId: currentClassroomId,
        selectedLabs: laboratories.filter(l => selectedLabs.includes(l.id)),
        selectedSubjects: selectedSubjs,
        subjectSettings: configs
      });
      setIsGenerating(false);
      if (res && onClose) onClose();
    } catch (err) {
      setIsGenerating(false);
    }
  };

  const handleGenAll = async () => {
    if (!selectedSubjs.length) {
      notify('Select at least one subject via checkboxes.', 'warning');
      return;
    }
    setIsGenerating(true);
    clearGenerationError();
    try {
      const calcYear = Math.ceil(Number(selectedSemester) / 2);
      const res = await generateDraftsForDepartment({
        department,
        selectedClassrooms: classrooms.filter(c => selectedCRs.includes(c.id)),
        sectionClassrooms: sectionClassrooms,
        selectedLabs: laboratories.filter(l => selectedLabs.includes(l.id)),
        sectionsPerYear: { 1: numSections, 2: numSections, 3: numSections, 4: numSections },
        selectedSubjectsByYear: { [calcYear]: selectedSubjs },
        subjectSettings: configs
      });
      setIsGenerating(false);
      if (res && onClose) onClose();
    } catch (err) {
      setIsGenerating(false);
    }
  };

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
            Scheduling conflict detected with the current constraint inputs. As per institutional protocol, <strong className="text-white">no timetable was generated</strong>.
          </p>
          {generationError.unplaced?.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
              {generationError.unplaced.map((u, i) => (
                <div key={i} className="font-mono text-[11px] text-rose-300 bg-rose-950/60 p-1.5 rounded border border-rose-800/40 flex items-center justify-between">
                  <span>• {u.subjectCode} ({u.subjectName}) — Faculty: {u.facultyName}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-slate-300 text-[11px] pt-1 border-t border-rose-800/40">
            Suggestion: Select additional classrooms or adjust course selections to balance weekly hours.
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
              Dept. of {deptObj.name}
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
            <span>Assigned Department Classrooms ({selectedCRs.length} Selected)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {classrooms.map(cr => {
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

      {/* Step 2: Laboratories Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
            <span>Assigned Department Laboratories ({selectedLabs.length} Selected)</span>
          </span>
          <span className="text-xs text-slate-400">
            {selectedLabs.length} labs active for practical scheduling
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {laboratories.map(lab => {
            const checked = selectedLabs.includes(lab.id);
            return (
              <div 
                key={lab.id} 
                onClick={() => toggle(selectedLabs, setSelectedLabs, lab.id)}
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
                  <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{lab.code} - {lab.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Dept: {lab.department_id || department} • Cap: {lab.capacity || 40}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Target Cohort (Semester & Dynamic Section) */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
        isDark ? 'bg-[#090d16]/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Sem:</span>
            <div className={`flex rounded-md p-0.5 border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              {SEMESTERS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSemester(Number(s.value))}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    Number(selectedSemester) === s.value 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Sections Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">No. of Sections:</span>
            <select
              value={numSections}
              onChange={(e) => handleNumSectionsChange(Number(e.target.value))}
              className={`px-2.5 py-1 border rounded-md text-xs font-semibold focus:outline-none cursor-pointer ${
                isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {[1, 2, 3, 4].map(count => (
                <option key={count} value={count}>
                  {count} {count === 1 ? 'Section (A)' : count === 2 ? 'Sections (A, B)' : count === 3 ? 'Sections (A, B, C)' : 'Sections (A, B, C, D)'}
                </option>
              ))}
            </select>
          </div>

          {/* Target Section (only shows sections up to selected count) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Section:</span>
            <div className={`flex rounded-md p-0.5 border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              {SECTIONS.slice(0, numSections).map(s => (
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

      {/* Target Classroom Selector (Just below Target Sem box) */}
      <div className={`p-3 rounded-xl border flex items-center gap-3 ${
        isDark ? 'bg-[#090d16]/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-blue-500" />
          <span>Select Classroom:</span>
        </span>
        <select
          value={currentClassroomId}
          onChange={(e) => handleClassroomChange(e.target.value)}
          className={`px-3 py-1.5 border rounded-md text-xs font-semibold focus:outline-none cursor-pointer ${
            isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {classrooms
            .filter(cr => !isClassroomOccupied(cr.id) || cr.id === currentClassroomId)
            .map(cr => (
              <option key={cr.id} value={cr.id}>
                {cr.name} (Capacity: {cr.capacity})
              </option>
            ))}
        </select>
      </div>

      {/* Step 3: Course Allocation from Database Curriculum */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>NITK Curriculum Courses for Semester {selectedSemester} ({selectedSubjs.length} selected of {semSubjects.length})</span>
          </span>
          <span className="text-xs text-slate-400">
            {selectedSubjs.length} subjects will be scheduled
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {semSubjects.map(s => {
            const on = selectedSubjs.includes(s.id);
            const cfg = configs[s.id] || { theoryHours: isLabSubject(s) ? 0 : 3, labHours: isLabSubject(s) ? 3 : 0, facultyId: '' };
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
                    {(isLabSubject(s) || (cfg.labHours > 0)) && (
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-black shrink-0 ${
                        isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        LAB (Afternoon)
                      </span>
                    )}
                    <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-bold ${
                      isDark ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {s.credits} Credits • {s.ltp || '(3-0-0)'}
                    </span>
                  </div>

                  {on && (
                    <div className="flex flex-wrap items-center gap-3 pl-6 md:pl-0">
                      {/* Theory Hours Dropdown */}
                      <label className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Theory Hours:</span>
                        <select 
                          value={cfg.theoryHours !== undefined ? cfg.theoryHours : (isLabSubject(s) ? 0 : 3)} 
                          onChange={e => {
                            const val = Number(e.target.value);
                            setConfigs(p => ({
                              ...p,
                              [s.id]: {
                                ...p[s.id],
                                theoryHours: val
                              }
                            }));
                          }}
                          className={`px-2 py-1 border rounded-md text-xs font-semibold focus:outline-none cursor-pointer ${
                            isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {[0, 1, 2, 3, 4, 5].map(v => (
                            <option key={v} value={v}>{v} Hrs</option>
                          ))}
                        </select>
                      </label>

                      {/* Lab Hours Dropdown beside Theory Hours */}
                      <label className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Lab Hours:</span>
                        <select 
                          value={cfg.labHours !== undefined ? cfg.labHours : (isLabSubject(s) ? 3 : 0)} 
                          onChange={e => {
                            const val = Number(e.target.value);
                            setConfigs(p => ({
                              ...p,
                              [s.id]: {
                                ...p[s.id],
                                labHours: val,
                                requiresLab: val > 0
                              }
                            }));
                          }}
                          className={`px-2 py-1 border rounded-md text-xs font-semibold focus:outline-none cursor-pointer ${
                            isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <option value={0}>None</option>
                          {[2, 3, 4, 5, 6].map(v => (
                            <option key={v} value={v}>{v} Hrs</option>
                          ))}
                        </select>
                      </label>

                      {/* Option for selecting lab room for courses requiring lab */}
                      {((cfg.labHours > 0) || (cfg.labHours === undefined && isLabSubject(s))) && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>Lab Room:</span>
                          <select
                            value={cfg.labRoomId || 'auto'}
                            onChange={e => setConfigs(p => ({ ...p, [s.id]: { ...p[s.id], labRoomId: e.target.value } }))}
                            className={`px-2 py-1 border rounded-md text-xs font-semibold max-w-[170px] truncate focus:outline-none cursor-pointer ${
                              isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="auto">Auto (Any Available)</option>
                            {laboratories
                              .filter(l => selectedLabs.includes(l.id))
                              .map(l => (
                                <option key={l.id} value={l.id}>{l.code}</option>
                              ))}
                          </select>
                        </label>
                      )}

                      <label className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Faculty:</span>
                        <select 
                          value={cfg.facultyId || s.defaultFaculty || ''} 
                          onChange={e => setConfigs(p => ({ ...p, [s.id]: { ...p[s.id], facultyId: e.target.value } }))}
                          className={`px-2 py-1 border rounded-md text-xs font-semibold max-w-[210px] truncate focus:outline-none ${
                            isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {isScienceMathOrFoundation(s) ? (
                            <>
                              {foundationProfessors?.filter(p => ['PH', 'CY'].includes(p.department)).length > 0 && (
                                <optgroup label="Science (Physics & Chemistry)">
                                  {foundationProfessors.filter(p => ['PH', 'CY'].includes(p.department)).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
                                  ))}
                                </optgroup>
                              )}
                              {foundationProfessors?.filter(p => p.department === 'MACS').length > 0 && (
                                <optgroup label="Mathematics (MACS)">
                                  {foundationProfessors.filter(p => p.department === 'MACS').map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (MACS)</option>
                                  ))}
                                </optgroup>
                              )}
                              {foundationProfessors?.filter(p => ['CSE', 'IT'].includes(p.department)).length > 0 && (
                                <optgroup label="Computer Science (CS & IT)">
                                  {foundationProfessors.filter(p => ['CSE', 'IT'].includes(p.department)).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
                                  ))}
                                </optgroup>
                              )}
                              {foundationProfessors?.filter(p => p.department === 'HSSM').length > 0 && (
                                <optgroup label="HSSM (Humanities & Management)">
                                  {foundationProfessors.filter(p => p.department === 'HSSM').map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (HSSM)</option>
                                  ))}
                                </optgroup>
                              )}
                              {professors.some(p => !['PH', 'CY', 'MACS', 'CSE', 'IT', 'HSSM'].includes(p.department)) && (
                                <optgroup label={`${department} Department Faculty`}>
                                  {professors.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.department || department})</option>
                                  ))}
                                </optgroup>
                              )}
                            </>
                          ) : (
                            professors.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))
                          )}
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
          Selected: <span className="font-semibold text-blue-400">{selectedCRs.length} Classrooms</span> • <span className="font-semibold text-emerald-400">{selectedLabs.length} Labs</span> • <span className="font-semibold text-purple-400">{selectedSubjs.length} Courses</span>
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
