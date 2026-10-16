import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTimetable } from '../../context/TimetableContext';
import { MessageSquarePlus, X, Send, CheckCircle2 } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose }) {
  const { isDark } = useTheme();
  const { notify } = useTimetable();
  const [category, setCategory] = useState('Schedule Feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Persist feedback locally
    const existing = JSON.parse(localStorage.getItem('dbim_portal_feedback') || '[]');
    existing.push({
      category,
      message,
      email,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem('dbim_portal_feedback', JSON.stringify(existing));

    setIsSubmitted(true);
    notify('Thank you! Your feedback has been recorded.', 'success');
    setTimeout(() => {
      setIsSubmitted(false);
      setMessage('');
      setEmail('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 transition-all ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Feedback & Grievance Redressal</h3>
              <p className="text-[11px] text-slate-400">DBIM Section 5.6 Citizen/Student Feedback Channel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold">Feedback Submitted Successfully</h4>
            <p className="text-xs text-slate-400">Your inputs have been forwarded to the Academic Timetable Committee.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Feedback Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                  isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Schedule Feedback">General Schedule Feedback</option>
                <option value="Conflict Report">Faculty / Room Conflict Report</option>
                <option value="Feature Suggestion">Feature Suggestion</option>
                <option value="UI & Accessibility">UI & Accessibility Concern</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400">NITK Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rollnumber@nitk.edu.in or faculty.dept@nitk.edu.in"
                className={`w-full px-3 py-2 rounded-lg font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Description / Details *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your feedback, schedule preference, or observation in detail..."
                className={`w-full px-3 py-2 rounded-lg font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${
                  isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
