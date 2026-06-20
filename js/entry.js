/* ===================================================
   ENTRY FORM — Daily report entry/edit
   =================================================== */

const EntryModule = {
  currentDate: todayStr(),
  selectedMemberId: null,
  selectedProjects: [],
  draftTimer: null,

  async init() {
    this.currentDate = todayStr();
    await this.render();
    this.bindEvents();
  },

  async render() {
    const members = await MembersDB.getAll();
    const panel = document.getElementById('panel-entry');

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">📝 Daily Entry</h2>
          <p class="section-subtitle">Add or edit a team member's daily report</p>
        </div>
      </div>

      <div class="card" style="margin-bottom: var(--space-lg);">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="entry-member">Team Member</label>
            <select class="form-select" id="entry-member">
              <option value="">Select a member...</option>
              ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="entry-date">Date</label>
            <input type="date" class="form-input" id="entry-date" value="${this.currentDate}">
          </div>
        </div>

        <div id="entry-carryover-hint" style="display:none; margin-bottom: var(--space-md);">
          <div style="display:flex; align-items:center; gap:var(--space-sm); padding:var(--space-sm) var(--space-md); background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.15); border-radius:var(--radius-md);">
            <span>💡</span>
            <span style="font-size:0.82rem; color:var(--text-secondary);" id="carryover-text"></span>
            <button class="btn btn-ghost" id="btn-apply-carryover" style="margin-left:auto; font-size:0.78rem;">Apply</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="entry-yesterday">Yesterday's Work Completed</label>
          <textarea class="form-textarea" id="entry-yesterday" placeholder="What did you complete yesterday?" rows="2"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="entry-issue">Issue Faced</label>
            <textarea class="form-textarea" id="entry-issue" placeholder="Any blockers or issues?" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="entry-solution">Solution</label>
            <textarea class="form-textarea" id="entry-solution" placeholder="How was it resolved?" rows="2"></textarea>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="entry-current">Current / Today's Work</label>
          <textarea class="form-textarea" id="entry-current" placeholder="What are you working on today?" rows="2"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="entry-description">Description / Notes</label>
          <textarea class="form-textarea" id="entry-description" placeholder="Any additional notes..." rows="2"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Project Tags</label>
          <div class="tag-selector" id="entry-tags">
            ${PROJECTS.map(p => `
              <span class="tag-option ${getTagClass(p)}" data-project="${p}">${p}</span>
            `).join('')}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-lg);">
          <span class="form-hint" id="entry-status"></span>
          <div style="display:flex; gap:var(--space-sm);">
            <button class="btn btn-secondary" id="btn-clear-entry">Clear</button>
            <button class="btn btn-primary btn-lg" id="btn-save-entry">
              💾 Save Entry <span class="kbd" style="margin-left:8px;">Ctrl+Enter</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick view of today's entries below the form -->
      <div id="entry-today-preview"></div>
    `;

    this.updateTodayPreview();
  },

  bindEvents() {
    const panel = document.getElementById('panel-entry');

    panel.addEventListener('change', async (e) => {
      if (e.target.id === 'entry-member' || e.target.id === 'entry-date') {
        await this.loadExisting();
        await this.checkCarryOver();
      }
    });

    panel.addEventListener('click', (e) => {
      if (e.target.closest('.tag-option')) {
        const tag = e.target.closest('.tag-option');
        const project = tag.dataset.project;
        tag.classList.toggle('selected');

        if (tag.classList.contains('selected')) {
          if (!this.selectedProjects.includes(project)) {
            this.selectedProjects.push(project);
          }
        } else {
          this.selectedProjects = this.selectedProjects.filter(p => p !== project);
        }
      }

      if (e.target.id === 'btn-save-entry' || e.target.closest('#btn-save-entry')) {
        this.save();
      }

      if (e.target.id === 'btn-clear-entry') {
        this.clearForm();
      }

      if (e.target.id === 'btn-apply-carryover') {
        this.applyCarryOver();
      }
    });

    // Keyboard shortcut: Ctrl+Enter to save
    panel.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.save();
      }
    });
  },

  async loadExisting() {
    const memberId = parseInt(document.getElementById('entry-member').value);
    const date = document.getElementById('entry-date').value;

    if (!memberId || !date) return;

    this.selectedMemberId = memberId;
    this.currentDate = date;

    const report = await ReportsDB.getByMemberAndDate(memberId, date);

    if (report) {
      document.getElementById('entry-yesterday').value = report.yesterdayWork || '';
      document.getElementById('entry-issue').value = report.issueFaced || '';
      document.getElementById('entry-solution').value = report.solution || '';
      document.getElementById('entry-current').value = report.currentWork || '';
      document.getElementById('entry-description').value = report.description || '';

      this.selectedProjects = report.projects || [];
      this.updateTagSelection();

      document.getElementById('entry-status').textContent = '📄 Loaded existing entry — editing';
      document.getElementById('entry-status').style.color = 'var(--accent-info)';
    } else {
      this.clearFormFields();
      document.getElementById('entry-status').textContent = '🆕 New entry';
      document.getElementById('entry-status').style.color = 'var(--accent-success)';
    }
  },

  async checkCarryOver() {
    const memberId = parseInt(document.getElementById('entry-member').value);
    const date = document.getElementById('entry-date').value;
    if (!memberId || !date) return;

    // Get yesterday's date
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const yesterdayDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const yesterdayReport = await ReportsDB.getByMemberAndDate(memberId, yesterdayDate);
    const hint = document.getElementById('entry-carryover-hint');
    const text = document.getElementById('carryover-text');

    if (yesterdayReport && yesterdayReport.currentWork && !document.getElementById('entry-yesterday').value) {
      text.textContent = `Yesterday's "Current Work": ${yesterdayReport.currentWork.substring(0, 120)}${yesterdayReport.currentWork.length > 120 ? '...' : ''}`;
      hint.style.display = 'block';
      hint._carryoverData = yesterdayReport.currentWork;
    } else {
      hint.style.display = 'none';
    }
  },

  applyCarryOver() {
    const hint = document.getElementById('entry-carryover-hint');
    if (hint._carryoverData) {
      document.getElementById('entry-yesterday').value = hint._carryoverData;
      hint.style.display = 'none';
      showToast('Carried over from yesterday!', 'success');
    }
  },

  updateTagSelection() {
    document.querySelectorAll('#entry-tags .tag-option').forEach(tag => {
      if (this.selectedProjects.includes(tag.dataset.project)) {
        tag.classList.add('selected');
      } else {
        tag.classList.remove('selected');
      }
    });
  },

  clearFormFields() {
    document.getElementById('entry-yesterday').value = '';
    document.getElementById('entry-issue').value = '';
    document.getElementById('entry-solution').value = '';
    document.getElementById('entry-current').value = '';
    document.getElementById('entry-description').value = '';
    this.selectedProjects = [];
    this.updateTagSelection();
  },

  clearForm() {
    this.clearFormFields();
    document.getElementById('entry-status').textContent = '';
    document.getElementById('entry-carryover-hint').style.display = 'none';
  },

  async save() {
    const memberId = parseInt(document.getElementById('entry-member').value);
    const date = document.getElementById('entry-date').value;

    if (!memberId) {
      showToast('Please select a team member', 'error');
      return;
    }
    if (!date) {
      showToast('Please select a date', 'error');
      return;
    }

    const reportData = {
      memberId,
      date,
      yesterdayWork: document.getElementById('entry-yesterday').value.trim(),
      issueFaced: document.getElementById('entry-issue').value.trim(),
      solution: document.getElementById('entry-solution').value.trim(),
      currentWork: document.getElementById('entry-current').value.trim(),
      description: document.getElementById('entry-description').value.trim(),
      projects: [...this.selectedProjects]
    };

    await ReportsDB.save(reportData);

    const member = await MembersDB.getById(memberId);
    showToast(`Saved entry for ${member.name}!`, 'success');

    document.getElementById('entry-status').textContent = '✅ Saved!';
    document.getElementById('entry-status').style.color = 'var(--accent-success)';

    this.updateTodayPreview();
    App.updateStats();
  },

  async updateTodayPreview() {
    const container = document.getElementById('entry-today-preview');
    if (!container) return;

    const reports = await ReportsDB.getByDate(todayStr());
    const members = await MembersDB.getAll();
    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m; });

    if (reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-xl);">
          <div class="empty-icon">📋</div>
          <div class="empty-title">No entries yet for today</div>
          <div class="empty-desc">Select a team member above to add the first entry</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="section-header" style="margin-top:var(--space-lg);">
        <h3 class="card-title">Today's Entries (${reports.length}/${members.length})</h3>
      </div>
      ${reports.map(r => {
        const m = memberMap[r.memberId];
        if (!m) return '';
        return `
          <div class="member-card" style="padding:var(--space-md);">
            <div class="member-name" style="font-size:0.95rem;">
              <span class="avatar" style="width:28px;height:28px;font-size:0.7rem;">${getInitials(m.name)}</span>
              ${m.name}
              <button class="btn btn-ghost btn-icon" style="margin-left:auto;font-size:0.85rem;" onclick="EntryModule.editEntry(${m.id})" title="Edit">✏️</button>
            </div>
            <div class="separator"></div>
            <div style="font-size:0.82rem; color:var(--text-secondary); line-height:1.6;">
              ${r.currentWork ? `<div><strong style="color:var(--accent-primary);">Working on:</strong> ${escapeHtml(r.currentWork)}</div>` : ''}
              ${r.issueFaced ? `<div style="color:var(--accent-danger);"><strong>⚠️ Issue:</strong> ${escapeHtml(r.issueFaced)}</div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    `;
  },

  editEntry(memberId) {
    document.getElementById('entry-member').value = memberId;
    document.getElementById('entry-member').dispatchEvent(new Event('change'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
