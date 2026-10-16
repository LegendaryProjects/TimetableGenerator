import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { HelpCircle, X, ChevronRight, BookOpen, Clock, Calendar, Download } from 'lucide-react';

export default function HelpFaqModal({ isOpen, onClose }) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How are timetables generated with zero overlap?',
      a: 'The system uses an academic constraint satisfaction engine that models courses, classrooms, faculty allocations, and laboratory blocks as non-overlapping slots. It mathematically prevents faculty double-booking and room collisions.'
    },
    {
      q: 'What is the L-T-P credit rule?',
      a: 'In accordance with NITK academic regulations, Total Credits = L (Lectures) + T (Tutorials) + max(0, P - 1) (Practicals). A 3-0-2 course yields 4 credits, while a 0-0-3 lab yields 2 credits.'
    },
    {
      q: 'How does the faculty and cross-department routing work?',
      a: 'Subjects with SM prefixes are routed to HSSM faculty, CV prefixes to Civil Engineering faculty, PH to Physics, CY to Chemistry, and MA to MACS. Department faculty are also available as secondary choices.'
    },
    {
      q: 'How can I export the finalized schedule?',
      a: 'Click the "Export PDF" button in the Viewer or HoD Studio. The timetable is rendered and exported as a high-resolution, print-ready document formatted to standard academic guidelines.'
    },
    {
      q: 'Can HoDs swap slots manually?',
      a: 'Yes! In the HoD Dashboard, drag-and-drop or click two slots to perform an atomic swap. The system automatically performs live conflict validation to protect zero-collision integrity.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 transition-all max-h-[85vh] overflow-y-auto ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Frequently Asked Questions & User Help</h3>
              <p className="text-[11px] text-slate-400">DBIM Section 5.6 Institutional Help Resources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div 
              key={i} 
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-blue-500 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{f.q}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                {f.a}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
          >
            Close Help
          </button>
        </div>
      </div>
    </div>
  );
}
