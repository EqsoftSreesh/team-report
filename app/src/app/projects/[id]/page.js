'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ReportsDB, ProjectsDB, MembersDB } from '@/lib/db';
import { todayStr, shiftDate, renderTextWithMentions, getInitials } from '@/lib/utils';
import Link from 'next/link';

export default function ProjectDetailPage({ params }) {
  const projectId = parseInt(params.id);
  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, allReports, m] = await Promise.all([
        ProjectsDB.getById(projectId),
        ReportsDB.getAll(),
        MembersDB.getAllIncludingInactive()
      ]);
      
      setProject(p);
      setMembers(m);
      
      // Filter reports mentioning this project
      const projectReports = allReports.filter(r => 
        (r.projects && r.projects.includes(projectId)) || 
        (r.yesterdayWork && r.yesterdayWork.includes(`@${p?.name}`)) ||
        (r.issueFaced && r.issueFaced.includes(`@${p?.name}`)) ||
        (r.solution && r.solution.includes(`@${p?.name}`)) ||
        (r.currentWork && r.currentWork.includes(`@${p?.name}`))
      ).sort((a, b) => b.date.localeCompare(a.date));
      
      setReports(projectReports);
      setLoading(false);
    }
    if (projectId) load();
  }, [projectId]);

  if (loading) return <div className="empty-state">Loading...</div>;
  if (!project) return <div className="empty-state">Project not found</div>;

  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m);
  
  const issueReports = reports.filter(r => r.issueFaced && r.issueFaced.trim() !== '');

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--sp-md)' }}>
        <div>
          <Link href="/projects" className="btn btn-ghost" style={{ marginBottom: 'var(--sp-sm)', display: 'inline-block', padding: '0 8px' }}>← Back to Projects</Link>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
            <div className="project-dot" style={{ width: 16, height: 16, background: project.color, borderRadius: '50%', position: 'static' }} />
            {project.name}
          </h2>
          <p className="page-subtitle">{project.description || 'No description'}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
          <span className="tag" style={{ borderColor: project.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>{project.status}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Total Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{issueReports.length}</div>
          <div className="stat-label">Issues Reported</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{new Set(reports.map(r => r.memberId)).size}</div>
          <div className="stat-label">Contributors</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 'var(--sp-md)' }}>Project Timeline</h3>
      
      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No activity yet</div>
          <div className="empty-desc">Entries mentioning @{project.name} will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          {reports.map(r => {
            const m = memberMap[r.memberId];
            return (
              <div key={r.id} className="member-report-card">
                <div className="member-name-row">
                  <div className="avatar avatar-sm">{m ? getInitials(m.name) : '?'}</div>
                  <div style={{ flex: 1 }}>
                    <span className="member-name-text" style={{ fontSize: '1rem' }}>{m?.name || 'Unknown'}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.8rem' }}>{r.date}</span>
                  </div>
                  <Link href={`/daily?date=${r.date}`} className="btn btn-ghost btn-icon" title="View in Daily Report">👁️</Link>
                </div>
                <div className="card-divider" style={{ margin: '8px 0' }} />
                
                {r.yesterdayWork && (
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--success)' }}>YESTERDAY: </strong>
                    <span dangerouslySetInnerHTML={{ __html: renderTextWithMentions(r.yesterdayWork, [project]) }} />
                  </div>
                )}
                {r.issueFaced && (
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>ISSUE: </strong>
                    <span dangerouslySetInnerHTML={{ __html: renderTextWithMentions(r.issueFaced, [project]) }} />
                  </div>
                )}
                {r.currentWork && (
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--lime)' }}>CURRENT: </strong>
                    <span dangerouslySetInnerHTML={{ __html: renderTextWithMentions(r.currentWork, [project]) }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
