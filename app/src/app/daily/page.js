'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MembersDB, ReportsDB, ProjectsDB } from '@/lib/db';
import { todayStr, formatDate, shiftDate, renderTextWithMentions, getInitials } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function DailyViewPage() {
  const toast = useToast();
  const [date, setDate] = useState(todayStr());
  const [reports, setReports] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [r, m, p] = await Promise.all([
        ReportsDB.getByDate(date),
        MembersDB.getAll(),
        ProjectsDB.getAll()
      ]);
      setReports(r);
      setMembers(m);
      setProjects(p);
      setLoading(false);
    }
    load();
  }, [date]);

  const handleCopy = () => {
    let text = `Team Report — ${formatDate(date)}\n\n`;
    const memberMap = {};
    members.forEach(m => memberMap[m.id] = m);

    reports.forEach(r => {
      const m = memberMap[r.memberId];
      if (!m) return;
      text += `--- ${m.name} ---\n`;
      if (r.yesterdayWork) text += `Yesterday's Work: ${r.yesterdayWork}\n`;
      if (r.issueFaced) text += `Issue: ${r.issueFaced}\n`;
      if (r.solution) text += `Solution: ${r.solution}\n`;
      if (r.currentWork) text += `Current Work: ${r.currentWork}\n`;
      if (r.description) text += `Description: ${r.description}\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    toast('Copied to clipboard!', 'success');
  };

  const projectMap = {};
  projects.forEach(p => projectMap[p.id] = p);

  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m);

  const submittedMemberIds = new Set(reports.map(r => r.memberId));
  const activeProjects = new Set();
  reports.forEach(r => {
    r.projects?.forEach(pId => activeProjects.add(pId));
  });
  const issueCount = reports.filter(r => r.issueFaced && r.issueFaced.trim() !== '').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📊 <span className="accent">Daily Report</span></h2>
          <p className="page-subtitle">{formatDate(date)}</p>
        </div>
        <button className="btn btn-glass" onClick={handleCopy}>📋 Copy Text</button>
      </div>

      <div className="date-nav">
        <button className="btn btn-secondary btn-icon" onClick={() => setDate(shiftDate(date, -1))}>◀</button>
        <input type="date" className="form-input date-display" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn btn-secondary btn-icon" onClick={() => setDate(shiftDate(date, 1))}>▶</button>
        <button className="btn btn-ghost" onClick={() => setDate(todayStr())}>Today</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{reports.length}/{members.length}</div>
          <div className="stat-label">Submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{issueCount}</div>
          <div className="stat-label">Issues Reported</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeProjects.size}</div>
          <div className="stat-label">Active Projects</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <div className="empty-title">No entries yet for {formatDate(date)}</div>
        </div>
      ) : (
        <div>
          {members.map(member => {
            const report = reports.find(r => r.memberId === member.id);
            if (!report) {
              if (date === todayStr()) {
                return (
                  <div key={member.id} className="no-entry-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                      <div className="avatar avatar-sm">{getInitials(member.name)}</div>
                      <span>{member.name}</span>
                    </div>
                    <Link href={`/entry?member=${member.id}`} className="btn btn-ghost">Add Entry</Link>
                  </div>
                );
              }
              return null; // Don't show missing for past days unless we want to
            }

            return (
              <div key={member.id} className="member-report-card">
                <div className="member-name-row">
                  <div className="avatar">{getInitials(member.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="member-name-text">{member.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.role}</div>
                  </div>
                  <Link href={`/entry?member=${member.id}&date=${date}`} className="btn btn-ghost btn-icon">✏️</Link>
                </div>
                <div className="card-divider" />

                <div className="field-row f-yesterday">
                  <div className="field-label">Yesterday's Work Completed</div>
                  <div className={`field-value ${!report.yesterdayWork ? 'empty' : ''}`}
                    dangerouslySetInnerHTML={{ __html: renderTextWithMentions(report.yesterdayWork || 'Nothing recorded', projects) }} />
                </div>
                <div className="field-row f-issue">
                  <div className="field-label">Issue Faced</div>
                  <div className={`field-value ${!report.issueFaced ? 'empty' : ''}`}
                    dangerouslySetInnerHTML={{ __html: renderTextWithMentions(report.issueFaced || 'No issues', projects) }} />
                </div>
                <div className="field-row f-solution">
                  <div className="field-label">Solution</div>
                  <div className={`field-value ${!report.solution ? 'empty' : ''}`}
                    dangerouslySetInnerHTML={{ __html: renderTextWithMentions(report.solution || 'N/A', projects) }} />
                </div>
                <div className="field-row f-current">
                  <div className="field-label">Current / Today's Work</div>
                  <div className={`field-value ${!report.currentWork ? 'empty' : ''}`}
                    dangerouslySetInnerHTML={{ __html: renderTextWithMentions(report.currentWork || 'Nothing recorded', projects) }} />
                </div>
                <div className="field-row f-description">
                  <div className="field-label">Description / Notes</div>
                  <div className={`field-value ${!report.description ? 'empty' : ''}`}
                    dangerouslySetInnerHTML={{ __html: renderTextWithMentions(report.description || 'N/A', projects) }} />
                </div>

                {report.images && report.images.length > 0 && (
                  <div className="field-row" style={{ background: 'transparent' }}>
                    <div className="field-label">Attachments</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {report.images.map((img, idx) => (
                        <div key={idx} style={{ width: 80, height: 80, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', cursor: 'zoom-in' }} onClick={() => setSelectedImage(img)}>
                          <img src={img} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.projects && report.projects.length > 0 && (
                  <div className="tags-row">
                    {report.projects.map(pid => {
                      const proj = projectMap[pid];
                      if (!proj) return null;
                      return (
                        <span key={pid} className="tag" style={{ borderColor: proj.color + '40', background: proj.color + '15', color: proj.color }}>
                          {proj.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Image Zoom Modal */}
      {selectedImage && (
        <div className="modal-overlay open" onClick={() => setSelectedImage(null)}>
          <div className="modal-box" style={{ maxWidth: '90vw', maxHeight: '90vh', background: 'transparent', border: 'none', boxShadow: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Zoomed Attachment" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
            <button className="btn btn-icon" onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', color: 'white' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
