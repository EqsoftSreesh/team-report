/* ===================================================
   DAILY VIEW — All members' entries for a selected date
   =================================================== */

const DailyViewModule = {
  currentDate: todayStr(),

  async init() {
    this.currentDate = todayStr();
    await this.render();
  },

  async render() {
    const panel = document.getElementById('panel-daily');

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">📊 Daily Report</h2>
          <p class="section-subtitle" id="daily-date-label">${formatDate(this.currentDate)}</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <button class="btn btn-secondary" id="btn-copy-daily" title="Copy to clipboard">📋 Copy</button>
        </div>
      </div>

      <div class="date-nav">
        <button class="btn btn-secondary btn-icon" id="daily-prev-day">◀</button>
        <input type="date" class="form-input" id="daily-date-picker" value="${this.currentDate}" style="max-width:200px; text-align:center;">
        <button class="btn btn-secondary btn-icon" id="daily-next-day">▶</button>
        <button class="btn btn-ghost" id="daily-today">Today</button>
      </div>

      <div id="daily-stats-row" class="stats-row"></div>
      <div id="daily-entries-container"></div>
    `;

    this.bindEvents();
    await this.loadEntries();
  },

  bindEvents() {
    document.getElementById('daily-prev-day').addEventListener('click', () => {
      this.changeDate(-1);
    });
    document.getElementById('daily-next-day').addEventListener('click', () => {
      this.changeDate(1);
    });
    document.getElementById('daily-today').addEventListener('click', () => {
      this.currentDate = todayStr();
      document.getElementById('daily-date-picker').value = this.currentDate;
      this.loadEntries();
    });
    document.getElementById('daily-date-picker').addEventListener('change', (e) => {
      this.currentDate = e.target.value;
      this.loadEntries();
    });
    document.getElementById('btn-copy-daily').addEventListener('click', () => {
      this.copyToClipboard();
    });
  },

  changeDate(delta) {
    const d = new Date(this.currentDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    this.currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    document.getElementById('daily-date-picker').value = this.currentDate;
    this.loadEntries();
  },

  async loadEntries() {
    document.getElementById('daily-date-label').textContent = formatDate(this.currentDate);

    const reports = await ReportsDB.getByDate(this.currentDate);
    const members = await MembersDB.getAll();
    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m; });

    // Stats
    const totalMembers = members.length;
    const submitted = reports.length;
    const withIssues = reports.filter(r => r.issueFaced && r.issueFaced.trim()).length;
    const projectSet = new Set();
    reports.forEach(r => (r.projects || []).forEach(p => projectSet.add(p)));

    document.getElementById('daily-stats-row').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${submitted}/${totalMembers}</div>
        <div class="stat-label">Entries Submitted</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${withIssues}</div>
        <div class="stat-label">Issues Reported</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${projectSet.size}</div>
        <div class="stat-label">Projects Active</div>
      </div>
    `;

    // Entries
    const container = document.getElementById('daily-entries-container');

    if (reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No entries for ${formatDateShort(this.currentDate)}</div>
          <div class="empty-desc">Switch to the Entry tab to add reports, or browse another date</div>
        </div>
      `;
      return;
    }

    // Show members with entries first, then those without
    const reportedMemberIds = new Set(reports.map(r => r.memberId));
    const membersWithEntries = members.filter(m => reportedMemberIds.has(m.id));
    const membersWithout = members.filter(m => !reportedMemberIds.has(m.id));

    let html = '';

    reports.forEach(r => {
      const m = memberMap[r.memberId];
      if (!m) return;

      html += `
        <div class="member-card">
          <div class="member-name">
            <span class="avatar">${getInitials(m.name)}</span>
            ${m.name}
            <span style="font-size:0.75rem; color:var(--text-muted); margin-left:var(--space-sm);">${m.role}</span>
          </div>
          <div class="separator"></div>

          <div class="field-group yesterday">
            <div class="field-label">Yesterday's Work Completed</div>
            <div class="field-value ${!r.yesterdayWork ? 'empty' : ''}">${r.yesterdayWork ? escapeHtml(r.yesterdayWork) : '—'}</div>
          </div>

          <div class="field-group issue">
            <div class="field-label">Issue Faced</div>
            <div class="field-value ${!r.issueFaced ? 'empty' : ''}">${r.issueFaced ? escapeHtml(r.issueFaced) : '—'}</div>
          </div>

          <div class="field-group solution">
            <div class="field-label">Solution</div>
            <div class="field-value ${!r.solution ? 'empty' : ''}">${r.solution ? escapeHtml(r.solution) : '—'}</div>
          </div>

          <div class="field-group current">
            <div class="field-label">Current / Today's Work</div>
            <div class="field-value ${!r.currentWork ? 'empty' : ''}">${r.currentWork ? escapeHtml(r.currentWork) : '—'}</div>
          </div>

          <div class="field-group description">
            <div class="field-label">Description / Notes</div>
            <div class="field-value ${!r.description ? 'empty' : ''}">${r.description ? escapeHtml(r.description) : '—'}</div>
          </div>

          ${(r.projects && r.projects.length > 0) ? `
            <div class="tags">
              ${r.projects.map(p => `<span class="tag ${getTagClass(p)}">${p}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    });

    // Members without entries
    membersWithout.forEach(m => {
      html += `
        <div class="no-entry-card">
          <div style="display:flex;align-items:center;gap:var(--space-sm);">
            <span class="avatar" style="width:32px;height:32px;font-size:0.7rem;border-radius:50%;background:linear-gradient(135deg,var(--accent-primary),var(--accent-info));display:flex;align-items:center;justify-content:center;color:var(--bg-primary);font-weight:700;">${getInitials(m.name)}</span>
            <span style="color:var(--text-muted);">${m.name}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">— No entry</span>
          </div>
          <button class="btn btn-ghost" onclick="App.switchToEntry(${m.id})">+ Add</button>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  async copyToClipboard() {
    const reports = await ReportsDB.getByDate(this.currentDate);
    const members = await MembersDB.getAll();
    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m; });

    let text = `Daily Meeting ${formatDate(this.currentDate)}\n${'='.repeat(40)}\n\n`;

    reports.forEach(r => {
      const m = memberMap[r.memberId];
      if (!m) return;

      text += `${m.name}\n${'-'.repeat(20)}\n`;
      text += `Yesterday work completed: ${r.yesterdayWork || ''}\n`;
      text += `Issue faced: ${r.issueFaced || ''}\n`;
      text += `Solution: ${r.solution || ''}\n`;
      text += `Current working: ${r.currentWork || ''}\n`;
      text += `Description: ${r.description || ''}\n`;
      if (r.projects && r.projects.length > 0) {
        text += `Projects: ${r.projects.join(', ')}\n`;
      }
      text += '\n';
    });

    try {
      await navigator.clipboard.writeText(text);
      showToast('Report copied to clipboard!', 'success');
    } catch {
      // Fallback
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
