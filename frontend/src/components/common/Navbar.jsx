import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Calendar, LayoutGrid, Sliders, LogOut, Sun, Moon, Search, Eye
} from 'lucide-react';
import GlobalSearchModal from './GlobalSearchModal';
import AccessibilityModal from './AccessibilityModal';

export default function Navbar() {
  const { currentUser, isHod, logout, formattedLoginTime, setAuthModalOpen, setAuthModalTab, setLoginType } = useAuth();
  const { isEditingHodStudio, setIsEditingHodStudio, draftTimetables } = useTimetable();
  const { isDark, toggleTheme } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut listener (restricted strictly to HoD)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (!isHod) return;
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHod]);

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
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                AutoTTGen
              </span>
            </div>
            <p className={`text-xs hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Dept. of IT, NITK • Academic Timetable Generator
            </p>
          </div>
        </div>

        {/* Navigation Switcher */}
        <div className={`flex items-center rounded-xl p-1 border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setIsEditingHodStudio(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              !isEditingHodStudio 
                ? 'bg-blue-600 text-white shadow-sm' 
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Timetable</span>
          </button>
          {isHod && (
            <button
              onClick={() => setIsEditingHodStudio(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                isEditingHodStudio 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>HoD Dashboard</span>
              {draftTimetables.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[11px] bg-blue-500 text-white font-bold">
                  {draftTimetables.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Section: Theme Toggle & User Account */}
        <div className="flex items-center gap-3.5">
          {currentUser && formattedLoginTime && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
              isDark ? 'bg-blue-950/60 border-blue-900/50 text-blue-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`} title="Last logged in timestamp">
              Last login: {formattedLoginTime}
            </span>
          )}

          {/* Departmental Search Button (Ctrl+K) - Strictly for HoD only */}
          {isHod && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isDark 
                  ? 'bg-[#0f172a] hover:bg-[#1e293b] border-[#1e293b] text-slate-300' 
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
              }`}
              title="Department Timetable Search (Ctrl + K)"
              aria-label="Department Search"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span>Search...</span>
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-600'
              }`}>
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Accessibility Settings (DBIM Fig 44) */}
          <button
            onClick={() => setIsAccessibilityOpen(true)}
            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
              isDark 
                ? 'bg-[#0f172a] hover:bg-[#1e293b] border-[#1e293b] text-blue-400' 
                : 'bg-white hover:bg-slate-100 border-slate-200 text-blue-600'
            }`}
            title="Accessibility Controls (GIGW 3.0 & DBIM Section 8)"
            aria-label="Accessibility Options"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
              isDark 
                ? 'bg-[#0f172a] hover:bg-[#1e293b] border-[#1e293b] text-orange-500' 
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun 
                className="w-4 h-4 text-orange-500" 
                color="#f97316" 
                stroke="#f97316" 
                style={{ color: '#f97316', stroke: '#f97316' }} 
              />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Account / Profile */}
          {currentUser ? (
            <div className={`flex items-center gap-3 pl-3.5 border-l ${isDark ? 'border-[#1e293b]' : 'border-slate-200'}`}>
              <div className="text-right hidden sm:block">
                <div>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser.name}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase ${
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
                className={`p-2 rounded-lg border transition-colors ${
                  isDark 
                    ? 'border-[#1e293b] text-slate-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10' 
                    : 'border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50'
                }`} 
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 transition-colors" />
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

      {/* Accessibility Modal (Universal) and Department Search Modal (HoD Only) */}
      {isHod && <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
    </header>
  );
}
