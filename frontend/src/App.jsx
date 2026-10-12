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
  const { isEditingHodStudio } = useTimetable();
  const { isHod, currentUser } = useAuth();
  const { isLight } = useTheme();

  // If unauthenticated, show the dedicated standalone LoginPage
  if (!currentUser) {
    return <LoginPage />;
  }


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

      <footer className={`border-t py-4 text-center transition-colors ${
        isLight ? 'border-slate-200 bg-white text-slate-500' : 'border-[#182030] bg-[#07090f] text-zinc-400'
      }`}>
        <div className="max-w-[98%] xl:max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 items-center gap-2.5 text-sm">
          <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
            <span className="font-bold text-blue-500 text-sm sm:text-base">AutoTTGen</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 dark:text-zinc-400">Academic Timetable Generator</span>
          </div>
          <div className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-zinc-400 text-center">
            © {new Date().getFullYear()} Sankalp, Abhishek, Ravi | All rights reserved.
          </div>
          <div className="text-sm font-medium text-slate-600 dark:text-zinc-400 text-center md:text-right">
            Dept. of IT, NITK
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
