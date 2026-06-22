'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReportsDB, MembersDB } from '@/lib/db';
import { todayStr, shiftDate, getInitials } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function CarryOverPage() {
  const toast = useToast();
  const [date, setDate] = useState(todayStr());
  const [yesterdayReports, setYesterdayReports] = useState([]);
  const [todayReports, setTodayReports] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const yesterday = shiftDate(date, -1);
      const [y, t, m] = await Promise.all([
        ReportsDB.getByDate(yesterday),
        ReportsDB.getByDate(date),
        MembersDB.getAll()
      ]);
      setYesterdayReports(y);
      setTodayReports(t);
      setMembers(m);
      setLoading(false);
    }
    load();
  }, [date]);

  if (loading) return <div className="empty-state">Loading...</div>;

  const todayMemberIds = new Set(todayReports.map(r => r.memberId));
  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m);

  // Only show members who had "Current Work" yesterday
  const carryOverItems = yesterdayReports.filter(r => r.currentWork && r.currentWork.trim() !== '');

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🔄 <span className="accent">Carry-Over</span></h2>
          <p className="page-subtitle">Track yesterday's tasks for {date}</p>
        </div>
      </div>

      <div className="date-nav">
        <button className="btn btn-secondary btn-icon" onClick={() => setDate(shiftDate(date, -1))}>◀</button>
        <input type="date" className="form-input date-display" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn btn-secondary btn-icon" onClick={() => setDate(shiftDate(date, 1))}>▶</button>
        <button className="btn btn-ghost" onClick={() => setDate(todayStr())}>Today</button>
      </div>

      {carryOverItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Nothing to carry over</div>
          <div className="empty-desc">No tasks were recorded as "Current Work" yesterday.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          {carryOverItems.map(report => {
            const m = memberMap[report.memberId];
            if (!m) return null;
            const hasSubmittedToday = todayMemberIds.has(m.id);
            
            return (
              <div key={report.id} className="carryover-row">
                <div className="avatar">{getInitials(m.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', marginBottom: 8 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--lime)' }}>{m.name}</span>
                    {hasSubmittedToday ? (
                      <span className="status-badge status-done">✓ Submitted Today</span>
                    ) : (
                      <span className="status-badge status-pending">⏳ Pending Submission</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <strong>Yesterday's Plan: </strong> 
                    {report.currentWork}
                  </div>
                </div>
                {!hasSubmittedToday && (
                  <Link href={`/entry?member=${m.id}&date=${date}`} className="btn btn-lime">
                    Add Entry
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
