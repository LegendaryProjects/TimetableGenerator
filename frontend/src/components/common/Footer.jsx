import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import HelpFaqModal from './HelpFaqModal';
import FeedbackModal from './FeedbackModal';
import { ExternalLink, HelpCircle, MessageSquarePlus, ShieldCheck, Calendar, Info } from 'lucide-react';

export default function Footer() {
  const { isDark } = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <footer className={`border-t transition-colors mt-auto ${
        isDark ? 'border-[#182030] bg-[#07090f] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <div className="max-w-[98%] xl:max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6 text-xs">
          
          {/* Main 4-Column Grid conforming to DBIM Table 12 & Figure 33 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            {/* Column 1: Institutional Lineage */}
            <div className="space-y-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-blue-500">AutoTTGen</span>
                <span className="text-slate-500">•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">NITK Surathkal</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Automated Zero-Overlap Academic Timetable Management System. Powered by genetic constraint scheduling algorithms.
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                Last Updated On: <strong className="text-slate-700 dark:text-slate-300">16 October 2026</strong>
              </div>
            </div>

            {/* Column 2: Government & Educational Portals (DBIM Related Links) */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-900 dark:text-slate-200">
                Institutional Links
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a href="https://www.nitk.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center gap-1 transition-colors">
                    <span>NITK Surathkal Official Portal</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a href="https://iris.nitk.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center gap-1 transition-colors">
                    <span>IRIS Student & Faculty Portal</span>
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

            {/* Column 3: Help & Citizen Support (DBIM Section 5.6) */}
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

            {/* Column 4: Standards & Compliance (DBIM Annexure F) */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-900 dark:text-slate-200">
                Compliance Standards
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Built in adherence to <strong>GIGW 3.0</strong>, <strong>DBIM Version 3 (January 2025)</strong>, and <strong>DPDP Act 2023</strong> data governance frameworks.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Gov.In Digital Brand Compliant</span>
              </div>
            </div>
          </div>

          {/* Lineage Mandatory Statement (DBIM Section 5.6, Page 35) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
            <div>
              The portal belongs to <strong>Department of Information Technology</strong>, National Institute of Technology Karnataka (NITK) Surathkal, Ministry of Education, Government of India.
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
