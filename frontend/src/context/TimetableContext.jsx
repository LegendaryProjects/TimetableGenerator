import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const TimetableContext = createContext(null);

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_TIME_SLOTS = [
  { id: 1, time: '08:00 - 08:45', label: 'Period 1' },
  { id: 2, time: '09:00 - 09:45', label: 'Period 2' },
  { id: 3, time: '10:00 - 10:45', label: 'Period 3' },
  { id: 4, time: '11:00 - 11:45', label: 'Period 4' },
  { id: 'lunch', time: '11:45 - 13:00', label: 'Lunch Break', isBreak: true },
  { id: 5, time: '13:00 - 13:45', label: 'Period 5' },
  { id: 6, time: '14:00 - 14:45', label: 'Period 6' },
  { id: 7, time: '15:00 - 15:45', label: 'Period 7' },
  { id: 8, time: '16:00 - 16:45', label: 'Period 8' },
  { id: 9, time: '17:00 - 17:45', label: 'Period 9' },
  { id: 10, time: '18:00 - 18:45', label: 'Period 10' }
];

// Policy: Institutional ban on scheduling classes from 8:00 - 9:00 AM (Period 1)
const stripPeriod1FromTimetable = (tt) => {
  if (!tt || !tt.grid) return tt;
  let hasPeriod1 = false;
  const newGrid = {};
  for (const day of Object.keys(tt.grid)) {
    newGrid[day] = { ...tt.grid[day] };
    if (newGrid[day][1] || newGrid[day]['1']) {
      hasPeriod1 = true;
      delete newGrid[day][1];
      delete newGrid[day]['1'];
    }
  }
  return hasPeriod1 ? { ...tt, grid: newGrid } : tt;
};

export function TimetableProvider({ children }) {
  const { currentUser, isHod } = useAuth();

  const [timetables, setTimetables] = useState(() => {
    const saved = localStorage.getItem('nitk_timetables_v14') || localStorage.getItem('nitk_timetables_v13');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map(stripPeriod1FromTimetable) : [];
      } catch (e) {
        console.error('Error parsing stored timetables:', e);
      }
    }
    return [];
  });

  const [selectedDepartment, setSelectedDepartment] = useState(currentUser?.department || 'IT');
  const [selectedSemester, setSelectedSemester] = useState(currentUser?.semester || 5);
  const [selectedYear, setSelectedYear] = useState(3);
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [viewMode, setViewMode] = useState('student');
  
  const [semesterType, setSemesterType] = useState(() => {
    const saved = localStorage.getItem('nitk_semester_type');
    if (saved === 'odd' || saved === 'even') return saved;
    return (currentUser?.semester && Number(currentUser.semester) % 2 === 0) ? 'even' : 'odd';
  });

  useEffect(() => {
    localStorage.setItem('nitk_semester_type', semesterType);
  }, [semesterType]);

  const [departments, setDepartments] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [foundationProfessors, setFoundationProfessors] = useState([]);
  const [allProfessors, setAllProfessors] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([1, 2, 3, 4]);
  const [semesters, setSemesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [sections, setSections] = useState(['A', 'B', 'C', 'D']);
  const [workingDays, setWorkingDays] = useState(DEFAULT_DAYS);
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);

  const [isEditingHodStudio, setIsEditingHodStudio] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [lastConflictAlert, setLastConflictAlert] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch academic constraints and entity options from Backend Database
  useEffect(() => {
    async function fetchOptions() {
      try {
        // Fetch all department courses across all years & semesters
        const res = await api.getOptions(selectedDepartment);
        if (res) {
          if (res.departments && res.departments.length > 0) setDepartments(res.departments);
          if (res.professors) {
            setProfessors(res.professors);
            if (res.professors.length > 0 && !selectedFacultyId) {
              setSelectedFacultyId(res.professors[0].id);
            }
          }
          if (res.foundationProfessors) setFoundationProfessors(res.foundationProfessors);
          if (res.allProfessors) setAllProfessors(res.allProfessors);
          if (res.classrooms) setClassrooms(res.classrooms);
          if (res.laboratories) setLaboratories(res.laboratories);
          if (res.subjects) setSubjects(res.subjects);
          if (res.years) setYears(res.years);
          if (res.semesters) setSemesters(res.semesters);
          if (res.sections) setSections(res.sections);
          if (res.workingDays) setWorkingDays(res.workingDays);
          if (res.timeSlots) setTimeSlots(res.timeSlots);
        }
      } catch (err) {
        console.error('Failed to load academic options from database:', err);
      }
    }
    fetchOptions();
  }, [selectedDepartment]);

  // Sync timetables from live backend database
  useEffect(() => {
    async function fetchFromBackend() {
      try {
        const res = await api.getTimetables({ department: selectedDepartment });
        if (res.timetables) {
          const sanitized = res.timetables.map(stripPeriod1FromTimetable);
          setTimetables(prev => {
            const otherDepts = prev.filter(t => t.department !== selectedDepartment);
            return [...otherDepts, ...sanitized];
          });
        }
      } catch (e) {
        console.error('Failed to load timetables from backend:', e);
      }
    }
    fetchFromBackend();
  }, [selectedDepartment]);

  useEffect(() => {
    if (currentUser?.department) {
      setSelectedDepartment(currentUser.department);
    }
    if (currentUser?.userType === 'Student') {
      if (currentUser.semester) {
        setSelectedSemester(Number(currentUser.semester));
        setSelectedYear(Math.ceil(Number(currentUser.semester) / 2));
      } else if (currentUser.year) {
        setSelectedYear(Number(currentUser.year));
        setSelectedSemester(Number(currentUser.year) * 2 - 1);
      }
      if (currentUser.section) setSelectedSection(currentUser.section);
      setViewMode('student');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('nitk_timetables_v14', JSON.stringify(timetables));
  }, [timetables]);

  const notify = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  /**
   * Real-time Cross-Section Conflict Auditor
   */
  const conflictAudit = useMemo(() => {
    const facultyClashes = [];
    const roomClashes = [];
    const deptTTs = timetables.filter(t => t.department === selectedDepartment);

    workingDays.forEach(day => {
      timeSlots.forEach(slot => {
        if (slot.isBreak) return;
        
        const facultyMap = {};
        const roomMap = {};

        deptTTs.forEach(tt => {
          const cell = tt.grid?.[day]?.[slot.id];
          if (cell) {
            if (cell.facultyId) {
              if (!facultyMap[cell.facultyId]) facultyMap[cell.facultyId] = [];
              facultyMap[cell.facultyId].push({
                facultyName: cell.facultyName,
                year: tt.year,
                section: tt.section,
                subjectCode: cell.subjectCode
              });
            }
            if (cell.roomId) {
              if (!roomMap[cell.roomId]) roomMap[cell.roomId] = [];
              roomMap[cell.roomId].push({
                roomName: cell.roomName || cell.roomId,
                year: tt.year,
                section: tt.section,
                subjectCode: cell.subjectCode
              });
            }
          }
        });

        Object.entries(facultyMap).forEach(([fId, entries]) => {
          if (entries.length > 1) {
            facultyClashes.push({
              day,
              period: slot.id,
              facultyName: entries[0].facultyName,
              entries
            });
          }
        });

        Object.entries(roomMap).forEach(([rId, entries]) => {
          if (entries.length > 1) {
            roomClashes.push({
              day,
              period: slot.id,
              roomName: entries[0].roomName,
              entries
            });
          }
        });
      });
    });

    return {
      facultyClashes,
      roomClashes,
      totalClashes: facultyClashes.length + roomClashes.length,
      isZeroOverlap: facultyClashes.length === 0 && roomClashes.length === 0
    };
  }, [timetables, selectedDepartment, workingDays, timeSlots]);

  /**
   * Composite Faculty Timetable when in Faculty View Mode
   */
  const facultyCompositeTimetable = useMemo(() => {
    if (viewMode !== 'faculty') return null;

    const faculty = professors.find(p => p.id === selectedFacultyId) || 
                    professors.find(p => p.department === selectedDepartment) || 
                    professors[0];
    if (!faculty) return null;

    const grid = {};
    workingDays.forEach(day => {
      grid[day] = {};
      timeSlots.forEach(slot => {
        if (slot.isBreak) return;
        grid[day][slot.id] = null;
      });
    });

    const deptTTs = timetables.filter(t => t.department === selectedDepartment);

    deptTTs.forEach(tt => {
      workingDays.forEach(day => {
        timeSlots.forEach(slot => {
          if (slot.isBreak) return;
          const cell = tt.grid?.[day]?.[slot.id];
          if (cell && cell.facultyId === faculty.id) {
            grid[day][slot.id] = {
              ...cell,
              assignedClassroom: `Sem ${tt.semester || tt.year} Sec ${tt.section} (${cell.roomName || cell.roomId})`
            };
          }
        });
      });
    });

    return {
      id: `faculty_${faculty.id}`,
      department: faculty.department,
      year: 'All',
      section: 'Faculty Schedule',
      status: 'APPROVED',
      isFacultySchedule: true,
      facultyName: faculty.name,
      designation: faculty.designation,
      assignedClassroom: `Composite View for ${faculty.name}`,
      isFeasible: true,
      grid
    };
  }, [viewMode, selectedFacultyId, timetables, selectedDepartment, professors, workingDays, timeSlots]);

  const currentViewerTimetable = viewMode === 'faculty'
    ? facultyCompositeTimetable
    : timetables.find(
        t => t.department === selectedDepartment && 
             (t.semester ? Number(t.semester) === Number(selectedSemester) : t.year === Number(selectedYear)) && 
             t.section === selectedSection &&
             t.status === 'APPROVED'
      ) || timetables.find(
        t => t.department === selectedDepartment && 
             t.year === Number(selectedYear) && 
             t.section === selectedSection &&
             t.status === 'APPROVED'
      ) || null;

  const draftTimetables = timetables.filter(
    t => t.status === 'DRAFT' && t.department === selectedDepartment
  );

  const currentHodTimetable = activeDraftId 
    ? timetables.find(t => t.id === activeDraftId)
    : draftTimetables.find(t => (t.semester ? Number(t.semester) === Number(selectedSemester) : t.year === Number(selectedYear)) && t.section === selectedSection)
      || draftTimetables[0] 
      || timetables.find(t => t.department === selectedDepartment && (t.semester ? Number(t.semester) === Number(selectedSemester) : t.year === Number(selectedYear)) && t.section === selectedSection) 
      || timetables.find(t => t.department === selectedDepartment) 
      || null;

  /**
   * Generate Draft for a single section via Backend Constraint Solver
   */
  const generateSingleSectionDraft = async ({
    department = selectedDepartment,
    year,
    semester = selectedSemester,
    section = 'A',
    selectedClassrooms = [],
    selectedLabs = [],
    selectedSubjects = [],
    subjectSettings = {},
    selectedClassroomId = null
  }) => {
    try {
      clearGenerationError();
      const semNum = Number(semester || selectedSemester || 5);
      const yrNum = year ? Number(year) : Math.ceil(semNum / 2);
      const res = await api.generateDrafts({
        department,
        year: yrNum,
        semester: semNum,
        section,
        selectedClassrooms,
        selectedClassroomId,
        selectedLabs,
        selectedSubjects,
        subjectSettings
      });

      if (res && res.drafts && res.drafts.length > 0) {
        const newDrafts = res.drafts;
        setTimetables(prev => {
          const remaining = prev.filter(t => !(t.department === department && (t.semester ? Number(t.semester) === semNum : t.year === yrNum) && t.section === section));
          return [...remaining, ...newDrafts];
        });
        setActiveDraftId(newDrafts[0].id);
        setSelectedSemester(semNum);
        setSelectedYear(yrNum);
        setSelectedSection(section);
        notify(`Successfully generated timetable for Semester ${semNum} (Sec ${section})!`, 'success');
        return newDrafts[0];
      }
    } catch (err) {
      const errInfo = {
        title: 'Timetable Generation Aborted',
        message: err.message || 'Unable to generate schedule with current constraints.',
        department,
        year,
        section
      };
      setGenerationError(errInfo);
      notify(`⚠️ ${err.message || 'Generation aborted'}`, 'warning');
      return null;
    }
  };

  /**
   * Generate Draft Timetables for entire department via Backend Constraint Solver
   */
  const generateDraftsForDepartment = async ({ 
    department = selectedDepartment,
    sectionsPerYear = { 1: 2, 2: 2, 3: 2, 4: 2 },
    selectedSubjectsByYear = {},
    subjectSettings = {},
    selectedClassrooms = [],
    selectedLabs = [],
    sectionClassrooms = {},
    semesterType: overrideSemType = null
  }) => {
    try {
      clearGenerationError();
      const semType = overrideSemType || semesterType || 'odd';
      const res = await api.generateDrafts({
        department,
        sectionsPerYear,
        selectedSubjectsByYear,
        subjectSettings,
        selectedClassrooms,
        selectedLabs,
        sectionClassrooms,
        semesterType: semType
      });

      if (res && res.drafts && res.drafts.length > 0) {
        const candidateDrafts = res.drafts;
        setTimetables(prev => {
          const remaining = prev.filter(t => t.department !== department);
          return [...remaining, ...candidateDrafts];
        });

        if (candidateDrafts.length > 0) {
          setActiveDraftId(candidateDrafts[0].id);
          setSelectedYear(candidateDrafts[0].year);
          setSelectedSection(candidateDrafts[0].section);
        }

        notify(`Successfully formulated ${candidateDrafts.length} draft timetables for ${department}!`, 'success');
        return candidateDrafts;
      }
    } catch (err) {
      const errInfo = {
        title: 'Department Timetables Generation Aborted',
        message: err.message || 'Unable to generate department schedules with current constraints.',
        department
      };
      setGenerationError(errInfo);
      notify(`⚠️ ${err.message || 'Generation aborted'}`, 'warning');
      return null;
    }
  };

  const clearGenerationError = () => {
    setGenerationError(null);
  };

  /**
   * Check for slot conflict across all sections
   */
  const checkOverlapConflict = (targetTimetableId, targetDay, targetSlotId, candidateSlotData, sourceTimetableId = null, sourceSlot = null) => {
    if (!candidateSlotData) return null;

    const targetTT = timetables.find(t => t.id === targetTimetableId);
    if (!targetTT) return null;

    for (const tt of timetables) {
      if (tt.department !== targetTT.department) continue;
      if (sourceTimetableId && tt.id === sourceTimetableId) continue;

      const existingSlot = tt.grid?.[targetDay]?.[targetSlotId];
      if (existingSlot && tt.id !== targetTimetableId) {
        if (existingSlot.facultyId === candidateSlotData.facultyId) {
          return `Faculty Conflict: ${candidateSlotData.facultyName} is already teaching Year ${tt.year} Sec ${tt.section} on ${targetDay} Period ${targetSlotId}.`;
        }
        if (existingSlot.roomId === candidateSlotData.roomId) {
          return `Room Conflict: ${candidateSlotData.roomName} is already occupied by Year ${tt.year} Sec ${tt.section} on ${targetDay} Period ${targetSlotId}.`;
        }
      }
    }

    return null;
  };

  const swapSlots = async (sourceTimetableId, source, targetTimetableId = null, target) => {
    const actualTargetTimetableId = targetTimetableId || sourceTimetableId;
    let conflictWarning = null;

    const sourceTT = timetables.find(t => t.id === sourceTimetableId);
    const targetTT = timetables.find(t => t.id === actualTargetTimetableId);

    if (!sourceTT || !targetTT) return false;

    const sourceData = sourceTT.grid?.[source.day]?.[source.slotId] || null;
    const targetData = targetTT.grid?.[target.day]?.[target.slotId] || null;

    if (sourceData) {
      const c1 = checkOverlapConflict(actualTargetTimetableId, target.day, target.slotId, sourceData, sourceTimetableId, source);
      if (c1) conflictWarning = c1;
    }

    if (targetData && !conflictWarning) {
      const c2 = checkOverlapConflict(sourceTimetableId, source.day, source.slotId, targetData, actualTargetTimetableId, target);
      if (c2) conflictWarning = c2;
    }

    if (conflictWarning) {
      setLastConflictAlert(conflictWarning);
      notify(conflictWarning, 'warning');
      return false;
    }

    try {
      await api.swapSlots({
        sourceTimetableId,
        targetTimetableId: actualTargetTimetableId,
        source,
        target
      });
    } catch (e) {
      console.error('Swap persistence error:', e);
    }

    setTimetables(prev => {
      return prev.map(tt => {
        if (tt.id === sourceTimetableId && tt.id === actualTargetTimetableId) {
          const updatedGrid = JSON.parse(JSON.stringify(tt.grid));
          updatedGrid[source.day][source.slotId] = targetData;
          updatedGrid[target.day][target.slotId] = sourceData;
          return { ...tt, grid: updatedGrid, lastUpdated: new Date().toISOString(), hasUnsavedEdits: true };
        }
        if (tt.id === sourceTimetableId) {
          const updatedGrid = JSON.parse(JSON.stringify(tt.grid));
          updatedGrid[source.day][source.slotId] = targetData;
          return { ...tt, grid: updatedGrid, lastUpdated: new Date().toISOString(), hasUnsavedEdits: true };
        }
        if (tt.id === actualTargetTimetableId) {
          const updatedGrid = JSON.parse(JSON.stringify(tt.grid));
          updatedGrid[target.day][target.slotId] = sourceData;
          return { ...tt, grid: updatedGrid, lastUpdated: new Date().toISOString(), hasUnsavedEdits: true };
        }
        return tt;
      });
    });

    setLastConflictAlert(null);
    const isCross = sourceTimetableId !== actualTargetTimetableId;
    notify(
      isCross 
        ? `Conflict-free swap executed between ${source.day} P${source.slotId} and target ${target.day} P${target.slotId}` 
        : `Slots swapped successfully on ${source.day} between P${source.slotId} and P${target.slotId}`, 
      'success'
    );
    return true;
  };

  const approveTimetable = async (timetableId) => {
    try {
      await api.approveTimetable(timetableId);
    } catch (e) {
      console.error('Error approving timetable:', e);
    }

    setTimetables(prev => {
      return prev.map(t => {
        if (t.id === timetableId) {
          return {
            ...t,
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
            hasUnsavedEdits: false
          };
        }
        return t;
      });
    });

    notify('Timetable approved and published to Student/Professor portal!', 'success');
  };

  const revertTimetable = async (timetableId) => {
    try {
      await api.revertTimetable(timetableId);
    } catch (e) {
      console.error('Error reverting timetable to draft:', e);
    }

    setTimetables(prev => prev.map(t => {
      if (t.id === timetableId) {
        return {
          ...t,
          status: 'DRAFT',
          hasUnsavedEdits: false
        };
      }
      return t;
    }));

    notify('Timetable reverted to DRAFT in database.', 'info');
  };

  const disapproveTimetable = revertTimetable;

  const deleteTimetable = async (timetableId) => {
    try {
      await api.deleteTimetable(timetableId);
    } catch (e) {
      console.error('Error deleting timetable from database:', e);
    }

    setTimetables(prev => prev.filter(t => t.id !== timetableId));
    setActiveDraftId(null);
    notify('Timetable deleted from database.', 'warning');
  };

  const discardDraft = deleteTimetable;

  const approveAllDrafts = async () => {
    const draftsToApprove = timetables.filter(t => t.department === selectedDepartment && t.status === 'DRAFT');
    for (const d of draftsToApprove) {
      try {
        await api.approveTimetable(d.id);
      } catch (e) {}
    }

    setTimetables(prev => {
      return prev.map(t => {
        if (t.department === selectedDepartment && t.status === 'DRAFT') {
          return {
            ...t,
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
            hasUnsavedEdits: false
          };
        }
        return t;
      });
    });

    notify(`All timetables for ${selectedDepartment} have been APPROVED & PUBLISHED!`, 'success');
  };

  return (
    <TimetableContext.Provider value={{
      timetables,
      departments,
      professors,
      foundationProfessors,
      allProfessors,
      classrooms,
      laboratories,
      subjects,
      years,
      semesters,
      sections,
      workingDays,
      timeSlots,
      selectedDepartment,
      setSelectedDepartment: (dept) => {
        setSelectedDepartment(dept);
        setSelectedSemester(5);
        setSelectedYear(3);
        setSelectedSection('A');
        setActiveDraftId(null);
      },
      selectedSemester,
      setSelectedSemester: (sem) => {
        const s = Number(sem);
        setSelectedSemester(s);
        setSelectedYear(Math.ceil(s / 2));
        setSemesterType(s % 2 === 0 ? 'even' : 'odd');
      },
      selectedYear,
      setSelectedYear: (yr) => {
        const y = Number(yr);
        setSelectedYear(y);
        setSelectedSemester(semesterType === 'even' ? (y * 2) : ((y * 2) - 1));
      },
      semesterType,
      setSemesterType: (type) => {
        const t = (type === 'even') ? 'even' : 'odd';
        setSemesterType(t);
        setSelectedSemester(prev => {
          const current = Number(prev) || 1;
          if (t === 'odd' && current % 2 === 0) {
            return Math.max(1, current - 1);
          } else if (t === 'even' && current % 2 !== 0) {
            return Math.min(8, current + 1);
          }
          return current;
        });
      },
      selectedSection,
      setSelectedSection,
      selectedFacultyId,
      setSelectedFacultyId,
      viewMode,
      setViewMode,
      isEditingHodStudio,
      setIsEditingHodStudio,
      activeDraftId,
      setActiveDraftId,
      currentViewerTimetable,
      currentHodTimetable,
      draftTimetables,
      generateSingleSectionDraft,
      generateDraftsForDepartment,
      swapSlots,
      approveTimetable,
      revertTimetable,
      disapproveTimetable,
      deleteTimetable,
      discardDraft,
      approveAllDrafts,
      lastConflictAlert,
      conflictAudit,
      generationError,
      clearGenerationError,
      notification,
      notify
    }}>
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
}
