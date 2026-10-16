import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Eye, ZoomIn, ZoomOut, RotateCcw, Link2, Sparkles, X, Contrast, SunMedium
} from 'lucide-react';

export default function AccessibilityModal({ isOpen, onClose }) {
  const { 
    isDark,
    fontSize, 
    setFontSize, 
    isHighContrast, 
    setIsHighContrast, 
    isInverted, 
    setIsInverted, 
    highlightLinks, 
    setHighlightLinks,
    resetAccessibility,
    toggleTheme
  } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 transition-all ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Header compliant with DBIM Section 8 (Figure 44) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Accessibility Controls</h3>
              <p className="text-[11px] text-slate-400">GIGW 3.0 & DBIM Section 8 Compliant Options</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Grid Options as specified in Figure 44 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* 1. Theme / Dark Contrast */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDark 
                ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Contrast className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Dark / Light Mode</span>
            <span className="text-[10px] text-slate-400">{isDark ? 'Active: Dark' : 'Active: Light'}</span>
          </button>

          {/* 2. Color Invert */}
          <button
            type="button"
            onClick={() => setIsInverted(p => !p)}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isInverted 
                ? 'bg-blue-600 border-blue-500 text-white' 
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Invert Colors</span>
            <span className="text-[10px] text-slate-400">{isInverted ? 'Enabled' : 'Disabled'}</span>
          </button>

          {/* 3. Text Size Increase (A+) */}
          <button
            type="button"
            onClick={() => setFontSize(prev => (prev === 'normal' ? 'large' : 'xlarge'))}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              fontSize !== 'normal' 
                ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400' 
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ZoomIn className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Text Size (A+)</span>
            <span className="text-[10px] text-slate-400">{fontSize === 'normal' ? 'Standard' : fontSize === 'large' ? '+10% Zoom' : '+22% Zoom'}</span>
          </button>

          {/* 4. Text Size Reset / Decrease (A-) */}
          <button
            type="button"
            onClick={() => setFontSize('normal')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              fontSize === 'normal' 
                ? isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-300 bg-slate-100'
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ZoomOut className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Text Reset (A)</span>
            <span className="text-[10px] text-slate-400">Default Size</span>
          </button>

          {/* 5. Highlight Interactive Links */}
          <button
            type="button"
            onClick={() => setHighlightLinks(p => !p)}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              highlightLinks 
                ? 'bg-amber-600 border-amber-500 text-white' 
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Link2 className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Highlight Links</span>
            <span className="text-[10px] text-slate-400">{highlightLinks ? 'Outlined' : 'Standard'}</span>
          </button>

          {/* 6. High Contrast */}
          <button
            type="button"
            onClick={() => setIsHighContrast(p => !p)}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isHighContrast 
                ? 'bg-blue-600 border-blue-500 text-white' 
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SunMedium className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">High Contrast</span>
            <span className="text-[10px] text-slate-400">{isHighContrast ? 'Max (135%)' : 'Standard'}</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={resetAccessibility}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
