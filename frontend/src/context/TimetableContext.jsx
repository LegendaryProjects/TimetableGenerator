import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { 
  INITIAL_TIMETABLES, 
  generateScheduleWithGlobalCSP,
  createGlobalOccupancyTracker,
  DEPARTMENT_CLASSROOMS,
  DEPARTMENT_LABS,
  SUBJECTS_BY_DEPT_YEAR, 
  PROFESSORS, 
  DAYS, 
  TIME_SLOTS 
} from '../data/mockAcademicData';
import { useAuth } from './AuthContext';

const TimetableContext = createContext(null);

export function TimetableProvider({ children }) {
  const { currentUser, isHod } = useAuth();

  const [timetables, setTimetables] = useState(() => {
    const saved = localStorage.getItem('nitk_timetables_v12');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored timetables:', e);
      }
    }
    return INITIAL_TIMETABLES;
  });

  const [selectedDepartment, setSelectedDepartment] = useState(currentUser?.department || 'IT');
  const [selectedYear, setSelectedYear] = useState(3);
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedFacultyId, setSelectedFacultyId] = useState('p1');
  const [viewMode, setViewMode] = useState('student');
  
  const [isEditingHodStudio, setIsEditingHodStudio] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [lastConflictAlert, setLastConflictAlert] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Sync with live Backend Database
  useEffect(() => {
    async function fetchFromBackend() {
      try {
        const res = await api.getTimetables({ department: selectedDepartment });
        if (res.timetables && res.timetables.length > 0) {
          setTimetables(prev => {
            const otherDepts = prev.filter(t => t.department !== selectedDepartment);
            return [...otherDepts, ...res.timetables];
          });
        }
      } catch (e) {
        // Backend offline or local mode
      }
    }
    fetchFromBackend();
  }, [selectedDepartment]);

  useEffect(() => {
    if (currentUser?.department) {
      setSelectedDepartment(currentUser.department);
    }
    if (currentUser?.userType === 'Student') {
      if (currentUser.year) setSelectedYear(Number(currentUser.year));
      if (currentUser.section) setSelectedSection(currentUser.section);
      setViewMode('student');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('nitk_timetables_v12', JSON.stringify(timetables));
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

    DAYS.forEach(day => {
      TIME_SLOTS.forEach(slot => {
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
  }, [timetables, selectedDepartment]);

  /**
   * Builds composite Faculty Timetable when in Faculty View Mode
   */
  const facultyCompositeTimetable = useMemo(() => {
    if (viewMode !== 'faculty') return null;

    const faculty = PROFESSORS.find(p => p.id === selectedFacultyId) || PROFESSORS.find(p => p.department === selectedDepartment) || PROFESSORS[0];
    if (!faculty) return null;

    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(slot => {
        if (slot.isBreak) return;
        grid[day][slot.id] = null;
      });
    });

    const deptTTs = timetables.filter(t => t.department === selectedDepartment);

    deptTTs.forEach(tt => {
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(slot => {
          if (slot.isBreak) return;
          const cell = tt.grid?.[day]?.[slot.id];
          if (cell && cell.facultyId === faculty.id) {
            grid[day][slot.id] = {
              ...cell,
              assignedClassroom: `Year ${tt.year} Sec ${tt.section} (${cell.roomName || cell.roomId})`
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
  }, [viewMode, selectedFacultyId, timetables, selectedDepartment]);

  const currentViewerTimetable = viewMode === 'faculty'
    ? facultyCompositeTimetable
    : timetables.find(
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
    : draftTimetables[0] || timetables.find(t => t.department === selectedDepartment && t.year === Number(selectedYear) && t.section === selectedSection) || timetables.find(t => t.department === selectedDepartment) || null;

  const buildTrackerFromTimetables = (ttList, excludeId = null) => {
    const tracker = createGlobalOccupancyTracker();
    ttList.forEach(tt => {
      if (excludeId && tt.id === excludeId) return;
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(slot => {
          if (slot.isBreak) return;
          const cell = tt.grid?.[day]?.[slot.id];
          if (cell) {
            if (cell.facultyId) tracker[day][slot.id].facultyIds.add(cell.facultyId);
            if (cell.roomId) tracker[day][slot.id].roomIds.add(cell.roomId);
          }
        });
      });
    });
    return tracker;
  };

  /**
   * Generate Draft for ONLY ONE specific section.
   * If zero-overlapping is impossible, DOES NOT generate or save any timetable!
   */
  const generateSingleSectionDraft = ({
    department = selectedDepartment,
    year = 3,
    section = 'A',
    selectedClassrooms = [],
    selectedLabs = [],
    labsPerSection = 2,
    selectedSubjects = [],
    subjectSettings = {}
  }) => {
    const activeClassrooms = selectedClassrooms.length > 0
      ? selectedClassrooms
      : (DEPARTMENT_CLASSROOMS[department] || DEPARTMENT_CLASSROOMS['IT']).slice(0, 2);

    const activeLabs = selectedLabs.length > 0
      ? selectedLabs
      : (DEPARTMENT_LABS[department] || DEPARTMENT_LABS['IT']).slice(0, 2);

    const existingDeptTimetables = timetables.filter(
      t => t.department === department && !(t.year === Number(year) && t.section === section)
    );
    const globalOccupancy = buildTrackerFromTimetables(existingDeptTimetables);

    const singleDraft = generateScheduleWithGlobalCSP({
      department,
      year: Number(year),
      section,
      status: 'DRAFT',
      selectedSubjects,
      subjectSettings,
      selectedClassrooms: activeClassrooms,
      selectedLabs: activeLabs,
      labsPerSection: Number(labsPerSection),
      allocatedClassroom: activeClassrooms[0],
      allocatedLabs: activeLabs.slice(0, labsPerSection),
      globalOccupancy
    });

    // RULE: If zero-overlapping is impossible, DO NOT GENERATE AT ALL!
    if (!singleDraft.isFeasible) {
      const errInfo = {
        title: 'Timetable Generation Aborted',
        message: 'There is no possibility to achieve zero-overlapping with the current constraint inputs.',
        unplaced: singleDraft.unplacedSessions,
        department,
        year,
        section
      };
      setGenerationError(errInfo);
      notify('⚠️ Generation Aborted: There is no possibility to achieve zero-overlapping with current constraints.', 'warning');
      return null;
    }

    // Otherwise, zero-overlap is verified: Save the draft
    setGenerationError(null);
    singleDraft.name = `Year ${year} - Section ${section}`;

    setTimetables(prev => {
      const remaining = prev.filter(t => !(t.department === department && t.year === Number(year) && t.section === section));
      return [...remaining, singleDraft];
    });

    setActiveDraftId(singleDraft.id);
    setSelectedYear(Number(year));
    setSelectedSection(section);

    notify(`Successfully generated 100% zero-overlap timetable for Year ${year} Sec ${section}!`, 'success');
    return singleDraft;
  };

  /**
   * Generate Draft Timetables for Entire Department.
   * If zero-overlapping is impossible for ANY section, DOES NOT generate ANY timetable at all!
   */
  const generateDraftsForDepartment = ({ 
    department = selectedDepartment,
    selectedClassrooms = [],
    selectedLabs = [],
    labsPerSection = 2,
    sectionsPerYear = { 1: 2, 2: 2, 3: 2, 4: 2 },
    selectedSubjectsByYear = {},
    subjectSettings = {}
  }) => {
    const activeClassrooms = selectedClassrooms.length > 0
      ? selectedClassrooms
      : (DEPARTMENT_CLASSROOMS[department] || DEPARTMENT_CLASSROOMS['IT']);

    const activeLabs = selectedLabs.length > 0
      ? selectedLabs
      : (DEPARTMENT_LABS[department] || DEPARTMENT_LABS['IT']);

    const globalOccupancy = createGlobalOccupancyTracker();
    const candidateDrafts = [];
    const allUnplacedSessions = [];
    const sectionLetters = ['A', 'B', 'C', 'D'];

    let globalCrIdx = 0;
    let globalLabIdx = 0;

    [1, 2, 3, 4].forEach(year => {
      const numSec = sectionsPerYear[year] || 2;
      const yearSelectedSubjs = selectedSubjectsByYear[year] || [];

      for (let sIdx = 0; sIdx < numSec; sIdx++) {
        const sec = sectionLetters[sIdx];
        
        const assignedClassroom = activeClassrooms[globalCrIdx % activeClassrooms.length];
        globalCrIdx++;

        const assignedLab1 = activeLabs[globalLabIdx % activeLabs.length];
        const assignedLab2 = activeLabs[(globalLabIdx + 1) % activeLabs.length];
        globalLabIdx += labsPerSection;

        const draft = generateScheduleWithGlobalCSP({
          department,
          year,
          section: sec,
          status: 'DRAFT',
          selectedSubjects: yearSelectedSubjs,
          subjectSettings,
          selectedClassrooms: activeClassrooms,
          selectedLabs: activeLabs,
          labsPerSection,
          allocatedClassroom: assignedClassroom,
          allocatedLabs: [assignedLab1, assignedLab2],
          globalOccupancy
        });

        draft.name = `Year ${year} - Section ${sec}`;
        if (!draft.isFeasible) {
          allUnplacedSessions.push(...draft.unplacedSessions);
        }
        candidateDrafts.push(draft);
      }
    });

    // RULE: If any session could not be placed with zero-overlap, DO NOT GENERATE AT ALL!
    if (allUnplacedSessions.length > 0) {
      const errInfo = {
        title: 'Department Timetables Generation Aborted',
        message: 'There is no possibility to achieve zero-overlapping with the current constraint inputs.',
        unplaced: allUnplacedSessions,
        department
      };
      setGenerationError(errInfo);
      notify(
        `⚠️ Generation Aborted: There is no possibility to achieve zero-overlapping for ${allUnplacedSessions.length} session(s).`,
        'warning'
      );
      return null;
    }

    // 100% Zero-Overlap Verified: Save all department drafts
    setGenerationError(null);
    setTimetables(prev => {
      const remaining = prev.filter(t => t.department !== department);
      return [...remaining, ...candidateDrafts];
    });

    if (candidateDrafts.length > 0) {
      setActiveDraftId(candidateDrafts[0].id);
      setSelectedYear(candidateDrafts[0].year);
      setSelectedSection(candidateDrafts[0].section);
    }

    notify(`Successfully formulated ${candidateDrafts.length} zero-conflict draft timetables for ${department}!`, 'success');
    return candidateDrafts;
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

  const swapSlots = (sourceTimetableId, source, targetTimetableId = null, target) => {
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
      // Sync fallback
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

  const approveAllDrafts = () => {
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
      selectedDepartment,
      setSelectedDepartment: (dept) => {
        setSelectedDepartment(dept);
        setSelectedYear(1);
        setSelectedSection('A');
        setActiveDraftId(null);
      },
      selectedYear,
      setSelectedYear,
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
