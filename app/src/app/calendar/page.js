'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ReportsDB } from '@/lib/db';
import { todayStr, shiftDate } from '@/lib/utils';

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateMap, setDateMap] = useState({});

  useEffect(() => {
    async function load() {
      const map = await ReportsDB.getDatesWithEntries(currentMonth.getFullYear(), currentMonth.getMonth());
      setDateMap(map);
    }
    load();
  }, [currentMonth]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const today = todayStr();

  const handleDayClick = (dateStr) => {
    router.push(`/daily?date=${dateStr}`);
  };

  const days = [];
  // Empty slots before 1st day
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="cal-cell other-month"></div>);
  }

  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const count = dateMap[dStr] || 0;
    const isToday = dStr === today;
    
    days.push(
      <div 
        key={dStr} 
        className={`cal-cell ${isToday ? 'today' : ''} ${count > 0 ? 'has-entries' : ''}`}
        onClick={() => handleDayClick(dStr)}
      >
        <span className="day-num">{i}</span>
        {count > 0 && <span className="entry-dot">{count} entries</span>}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📅 <span className="accent">Calendar History</span></h2>
          <p className="page-subtitle">Browse entries by date</p>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="cal-nav">
          <button className="btn btn-secondary btn-icon" onClick={prevMonth}>◀</button>
          <div className="month-label">{monthLabel}</div>
          <button className="btn btn-secondary btn-icon" onClick={nextMonth}>▶</button>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="cal-header">{day}</div>
          ))}
          {days}
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--sp-md)', justifyContent: 'center', marginTop: 'var(--sp-lg)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 12, background: 'var(--lime-subtle)', border: '1px solid var(--lime-border)' }}/> Today</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 12, background: 'rgba(198, 255, 51, 0.04)', border: '1px solid rgba(255,255,255,0.05)' }}/> Has Entries</div>
        </div>
      </div>
    </div>
  );
}
