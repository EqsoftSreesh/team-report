/* ===================================================
   ISSUES — Recurring issue detection & tracker
   =================================================== */

const IssuesModule = {
  resolvedIssues: JSON.parse(localStorage.getItem('resolvedIssues') || '[]'),

  async init() {
    await this.render();
  },

  async render() {
    const panel = document.getElementById('panel-issues');
    const issues = await ReportsDB.detectRecurringIssues();

    const unresolvedCount = issues.filter(i => !this.resolvedIssues.includes(i.keyword)).length;

    // Update badge
    App.updateIssueBadge(unresolvedCount);

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">⚠️ Recurring Issues</h2>
          <p class="section-subtitle">Issues that appear across multiple days — don't let blockers get lost</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);align-items:center;">
          <label style="font-size:0.82rem;color:var(--text-muted);display:flex;align-items:center;gap:var(--space-xs);">
            <input type="checkbox" id="show-resolved-issues"> Show resolved
          </label>
        </div>
      </div>

      <div id="issues-container">
        ${issues.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <div class="empty-title">No recurring issues detected</div>
            <div class="empty-desc">Issues that appear in multiple days will be flagged here automatically</div>
          </div>
        ` : ''}

        ${issues.map(issue => {
          const isResolved = this.resolvedIssues.includes(issue.keyword);
          return `
            <div class="issue-item ${isResolved ? 'resolved' : ''}" data-keyword="${escapeHtml(issue.keyword)}" ${isResolved ? 'style="display:none;"' : ''}>
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-md);">
                <div>
                  <div class="issue-keyword">${escapeHtml(issue.keyword)}</div>
                  <div class="issue-meta">
                    <span>📊 ${issue.count} occurrences</span>
                    <span>👥 ${issue.members.join(', ')}</span>
                    <span>📅 ${formatDateShort(issue.firstSeen)} → ${formatDateShort(issue.lastSeen)}</span>
                  </div>
                </div>
                <button class="btn ${isResolved ? 'btn-secondary' : 'btn-success'}" onclick="IssuesModule.toggleResolved('${escapeHtml(issue.keyword).replace(/'/g, "\\'")}')" style="flex-shrink:0;">
                  ${isResolved ? '↩️ Reopen' : '✅ Resolve'}
                </button>
              </div>

              <div class="issue-timeline" style="margin-top:var(--space-md);">
                ${issue.occurrences.map(o => `
                  <div class="timeline-entry">
                    <span class="timeline-date">${formatDateShort(o.date)}</span>
                    <span class="timeline-member">${escapeHtml(o.memberName)}</span>
                    <span class="timeline-context">${escapeHtml(o.issue.substring(0, 100))}${o.issue.length > 100 ? '...' : ''}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Toggle resolved visibility
    const checkbox = document.getElementById('show-resolved-issues');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        const items = document.querySelectorAll('.issue-item.resolved');
        items.forEach(item => {
          item.style.display = e.target.checked ? 'block' : 'none';
        });
      });
    }
  },

  toggleResolved(keyword) {
    if (this.resolvedIssues.includes(keyword)) {
      this.resolvedIssues = this.resolvedIssues.filter(k => k !== keyword);
    } else {
      this.resolvedIssues.push(keyword);
    }
    localStorage.setItem('resolvedIssues', JSON.stringify(this.resolvedIssues));
    this.render();
    showToast('Issue status updated', 'info');
  },

  async getUnresolvedCount() {
    const issues = await ReportsDB.detectRecurringIssues();
    return issues.filter(i => !this.resolvedIssues.includes(i.keyword)).length;
  }
};
