/* ===================================================
   EXPORT — Export reports to Text/PDF/Excel
   =================================================== */

const ExportModule = {
  async init() {
    await this.render();
  },

  async render() {
    const panel = document.getElementById('panel-export');

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">📤 Export Reports</h2>
          <p class="section-subtitle">Download reports as Text, PDF, or Excel</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Export Type</label>
            <select class="form-select" id="export-type">
              <option value="single">Single Day</option>
              <option value="range">Date Range</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="export-date" value="${todayStr()}">
          </div>
        </div>

        <div id="export-range-fields" style="display:none;">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">From Date</label>
              <input type="date" class="form-input" id="export-start-date">
            </div>
            <div class="form-group">
              <label class="form-label">To Date</label>
              <input type="date" class="form-input" id="export-end-date">
            </div>
          </div>
        </div>
      </div>

      <div class="export-options">
        <div class="export-card" id="export-text">
          <div class="export-icon">📄</div>
          <div class="export-title">Plain Text</div>
          <div class="export-desc">Same format as your notepad. Copy-paste friendly.</div>
        </div>
        <div class="export-card" id="export-pdf">
          <div class="export-icon">📕</div>
          <div class="export-title">PDF Report</div>
          <div class="export-desc">Formatted report with headers and sections.</div>
        </div>
        <div class="export-card" id="export-excel">
          <div class="export-icon">📊</div>
          <div class="export-title">Excel Spreadsheet</div>
          <div class="export-desc">Filterable columns for each field.</div>
        </div>
        <div class="export-card" id="export-clipboard">
          <div class="export-icon">📋</div>
          <div class="export-title">Copy to Clipboard</div>
          <div class="export-desc">Quick copy for Slack, email, or chat.</div>
        </div>
      </div>

      <div id="export-preview" style="display:none;">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Preview</span>
            <button class="btn btn-ghost" id="close-preview">✕</button>
          </div>
          <pre id="export-preview-content" style="white-space:pre-wrap; font-size:0.82rem; color:var(--text-secondary); max-height:400px; overflow-y:auto; line-height:1.6;"></pre>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('export-type').addEventListener('change', (e) => {
      const rangeFields = document.getElementById('export-range-fields');
      const dateField = document.getElementById('export-date').parentElement;
      if (e.target.value === 'range') {
        rangeFields.style.display = 'block';
        dateField.style.display = 'none';
      } else {
        rangeFields.style.display = 'none';
        dateField.style.display = 'block';
      }
    });

    document.getElementById('export-text').addEventListener('click', () => this.exportText());
    document.getElementById('export-pdf').addEventListener('click', () => this.exportPDF());
    document.getElementById('export-excel').addEventListener('click', () => this.exportExcel());
    document.getElementById('export-clipboard').addEventListener('click', () => this.exportClipboard());

    const closeBtn = document.getElementById('close-preview');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('export-preview').style.display = 'none';
      });
    }
  },

  async getExportData() {
    const type = document.getElementById('export-type').value;
    let reports;

    if (type === 'single') {
      const date = document.getElementById('export-date').value;
      reports = await ReportsDB.getByDate(date);
    } else {
      const start = document.getElementById('export-start-date').value;
      const end = document.getElementById('export-end-date').value;
      if (!start || !end) {
        showToast('Please select both start and end dates', 'error');
        return null;
      }
      reports = await ReportsDB.getByDateRange(start, end);
    }

    const members = await MembersDB.getAll();
    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m; });

    return { reports, memberMap, type };
  },

  async generateText() {
    const data = await this.getExportData();
    if (!data) return null;

    const { reports, memberMap, type } = data;

    // Group by date
    const grouped = {};
    reports.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });

    let text = '';
    const dates = Object.keys(grouped).sort();

    dates.forEach(date => {
      text += `Daily Meeting ${formatDate(date)}\n${'='.repeat(40)}\n\n`;

      grouped[date].forEach(r => {
        const m = memberMap[r.memberId];
        if (!m) return;

        text += `${m.name}\n${'-'.repeat(20)}\n`;
        text += `yesterday work completed: ${r.yesterdayWork || ''}\n`;
        text += `issue faced: ${r.issueFaced || ''}\n`;
        text += `solution: ${r.solution || ''}\n`;
        text += `Current working: ${r.currentWork || ''}\n`;
        text += `Description: ${r.description || ''}\n`;
        if (r.projects && r.projects.length > 0) {
          text += `Projects: ${r.projects.join(', ')}\n`;
        }
        text += '\n';
      });

      text += '\n';
    });

    return text;
  },

  async exportText() {
    const text = await this.generateText();
    if (!text) return;

    // Show preview
    document.getElementById('export-preview').style.display = 'block';
    document.getElementById('export-preview-content').textContent = text;

    // Download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `standup-report-${document.getElementById('export-date').value || 'range'}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Text file downloaded!', 'success');
  },

  async exportPDF() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      showToast('PDF library loading... please wait and try again', 'warning');
      return;
    }

    const data = await this.getExportData();
    if (!data) return;

    const { reports, memberMap } = data;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Group by date
    const grouped = {};
    reports.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });

    const dates = Object.keys(grouped).sort();
    let y = 20;

    dates.forEach((date, dateIdx) => {
      if (dateIdx > 0) {
        doc.addPage();
        y = 20;
      }

      // Title
      doc.setFontSize(16);
      doc.setTextColor(56, 189, 248);
      doc.text(`Daily Meeting — ${formatDate(date)}`, 14, y);
      y += 10;

      doc.setDrawColor(56, 189, 248);
      doc.line(14, y, 196, y);
      y += 8;

      grouped[date].forEach(r => {
        const m = memberMap[r.memberId];
        if (!m) return;

        // Check if we need a new page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(56, 189, 248);
        doc.text(m.name, 14, y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);

        const fields = [
          ['Yesterday Work', r.yesterdayWork],
          ['Issue Faced', r.issueFaced],
          ['Solution', r.solution],
          ['Current Work', r.currentWork],
          ['Description', r.description]
        ];

        fields.forEach(([label, value]) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setTextColor(100, 116, 139);
          doc.text(`${label}:`, 16, y);
          doc.setTextColor(60, 60, 60);
          const lines = doc.splitTextToSize(value || '—', 150);
          doc.text(lines, 55, y);
          y += Math.max(lines.length * 4.5, 5);
        });

        if (r.projects && r.projects.length > 0) {
          doc.setTextColor(100, 116, 139);
          doc.text(`Projects: ${r.projects.join(', ')}`, 16, y);
          y += 5;
        }

        y += 6;
      });
    });

    doc.save(`standup-report-${dates[0] || 'export'}.pdf`);
    showToast('PDF downloaded!', 'success');
  },

  async exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('Excel library loading... please wait and try again', 'warning');
      return;
    }

    const data = await this.getExportData();
    if (!data) return;

    const { reports, memberMap } = data;

    const rows = reports.map(r => {
      const m = memberMap[r.memberId];
      return {
        'Date': r.date,
        'Member': m ? m.name : 'Unknown',
        'Role': m ? m.role : '',
        'Yesterday Work': r.yesterdayWork || '',
        'Issue Faced': r.issueFaced || '',
        'Solution': r.solution || '',
        'Current Work': r.currentWork || '',
        'Description': r.description || '',
        'Projects': (r.projects || []).join(', ')
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Standup Report');

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => (r[key] || '').length).slice(0, 20)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `standup-report-${document.getElementById('export-date').value || 'range'}.xlsx`);
    showToast('Excel file downloaded!', 'success');
  },

  async exportClipboard() {
    const text = await this.generateText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      showToast('Report copied to clipboard!', 'success');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Report copied!', 'success');
    }
  }
};
