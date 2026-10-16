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
import Footer from './components/common/Footer';
import CookieConsentBanner from './components/common/CookieConsentBanner';

function MainAppContent() {
  const { isEditingHodStudio } = useTimetable();
  const { isHod, currentUser } = useAuth();
  const { isLight } = useTheme();

  return (
    <>
      {!currentUser ? (
        <LoginPage />
      ) : (
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

          <Footer />

          <AlertBanner />
        </div>
      )}
      <CookieConsentBanner />
    </>
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
