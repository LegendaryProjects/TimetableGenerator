import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Calendar, LayoutGrid, Sliders, LogOut, Sun, Moon
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, isHod, logout, formattedLoginTime, setAuthModalOpen, setAuthModalTab, setLoginType } = useAuth();
  const { isEditingHodStudio, setIsEditingHodStudio, draftTimetables } = useTimetable();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors ${
      isDark ? 'bg-[#0b0f17]/95 border-[#182030] backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'
    }`}>
      <div className="w-full px-8 sm:px-12 lg:px-20 h-20 flex items-center justify-between">

        {/* Institutional Branding */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none" 
          onClick={() => setIsEditingHodStudio(false)}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-base tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                NITK AutoTTGen
              </span>
            </div>
            <p className={`text-[11px] hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Academic Timetable System
            </p>
          </div>
        </div>

        {/* Navigation Switcher */}
        <div className={`flex items-center rounded-lg p-0.5 border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setIsEditingHodStudio(false)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              !isEditingHodStudio 
                ? 'bg-blue-600 text-white shadow-sm' 
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Timetable</span>
          </button>
          {isHod && (
            <button
              onClick={() => setIsEditingHodStudio(true)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isEditingHodStudio 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>HoD Studio</span>
              {draftTimetables.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-blue-500 text-white font-bold">
                  {draftTimetables.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Section: Theme Toggle & User Account */}
        <div className="flex items-center gap-3">
          {currentUser && formattedLoginTime && (
            <span className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
              isDark ? 'bg-blue-950/60 border-blue-900/50 text-blue-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`} title="Last logged in timestamp">
              Last login: {formattedLoginTime}
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${
              isDark 
                ? 'bg-[#0f172a] hover:bg-[#1e293b] border-[#1e293b] text-slate-300' 
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-blue-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Account / Profile */}
          {currentUser ? (
            <div className={`flex items-center gap-2.5 pl-3 border-l ${isDark ? 'border-[#1e293b]' : 'border-slate-200'}`}>
              <div className="text-right hidden sm:block">
                <div>
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    isHod
                      ? 'bg-blue-950/90 text-blue-200 border border-blue-800'
                      : 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                  }`}>
                    {isHod ? 'HoD' : (currentUser.userType || 'Student')}
                  </span>
                  <span>• {currentUser.department}</span>
                </div>
              </div>
              <button 
                onClick={logout} 
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark 
                    ? 'border-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`} 
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setLoginType('GENERAL'); setAuthModalTab('login'); setAuthModalOpen(true); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  isDark ? 'bg-[#0f172a] hover:bg-[#1e293b] border-[#1e293b] text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
