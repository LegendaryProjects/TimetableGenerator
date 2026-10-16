import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Users, GraduationCap, Lock, CheckCircle2, UserCheck, BarChart3 } from 'lucide-react';
import FacultyWorkloadModal from '../hod/FacultyWorkloadModal';

const SEMESTERS_LIST = [
  { id: '1', label: 'Sem 1', value: 1 },
  { id: '2', label: 'Sem 2', value: 2 },
  { id: '3', label: 'Sem 3', value: 3 },
  { id: '4', label: 'Sem 4', value: 4 },
  { id: '5', label: 'Sem 5', value: 5 },
  { id: '6', label: 'Sem 6', value: 6 },
  { id: '7', label: 'Sem 7', value: 7 },
  { id: '8', label: 'Sem 8', value: 8 }
];

const SECTIONS_LIST = ['A', 'B', 'C', 'D'];

export default function ScheduleControls() {
  const { 
    selectedDepartment, setSelectedDepartment,
    selectedSemester, setSelectedSemester,
    selectedYear, setSelectedYear,
    selectedSection, setSelectedSection,
    selectedFacultyId, setSelectedFacultyId,
    viewMode, setViewMode,
    professors
  } = useTimetable();
  const { isHod, currentUser } = useAuth();
  const { isDark } = useTheme();

  const isStudent = currentUser?.userType === 'Student' && !isHod;
  const isFaculty = currentUser?.userType === 'Faculty' && !isHod;
  const [isWorkloadOpen, setIsWorkloadOpen] = useState(false);

  // Find professor object matching the logged-in faculty
  const loggedInFaculty = professors.find(
    p => p.email === currentUser?.email || p.name === currentUser?.name
  ) || professors.find(p => p.department === (currentUser?.department || 'IT'));

  // Lock selectedFacultyId to the logged-in faculty member
  useEffect(() => {
    if (isFaculty && loggedInFaculty) {
      setSelectedFacultyId(loggedInFaculty.id);
    }
  }, [isFaculty, loggedInFaculty, setSelectedFacultyId]);

  return (
    <div className={`border rounded-2xl px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors w-full shadow-sm ${
      isDark 
        ? 'bg-[#0f172a] border-[#1e293b]' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">

        {/* View Mode Switch (Class Timetable vs My Faculty Schedule) */}
        {!isStudent && (
          <>
            <div className={`flex rounded-xl p-1 border h-10 items-center ${
              isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setViewMode('student')}
                className={`h-8 px-3.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                  viewMode === 'student' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Classroom Timetables</span>
              </button>
              <button
                onClick={() => setViewMode('faculty')}
                className={`h-8 px-3.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                  viewMode === 'faculty' 
                    ? 'bg-blue-800 text-white shadow-sm' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{isFaculty ? 'My Timetable' : 'Faculty View'}</span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          </>
        )}

        {/* 1. Student Role: Locked strictly to their Department, Semester & Section */}
        {isStudent && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-semibold border ${
              isDark 
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-300' 
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Enrolled: Dept. of {currentUser?.department} • Sem {currentUser?.semester || ((currentUser?.year * 2) - 1) || 5} - Section {currentUser?.section || 'A'}</span>
            </span>
          </div>
        )}

        {/* 2. Professor Role: Locked Name & Department, views personal schedule or all classroom timetables */}
        {isFaculty && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Locked Faculty Name Badge */}
            <span className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-semibold border ${
              isDark ? 'bg-blue-950/70 border-blue-800/60 text-blue-200' : 'bg-blue-900/10 border-blue-800/30 text-blue-950'
            }`}>
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Faculty: {currentUser?.name} • Dept. of {currentUser?.department}</span>
            </span>

            {/* If viewing classroom timetables, allow switching Semester & Section within department */}
            {viewMode === 'student' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-400">Sem:</span>
                  <div className={`flex rounded-xl p-1 border h-10 items-center ${
                    isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {SEMESTERS_LIST.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSemester(s.value)}
                        className={`h-8 px-2.5 rounded-lg text-sm font-semibold transition-all ${
                          Number(selectedSemester) === s.value 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {s.value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-400">Sec:</span>
                  <div className={`flex rounded-xl p-1 border h-10 items-center ${
                    isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {SECTIONS_LIST.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSection(s)}
                        className={`h-8 px-3 rounded-lg text-sm font-semibold transition-all ${
                          selectedSection === s 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. HoD Role: Department Admin with full access across all semesters, sections, and faculty in their department */}
        {isHod && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400">Dept:</span>
              <span className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold border ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser?.department || selectedDepartment}</span>
              </span>
            </div>

            {viewMode === 'student' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-400">Sem:</span>
                  <div className={`flex rounded-xl p-1 border h-10 items-center ${
                    isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {SEMESTERS_LIST.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSemester(s.value)}
                        className={`h-8 px-2.5 rounded-lg text-sm font-semibold transition-all ${
                          Number(selectedSemester) === s.value 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {s.value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-400">Sec:</span>
                  <div className={`flex rounded-xl p-1 border h-10 items-center ${
                    isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {SECTIONS_LIST.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSection(s)}
                        className={`h-8 px-3 rounded-lg text-sm font-semibold transition-all ${
                          selectedSection === s 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {viewMode === 'faculty' && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">Instructor:</span>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className={`h-9 px-3 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {professors.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.designation})</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Faculty Workload Analyzer Trigger & Modal (DBIM Analytics Section 10.5) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsWorkloadOpen(true)}
          className={`h-10 px-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
            isDark 
              ? 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-800/60 text-blue-300' 
              : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
          }`}
          title="Analyze Weekly Faculty Teaching Workload (DBIM Section 10.5 Analytics)"
        >
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <span className="hidden sm:inline">Faculty Workload</span>
          <span className="sm:hidden">Workload</span>
        </button>
      </div>

      <FacultyWorkloadModal isOpen={isWorkloadOpen} onClose={() => setIsWorkloadOpen(false)} />
    </div>
  );
}
