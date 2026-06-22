'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MembersDB, ReportsDB, ProjectsDB, TeamsDB } from '@/lib/db';
import { todayStr, formatDate, getInitials, renderTextWithMentions, shiftDate } from '@/lib/utils';
import ProjectVelocity from '@/components/charts/ProjectVelocity';
import ActivityTimeline from '@/components/charts/ActivityTimeline';

export default function DashboardPage() {
  const [members, setMembers] = useState([]);
  const [todayReports, setTodayReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [issues, setIssues] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [chartData, setChartData] = useState({ timeline: [], velocity: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, r, p, t, i, all] = await Promise.all([
          MembersDB.getAll(),
          ReportsDB.getByDate(todayStr()),
          ProjectsDB.getAll(),
          TeamsDB.getAll(),
          ReportsDB.detectRecurringIssues(),
          ReportsDB.getAll()
        ]);
        setMembers(m);
        setTodayReports(r);
        setProjects(p);
        setTeams(t);
        const resolved = JSON.parse(localStorage.getItem('resolvedIssues') || '[]');
        setIssues(i.filter(x => !resolved.includes(x.keyword)));
        // Recent 10 reports
        setRecentReports(all.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt?.localeCompare(a.updatedAt || '')).slice(0, 8));

        // Generate Chart Data
        const last14Days = Array.from({ length: 14 }, (_, i) => shiftDate(todayStr(), -13 + i));
        const timeline = last14Days.map(d => {
          const dayReports = all.filter(x => x.date === d);
          return {
            date: d,
            submitted: dayReports.length,
            issues: dayReports.filter(x => x.issueFaced && x.issueFaced.trim() !== '').length
          };
        });

        const projectCounts = {};
        all.forEach(r => {
          r.projects?.forEach(pid => {
            projectCounts[pid] = (projectCounts[pid] || 0) + 1;
          });
        });
        const velocity = p
          .filter(proj => projectCounts[proj.id])
          .map(proj => ({
            name: proj.name,
            value: projectCounts[proj.id],
            fill: proj.color
          }))
          .sort((a, b) => b.value - a.value);

        setChartData({ timeline, velocity });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Loading...</div></div>;

  const submitted = todayReports.length;
  const total = members.length;
  const withIssues = todayReports.filter(r => r.issueFaced && r.issueFaced.trim()).length;
  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m; });

  const todayMemberIds = new Set(todayReports.map(r => r.memberId));
  const pendingMembers = members.filter(m => !todayMemberIds.has(m.id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🏠 <span className="accent">Dashboard</span></h2>
          <p className="page-subtitle">{formatDate(todayStr())}</p>
        </div>
        <Link href="/entry" className="btn btn-lime btn-lg">📝 New Entry</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{submitted}/{total}</div>
          <div className="stat-label">Today&apos;s Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingMembers.length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{withIssues}</div>
          <div className="stat-label">Issues Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{issues.length}</div>
          <div className="stat-label">Recurring Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Active Projects</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Pending Members */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--sp-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⏳ Pending Today
          </h3>
          {pendingMembers.length === 0 ? (
            <p style={{ color: 'var(--success)', fontSize: '0.88rem' }}>✅ All members have submitted!</p>
          ) : (
            pendingMembers.map(m => (
              <div key={m.id} className="no-entry-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                  <div className="avatar avatar-sm">{getInitials(m.name)}</div>
                  <span style={{ color: 'var(--text-muted)' }}>{m.name}</span>
                </div>
                <Link href={`/entry?member=${m.id}`} className="btn btn-ghost" style={{ fontSize: '0.78rem' }}>+ Add</Link>
              </div>
            ))
          )}
        </div>

        {/* Recurring Issues */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--sp-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Recurring Issues
            {issues.length > 0 && <span className="nav-badge">{issues.length}</span>}
          </h3>
          {issues.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No unresolved recurring issues</p>
          ) : (
            issues.slice(0, 4).map((issue, idx) => (
              <div key={idx} style={{ padding: 'var(--sp-sm) 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{issue.keyword}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({issue.count}× by {issue.members.join(', ')})</span>
              </div>
            ))
          )}
          {issues.length > 4 && <Link href="/issues" className="btn btn-ghost" style={{ marginTop: 'var(--sp-sm)', fontSize: '0.78rem' }}>View all →</Link>}
        </div>

        {/* Analytics Charts */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--sp-md)' }}>
          <ActivityTimeline data={chartData.timeline} />
          <ProjectVelocity data={chartData.velocity} />
        </div>

        {/* Recent Activity */}
        <div className="glass-card full-width">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--sp-md)' }}>
            📋 Recent Activity
          </h3>
          {recentReports.map((r, idx) => {
            const m = memberMap[r.memberId];
            return (
              <div key={idx} className="activity-item">
                <div className="avatar avatar-sm">{m ? getInitials(m.name) : '?'}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--lime)' }}>{m?.name || 'Unknown'}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{r.date}</span>
                  {r.currentWork && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Working on: {r.currentWork.substring(0, 80)}{r.currentWork.length > 80 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
