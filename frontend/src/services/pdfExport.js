/**
 * PDF Notice-Board Export Service for NITK AutoTTGen
 * Generates an institutional landscape A4 PDF conforming exactly to the official NITK Surathkal notice-board layout.
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
export async function exportNoticeBoardPdf(timetable, academicOptions = {}) {
  const DAYS = academicOptions.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
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

            // Resolve LTP:
            // 1. Matched subject from curriculum is the gold standard
            let courseLtp = null;
            if (matchedSubj && matchedSubj.ltp) {
              courseLtp = String(matchedSubj.ltp).trim();
            } else if (slot.ltp && slot.ltp !== '(3-0-2)') {
              // Explicit slot LTP that wasn't the legacy fallback
              courseLtp = String(slot.ltp).trim();
            } else if (slot.ltp && !isLab && courseCredits === 4) {
              courseLtp = String(slot.ltp).trim();
            }

            // 2. Intelligent inference if still unassigned
            if (!courseLtp) {
              if (isLab) {
                courseLtp = courseCredits <= 1 ? '(0-0-2)' : '(0-0-3)';
              } else {
                courseLtp = `(${courseCredits}-0-0)`;
              }
            }

            // Clean up: ensure enclosed in parentheses e.g. "3-0-0" -> "(3-0-0)"
            if (!courseLtp.startsWith('(')) {
              courseLtp = `(${courseLtp})`;
            }

            // Safeguard: A 3-credit theory course or pure lab should NEVER be (3-0-2)
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

    // Save File
    const filename = `NITK_${deptCode}_Sem${timetable.semester || timetable.year}_Sec${timetable.section}_Timetable.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}

export const exportTimetableAsPDF = exportNoticeBoardPdf;
