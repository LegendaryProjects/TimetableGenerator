import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TimetableProvider, useTimetable } from './context/TimetableContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import AlertBanner from './components/common/AlertBanner';
import LoginPage from './components/auth/LoginPage';
import ScheduleControls from './components/viewer/ScheduleControls';
import TimetableGrid from './components/viewer/TimetableGrid';
import HodStudio from './components/hod/HodStudio';

function MainAppContent() {
  const { isEditingHodStudio, selectedDepartment, departments } = useTimetable();
  const { isHod, currentUser } = useAuth();
  const { isLight } = useTheme();

  // If unauthenticated, show the dedicated standalone LoginPage
  if (!currentUser) {
    return <LoginPage />;
  }

  // Dynamic department of the active persona/user
  const activeDeptId = currentUser?.department || selectedDepartment || 'IT';
  const deptObj = departments.find(d => d.id === activeDeptId) || { name: activeDeptId, code: activeDeptId };
  const deptDisplayName = `Dept. of ${deptObj.name}`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#080b12] text-slate-100'
    }`}>
      <Navbar />

      <main className="flex-1 max-w-[98%] xl:max-w-[1700px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-5">
        {isEditingHodStudio && isHod ? (
          <HodStudio />
        ) : (
          <div className="space-y-4">
            <ScheduleControls />
            <TimetableGrid />
          </div>
        )}
      </main>

      <footer className={`border-t py-3.5 text-center text-xs transition-colors ${
        isLight ? 'border-slate-200 bg-white text-slate-500' : 'border-[#182030] bg-[#07090f] text-zinc-500'
      }`}>
        <div className="max-w-[98%] xl:max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-500">NITK AutoTTGen</span>
            <span>•</span>
            <span>Academic Timetable Generator</span>
          </div>
          <div className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
            Made by Sankalp, Abhishek, Ravi
          </div>
          <div className="text-zinc-400 text-[11px]">
            National Institute of Technology Karnataka, Surathkal • {deptDisplayName}
          </div>
        </div>
      </footer>

      <AlertBanner />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimetableProvider>
          <MainAppContent />
        </TimetableProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
