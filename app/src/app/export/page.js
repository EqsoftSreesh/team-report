'use client';

import { useState } from 'react';
import { ReportsDB, MembersDB } from '@/lib/db';
import { todayStr, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function ExportPage() {
  const toast = useToast();
  const [exportType, setExportType] = useState('single'); // single, range
  const [singleDate, setSingleDate] = useState(todayStr());
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());

  const getExportData = async () => {
    let reports = [];
    if (exportType === 'single') {
      reports = await ReportsDB.getByDate(singleDate);
    } else {
      reports = await ReportsDB.getByDateRange(startDate, endDate);
    }
    
    const members = await MembersDB.getAllIncludingInactive();
    const memberMap = {};
    members.forEach(m => memberMap[m.id] = m.name);
    
    // Sort by date then by member name
    reports.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (memberMap[a.memberId] || '').localeCompare(memberMap[b.memberId] || '');
    });
    
    return { reports, memberMap };
  };

  const buildText = async () => {
    const { reports, memberMap } = await getExportData();
    if (reports.length === 0) return null;
    
    let text = `Team Standup Report — ${exportType === 'single' ? formatDate(singleDate) : `${startDate} to ${endDate}`}\n\n`;
    
    let currentDate = '';
    reports.forEach(r => {
      if (r.date !== currentDate) {
        text += `\n=== DATE: ${r.date} ===\n\n`;
        currentDate = r.date;
      }
      text += `--- ${memberMap[r.memberId] || 'Unknown'} ---\n`;
      if (r.yesterdayWork) text += `Yesterday's Work Completed:\n${r.yesterdayWork}\n\n`;
      if (r.issueFaced) text += `Issue Faced:\n${r.issueFaced}\n\n`;
      if (r.solution) text += `Solution:\n${r.solution}\n\n`;
      if (r.currentWork) text += `Current / Today's Work:\n${r.currentWork}\n\n`;
      if (r.description) text += `Description / Notes:\n${r.description}\n\n`;
      text += `\n`;
    });
    
    return text;
  };

  const exportText = async () => {
    const text = await buildText();
    if (!text) return toast('No data to export', 'error');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Standup_Report_${exportType === 'single' ? singleDate : 'Range'}.txt`;
    a.click();
    toast('Text file downloaded', 'success');
  };

  const exportClipboard = async () => {
    const text = await buildText();
    if (!text) return toast('No data to export', 'error');
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard', 'success');
  };

  const exportExcel = async () => {
    const { reports, memberMap } = await getExportData();
    if (reports.length === 0) return toast('No data to export', 'error');

    const data = reports.map(r => ({
      Date: r.date,
      Member: memberMap[r.memberId] || 'Unknown',
      'Yesterday Work': r.yesterdayWork || '',
      'Issue Faced': r.issueFaced || '',
      'Solution': r.solution || '',
      'Current Work': r.currentWork || '',
      'Description': r.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, `Standup_Report_${exportType === 'single' ? singleDate : 'Range'}.xlsx`);
    toast('Excel file downloaded', 'success');
  };

  const exportPdf = async () => {
    const { reports, memberMap } = await getExportData();
    if (reports.length === 0) return toast('No data to export', 'error');

    const doc = new jsPDF();
    let y = 20;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(16);
    doc.text(`Team Standup Report — ${exportType === 'single' ? singleDate : 'Range'}`, 14, y);
    y += 15;

    let currentDate = '';
    reports.forEach(r => {
      if (r.date !== currentDate) {
        if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(198, 255, 51); // Lime
        doc.text(`Date: ${r.date}`, 14, y);
        y += 10;
        currentDate = r.date;
      }

      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(memberMap[r.memberId] || 'Unknown', 14, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      const fields = [
        { label: 'Yesterday Work:', val: r.yesterdayWork },
        { label: 'Issue Faced:', val: r.issueFaced },
        { label: 'Solution:', val: r.solution },
        { label: 'Current Work:', val: r.currentWork }
      ];

      fields.forEach(f => {
        if (f.val) {
          if (y > pageHeight - 20) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(`${f.label} ${f.val}`, 180);
          doc.text(lines, 14, y);
          y += lines.length * 5 + 2;
        }
      });
      y += 5;
    });

    doc.save(`Standup_Report_${exportType === 'single' ? singleDate : 'Range'}.pdf`);
    toast('PDF file downloaded', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📤 <span className="accent">Export Reports</span></h2>
          <p className="page-subtitle">Download your standup data in various formats</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 'var(--sp-xl)', maxWidth: 600 }}>
        <div style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-md)' }}>
          <button 
            className={`btn ${exportType === 'single' ? 'btn-lime' : 'btn-glass'}`} 
            style={{ flex: 1 }}
            onClick={() => setExportType('single')}
          >
            Single Day
          </button>
          <button 
            className={`btn ${exportType === 'range' ? 'btn-lime' : 'btn-glass'}`} 
            style={{ flex: 1 }}
            onClick={() => setExportType('range')}
          >
            Date Range
          </button>
        </div>

        {exportType === 'single' ? (
          <div className="form-group">
            <label className="form-label">Select Date</label>
            <input type="date" className="form-input" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
          </div>
        ) : (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="export-grid">
        <div className="export-card" onClick={exportClipboard}>
          <div className="export-icon">📋</div>
          <div className="export-title">Copy Text</div>
          <div className="export-desc">Copy formatted text to clipboard for Slack or email</div>
        </div>
        <div className="export-card" onClick={exportText}>
          <div className="export-icon">📝</div>
          <div className="export-title">Text File</div>
          <div className="export-desc">Download as a .txt file (Notepad friendly)</div>
        </div>
        <div className="export-card" onClick={exportPdf}>
          <div className="export-icon">📄</div>
          <div className="export-title">PDF Document</div>
          <div className="export-desc">Download as a formatted .pdf file</div>
        </div>
        <div className="export-card" onClick={exportExcel}>
          <div className="export-icon">📊</div>
          <div className="export-title">Excel Spreadsheet</div>
          <div className="export-desc">Download as a filterable .xlsx file</div>
        </div>
      </div>
    </div>
  );
}
