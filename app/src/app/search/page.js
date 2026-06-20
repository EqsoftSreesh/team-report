'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MembersDB, ReportsDB, ProjectsDB } from '@/lib/db';
import { getInitials, renderTextWithMentions } from '@/lib/utils';

export default function SearchPage() {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function load() {
      const [m, p] = await Promise.all([MembersDB.getAll(), ProjectsDB.getAll()]);
      setMembers(m);
      setProjects(p);
    }
    load();
  }, []);

  const handleSearch = async () => {
    const filters = {
      query: query.trim(),
      memberId: selectedMember ? parseInt(selectedMember) : null,
      projectId: selectedProject ? parseInt(selectedProject) : null,
      startDate: startDate || null,
      endDate: endDate || null
    };

    const res = await ReportsDB.searchFiltered(filters);
    // Sort by date desc
    setResults(res.sort((a, b) => b.date.localeCompare(a.date)));
    setHasSearched(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m);

  const highlight = (text) => {
    if (!text) return 'N/A';
    if (!query.trim()) return renderTextWithMentions(text, projects);
    
    // First render mentions, then highlight query
    let html = renderTextWithMentions(text, projects);
    const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${q})`, 'gi');
    return html.replace(regex, '<span class="highlight-match">$1</span>');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🔍 <span className="accent">Search</span></h2>
          <p className="page-subtitle">Find anything across all reports</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 'var(--sp-xl)' }}>
        <div className="search-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search keywords (e.g. 'premium', 'server')..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="btn btn-lime" onClick={handleSearch}>Search</button>
        </div>

        <div className="search-filters">
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Member</label>
            <select className="form-select" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}>
              <option value="">All Members</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Project</label>
            <select className="form-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {hasSearched && (
        <div>
          <h3 style={{ marginBottom: 'var(--sp-md)' }}>{results.length} Results Found</h3>
          
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🤷‍♂️</div>
              <div className="empty-title">No matching reports</div>
              <div className="empty-desc">Try adjusting your search terms or filters</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              {results.map(r => {
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
                        <span dangerouslySetInnerHTML={{ __html: highlight(r.yesterdayWork) }} />
                      </div>
                    )}
                    {r.issueFaced && (
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>ISSUE: </strong>
                        <span dangerouslySetInnerHTML={{ __html: highlight(r.issueFaced) }} />
                      </div>
                    )}
                    {r.solution && (
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>SOLUTION: </strong>
                        <span dangerouslySetInnerHTML={{ __html: highlight(r.solution) }} />
                      </div>
                    )}
                    {r.currentWork && (
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--lime)' }}>CURRENT: </strong>
                        <span dangerouslySetInnerHTML={{ __html: highlight(r.currentWork) }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
