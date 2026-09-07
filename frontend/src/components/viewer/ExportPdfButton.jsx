import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { exportTimetableAsPDF } from '../../services/pdfExport';
import { useTimetable } from '../../context/TimetableContext';

export default function ExportPdfButton({ timetable }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const { currentViewerTimetable, notify } = useTimetable();

  const activeTimetable = timetable || currentViewerTimetable;

  const handleExport = async () => {
    if (!activeTimetable) {
      notify('No active timetable found to export.', 'warning');
      return;
    }
    setExporting(true);
    try {
      await exportTimetableAsPDF(activeTimetable);
      setDone(true);
      notify('Timetable PDF downloaded successfully', 'success');
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error('PDF Export Error:', e);
      notify('Failed to generate PDF: ' + (e.message || 'Unknown error'), 'warning');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || !activeTimetable}
      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating PDF...</span>
        </>
      ) : done ? (
        <>
          <Check className="w-4 h-4 text-emerald-300" />
          <span>Downloaded</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}
