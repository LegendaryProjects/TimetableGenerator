/**
 * PDF Notice-Board Export Service for NITK AutoTTGen
 * Generates institutional landscape A4 PDFs conforming exactly to the official NITK Surathkal notice-board layout.
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Renders a single official NITK Notice-Board timetable sheet onto the given jsPDF document.
 */
function renderNoticeBoardPage(doc, timetable, academicOptions = {}, pageNum = 1, totalPages = 1) {
  const DAYS = academicOptions.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 11;
  const contentWidth = pageWidth - (margin * 2); // 275mm

  let currentY = margin;

  // --- Header Meta Line: Dynamic Date of Download (DD-MM-YYYY) ---
  const now = new Date();
  const dStr = String(now.getDate()).padStart(2, '0');
  const mStr = String(now.getMonth() + 1).padStart(2, '0');
  const yStr = now.getFullYear();
  const downloadDateStr = `${dStr}-${mStr}-${yStr}`;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(downloadDateStr, pageWidth - margin, currentY, { align: 'right' });
  currentY += 2.0;

  // --- Institutional Title Box (3 BORDERED ROWS) ---
  let deptFullName = timetable.departmentName || (
    academicOptions.departments?.find(d => d.id === timetable.department)?.name || timetable.department
  );

  // Special case: in PDF export, show Department of Information Technology instead of Department of AI
  const isAiDept = timetable.department === 'AI' ||
    deptFullName === 'AI' ||
    (typeof deptFullName === 'string' && (
      deptFullName.toLowerCase().includes('artificial intelligence') ||
      deptFullName.toLowerCase().includes('department of ai')
    ));

  if (isAiDept) {
    deptFullName = 'Information Technology';
  }

  const deptCode = isAiDept ? 'IT' : (timetable.department || 'IT');

  const semNum = Number(timetable.semester || (timetable.year ? (timetable.year * 2 - 1) : 5));
  const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const semRoman = romanNumerals[semNum] || String(semNum);
  const semSuffix = semNum === 1 ? 'st' : semNum === 2 ? 'nd' : semNum === 3 ? 'rd' : 'th';
  const semTerm = (semNum % 2 === 1) ? 'ODD' : 'EVEN';
  const semStr = `${semRoman}${semSuffix} Semester B.Tech.(${deptCode}) (Sec ${timetable.section || 'A'}) Time Table for ${semTerm} Semester of the Academic Year 2026 - 2027`;

  doc.autoTable({
    head: [
      [{ content: `Department of ${deptFullName}`, styles: { halign: 'center', fontStyle: 'bold', fontSize: 10.5, font: 'times' } }],
      [{ content: 'National Institute of Technology Karnataka Surathkal-575025', styles: { halign: 'center', fontStyle: 'bold', fontSize: 10.0, font: 'times' } }],
      [{ content: semStr, styles: { halign: 'center', fontStyle: 'bold', fontSize: 9.5, font: 'times' } }]
    ],
    body: [],
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      cellPadding: 1.5,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [255, 255, 255]
    }
  });

  currentY = doc.lastAutoTable.finalY + 1.2;

  const shortDayNames = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thur',
    'Friday': 'Fri'
  };

  // Periods 1 to 4: 8:00-8:45, 9:00-9:45, 10:00-10:45, 11:00-11:45
  // Lunch Break: 11:45-13:00 (Column 5)
  // Periods 5 to 10: 13:00-13:45, 14:00-14:45, 15:00-15:45, 16:00-16:45, 17:00-17:45, 18:00-18:45

  const gridRows = DAYS.map((day, dayIdx) => {
    const row = [
      { 
        content: shortDayNames[day] || day.slice(0, 3), 
        styles: { fontStyle: 'bold', halign: 'center', font: 'times', fontSize: 9.2 } 
      }
    ];

    // Periods 1 to 4 (8:00 to 11:45)
    let p = 1;
    while (p <= 4) {
      const slot = timetable.grid?.[day]?.[p];
      if (!slot) {
        row.push({ content: '', styles: { halign: 'center', font: 'times', fontSize: 9.0 } });
        p++;
        continue;
      }

      const isLab = slot.isLab || slot.type === 'lab';
      if (isLab) {
        let span = 1;
        while (p + span <= 4) {
          const nextSlot = timetable.grid?.[day]?.[p + span];
          if (nextSlot && (nextSlot.isLab || nextSlot.type === 'lab') && nextSlot.subjectCode === slot.subjectCode) {
            span++;
          } else {
            break;
          }
        }

        row.push({
          content: slot.roomName ? `${slot.subjectCode} Lab (${slot.roomName})` : `${slot.subjectCode} Lab`,
          colSpan: span,
          styles: {
            fillColor: [200, 247, 197],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            font: 'times',
            fontSize: 9.0,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.35
          }
        });
        p += span;
      } else {
        row.push({
          content: slot.subjectCode,
          styles: {
            halign: 'center',
            valign: 'middle',
            fontStyle: 'bold',
            font: 'times',
            fontSize: 9.0,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.35
          }
        });
        p++;
      }
    }

    // Column 5: LUNCH BREAK (11:45 to 13:00)
    row.push({
      content: dayIdx === 2 ? 'Lunch Break' : '',
      styles: {
        fillColor: [219, 234, 254], // Soft Blue (#dbeafe)
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold',
        font: 'times',
        fontSize: 8.5,
        textColor: [0, 0, 0],
        lineWidth: {
          top: dayIdx === 0 ? 0.35 : 0,
          bottom: dayIdx === 4 ? 0.35 : 0,
          left: 0.35,
          right: 0.35
        },
        lineColor: [0, 0, 0]
      }
    });

    // Periods 5 to 10 (13:00 to 18:45)
    p = 5;
    while (p <= 10) {
      const slot = timetable.grid?.[day]?.[p];
      if (!slot) {
        row.push({ content: '', styles: { halign: 'center', font: 'times', fontSize: 9.0 } });
        p++;
        continue;
      }

      const isLab = slot.isLab || slot.type === 'lab';
      if (isLab) {
        let span = 1;
        while (p + span <= 10) {
          const nextSlot = timetable.grid?.[day]?.[p + span];
          if (nextSlot && (nextSlot.isLab || nextSlot.type === 'lab') && nextSlot.subjectCode === slot.subjectCode) {
            span++;
          } else {
            break;
          }
        }

        row.push({
          content: slot.roomName ? `${slot.subjectCode} Lab (${slot.roomName})` : `${slot.subjectCode} Lab`,
          colSpan: span,
          styles: {
            fillColor: [200, 247, 197],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            font: 'times',
            fontSize: 9.0,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.35
          }
        });
        p += span;
      } else {
        row.push({
          content: slot.subjectCode,
          styles: {
            halign: 'center',
            valign: 'middle',
            fontStyle: 'bold',
            font: 'times',
            fontSize: 9.0,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.35
          }
        });
        p++;
      }
    }

    return row;
  });

  doc.autoTable({
    head: [
      [
        { content: 'Time&Day', rowSpan: 2, styles: { valign: 'middle', halign: 'center', font: 'times', fontStyle: 'bold', fontSize: 9.0 } },
        '1', '2', '3', '4', 'Lunch Break', '5', '6', '7', '8', '9', '10'
      ],
      [
        '8:00-8:45', '9:00-9:45', '10:00-10:45', '11:00-11:45', '11:45-13:00', '13:00-13:45', '14:00-14:45', '15:00-15:45', '16:00-16:45', '17:00-17:45', '18:00-18:45'
      ]
    ],
    body: gridRows,
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 9.0,
      font: 'times',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1.6,
      minCellHeight: 7.2
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8.5,
      font: 'times',
      lineColor: [0, 0, 0],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 16.5, halign: 'center' },
      1: { cellWidth: 23.5 },
      2: { cellWidth: 23.5 },
      3: { cellWidth: 23.5 },
      4: { cellWidth: 23.5 },
      5: { cellWidth: 23.5 }, // Lunch Break (11:45 to 13:00)
      6: { cellWidth: 23.5 },
      7: { cellWidth: 23.5 },
      8: { cellWidth: 23.5 },
      9: { cellWidth: 23.5 },
      10: { cellWidth: 23.5 },
      11: { cellWidth: 23.5 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 1.2;

  // --- Location Allocation Box (2 DISTINCT ROWS: Class Room & Laboratory) ---
  const locationHeight = 12.0;
  const rowH = locationHeight / 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);

  doc.rect(margin, currentY, contentWidth, locationHeight);

  // 1 internal horizontal divider splitting into 2 equal rows
  doc.line(margin, currentY + rowH, pageWidth - margin, currentY + rowH);

  const classroomName = timetable.assignedClassroom || 'CR 2.2, LHC-D, NITK, Surathkal';

  // Extract assigned labs from grid and timetable data
  const labNamesSet = new Set();
  if (timetable.assignedLabs && Array.isArray(timetable.assignedLabs)) {
    timetable.assignedLabs.forEach(l => {
      if (l) labNamesSet.add(typeof l === 'string' ? l : (l.code || l.name || l.id));
    });
  }
  if (timetable.grid) {
    Object.values(timetable.grid).forEach(day => {
      if (day) {
        Object.values(day).forEach(cell => {
          if (cell && (cell.isLab || cell.type === 'lab') && cell.roomName) {
            labNamesSet.add(cell.roomName);
          }
        });
      }
    });
  }
  const labNamesArray = Array.from(labNamesSet).filter(Boolean);
  const labsList = labNamesArray.length > 0
    ? `${labNamesArray.join(' & ')}, NITK Surathkal`
    : 'UG-IT-1, NITK Surathkal';

  doc.setFont('times', 'bold');
  doc.setFontSize(9.0);
  doc.setTextColor(0, 0, 0);

  // Row 1: Classroom
  doc.text(`Class Room: ${classroomName}`, margin + 2.5, currentY + 4.0);

  // Row 2: Laboratory
  doc.text(`Laboratory: ${labsList}`, margin + 2.5, currentY + rowH + 4.0);

  currentY += locationHeight + 2.5;

  // --- Official 7-Column Course & Faculty Roster ---
  // Columns: Sl. No | Course Code | Course Name | (L-T-P) | Credits | Faculty Name | Course Instructor
  const subjectsMap = {};
  const subjectsList = Array.isArray(academicOptions.subjects) ? academicOptions.subjects : [];

  const findSubject = (code, name) => {
    if (!code && !name) return null;
    const cleanCode = code ? String(code).trim().toLowerCase() : '';
    const cleanName = name ? String(name).trim().toLowerCase() : '';
    return subjectsList.find(s => {
      const sCode = s.code ? String(s.code).trim().toLowerCase() : '';
      const sId = s.id ? String(s.id).trim().toLowerCase() : '';
      const sName = s.name ? String(s.name).trim().toLowerCase() : '';
      return (cleanCode && (sCode === cleanCode || sId === cleanCode)) ||
             (cleanName && sName === cleanName);
    });
  };

  DAYS.forEach(day => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(p => {
      const slot = timetable.grid?.[day]?.[p];
      if (slot && slot.subjectCode) {
        if (!subjectsMap[slot.subjectCode]) {
          const matchedSubj = findSubject(slot.subjectCode, slot.subjectName || slot.title);
          const isLab = slot.isLab || slot.type === 'lab' || matchedSubj?.type === 'lab';
          const courseCredits = slot.credits || matchedSubj?.credits || (isLab ? 2 : 3);

          // Resolve LTP
          let courseLtp = null;
          if (matchedSubj && matchedSubj.ltp) {
            courseLtp = String(matchedSubj.ltp).trim();
          } else if (slot.ltp && slot.ltp !== '(3-0-2)') {
            courseLtp = String(slot.ltp).trim();
          } else if (slot.ltp && !isLab && courseCredits === 4) {
            courseLtp = String(slot.ltp).trim();
          }

          if (!courseLtp) {
            if (isLab) {
              courseLtp = courseCredits <= 1 ? '(0-0-2)' : '(0-0-3)';
            } else {
              courseLtp = `(${courseCredits}-0-0)`;
            }
          }

          if (!courseLtp.startsWith('(')) {
            courseLtp = `(${courseLtp})`;
          }

          if (courseLtp === '(3-0-2)' && (courseCredits === 3 || isLab)) {
            courseLtp = isLab ? '(0-0-3)' : '(3-0-0)';
          }

          const courseName = slot.subjectName || matchedSubj?.name || slot.title || slot.subjectCode;
          const courseFaculty = slot.facultyName || slot.faculty || matchedSubj?.facultyName || 'Course Instructor';

          subjectsMap[slot.subjectCode] = {
            code: slot.subjectCode,
            name: courseName,
            ltp: courseLtp,
            credits: courseCredits,
            faculty: courseFaculty
          };
        }
      }
    });
  });

  let index = 1;
  const rosterRows = Object.values(subjectsMap).map(s => [
    String(index++),
    s.code,
    s.name,
    s.ltp,
    String(s.credits),
    s.faculty,
    'Course Instructor'
  ]);

  doc.autoTable({
    head: [
      [
        { content: 'Sl. No', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'Course Code', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'Course Name', styles: { halign: 'left', fontStyle: 'bold' } },
        { content: '(L-T-P)', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'Credits', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'Faculty Name', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'Course Instructor', styles: { halign: 'center', fontStyle: 'bold' } }
      ]
    ],
    body: rosterRows,
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      font: 'times',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      cellPadding: 1.3
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      font: 'times',
      fontSize: 8.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.35
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 85, halign: 'left' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 62, halign: 'center' },
      6: { cellWidth: 50, halign: 'center' }
    }
  });

  // --- Signatures Footer Block (Sd/- Time Table In-charge & Sd/- HoD) ---
  const sigY = pageHeight - 12.0;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);

  // Left Signature: Time Table In-charge
  doc.text('Sd/-', margin + 15, sigY - 4.5);
  doc.text('Time Table In-charge', margin + 15, sigY);

  // Right Signature: HoD
  doc.text('Sd/-', pageWidth - margin - 25, sigY - 4.5, { align: 'center' });
  doc.text('HoD', pageWidth - margin - 25, sigY, { align: 'center' });

  // If part of multi-page batch export, render sheet indicator at bottom center
  if (totalPages > 1) {
    doc.setFont('times', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Sheet ${pageNum} of ${totalPages} • NITK Surathkal Batch Export`,
      pageWidth / 2,
      pageHeight - 5.5,
      { align: 'center' }
    );
  }
}

/**
 * Feature 1 (Single): Exports a single timetable notice-board sheet.
 */
export async function exportNoticeBoardPdf(timetable, academicOptions = {}) {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    renderNoticeBoardPage(doc, timetable, academicOptions, 1, 1);

    let deptFullName = timetable.departmentName || (
      academicOptions.departments?.find(d => d.id === timetable.department)?.name || timetable.department
    );
    const isAiDept = timetable.department === 'AI' ||
      deptFullName === 'AI' ||
      (typeof deptFullName === 'string' && (
        deptFullName.toLowerCase().includes('artificial intelligence') ||
        deptFullName.toLowerCase().includes('department of ai')
      ));
    const deptCode = isAiDept ? 'IT' : (timetable.department || 'IT');

    const filename = `NITK_${deptCode}_Sem${timetable.semester || timetable.year}_Sec${timetable.section}_Timetable.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Single Timetable PDF Generation Error:', error);
    throw error;
  }
}

export const exportTimetableAsPDF = exportNoticeBoardPdf;

/**
 * Feature 1 (Batch): Exports all generated timetables as a unified multi-page institutional PDF.
 */
export async function exportAllTimetablesAsPDF(timetablesList, academicOptions = {}) {
  try {
    if (!Array.isArray(timetablesList) || timetablesList.length === 0) {
      throw new Error('No generated timetables available to export.');
    }

    // Sort timetables logically: Department, Semester, Section
    const sorted = [...timetablesList].sort((a, b) => {
      const deptA = a.department || '';
      const deptB = b.department || '';
      if (deptA !== deptB) return deptA.localeCompare(deptB);

      const semA = Number(a.semester || (a.year ? a.year * 2 - 1 : 1));
      const semB = Number(b.semester || (b.year ? b.year * 2 - 1 : 1));
      if (semA !== semB) return semA - semB;

      return String(a.section || 'A').localeCompare(String(b.section || 'A'));
    });

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const targetDept = academicOptions.department || sorted[0]?.department || 'IT';
    const deptCode = targetDept === 'AI' ? 'IT' : targetDept;

    const now = new Date();
    const dStr = String(now.getDate()).padStart(2, '0');
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const yStr = now.getFullYear();
    const downloadDateStr = `${dStr}-${mStr}-${yStr}`;

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        doc.addPage('a4', 'landscape');
      }
      renderNoticeBoardPage(doc, sorted[i], academicOptions, i + 1, sorted.length);
    }

    const filename = `NITK_${deptCode}_All_Timetables_${downloadDateStr}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Batch Timetables PDF Export Error:', error);
    throw error;
  }
}

/**
 * Feature 2: Exports a formal Course Curriculum & Faculty Allocation Roster PDF.
 * Maps every course, credits, LTP, type, and assigned faculty/instructor across all cohorts.
 */
export async function exportCourseFacultyRosterPdf(academicOptions = {}) {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 11;
    const contentWidth = pageWidth - (margin * 2); // 275mm

    const dept = academicOptions.department || 'IT';
    let deptFullName = academicOptions.departments?.find(d => d.id === dept)?.name || dept;
    if (dept === 'AI' || deptFullName === 'AI' || (typeof deptFullName === 'string' && deptFullName.toLowerCase().includes('artificial intelligence'))) {
      deptFullName = 'Information Technology';
    }
    const deptCode = (dept === 'AI') ? 'IT' : dept;

    const now = new Date();
    const dStr = String(now.getDate()).padStart(2, '0');
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const yStr = now.getFullYear();
    const downloadDateStr = `${dStr}-${mStr}-${yStr}`;

    let currentY = margin;

    // Meta Header Date
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(downloadDateStr, pageWidth - margin, currentY, { align: 'right' });
    currentY += 2.0;

    // Header Box (3 bordered rows matching NITK standard notice format)
    doc.autoTable({
      head: [
        [{ content: `Department of ${deptFullName}`, styles: { halign: 'center', fontStyle: 'bold', fontSize: 11, font: 'times' } }],
        [{ content: 'National Institute of Technology Karnataka Surathkal-575025', styles: { halign: 'center', fontStyle: 'bold', fontSize: 10, font: 'times' } }],
        [{ content: `Course-Professor Allocation Roster - Academic Year 2026 - 2027`, styles: { halign: 'center', fontStyle: 'bold', fontSize: 9.5, font: 'times' } }]
      ],
      body: [],
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.35,
        cellPadding: 1.5,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [255, 255, 255]
      }
    });

    currentY = doc.lastAutoTable.finalY + 1.5;

    // Filter active generated timetables
    const timetablesList = Array.isArray(academicOptions.timetables) 
      ? academicOptions.timetables.filter(t => !dept || t.department === dept || dept === 'ALL') 
      : [];

    if (timetablesList.length === 0) {
      throw new Error(`No generated timetables found for ${deptFullName}. Please generate timetables first to view the Course-Professor roster.`);
    }

    const subjectsList = Array.isArray(academicOptions.subjects) ? academicOptions.subjects : [];
    const courseMap = new Map();

    const findSubjectMeta = (code, name) => {
      const cleanCode = (code || '').trim().toLowerCase();
      const cleanName = (name || '').trim().toLowerCase();
      return subjectsList.find(s => {
        const sCode = (s.code || s.id || '').trim().toLowerCase();
        const sName = (s.name || '').trim().toLowerCase();
        return (cleanCode && sCode === cleanCode) || (cleanName && sName === cleanName);
      });
    };

    // Extract subjects and assigned professors ONLY from active generated timetables
    timetablesList.forEach(tt => {
      const sem = Number(tt.semester || (tt.year ? (tt.year * 2 - 1) : 5));
      const sec = tt.section || 'A';
      const cohortKey = `Sem ${sem} Sec ${sec}`;

      if (tt.grid) {
        Object.values(tt.grid).forEach(daySlots => {
          if (!daySlots) return;
          Object.values(daySlots).forEach(cell => {
            if (!cell || !cell.subjectCode) return;
            const code = cell.subjectCode.trim().toUpperCase();
            const matchedMeta = findSubjectMeta(cell.subjectCode, cell.subjectName || cell.title);

            let entry = courseMap.get(code);
            if (!entry) {
              const isLab = cell.isLab || cell.type === 'lab' || matchedMeta?.type === 'lab';
              let ltp = cell.ltp || matchedMeta?.ltp;
              if (ltp) {
                ltp = String(ltp).trim();
                if (!ltp.startsWith('(')) ltp = `(${ltp})`;
              } else {
                ltp = isLab ? '(0-0-3)' : `(${cell.credits || matchedMeta?.credits || 3}-0-0)`;
              }

              const credits = cell.credits || matchedMeta?.credits || (isLab ? 2 : 3);
              const courseName = cell.subjectName || matchedMeta?.name || cell.title || code;

              entry = {
                code,
                name: courseName,
                semester: sem,
                type: isLab ? 'Practical Lab' : 'Theory',
                ltp,
                credits,
                department: tt.department || deptCode,
                sectionAllocations: {}
              };
              courseMap.set(code, entry);
            }

            const profName = cell.facultyName || cell.faculty || matchedMeta?.facultyName;
            if (profName) {
              entry.sectionAllocations[cohortKey] = profName;
            }
          });
        });
      }
    });

    if (courseMap.size === 0) {
      throw new Error(`The generated timetables for ${deptFullName} do not contain scheduled courses yet.`);
    }

    // Sort courses by semester ascending, then by course code alphabetically
    const sortedCourses = Array.from(courseMap.values()).sort((a, b) => {
      if (a.semester !== b.semester) return a.semester - b.semester;
      return a.code.localeCompare(b.code);
    });

    const totalCourses = sortedCourses.length;
    const theoryCount = sortedCourses.filter(c => c.type === 'Theory').length;
    const labCount = sortedCourses.filter(c => c.type === 'Practical Lab').length;
    const uniqueProfessors = new Set();
    sortedCourses.forEach(c => {
      Object.values(c.sectionAllocations).forEach(f => uniqueProfessors.add(f));
    });

    // KPI Summary Header Banner
    doc.autoTable({
      head: [[
        { content: `Total Courses: ${totalCourses}`, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: `Theory Lectures: ${theoryCount}`, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: `Practical Labs: ${labCount}`, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: `Assigned Faculty: ${uniqueProfessors.size}`, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: `Active Timetables: ${timetablesList.length}`, styles: { halign: 'center', fontStyle: 'bold' } }
      ]],
      body: [],
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.35,
        cellPadding: 1.5,
        fontSize: 8.5,
        font: 'times',
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [240, 245, 255]
      }
    });

    currentY = doc.lastAutoTable.finalY + 2.0;

    // Main Table Rows
    let slNo = 1;
    const tableRows = sortedCourses.map(c => {
      let facultyDisplay = '';
      const allocEntries = Object.entries(c.sectionAllocations);
      if (allocEntries.length > 0) {
        const profs = Array.from(new Set(allocEntries.map(([_, p]) => p)));
        if (profs.length === 1) {
          facultyDisplay = `${profs[0]} (All Sections)`;
        } else {
          facultyDisplay = allocEntries.map(([sec, prof]) => `${sec}: ${prof}`).join('\n');
        }
      } else {
        facultyDisplay = c.defaultFacultyName || 'Department Faculty';
      }

      const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
      const semRoman = `Sem ${c.semester} (${romanNumerals[c.semester] || c.semester})`;

      return [
        String(slNo++),
        c.code,
        c.name,
        semRoman,
        c.type,
        c.ltp,
        String(c.credits),
        facultyDisplay,
        c.department
      ];
    });

    doc.autoTable({
      head: [
        [
          { content: 'Sl.', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Course Code', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Course Name / Syllabus Title', styles: { halign: 'left', fontStyle: 'bold' } },
          { content: 'Semester', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Type', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: '(L-T-P)', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Credits', styles: { halign: 'center', fontStyle: 'bold' } },
          { content: 'Assigned Faculty In-Charge / Professor', styles: { halign: 'left', fontStyle: 'bold' } },
          { content: 'Dept', styles: { halign: 'center', fontStyle: 'bold' } }
        ]
      ],
      body: tableRows,
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 25 },
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        font: 'times',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.35,
        cellPadding: 1.5,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        font: 'times',
        fontSize: 8.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.35
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 80, halign: 'left' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
        8: { cellWidth: 18, halign: 'center' }
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          doc.setFont('times', 'bold');
          doc.setFontSize(8.5);
          doc.text(`Department of ${deptFullName} - Course-Professor Allocation Roster (Contd.)`, margin, 8);
        }
        doc.setFont('times', 'normal');
        doc.setFontSize(8.0);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `NITK Surathkal • Course-Professor Allocation Roster • Page ${data.pageNumber}`,
          pageWidth / 2,
          pageHeight - 6.0,
          { align: 'center' }
        );
      }
    });

    // Ensure signatures block fits cleanly
    let lastY = doc.lastAutoTable.finalY + 12;
    if (lastY > pageHeight - 20) {
      doc.addPage('a4', 'landscape');
      lastY = 30;
    }

    const sigY = pageHeight - 12.0;
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    // Signatures
    doc.text('Sd/-', margin + 15, sigY - 4.5);
    doc.text('Time Table In-charge', margin + 15, sigY);

    doc.text('Sd/-', pageWidth / 2, sigY - 4.5, { align: 'center' });
    doc.text(`Head of Department (${deptCode})`, pageWidth / 2, sigY, { align: 'center' });

    doc.text('Sd/-', pageWidth - margin - 25, sigY - 4.5, { align: 'center' });
    doc.text('Dean (Academic)', pageWidth - margin - 25, sigY, { align: 'center' });

    const filename = `NITK_${deptCode}_Course_Professor_${downloadDateStr}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Course-Professor PDF Generation Error:', error);
    throw error;
  }
}
