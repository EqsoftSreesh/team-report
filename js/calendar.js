/* ===================================================
   CALENDAR — Monthly calendar history browser
   =================================================== */

const CalendarModule = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),

  async init() {
    await this.render();
  },

  async render() {
    const panel = document.getElementById('panel-calendar');

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">📅 Calendar View</h2>
          <p class="section-subtitle">Browse past daily reports</p>
        </div>
      </div>

      <div class="card">
        <div class="calendar-nav">
          <button class="btn btn-secondary btn-icon" id="cal-prev-month">◀</button>
          <span class="month-year" id="cal-month-label"></span>
          <button class="btn btn-secondary btn-icon" id="cal-next-month">▶</button>
        </div>

        <div class="calendar-grid" id="cal-grid">
          <div class="calendar-header-cell">Sun</div>
          <div class="calendar-header-cell">Mon</div>
          <div class="calendar-header-cell">Tue</div>
          <div class="calendar-header-cell">Wed</div>
          <div class="calendar-header-cell">Thu</div>
          <div class="calendar-header-cell">Fri</div>
          <div class="calendar-header-cell">Sat</div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadMonth();
  },

  bindEvents() {
    document.getElementById('cal-prev-month').addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.loadMonth();
    });

    document.getElementById('cal-next-month').addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.loadMonth();
    });
  },

  async loadMonth() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('cal-month-label').textContent =
      `${months[this.currentMonth]} ${this.currentYear}`;

    const totalMembers = (await MembersDB.getAll()).length;
    const entriesMap = await ReportsDB.getDatesWithEntries(this.currentYear, this.currentMonth);

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    const today = todayStr();
    const grid = document.getElementById('cal-grid');

    // Remove existing day cells (keep headers)
    const existingCells = grid.querySelectorAll('.calendar-cell');
    existingCells.forEach(c => c.remove());

    // Previous month padding
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell other-month';
      cell.innerHTML = `<span class="day-num">${prevMonthDays - i}</span>`;
      grid.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entries = entriesMap[dateStr] || 0;
      const isToday = dateStr === today;

      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      if (isToday) cell.classList.add('today');
      if (entries > 0) cell.classList.add('has-entries');

      cell.innerHTML = `
        <span class="day-num">${day}</span>
        ${entries > 0 ? `<span class="entry-count">${entries}/${totalMembers}</span>` : ''}
      `;

      cell.addEventListener('click', () => {
        // Navigate to daily view for this date
        DailyViewModule.currentDate = dateStr;
        App.switchTab('daily');
      });

      grid.appendChild(cell);
    }

    // Next month padding
    const totalCells = firstDay + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell other-month';
      cell.innerHTML = `<span class="day-num">${i}</span>`;
      grid.appendChild(cell);
    }
  }
};
