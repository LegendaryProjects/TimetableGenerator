import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function AlertBanner() {
  const { notification, lastConflictAlert } = useTimetable();
  const { isDark } = useTheme();
  if (!notification && !lastConflictAlert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      
      {/* Real-time Conflict Alert (Purple / Rose) */}
      {lastConflictAlert && (
        <div className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 ${
          isDark 
            ? 'bg-[#180e1e] border-purple-500/50 text-purple-200 shadow-black' 
            : 'bg-purple-50 border-purple-300 text-purple-900'
        }`}>
          <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <div className="font-extrabold mb-0.5">Constraint Overlap Collision Detected</div>
            <p className="leading-relaxed font-medium opacity-90">{lastConflictAlert}</p>
          </div>
        </div>
      )}

      {/* General Notification Toast (Emerald / Purple / Cyan) */}
      {notification && (
        <div className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 ${
          notification.type === 'success' 
            ? isDark ? 'bg-[#0a1813] border-emerald-500/50 text-emerald-200 shadow-black' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : notification.type === 'warning' 
            ? isDark ? 'bg-[#180e1e] border-purple-500/50 text-purple-200 shadow-black' : 'bg-purple-50 border-purple-300 text-purple-900'
            : isDark ? 'bg-[#0c1424] border-cyan-500/50 text-cyan-200 shadow-black' : 'bg-cyan-50 border-cyan-300 text-cyan-900'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
          <div className="text-xs sm:text-sm font-semibold leading-relaxed">
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}
