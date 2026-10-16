import React, { useState, useEffect, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Building, BookOpen, Sparkles, RotateCcw, Zap, Check, AlertOctagon, X, Monitor, Plus
} from 'lucide-react';

const ODD_SEMESTERS = [
  { id: '1', label: 'Sem 1', value: 1, year: 1 },
  { id: '3', label: 'Sem 3', value: 3, year: 2 },
  { id: '5', label: 'Sem 5', value: 5, year: 3 },
  { id: '7', label: 'Sem 7', value: 7, year: 4 }
];

const EVEN_SEMESTERS = [
  { id: '2', label: 'Sem 2', value: 2, year: 1 },
  { id: '4', label: 'Sem 4', value: 4, year: 2 },
  { id: '6', label: 'Sem 6', value: 6, year: 3 },
  { id: '8', label: 'Sem 8', value: 8, year: 4 }
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
    addSubject,
    professors,
    foundationProfessors,
    allProfessors,
    generateDraftsForDepartment,
    generateSingleSectionDraft,
    generationError,
    clearGenerationError,
    notify,
    selectedSemester,
    setSelectedSemester,
    selectedYear,
    setSelectedYear,
    semesterType,
    setSemesterType
  } = useTimetable();
  const { isDark } = useTheme();

  const department = currentUser?.department || selectedDepartment || 'IT';
  const deptObj = departments.find(d => d.id === department) || { id: department, name: department };

  const [selectedCRs, setSelectedCRs] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [sectionsPerSemester, setSectionsPerSemester] = useState({
    1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2
  });
  const [targetSection, setTargetSection] = useState('A');
  const currentSemSections = sectionsPerSemester[selectedSemester] || 2;

  const availableSemesters = semesterType === 'even' ? EVEN_SEMESTERS : ODD_SEMESTERS;

  // Always ensure selectedSemester is one of the availableSemesters in active session
  useEffect(() => {
    const validValues = availableSemesters.map(s => Number(s.value));
    if (!validValues.includes(Number(selectedSemester))) {
      setSelectedSemester(validValues[0] || (semesterType === 'even' ? 2 : 1));
    }
  }, [availableSemesters, selectedSemester, setSelectedSemester, semesterType]);

  const handleSemesterTypeChange = (newType) => {
    if (newType === semesterType) return;
    setSemesterType(newType);
    if (newType === 'odd') {
      const oddSem = Number(selectedSemester) % 2 === 0 ? Math.max(1, Number(selectedSemester) - 1) : Number(selectedSemester);
      setSelectedSemester(oddSem);
      notify('Switched to Odd Semesters session (Sem 1, 3, 5, 7)', 'info');
    } else {
      const evenSem = Number(selectedSemester) % 2 !== 0 ? Math.min(8, Number(selectedSemester) + 1) : Number(selectedSemester);
      setSelectedSemester(evenSem);
      notify('Switched to Even Semesters session (Sem 2, 4, 6, 8)', 'info');
    }
  };

  // Filter subjects for the selected semester
  const semSubjects = subjects.filter(s => 
    s.semester ? Number(s.semester) === Number(selectedSemester) : Number(s.year) === Math.ceil(Number(selectedSemester) / 2)
  );
  const [selectedSubjsBySem, setSelectedSubjsBySem] = useState({});
  const selectedSubjs = selectedSubjsBySem[selectedSemester] || [];
  const [configs, setConfigs] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [sectionClassrooms, setSectionClassrooms] = useState({});

  // Add Subject Modal State
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCredits, setNewSubjCredits] = useState(3);
  const [newSubjL, setNewSubjL] = useState(3);
  const [newSubjT, setNewSubjT] = useState(0);
  const [newSubjP, setNewSubjP] = useState(0);
  const [newSubjFacultyId, setNewSubjFacultyId] = useState('');
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);

  // Sync classrooms: select all department classrooms by default
  useEffect(() => {
    if (classrooms && classrooms.length > 0) {
      setSelectedCRs(classrooms.map(c => c.id));
    }
  }, [classrooms]);

  // Central Science labs (Chemistry & Physics) should be available only to 1st and 2nd semesters
  const isChemistryLab = (lab) => {
    return lab.department_id === 'CY' ||
           lab.code?.startsWith('UG-CY-') ||
           lab.id?.startsWith('lab_cy_') ||
           lab.name?.toLowerCase().includes('chemistry');
  };

  const isPhysicsLab = (lab) => {
    return lab.department_id === 'PH' ||
           lab.code?.startsWith('UG-PH-') ||
           lab.id?.startsWith('lab_ph_') ||
           lab.name?.toLowerCase().includes('physics');
  };

  const isScienceLab = (lab) => isChemistryLab(lab) || isPhysicsLab(lab);

  const availableLaboratories = useMemo(() => {
    const semNum = Number(selectedSemester);
    if (semNum === 1 || semNum === 2) {
      return laboratories || [];
    }
    return (laboratories || []).filter(lab => !isScienceLab(lab));
  }, [laboratories, selectedSemester]);

  // Sync laboratories based on availableLaboratories for the active semester:
  // For Sem 1 & 2: select all departmental labs + only ONE chemistry lab and ONE physics lab by default
  useEffect(() => {
    if (availableLaboratories && availableLaboratories.length > 0) {
      const validIds = availableLaboratories.map(l => l.id);
      const semNum = Number(selectedSemester);

      setSelectedLabs(prev => {
        if (semNum === 1 || semNum === 2) {
          const validPrev = prev.filter(id => validIds.includes(id));
          const hasScience = validPrev.some(id => {
            const labObj = availableLaboratories.find(l => l.id === id);
            return labObj && isScienceLab(labObj);
          });
          // If no science labs were selected (e.g. initial load or switching from higher sem),
          // default to all departmental labs + 1 chemistry lab + 1 physics lab
          if (!hasScience) {
            const deptIds = availableLaboratories.filter(l => !isScienceLab(l)).map(l => l.id);
            const firstCy = availableLaboratories.find(l => isChemistryLab(l));
            const firstPh = availableLaboratories.find(l => isPhysicsLab(l));
            const defaults = [...deptIds];
            if (firstCy) defaults.push(firstCy.id);
            if (firstPh) defaults.push(firstPh.id);
            return defaults;
          }
          return validPrev;
        } else {
          // Semesters 3-8: strictly exclude science labs
          const nonScienceValid = availableLaboratories.filter(l => !isScienceLab(l)).map(l => l.id);
          const filtered = prev.filter(id => nonScienceValid.includes(id));
          return filtered.length > 0 ? filtered : nonScienceValid;
        }
      });
    } else {
      setSelectedLabs([]);
    }
  }, [availableLaboratories, selectedSemester]);

  const currentCohortKey = `S${selectedSemester}_Sec${targetSection}`;

  const isClassroomOccupied = (crId, forCohortKey = currentCohortKey) => {
    // Check if assigned to another cohort in current form session
    const otherEntry = Object.entries(sectionClassrooms).find(
      ([k, id]) => id === crId && k !== forCohortKey
    );
    if (otherEntry) {
      return { occupied: true, reason: `Assigned to ${otherEntry[0]}` };
    }

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
    if (otherTT) {
      const semLabel = otherTT.semester ? `Sem ${otherTT.semester}` : `Year ${otherTT.year}`;
      return { occupied: true, reason: `In use by ${semLabel} Sec ${otherTT.section}` };
    }
    return { occupied: false };
  };

  const getClassroomIdForSection = (sec) => {
    const cohortKey = `S${selectedSemester}_Sec${sec}`;
    return sectionClassrooms[cohortKey] || '';
  };

  const handleClassroomChangeForSection = (sec, crId) => {
    const cohortKey = `S${selectedSemester}_Sec${sec}`;
    if (!crId) {
      setSectionClassrooms(prev => {
        const next = { ...prev };
        delete next[cohortKey];
        return next;
      });
      return;
    }

    // Guard against duplicate selection across sections in current semester
    const activeSecs = SECTIONS.slice(0, currentSemSections);
    const existingSec = activeSecs.find(s => s !== sec && sectionClassrooms[`S${selectedSemester}_Sec${s}`] === crId);
    if (existingSec) {
      const crObj = classrooms?.find(c => c.id === crId);
      notify(`Classroom Overlap: ${crObj?.name || crId} is already assigned to Section ${existingSec}. Please select a different classroom.`, 'error');
      return;
    }

    setSectionClassrooms(prev => ({
      ...prev,
      [cohortKey]: crId
    }));
  };

  const currentClassroomId = getClassroomIdForSection(targetSection);

  const handleClassroomChange = (crId) => {
    handleClassroomChangeForSection(targetSection, crId);
  };

  // Handle number of sections selection for current semester (1 -> A, 2 -> A,B, 3 -> A,B,C, 4 -> A,B,C,D)
  const handleNumSectionsChange = (count) => {
    setSectionsPerSemester(prev => ({
      ...prev,
      [selectedSemester]: count
    }));
    const validSections = SECTIONS.slice(0, count);
    if (!validSections.includes(targetSection)) {
      setTargetSection('A');
    }
  };

  const handleSelectSemester = (sem) => {
    setSelectedSemester(sem);
    const count = sectionsPerSemester[sem] || 2;
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

  // Parse L-T-P structure (e.g. 3-0-2 -> 3 hrs theory, 2 hrs lab; 0-0-3 -> 0 hrs theory, 3 hrs lab)
  const parseLtp = (subj) => {
    if (!subj) return { theoryHours: 3, labHours: 0, requiresLab: false };
    const ltpStr = subj.ltp || '';
    const match = ltpStr.match(/(\d+)\s*[-:]\s*(\d+)\s*[-:]\s*(\d+)/);
    if (match) {
      const l = parseInt(match[1], 10) || 0;
      const t = parseInt(match[2], 10) || 0;
      const p = parseInt(match[3], 10) || 0;
      const theoryHours = l + t;
      const labHours = p;
      return {
        theoryHours,
        labHours,
        requiresLab: labHours > 0
      };
    }
    const isLab = isLabSubject(subj);
    if (isLab) {
      return { theoryHours: 0, labHours: 3, requiresLab: true };
    }
    const defaultTheory = subj.classesPerWeek || (subj.credits >= 4 ? 4 : 3);
    return { theoryHours: defaultTheory, labHours: 0, requiresLab: false };
  };

  const resolveFacultyId = (defaultFac, subj) => {
    if (!defaultFac) return professors[0]?.id || '';
    if (professors.some(p => p.id === defaultFac)) return defaultFac;

    // Cross-department prefix matching (e.g. it_p01 <-> ai_it_p01)
    if (defaultFac.startsWith('it_p')) {
      const aiId = `ai_${defaultFac}`;
      if (professors.some(p => p.id === aiId)) return aiId;
    }
    if (defaultFac.startsWith('ai_it_p')) {
      const itId = defaultFac.replace('ai_', '');
      if (professors.some(p => p.id === itId)) return itId;
    }

    // Name-based matching if professor is in allProfessors
    const allMatch = allProfessors?.find(p => p.id === defaultFac);
    if (allMatch) {
      const nameMatch = professors.find(p => p.name?.trim().toLowerCase() === allMatch.name?.trim().toLowerCase());
      if (nameMatch) return nameMatch.id;
    }

    // Foundation matching
    if (foundationProfessors?.some(p => p.id === defaultFac)) return defaultFac;

    return professors[0]?.id || '';
  };


  // Sync subjects when semester changes
  useEffect(() => {
    if (!subjects || subjects.length === 0) return;

    const currentSemSubjs = subjects.filter(s => 
      s.semester ? Number(s.semester) === Number(selectedSemester) : Number(s.year) === Math.ceil(Number(selectedSemester) / 2)
    );

    // Initialize selection for this semester ONLY if not already initialized
    setSelectedSubjsBySem(prev => {
      if (prev[selectedSemester] && prev[selectedSemester].length > 0) {
        return prev; // Preserve user's selections!
      }
      const initialSelected = currentSemSubjs.slice(0, 6).map(s => s.id);
      return {
        ...prev,
        [selectedSemester]: initialSelected
      };
    });

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

      const parsed = parseLtp(s);
      initialConfigs[s.id] = {
        theoryHours: parsed.theoryHours,
        labHours: parsed.labHours,
        requiresLab: parsed.requiresLab,
        facultyId: resolveFacultyId(defaultFac, s),
        labRoomId: 'auto'
      };
    });

    // Merge into configs, preserving any existing customizations by the user
    setConfigs(prev => {
      const merged = { ...initialConfigs };
      Object.keys(prev).forEach(key => {
        if (prev[key]) {
          merged[key] = { ...merged[key], ...prev[key] };
        }
      });
      return { ...prev, ...merged };
    });
  }, [subjects, selectedSemester, professors, foundationProfessors, allProfessors]);

  const toggleSubject = (subjId) => {
    setSelectedSubjsBySem(prev => {
      const current = prev[selectedSemester] || [];
      if (current.includes(subjId)) {
        if (current.length <= 1) {
          notify('At least one must be selected.', 'warning');
          return prev;
        }
        return {
          ...prev,
          [selectedSemester]: current.filter(id => id !== subjId)
        };
      } else {
        return {
          ...prev,
          [selectedSemester]: [...current, subjId]
        };
      }
    });
  };

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

  const handleAddSubjectSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (newSubjCode || '').trim().toUpperCase();
    if (!cleanCode) {
      notify('Please enter a valid Course Code.', 'warning');
      return;
    }

    setIsSubmittingSubject(true);
    try {
      const cleanName = (newSubjName || '').trim() || `Course ${cleanCode}`;
      const payload = {
        code: cleanCode,
        name: cleanName,
        department: department,
        semester: Number(selectedSemester),
        year: Math.ceil(Number(selectedSemester) / 2),
        credits: Number(newSubjCredits),
        l_hours: Number(newSubjL),
        t_hours: Number(newSubjT),
        p_hours: Number(newSubjP),
        defaultFacultyId: newSubjFacultyId || (professors[0]?.id || null)
      };

      const added = await addSubject(payload);

      // Auto-select this subject in current semester
      setSelectedSubjsBySem(prev => {
        const current = prev[selectedSemester] || [];
        if (!current.includes(added.id)) {
          return {
            ...prev,
            [selectedSemester]: [...current, added.id]
          };
        }
        return prev;
      });

      // Configure default theory & lab hours for this subject
      const theoryHours = Number(newSubjL) + Number(newSubjT);
      const labHours = Number(newSubjP);
      setConfigs(prev => ({
        ...prev,
        [added.id]: {
          theoryHours: theoryHours,
          labHours: labHours,
          requiresLab: labHours > 0,
          facultyId: newSubjFacultyId || resolveFacultyId(added.defaultFaculty, added),
          labRoomId: 'auto'
        }
      }));

      notify(`Course ${cleanCode} (${cleanName}) added to Semester ${selectedSemester} and selected!`, 'success');

      // Reset form
      setNewSubjCode('');
      setNewSubjName('');
      setNewSubjCredits(3);
      setNewSubjL(3);
      setNewSubjT(0);
      setNewSubjP(0);
      setNewSubjFacultyId('');
      setIsAddSubjectOpen(false);
    } catch (err) {
      notify(`Failed to add course: ${err.message}`, 'error');
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  const handleGenSingle = async () => {
    if (!selectedSubjs.length) {
      notify('Select at least one subject via checkboxes.', 'warning');
      return;
    }
    const chosenClassroomId = getClassroomIdForSection(targetSection);
    if (!chosenClassroomId) {
      notify(`Please select a classroom for Section ${targetSection} before generating.`, 'warning');
      return;
    }
    setIsGenerating(true);
    clearGenerationError();
    try {
      const cleanSubjectSettings = {};
      selectedSubjs.forEach(sid => {
        const sObj = semSubjects.find(s => s.id === sid) || subjects.find(s => s.id === sid);
        if (!sObj) return;
        const parsed = parseLtp(sObj);
        const curCfg = configs[sid] || {};
        const chosenFacultyId = curCfg.facultyId || (sObj ? resolveFacultyId(sObj.defaultFaculty, sObj) : '');
        const effectiveLabHours = curCfg.labHours !== undefined ? Number(curCfg.labHours) : parsed.labHours;
        const effectiveTheoryHours = curCfg.theoryHours !== undefined ? Number(curCfg.theoryHours) : parsed.theoryHours;
        const effectiveRequiresLab = curCfg.labHours !== undefined ? (Number(curCfg.labHours) > 0) : (curCfg.requiresLab !== undefined ? Boolean(curCfg.requiresLab) : parsed.requiresLab);

        cleanSubjectSettings[sid] = {
          ...curCfg,
          facultyId: chosenFacultyId,
          theoryHours: effectiveTheoryHours,
          labHours: effectiveLabHours,
          requiresLab: effectiveRequiresLab
        };
      });

      const res = await generateSingleSectionDraft({
        department,
        year: Math.ceil(Number(selectedSemester) / 2),
        semester: Number(selectedSemester),
        section: targetSection,
        selectedClassrooms: classrooms.filter(c => selectedCRs.includes(c.id)),
        selectedClassroomId: chosenClassroomId,
        selectedLabs: availableLaboratories.filter(l => selectedLabs.includes(l.id)),
        selectedSubjects: selectedSubjs,
        subjectSettings: cleanSubjectSettings
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

    // Validate that all sections in active semester have classrooms selected
    const activeSecs = SECTIONS.slice(0, currentSemSections);
    const missingSecs = activeSecs.filter(s => !getClassroomIdForSection(s));
    if (missingSecs.length > 0) {
      notify(`Please select a classroom for Section ${missingSecs.join(', ')} in Semester ${selectedSemester}.`, 'warning');
      return;
    }

    // Verify zero overlaps across active sections
    const assignedMap = {};
    for (const sec of activeSecs) {
      const crId = getClassroomIdForSection(sec);
      if (assignedMap[crId]) {
        const crObj = classrooms.find(c => c.id === crId);
        notify(`Classroom Overlap: ${crObj?.name || crId} cannot be shared between Section ${assignedMap[crId]} and Section ${sec}. Please assign unique classrooms.`, 'error');
        return;
      }
      assignedMap[crId] = sec;
    }

    setIsGenerating(true);
    clearGenerationError();
    try {
      const calcYear = Math.ceil(Number(selectedSemester) / 2);
      const isEven = semesterType === 'even';
      const sectionsPerYear = {
        1: sectionsPerSemester[isEven ? 2 : 1] || 2,
        2: sectionsPerSemester[isEven ? 4 : 3] || 2,
        3: sectionsPerSemester[isEven ? 6 : 5] || 2,
        4: sectionsPerSemester[isEven ? 8 : 7] || 2
      };

      const fullSectionClassrooms = { ...sectionClassrooms };
      const usedRoomIds = new Set(Object.values(fullSectionClassrooms).filter(Boolean));

      availableSemesters.forEach(semObj => {
        const sVal = semObj.value;
        const sSecCount = sectionsPerSemester[sVal] || 2;
        SECTIONS.slice(0, sSecCount).forEach(sec => {
          const key = `S${sVal}_Sec${sec}`;
          if (!fullSectionClassrooms[key]) {
            const freeCR = classrooms.find(cr => !usedRoomIds.has(cr.id));
            if (freeCR) {
              fullSectionClassrooms[key] = freeCR.id;
              usedRoomIds.add(freeCR.id);
            } else {
              const fallbackCR = classrooms[usedRoomIds.size % classrooms.length];
              if (fallbackCR) fullSectionClassrooms[key] = fallbackCR.id;
            }
          }
        });
      });

      const selectedSubjectsByYear = {};
      [1, 2, 3, 4].forEach(yr => {
        const targetSem = isEven ? yr * 2 : (yr * 2) - 1;
        const semSubjs = selectedSubjsBySem[targetSem];
        if (semSubjs && semSubjs.length > 0) {
          selectedSubjectsByYear[yr] = semSubjs;
        }
      });
      if (!selectedSubjectsByYear[calcYear] || selectedSubjectsByYear[calcYear].length === 0) {
        selectedSubjectsByYear[calcYear] = selectedSubjs;
      }

      const cleanSubjectSettings = {};
      // Collect all candidate subjects across all semesters/years and custom configs
      const allSubjectIds = new Set();
      Object.values(selectedSubjectsByYear).forEach(ids => {
        (ids || []).forEach(id => allSubjectIds.add(id));
      });
      selectedSubjs.forEach(id => allSubjectIds.add(id));
      Object.keys(configs).forEach(id => allSubjectIds.add(id));
      Object.values(selectedSubjsBySem).forEach(ids => {
        (ids || []).forEach(id => allSubjectIds.add(id));
      });

      allSubjectIds.forEach(sid => {
        const sObj = subjects.find(s => s.id === sid);
        if (!sObj) return;
        const parsed = parseLtp(sObj);
        const curCfg = configs[sid] || {};
        const chosenFacultyId = curCfg.facultyId || (sObj ? resolveFacultyId(sObj.defaultFaculty, sObj) : '');
        const effectiveLabHours = curCfg.labHours !== undefined ? Number(curCfg.labHours) : parsed.labHours;
        const effectiveTheoryHours = curCfg.theoryHours !== undefined ? Number(curCfg.theoryHours) : parsed.theoryHours;
        const effectiveRequiresLab = curCfg.labHours !== undefined ? (Number(curCfg.labHours) > 0) : (curCfg.requiresLab !== undefined ? Boolean(curCfg.requiresLab) : parsed.requiresLab);

        cleanSubjectSettings[sid] = {
          ...curCfg,
          facultyId: chosenFacultyId,
          theoryHours: effectiveTheoryHours,
          labHours: effectiveLabHours,
          requiresLab: effectiveRequiresLab
        };
      });

      const res = await generateDraftsForDepartment({
        department,
        selectedClassrooms: classrooms.filter(c => selectedCRs.includes(c.id)),
        sectionClassrooms: fullSectionClassrooms,
        selectedLabs: (laboratories || []).filter(l => selectedLabs.includes(l.id) || isScienceLab(l)),
        sectionsPerYear: sectionsPerYear,
        sectionsPerSemester: sectionsPerSemester,
        selectedSubjectsByYear: selectedSubjectsByYear,
        subjectSettings: cleanSubjectSettings,
        semesterType: semesterType
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
      <div className={`flex flex-wrap items-center justify-between pb-3.5 border-b gap-2.5 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Constraint Configuration
            </h3>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              Dept. of {deptObj.name}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400">
          HoD In-Charge: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{currentUser?.name}</span>
        </div>
      </div>

      {/* Step 1: Academic Session (Term) Selection */}
      <div className={`p-4 rounded-xl border space-y-3.5 transition-colors ${
        isDark ? 'bg-[#090d16]/80 border-blue-900/40' : 'bg-blue-50/60 border-blue-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Select Semester
            </h4>
          </div>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
            isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            Active: {semesterType === 'odd' ? 'Odd Semester' : 'Even Semester'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => handleSemesterTypeChange('odd')}
            className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-start justify-between cursor-pointer ${
              semesterType === 'odd'
                ? isDark 
                  ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 shadow-sm' 
                  : 'bg-white border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                : isDark 
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                  : 'bg-white/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  semesterType === 'odd' 
                    ? isDark ? 'text-blue-300' : 'text-blue-700' 
                    : isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Odd Semester
                </span>
                {semesterType === 'odd' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {ODD_SEMESTERS.map(s => (
                  <span key={s.id} className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    semesterType === 'odd'
                      ? 'bg-blue-600 text-white'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
              semesterType === 'odd'
                ? 'bg-blue-600 border-blue-500 text-white'
                : isDark ? 'border-slate-700 text-transparent' : 'border-slate-300 text-transparent'
            }`}>
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSemesterTypeChange('even')}
            className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-start justify-between cursor-pointer ${
              semesterType === 'even'
                ? isDark 
                  ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 shadow-sm' 
                  : 'bg-white border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                : isDark 
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                  : 'bg-white/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  semesterType === 'even' 
                    ? isDark ? 'text-blue-300' : 'text-blue-700' 
                    : isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Even Semester
                </span>
                {semesterType === 'even' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {EVEN_SEMESTERS.map(s => (
                  <span key={s.id} className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    semesterType === 'even'
                      ? 'bg-blue-600 text-white'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
              semesterType === 'even'
                ? 'bg-blue-600 border-blue-500 text-white'
                : isDark ? 'border-slate-700 text-transparent' : 'border-slate-300 text-transparent'
            }`}>
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </button>
        </div>
      </div>

      {/* Step 2: Classrooms Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Building className="w-4 h-4 text-blue-500" />
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
                  <div className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cr.name}</div>
                  <div className="text-xs text-slate-400 font-mono">Cap: {cr.capacity}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Laboratories Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Monitor className="w-4 h-4 text-emerald-500" />
            <span>Assigned Department Laboratories ({selectedLabs.filter(id => availableLaboratories.some(l => l.id === id)).length} Selected)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {availableLaboratories.map(lab => {
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
                  <div className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {lab.code} - {lab.name?.replace(/^Central\s+/i, '')}
                  </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 4: Target Cohort (Semester & Dynamic Section) */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
        isDark ? 'bg-[#090d16]/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-5">
          {/* Sem */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Sem:</span>
            <div className={`flex rounded-md p-0.5 border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              {availableSemesters.map(s => {
                const sCount = sectionsPerSemester[s.value] || 2;
                const isSelected = Number(selectedSemester) === s.value;
                const secLabels = SECTIONS.slice(0, sCount).join(', ');
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSemester(Number(s.value))}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{s.label} ({secLabels})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Sections Selector for Currently Selected Semester */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
              No. of Sections:
            </span>
            <select
              value={currentSemSections}
              onChange={(e) => handleNumSectionsChange(Number(e.target.value))}
              className={`px-3 py-1 border rounded-md text-sm font-semibold focus:outline-none cursor-pointer ${
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

          {/* Target Section (only shows sections up to selected count for this semester) */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Target Section:</span>
            <div className={`flex rounded-md p-0.5 border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}>
              {SECTIONS.slice(0, currentSemSections).map(s => (
                <button
                  key={s}
                  onClick={() => setTargetSection(s)}
                  className={`px-3.5 py-1 rounded text-sm font-semibold transition-all ${
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

      {/* Target Classroom Selectors (one dropdown per section) */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-4 ${
        isDark ? 'bg-[#090d16]/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <span className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Building className="w-4 h-4 text-blue-500" />
          <span>Select Classroom{currentSemSections > 1 ? 's' : ''} (Sem {selectedSemester}):</span>
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {SECTIONS.slice(0, currentSemSections).map(sec => {
            const secCrId = getClassroomIdForSection(sec);
            return (
              <div key={sec} className="flex items-center gap-1.5">
                <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${
                  isDark ? 'bg-[#0f172a] border-[#1e293b] text-blue-400' : 'bg-white border-slate-200 text-blue-600'
                }`}>
                  Sec {sec}:
                </span>
                <select
                  value={secCrId}
                  onChange={(e) => handleClassroomChangeForSection(sec, e.target.value)}
                  className={`px-3 py-1.5 border rounded-md text-sm font-semibold focus:outline-none cursor-pointer ${
                    isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">Select Classroom...</option>
                  {classrooms.map(cr => {
                    const otherSecInSem = SECTIONS.slice(0, currentSemSections).find(
                      s => s !== sec && sectionClassrooms[`S${selectedSemester}_Sec${s}`] === cr.id
                    );
                    const occStatus = isClassroomOccupied(cr.id, `S${selectedSemester}_Sec${sec}`);
                    const isCurrent = secCrId === cr.id;
                    const isConflict = !isCurrent && (Boolean(otherSecInSem) || occStatus.occupied);

                    let statusNote = '';
                    if (otherSecInSem) {
                      statusNote = ` (Assigned to Sec ${otherSecInSem})`;
                    } else if (occStatus.occupied && !isCurrent) {
                      statusNote = ` (${occStatus.reason})`;
                    }

                    return (
                      <option key={cr.id} value={cr.id} disabled={isConflict}>
                        {cr.name} {isConflict ? statusNote : `(Cap: ${cr.capacity})`}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 5: Course Allocation from Database Curriculum */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Courses for Semester {selectedSemester}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsAddSubjectOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {semSubjects.map(s => {
            const on = selectedSubjs.includes(s.id);
            const parsed = parseLtp(s);
            const cfg = configs[s.id] || { 
              theoryHours: parsed.theoryHours, 
              labHours: parsed.labHours, 
              requiresLab: parsed.requiresLab,
              facultyId: resolveFacultyId(s.defaultFaculty, s) 
            };
            return (
              <div 
                key={s.id} 
                className={`py-2 px-2.5 rounded-lg border transition-all ${
                  on 
                    ? isDark ? 'border-slate-700 bg-[#141d30]' : 'border-slate-200 bg-white shadow-sm'
                    : isDark ? 'border-slate-800/70 bg-slate-900/25 opacity-60 hover:opacity-90' : 'border-slate-200/70 bg-slate-50/60 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div 
                    className="flex items-center gap-2 cursor-pointer select-none min-w-0 flex-wrap sm:flex-nowrap" 
                    onClick={() => toggleSubject(s.id)}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      on ? 'bg-blue-600 border-blue-500 text-white' : isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'
                    }`}>
                      {on && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className={`font-mono text-xs font-bold shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      {s.code}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {s.name}
                    </span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      isDark ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {s.credits} Credits • {s.ltp || '(3-0-0)'}
                    </span>
                  </div>

                  {on && (
                    <div className="flex flex-wrap items-center gap-2 pl-5 md:pl-0 shrink-0">
                      {/* Theory Hours Dropdown */}
                      <label className="flex items-center gap-1 text-xs text-slate-400">
                        <span>Theory Hours:</span>
                        <select 
                          value={cfg.theoryHours !== undefined ? cfg.theoryHours : parsed.theoryHours} 
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
                          className={`px-2.5 py-1.5 border rounded-md text-xs font-semibold focus:outline-none cursor-pointer ${
                            isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {[0, 1, 2, 3, 4, 5].map(v => (
                            <option key={v} value={v}>{v} Hrs</option>
                          ))}
                        </select>
                      </label>

                      {/* Lab Hours Dropdown beside Theory Hours */}
                      <label className="flex items-center gap-1 text-xs text-slate-400">
                        <span>Lab Hours:</span>
                        <select 
                          value={cfg.labHours !== undefined ? cfg.labHours : parsed.labHours} 
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
                          className={`px-2.5 py-1.5 border rounded-md text-xs font-semibold focus:outline-none cursor-pointer ${
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
                        <label className="flex items-center gap-1 text-xs text-slate-400">
                          <span>Lab Room:</span>
                          <select
                            value={cfg.labRoomId || 'auto'}
                            onChange={e => setConfigs(p => ({ ...p, [s.id]: { ...p[s.id], labRoomId: e.target.value } }))}
                            className={`px-2.5 py-1.5 border rounded-md text-xs font-semibold max-w-[150px] truncate focus:outline-none cursor-pointer ${
                              isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="auto">Auto</option>
                            {availableLaboratories
                              .filter(l => selectedLabs.includes(l.id))
                              .map(l => (
                                <option key={l.id} value={l.id}>{l.code}</option>
                              ))}
                          </select>
                        </label>
                      )}

                      <label className="flex items-center gap-1 text-xs text-slate-400">
                        <span>Faculty:</span>
                        <select 
                          value={cfg.facultyId || resolveFacultyId(s.defaultFaculty, s)} 
                          onChange={e => {
                            const val = e.target.value;
                            setConfigs(p => ({
                              ...p,
                              [s.id]: {
                                ...(p[s.id] || {}),
                                facultyId: val
                              }
                            }));
                          }}
                          className={`px-2.5 py-1.5 border rounded-md text-xs font-semibold max-w-[190px] truncate focus:outline-none cursor-pointer ${
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
                            <>
                              {professors.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                              {cfg.facultyId && !professors.some(p => p.id === cfg.facultyId) && (
                                <option value={cfg.facultyId}>
                                  {allProfessors?.find(p => p.id === cfg.facultyId)?.name || 'Assigned Faculty'}
                                </option>
                              )}
                            </>
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
          Selected: <span className="font-semibold text-blue-400">{selectedCRs.length} Classrooms</span> • <span className="font-semibold text-emerald-400">{selectedLabs.filter(id => availableLaboratories.some(l => l.id === id)).length} Labs</span> • <span className="font-semibold text-blue-300">{selectedSubjs.length} Courses</span>
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
            <span>Generate Sem {selectedSemester} Sec {targetSection}</span>
          </button>
          <button 
            onClick={handleGenAll} 
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {isGenerating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isGenerating ? 'Computing...' : `Generate All ${semesterType === 'odd' ? 'Odd' : 'Even'} Semester Drafts`}</span>
          </button>
        </div>
      </div>

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 transition-all ${
            isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add Subject</h3>
                  <p className="text-[11px] text-slate-400">Add course to Semester {selectedSemester} curriculum ({department} Dept)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
              {/* Course Code & Course Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjCode}
                    onChange={e => setNewSubjCode(e.target.value.toUpperCase())}
                    placeholder="e.g. IT350"
                    className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Course Name</label>
                  <input
                    type="text"
                    value={newSubjName}
                    onChange={e => setNewSubjName(e.target.value)}
                    placeholder="e.g. Distributed Computing"
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Credits, L, T, P dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Credits - dropdown max till 6 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Credits</label>
                  <select
                    value={newSubjCredits}
                    onChange={e => setNewSubjCredits(Number(e.target.value))}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6].map(c => (
                      <option key={c} value={c}>{c} Credits</option>
                    ))}
                  </select>
                </div>

                {/* L Hours - dropdown max till 4 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">L Hours</label>
                  <select
                    value={newSubjL}
                    onChange={e => setNewSubjL(Number(e.target.value))}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {[0, 1, 2, 3, 4].map(l => (
                      <option key={l} value={l}>{l} Lecture Hrs</option>
                    ))}
                  </select>
                </div>

                {/* T Hours - dropdown max till 3 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">T Hours</label>
                  <select
                    value={newSubjT}
                    onChange={e => setNewSubjT(Number(e.target.value))}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {[0, 1, 2, 3].map(t => (
                      <option key={t} value={t}>{t} Tutorial Hrs</option>
                    ))}
                  </select>
                </div>

                {/* P Hours - dropdown max till 4 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">P Hours</label>
                  <select
                    value={newSubjP}
                    onChange={e => setNewSubjP(Number(e.target.value))}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                      isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {[0, 1, 2, 3, 4].map(p => (
                      <option key={p} value={p}>{p} Lab Hrs</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Faculty In-Charge Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Faculty In-Charge</label>
                <select
                  value={newSubjFacultyId}
                  onChange={e => setNewSubjFacultyId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                    isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">Auto-Assign / Default Faculty</option>
                  {professors.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.designation})</option>
                  ))}
                </select>
              </div>

              {/* LTP preview badge */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">LTP Scheme:</span>
                  <span className="font-mono font-bold text-blue-500">({newSubjL}-{newSubjT}-{newSubjP})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-blue-950/60 text-blue-300 border border-blue-800/40">
                    {newSubjCredits} Credits
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {newSubjL + newSubjT} Theory + {newSubjP} Lab hrs/wk
                  </span>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isDark ? 'bg-[#162032] hover:bg-[#1e2d47] border-[#1e293b] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSubject}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingSubject ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
