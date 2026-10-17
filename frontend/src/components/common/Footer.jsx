import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import HelpFaqModal from './HelpFaqModal';
import FeedbackModal from './FeedbackModal';
import { ExternalLink, HelpCircle, MessageSquarePlus } from 'lucide-react';

export default function Footer() {
  const { isDark } = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <footer className={`border-t transition-colors mt-auto ${
        isDark ? 'border-[#182030] bg-[#07090f] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <div className="max-w-[98%] xl:max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-7 space-y-5 text-xs">
          
          {/* Main 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5 border-b border-slate-200 dark:border-slate-800">
            {/* Column 1: Branding */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-blue-500">AutoTTGen</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Last Updated On: <strong className="text-slate-700 dark:text-slate-300">17 October 2026</strong>
              </div>
            </div>

            {/* Column 2: Institutional Links */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-900 dark:text-slate-200">
                Institutional Links
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a href="https://www.nitk.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center gap-1 transition-colors">
                    <span>NITK Official Portal</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a href="https://iris.nitk.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center gap-1 transition-colors">
                    <span>IRIS Portal</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a href="https://swayam.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center gap-1 transition-colors">
                    <span>SWAYAM / NPTEL MOOCs</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Help & Governance */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-900 dark:text-slate-200">
                Help & Governance
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button 
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="hover:text-blue-500 flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                  >
                    <HelpCircle className="w-3 h-3 text-blue-500" />
                    <span>Frequently Asked Questions (FAQ)</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setIsFeedbackOpen(true)}
                    className="hover:text-blue-500 flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                  >
                    <MessageSquarePlus className="w-3 h-3 text-emerald-500" />
                    <span>Submit Schedule Feedback / Grievance</span>
                  </button>
                </li>
                <li className="text-slate-400 text-[11px]">
                  Academic Audit: Zero-Collision Integrity Active
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Line: Just NITK and Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
            <div className="font-medium text-slate-600 dark:text-slate-400">
              NITK
            </div>
            <div className="shrink-0">
              © {new Date().getFullYear()} Sankalp, Abhishek, Ravi • All Rights Reserved
            </div>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <HelpFaqModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}
