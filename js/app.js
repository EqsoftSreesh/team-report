/* ===================================================
   APP — Main application controller
   Tab routing, navigation, global utilities
   =================================================== */

// Global HTML escape utility
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Main App Controller
const App = {
  currentTab: 'entry',

  async init() {
    // Seed database on first run
    await seedDatabase();

    // Render header
    this.renderHeader();

    // Initialize all modules
    await EntryModule.init();
    await DailyViewModule.init();
    await CalendarModule.init();
    await SearchModule.init();
    await IssuesModule.init();
    await ExportModule.init();
    await MembersModule.init();
    await CarryOverModule.init();

    // Set up tab navigation
    this.bindTabs();

    // Show default tab
    this.switchTab('entry');

    // Update stats
    this.updateStats();

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        const tabMap = {
          '1': 'entry', '2': 'daily', '3': 'calendar', '4': 'carryover',
          '5': 'search', '6': 'issues', '7': 'export', '8': 'members'
        };
        if (tabMap[e.key]) {
          e.preventDefault();
          this.switchTab(tabMap[e.key]);
        }
      }
    });

    console.log('📋 Standup Tracker initialized!');
  },

  renderHeader() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    document.getElementById('app-header').innerHTML = `
      <div class="logo">
        <div class="logo-icon">📋</div>
        <div>
          <h1>Team Standup Tracker</h1>
          <span class="header-date">${dateStr}</span>
        </div>
      </div>
      <div class="header-actions" id="header-stats">
        <!-- Stats rendered dynamically -->
      </div>
    `;
  },

  async updateStats() {
    const members = await MembersDB.getAll();
    const todayReports = await ReportsDB.getByDate(todayStr());

    const headerStats = document.getElementById('header-stats');
    if (headerStats) {
      headerStats.innerHTML = `
        <span style="font-size:0.82rem; color:var(--text-muted);">
          Today: <strong style="color:${todayReports.length === members.length ? 'var(--accent-success)' : 'var(--accent-warning)'}">${todayReports.length}/${members.length}</strong> entries
        </span>
      `;
    }
  },

  bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
  },

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tab}`);
    });

    // Re-render the active panel
    switch (tab) {
      case 'entry':
        EntryModule.render().then(() => EntryModule.bindEvents());
        break;
      case 'daily':
        DailyViewModule.render();
        break;
      case 'calendar':
        CalendarModule.render();
        break;
      case 'search':
        SearchModule.render();
        break;
      case 'issues':
        IssuesModule.render();
        break;
      case 'export':
        ExportModule.render();
        break;
      case 'members':
        MembersModule.render();
        break;
      case 'carryover':
        CarryOverModule.render();
        break;
    }
  },

  switchToEntry(memberId) {
    this.switchTab('entry');
    setTimeout(() => {
      document.getElementById('entry-member').value = memberId;
      document.getElementById('entry-member').dispatchEvent(new Event('change'));
    }, 100);
  },

  updateIssueBadge(count) {
    const badge = document.getElementById('issue-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  // Modal system
  showModal(title, content, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    const modalEl = overlay.querySelector('.modal');

    modalEl.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="btn btn-ghost btn-icon" id="modal-close">✕</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Save</button>
      </div>
    `;

    overlay.classList.add('open');

    document.getElementById('modal-close').addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    document.getElementById('modal-confirm').addEventListener('click', async () => {
      const result = await onConfirm();
      if (result !== false) {
        overlay.classList.remove('open');
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });

    // Focus first input
    setTimeout(() => {
      const firstInput = modalEl.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 100);
  }
};

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(err => {
    console.error('Failed to initialize app:', err);
    showToast('Failed to load app: ' + err.message, 'error');
  });
});
