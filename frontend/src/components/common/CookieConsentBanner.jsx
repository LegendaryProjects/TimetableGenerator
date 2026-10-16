import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, Settings, X, Check } from 'lucide-react';

export default function CookieConsentBanner() {
  const { isDark } = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Preference state
  const [prefs, setPrefs] = useState({
    essential: true, // Always locked to true
    performance: true,
    personalization: true
  });

  useEffect(() => {
    const consent = localStorage.getItem('dbim_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('dbim_cookie_consent', JSON.stringify({
      level: 'ALL',
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowModal(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('dbim_cookie_consent', JSON.stringify({
      level: 'ESSENTIAL',
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('dbim_cookie_consent', JSON.stringify({
      level: 'CUSTOM',
      prefs: prefs,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Bottom Sticky Banner matching Figure 40 of DBIM */}
      {showBanner && !showModal && (
        <div className={`fixed bottom-0 inset-x-0 z-40 p-4 border-t shadow-2xl backdrop-blur-md transition-all duration-300 ${
          isDark ? 'bg-[#0f172a]/95 border-[#1e293b] text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
        }`}>
          <div className="max-w-[98%] xl:max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-center md:text-left">
              <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 hidden sm:block" />
              <div>
                <span className="font-bold">Digital Personal Data Protection (DPDP Act, 2023) Notice:</span>{' '}
                <span className="text-slate-400">
                  This portal uses essential session data and performance metrics to provide seamless timetable generation and personalized accessibility controls.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleAcceptEssential}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
              >
                Accept Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal matching Figure 41 of DBIM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 transition-all ${
            isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-bold">Cookie & Privacy Preferences</h3>
                  <p className="text-[11px] text-slate-400">Compliant with Section 7.6 of DBIM Manual</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Essential Cookies */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-blue-400">
                    <span>Essential Session Cookies</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">Required</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Keeps user logged in securely and preserves department selections.</p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 rounded text-blue-600 cursor-not-allowed" />
              </div>

              {/* Performance & Cache */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="font-bold">Schedule Cache & Fast Rendering</div>
                  <p className="text-[11px] text-slate-400">Locally stores generated timetables for zero latency.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefs.performance} 
                  onChange={e => setPrefs(p => ({ ...p, performance: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer" 
                />
              </div>

              {/* Accessibility & Theme */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="font-bold">Accessibility & Theme Preferences</div>
                  <p className="text-[11px] text-slate-400">Remembers your dark/light mode and text zoom settings.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefs.personalization} 
                  onChange={e => setPrefs(p => ({ ...p, personalization: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleAcceptEssential}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
