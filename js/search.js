/* ===================================================
   SEARCH — Full-text search & filter engine
   =================================================== */

const SearchModule = {
  async init() {
    await this.render();
  },

  async render() {
    const members = await MembersDB.getAll();
    const panel = document.getElementById('panel-search');

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">🔍 Search Reports</h2>
          <p class="section-subtitle">Search across all entries by keyword, member, date, or project</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="search-bar">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" class="form-input" id="search-query" placeholder="Search e.g. 'trail balance', 'premium app', 'printing issue'...">
          </div>
          <button class="btn btn-primary" id="btn-search">Search</button>
        </div>

        <div class="search-filters">
          <div class="form-group" style="margin:0;min-width:160px;">
            <select class="form-select" id="search-member">
              <option value="">All Members</option>
              ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <input type="date" class="form-input" id="search-start-date" placeholder="From">
          </div>
          <div class="form-group" style="margin:0;">
            <input type="date" class="form-input" id="search-end-date" placeholder="To">
          </div>
          <div class="form-group" style="margin:0;min-width:140px;">
            <select class="form-select" id="search-project">
              <option value="">All Projects</option>
              ${PROJECTS.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-ghost" id="btn-clear-search">Clear</button>
        </div>
      </div>

      <div id="search-results"></div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('btn-search').addEventListener('click', () => this.doSearch());
    document.getElementById('search-query').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.doSearch();
    });
    document.getElementById('btn-clear-search').addEventListener('click', () => {
      document.getElementById('search-query').value = '';
      document.getElementById('search-member').value = '';
      document.getElementById('search-start-date').value = '';
      document.getElementById('search-end-date').value = '';
      document.getElementById('search-project').value = '';
      document.getElementById('search-results').innerHTML = '';
    });
  },

  async doSearch() {
    const query = document.getElementById('search-query').value.trim();
    const memberId = document.getElementById('search-member').value ? parseInt(document.getElementById('search-member').value) : null;
    const startDate = document.getElementById('search-start-date').value || null;
    const endDate = document.getElementById('search-end-date').value || null;
    const project = document.getElementById('search-project').value || null;

    if (!query && !memberId && !startDate && !endDate && !project) {
      showToast('Enter a search query or select filters', 'warning');
      return;
    }

    const results = await ReportsDB.searchFiltered({ query, memberId, startDate, endDate, project });
    const members = await MembersDB.getAll();
    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m; });

    const container = document.getElementById('search-results');

    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔎</div>
          <div class="empty-title">No results found</div>
          <div class="empty-desc">Try different keywords or adjust your filters</div>
        </div>
      `;
      return;
    }

    // Sort by date descending
    results.sort((a, b) => b.date.localeCompare(a.date));

    container.innerHTML = `
      <div style="margin-bottom:var(--space-md); color:var(--text-secondary); font-size:0.85rem;">
        Found <strong style="color:var(--text-primary);">${results.length}</strong> result${results.length !== 1 ? 's' : ''}
      </div>
      ${results.map(r => {
        const m = memberMap[r.memberId];
        if (!m) return '';

        return `
          <div class="member-card search-result">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-sm);">
              <div class="member-name" style="font-size:0.95rem;">
                <span class="avatar" style="width:28px;height:28px;font-size:0.7rem;">${getInitials(m.name)}</span>
                ${m.name}
              </div>
              <span style="font-size:0.78rem;color:var(--text-muted);">${formatDateShort(r.date)}</span>
            </div>
            <div class="separator"></div>

            ${r.yesterdayWork ? `<div class="field-group yesterday">
              <div class="field-label">Yesterday's Work</div>
              <div class="field-value">${this.highlightText(r.yesterdayWork, query)}</div>
            </div>` : ''}

            ${r.issueFaced ? `<div class="field-group issue">
              <div class="field-label">Issue Faced</div>
              <div class="field-value">${this.highlightText(r.issueFaced, query)}</div>
            </div>` : ''}

            ${r.solution ? `<div class="field-group solution">
              <div class="field-label">Solution</div>
              <div class="field-value">${this.highlightText(r.solution, query)}</div>
            </div>` : ''}

            ${r.currentWork ? `<div class="field-group current">
              <div class="field-label">Current Work</div>
              <div class="field-value">${this.highlightText(r.currentWork, query)}</div>
            </div>` : ''}

            ${r.description ? `<div class="field-group description">
              <div class="field-label">Description</div>
              <div class="field-value">${this.highlightText(r.description, query)}</div>
            </div>` : ''}

            ${(r.projects && r.projects.length > 0) ? `
              <div class="tags">
                ${r.projects.map(p => `<span class="tag ${getTagClass(p)}">${p}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    `;
  },

  highlightText(text, query) {
    if (!query || !text) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<span class="highlight">$1</span>');
  }
};
