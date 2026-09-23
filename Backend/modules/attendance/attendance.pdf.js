import PDFDocument from 'pdfkit';

const normalizeDate = (value) => {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
};

const formatDisplayHours = (value) => {
  const totalMinutes = Number(value) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
};

const formatPdfDate = (value) => {
  const normalized = normalizeDate(value);
  if (!normalized) return '-';
  const [year, month, day] = normalized.split('-');
  return `${day}/${month}/${year}`;
};

const getAttendanceCalculationType = (summary = {}) => {
  if (summary.requiredWorkingHours !== undefined || summary.actualWorkingHours !== undefined || summary.shortHours !== undefined) {
    return 'Hourly Based';
  }
  return 'Day Based';
};

export const buildAttendanceSummaryPdf = async (payload, companyName = 'Company') => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36, layout: 'portrait' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const employee = payload.employee || {};
    const summary = payload.summary || {};
    const dailyRows = payload.dailyAttendance || [];
    const calculationType = getAttendanceCalculationType(summary);

    const summaryItems = [
      ['Total Calendar Days', summary.calendarDays ?? 0],
      ['Working Days', summary.workingDays ?? 0],
      ['Present Days', summary.presentDays ?? 0],
      ['Half Days', summary.halfDays ?? 0],
      ['Absent Days', summary.absentDays ?? 0],
      ['Paid Leave', summary.paidLeaveDays ?? 0],
      ['Unpaid Leave', summary.unpaidLeaveDays ?? 0],
      ['Holidays', summary.holidays ?? 0],
      ['Week Off', summary.weekOffs ?? 0],
      ['Late Days', summary.lateDays ?? 0],
      ['Short Leave', summary.shortLeaveDays ?? 0],
      ['Total Working Hours', formatDisplayHours(summary.totalWorkingHours ?? 0)],
      ['Overtime Hours', formatDisplayHours(summary.overtimeHours ?? 0)],
    ];

    const workingHoursSummary = [
      ['Required Working Hours', formatDisplayHours(summary.requiredWorkingHours ?? 0)],
      ['Actual Working Hours', formatDisplayHours(summary.actualWorkingHours ?? 0)],
      ['Short Hours', formatDisplayHours(summary.shortHours ?? 0)],
    ];

    if (calculationType !== 'Hourly Based') {
      workingHoursSummary.length = 0;
    }

    const drawTwoColumnList = (items, startX, startY, columnGap, rowGap, fontSize) => {
      doc.fontSize(fontSize);
      items.forEach((item, index) => {
        const [label, value] = item;
        const x = index % 2 === 0 ? startX : startX + columnGap;
        const y = startY + Math.floor(index / 2) * rowGap;
        doc.text(`${label}: ${value}`, x, y, { width: 220, lineGap: 0 });
      });
      return startY + Math.ceil(items.length / 2) * rowGap + 8;
    };

    doc.fontSize(18).text(companyName, { align: 'center' });
    doc.fontSize(14).text('Employee Attendance Summary', { align: 'center' });
    doc.moveDown(0.3);

    doc.fontSize(9);
    doc.text(`Employee Name: ${employee.name || '-'}`);
    doc.text(`Employee Code: ${employee.employeeCode || '-'}`);
    doc.text(`Date of Joining: ${employee.dateOfJoining || '-'}`);
    doc.text(`Selected Month: ${payload.period?.month || '-'}`);
    doc.text(`Attendance Calculation Type: ${calculationType}`);

    doc.moveDown(0.5);
    doc.fontSize(10).text('Summary', { underline: true });
    const summaryTop = doc.y + 4;
    const summaryBottom = drawTwoColumnList(summaryItems, 42, summaryTop, 190, 14, 8);

    doc.moveDown(0.2);
    doc.fontSize(10).text('Working Hours Summary', { underline: true });
    const workingHoursTop = doc.y + 4;
    drawTwoColumnList(workingHoursSummary.length ? workingHoursSummary : [['Required Working Hours', '0h 0m'], ['Actual Working Hours', '0h 0m'], ['Short Hours', '0h 0m']], 42, workingHoursTop, 185, 16, 8);

    doc.addPage();
    doc.fontSize(12).text('Daily Attendance', { underline: true, align: 'left' });
    doc.moveDown(0.3);

    const tableHeaders = ['Date', 'Day', 'Check In', 'Check Out', 'Working', 'Late', 'Status', 'Remarks'];
    const colWidths = [68, 34, 58, 58, 58, 48, 90, 109];
    const tableStartX = 36;
    const tableTop = doc.y + 2;
    const rowHeight = 16;

    const drawTableHeader = (y) => {
      doc.font('Helvetica-Bold').fontSize(7);
      tableHeaders.forEach((header, index) => {
        const x = tableStartX + colWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(header, x, y, { width: colWidths[index], lineBreak: false });
      });
      doc.font('Helvetica').fontSize(7);
    };

    drawTableHeader(tableTop);

    let rowY = tableTop + 12;
    dailyRows.forEach((row) => {
      if (rowY + rowHeight > doc.page.height - 42) {
        doc.addPage();
        rowY = 42;
        drawTableHeader(rowY);
        rowY += 12;
      }

      const values = [
        formatPdfDate(row.date),
        row.day || '-',
        row.checkIn || '-',
        row.checkOut || '-',
        row.workingHours || '-',
        row.lateBy || '-',
        row.status || '-',
        row.remarks || '-',
      ];

      values.forEach((value, index) => {
        const x = tableStartX + colWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(String(value), x, rowY, { width: colWidths[index], lineBreak: false, ellipsis: true });
      });
      rowY += rowHeight;
    });

    doc.end();
  });
};
