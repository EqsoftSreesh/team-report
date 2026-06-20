'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReportsDB } from '@/lib/db';
import { formatDateShort } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function IssuesPage() {
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [resolvedKeywords, setResolvedKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const i = await ReportsDB.detectRecurringIssues();
    setIssues(i);
    const resolved = JSON.parse(localStorage.getItem('resolvedIssues') || '[]');
    setResolvedKeywords(resolved);
    setLoading(false);
  }

  const toggleResolved = (keyword) => {
    let newResolved;
    if (resolvedKeywords.includes(keyword)) {
      newResolved = resolvedKeywords.filter(k => k !== keyword);
      toast('Issue reopened', 'info');
    } else {
      newResolved = [...resolvedKeywords, keyword];
      toast('Issue marked as resolved', 'success');
    }
    setResolvedKeywords(newResolved);
    localStorage.setItem('resolvedIssues', JSON.stringify(newResolved));
  };

  const activeIssues = issues.filter(i => !resolvedKeywords.includes(i.keyword));
  const resolvedIssues = issues.filter(i => resolvedKeywords.includes(i.keyword));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>⚠️ <span className="accent">Recurring Issues</span></h2>
          <p className="page-subtitle">Auto-detected blockers that persist across multiple days</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">Zero Recurring Issues!</div>
          <div className="empty-desc">The team is crushing it. No blockers have persisted across multiple days.</div>
        </div>
      ) : (
        <>
          <h3 style={{ marginBottom: 'var(--sp-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Active Issues <span className="nav-badge" style={{ position: 'static' }}>{activeIssues.length}</span>
          </h3>
          
          {activeIssues.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active recurring issues.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-2xl)' }}>
            {activeIssues.map((issue, idx) => (
              <div key={idx} className="issue-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="issue-keyword">"{issue.keyword}"</div>
                    <div className="issue-meta">
                      <span>Occurrences: <strong>{issue.count}</strong></span>
                      <span>•</span>
                      <span>Members: <strong>{issue.members.join(', ')}</strong></span>
                      <span>•</span>
                      <span>First seen: {formatDateShort(issue.firstSeen)}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => toggleResolved(issue.keyword)}>✓ Resolve</button>
                </div>
                
                <div style={{ marginTop: 'var(--sp-sm)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Timeline</div>
                  {issue.occurrences.map((o, i) => (
                    <div key={i} className="timeline-row">
                      <div className="timeline-date">{formatDateShort(o.date)}</div>
                      <div className="timeline-member">{o.memberName}:</div>
                      <div className="timeline-text">{o.issue}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {resolvedIssues.length > 0 && (
            <>
              <h3 style={{ marginBottom: 'var(--sp-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Resolved
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                {resolvedIssues.map((issue, idx) => (
                  <div key={idx} className="issue-card resolved">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="issue-keyword">"{issue.keyword}"</div>
                      <button className="btn btn-ghost" onClick={() => toggleResolved(issue.keyword)}>Reopen</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
