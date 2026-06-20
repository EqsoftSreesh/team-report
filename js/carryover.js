/* ===================================================
   CARRY-OVER — Yesterday's work → Today's suggestions
   =================================================== */

const CarryOverModule = {
  async init() {
    await this.render();
  },

  async render() {
    const panel = document.getElementById('panel-carryover');
    const members = await MembersDB.getAll();
    const today = todayStr();

    // Get yesterday's date
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const yesterdayReports = await ReportsDB.getByDate(yesterday);
    const todayReports = await ReportsDB.getByDate(today);
    const todayMemberIds = new Set(todayReports.map(r => r.memberId));

    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m; });

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">🔄 Carry-Over</h2>
          <p class="section-subtitle">Yesterday's "Current Work" → Today's "Yesterday's Work Completed"</p>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">${yesterdayReports.length}</div>
          <div class="stat-label">Yesterday's Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${todayReports.length}</div>
          <div class="stat-label">Today's Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${members.length - todayMemberIds.size}</div>
          <div class="stat-label">Pending Today</div>
        </div>
      </div>

      <div id="carryover-list">
        ${yesterdayReports.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-title">No entries from yesterday</div>
            <div class="empty-desc">Yesterday's reports will appear here for easy carry-over</div>
          </div>
        ` : ''}

        ${yesterdayReports.map(r => {
          const m = memberMap[r.memberId];
          if (!m) return '';
          const hasTodayEntry = todayMemberIds.has(r.memberId);

          return `
            <div class="carryover-item">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent-primary),var(--accent-info));display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:var(--bg-primary);flex-shrink:0;">
                ${getInitials(m.name)}
              </div>
              <div class="carryover-content">
                <div class="carryover-member">${m.name}</div>
                <div class="carryover-task">${r.currentWork ? escapeHtml(r.currentWork) : '<em style="color:var(--text-muted);">No current work listed</em>'}</div>
                ${r.issueFaced ? `<div style="margin-top:var(--space-xs);font-size:0.78rem;color:var(--accent-danger);">⚠️ Open issue: ${escapeHtml(r.issueFaced.substring(0, 80))}</div>` : ''}
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-xs);flex-shrink:0;">
                <span class="carryover-status ${hasTodayEntry ? 'status-done' : 'status-pending'}">
                  ${hasTodayEntry ? '✅ Submitted' : '⏳ Pending'}
                </span>
                ${!hasTodayEntry ? `<button class="btn btn-ghost" style="font-size:0.78rem;" onclick="CarryOverModule.startEntry(${m.id})">+ Add Entry</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}

        <!-- Members who didn't report yesterday and haven't reported today -->
        ${members.filter(m => !yesterdayReports.find(r => r.memberId === m.id) && !todayMemberIds.has(m.id)).map(m => `
          <div class="carryover-item" style="opacity:0.5;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:var(--text-muted);flex-shrink:0;">
              ${getInitials(m.name)}
            </div>
            <div class="carryover-content">
              <div class="carryover-member" style="color:var(--text-muted);">${m.name}</div>
              <div class="carryover-task" style="font-style:italic;">No entry yesterday</div>
            </div>
            <div style="flex-shrink:0;">
              <span class="carryover-status status-pending">⏳ Pending</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  startEntry(memberId) {
    // Switch to entry tab and pre-select the member
    App.switchTab('entry');
    setTimeout(() => {
      document.getElementById('entry-member').value = memberId;
      document.getElementById('entry-member').dispatchEvent(new Event('change'));
    }, 100);
  }
};
