import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { User } from 'lucide-react';

export default function TimetableSlot({ 
  slot, 
  day, 
  slotInfo, 
  isInteractive = false, 
  isSelected = false, 
  isSwapTarget = false, 
  isInvalidTarget = false, 
  onClick 
}) {
  const { isDark } = useTheme();

  const slotId = typeof slotInfo === 'object' && slotInfo !== null ? slotInfo.id : slotInfo;
  const isPeriod1 = slotId === 1 || slotId === '1';

  if (!slot) {
    return (
      <div
        onClick={isInvalidTarget || isPeriod1 ? undefined : onClick}
        className={`min-h-[105px] h-full w-full rounded-xl border flex flex-col items-center justify-center text-xs sm:text-sm font-medium transition-colors select-none ${
          isPeriod1
            ? isDark
              ? 'border-slate-800/80 bg-slate-900/40 text-slate-500 cursor-not-allowed'
              : 'border-slate-200/80 bg-slate-100/50 text-slate-400 cursor-not-allowed'
            : isInteractive
            ? isInvalidTarget
              ? isDark
                ? 'border-rose-500/80 bg-rose-950/30 text-rose-400 cursor-not-allowed ring-1 ring-rose-500/40'
                : 'border-rose-400 bg-rose-50 text-rose-600 cursor-not-allowed ring-1 ring-rose-400'
              : isSwapTarget
              ? isDark
                ? 'border-emerald-500 bg-emerald-950/30 cursor-pointer text-emerald-300 ring-2 ring-emerald-500/50'
                : 'border-emerald-500 bg-emerald-50 cursor-pointer text-emerald-700 ring-2 ring-emerald-500/50'
              : isDark 
                ? 'border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 cursor-pointer text-slate-500 hover:text-blue-300' 
                : 'border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer text-slate-400 hover:text-blue-600'
            : isDark ? 'border-dashed border-slate-800/60 bg-slate-900/20 text-slate-600' : 'border-dashed border-slate-100 bg-slate-50/40 text-slate-300'
        }`}
        title={isPeriod1 ? 'Institutional Policy: Classes from 08:00 - 09:00 AM are prohibited' : isInvalidTarget ? 'Cannot swap here: conflict detected' : undefined}
      >
        <span className={`text-xs sm:text-sm tracking-wide font-mono ${
          isPeriod1 ? 'text-slate-500 font-medium text-xs' : isInvalidTarget ? 'text-rose-400 font-semibold' : isSwapTarget ? (isDark ? 'text-emerald-300 font-semibold' : 'text-emerald-700 font-semibold') : ''
        }`}>
          {isPeriod1
            ? '—'
            : isInteractive
            ? (isInvalidTarget ? 'Blocked' : isSwapTarget ? 'Drop Slot' : 'Available')
            : '—'}
        </span>
      </div>
    );
  }

  const isLab = slot.type === 'lab' || slot.isLab;

  return (
    <div
      onClick={isInvalidTarget ? undefined : onClick}
      className={`min-h-[105px] h-full w-full p-3 rounded-xl border flex flex-col justify-between overflow-hidden transition-all select-none shadow-sm ${
        isSelected
          ? 'border-blue-500 bg-blue-600/20 ring-2 ring-blue-500/50 shadow-md'
          : isInvalidTarget
          ? isDark
            ? 'border-rose-500 bg-rose-950/40 text-rose-200 ring-2 ring-rose-500/60 cursor-not-allowed'
            : 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-400 cursor-not-allowed'
          : isSwapTarget
          ? isDark
            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200 ring-2 ring-emerald-500/60 cursor-pointer'
            : 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/50 cursor-pointer'
          : isLab
          ? isDark 
            ? 'border-slate-800 border-l-4 border-l-blue-400 bg-[#0c1322] hover:bg-[#121c32]'
            : 'border-slate-200 border-l-4 border-l-blue-500 bg-blue-50/40 hover:bg-blue-50 text-slate-900'
          : isDark
            ? 'border-slate-800 border-l-4 border-l-blue-500 bg-[#0f172a] hover:bg-[#172238]'
            : 'border-slate-200 border-l-4 border-l-blue-600 bg-blue-50/50 hover:bg-blue-50 text-slate-900'
      } ${isInteractive && !isInvalidTarget ? 'cursor-pointer' : ''}`}
      title={isInvalidTarget ? 'Cannot swap with this slot: conflict detected' : undefined}
    >
      {/* Course Code */}
      <div className="flex items-center justify-between">
        <span className={`font-mono text-sm sm:text-base font-black tracking-wide truncate ${
          isInvalidTarget
            ? 'text-rose-400'
            : isSwapTarget
            ? isDark ? 'text-emerald-300' : 'text-emerald-700'
            : isLab 
            ? isDark ? 'text-blue-300' : 'text-blue-700' 
            : isDark ? 'text-blue-400' : 'text-blue-700'
        }`}>
          {slot.subjectCode}
        </span>
        {isLab && slot.roomName && (
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ml-1 shrink-0 ${
            isDark ? 'bg-blue-950/70 text-blue-300 border-blue-800/50' : 'bg-blue-100 text-blue-800 border-blue-300'
          }`}>
            {slot.roomName}
          </span>
        )}
      </div>

      {/* Course Name */}
      <div className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] overflow-hidden my-0.5 ${
        isInvalidTarget
          ? 'text-rose-300'
          : isSwapTarget
          ? isDark ? 'text-emerald-200' : 'text-emerald-900'
          : isDark ? 'text-slate-100' : 'text-slate-800'
      }`}>
        {slot.subjectName}
      </div>

      {/* Faculty Name */}
      <div className={`pt-1.5 border-t flex items-center gap-1.5 text-xs font-medium truncate ${
        isInvalidTarget
          ? 'border-rose-800/60 text-rose-300'
          : isSwapTarget
          ? isDark ? 'border-emerald-800/60 text-emerald-300' : 'border-emerald-200 text-emerald-700'
          : isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-200/80 text-slate-600'
      }`}>
        <User className={`w-3.5 h-3.5 shrink-0 ${
          isInvalidTarget ? 'text-rose-400' : isSwapTarget ? 'text-emerald-400' : 'text-slate-400'
        }`} />
        <span className="truncate">{slot.facultyName}</span>
      </div>
    </div>
  );
}
