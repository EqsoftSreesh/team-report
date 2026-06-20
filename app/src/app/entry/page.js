'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MembersDB, ReportsDB, ProjectsDB, TeamsDB } from '@/lib/db';
import { todayStr, getInitials, escapeHtml } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import MentionTextarea from '@/components/forms/MentionTextarea';

function EntryForm() {
  const toast = useToast();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [date, setDate] = useState(todayStr());
  const [yesterdayWork, setYesterdayWork] = useState('');
  const [issueFaced, setIssueFaced] = useState('');
  const [solution, setSolution] = useState('');
  const [currentWork, setCurrentWork] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [status, setStatus] = useState('');
  const [carryoverHint, setCarryoverHint] = useState(null);
  const [todayReports, setTodayReports] = useState([]);

  useEffect(() => {
    async function load() {
      const [m, p, t] = await Promise.all([MembersDB.getAll(), ProjectsDB.getAll(), TeamsDB.getAll()]);
      const teamMap = {};
      t.forEach(tm => { teamMap[tm.id] = tm.name; });
      const enrichedProjects = p.map(proj => ({ ...proj, teamName: teamMap[proj.teamId] || '' }));
      setMembers(m);
      setProjects(enrichedProjects);
      // Pre-select from URL query
      const memberParam = searchParams.get('member');
      if (memberParam) setSelectedMember(memberParam);
    }
    load();
  }, [searchParams]);

  useEffect(() => {
    loadTodayReports();
  }, [date]);

  useEffect(() => {
    if (selectedMember && date) {
      loadExisting();
      checkCarryOver();
    }
  }, [selectedMember, date]);

  async function loadTodayReports() {
    const r = await ReportsDB.getByDate(todayStr());
    setTodayReports(r);
  }

  async function loadExisting() {
    const memberId = parseInt(selectedMember);
    if (!memberId) return;
    const report = await ReportsDB.getByMemberAndDate(memberId, date);
    if (report) {
      setYesterdayWork(report.yesterdayWork || '');
      setIssueFaced(report.issueFaced || '');
      setSolution(report.solution || '');
      setCurrentWork(report.currentWork || '');
      setDescription(report.description || '');
      setSelectedProjects(report.projects || []);
      setStatus('📄 Editing existing entry');
    } else {
      clearFields();
      setStatus('🆕 New entry');
    }
  }

  async function checkCarryOver() {
    const memberId = parseInt(selectedMember);
    if (!memberId) return;
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const yesterdayReport = await ReportsDB.getByMemberAndDate(memberId, yesterday);
    if (yesterdayReport?.currentWork && !yesterdayWork) {
      setCarryoverHint(yesterdayReport.currentWork);
    } else {
      setCarryoverHint(null);
    }
  }

  function clearFields() {
    setYesterdayWork('');
    setIssueFaced('');
    setSolution('');
    setCurrentWork('');
    setDescription('');
    setSelectedProjects([]);
    setCarryoverHint(null);
    setStatus('');
  }

  function toggleProject(projectId) {
    setSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  }

  async function handleSave() {
    const memberId = parseInt(selectedMember);
    if (!memberId) { toast('Select a team member', 'error'); return; }
    if (!date) { toast('Select a date', 'error'); return; }

    await ReportsDB.save({
      memberId, date,
      yesterdayWork: yesterdayWork.trim(),
      issueFaced: issueFaced.trim(),
      solution: solution.trim(),
      currentWork: currentWork.trim(),
      description: description.trim(),
      projects: selectedProjects
    });

    const member = await MembersDB.getById(memberId);
    toast(`Saved entry for ${member.name}!`, 'success');
    setStatus('✅ Saved!');
    loadTodayReports();
  }

  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  }

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m; });

  return (
    <div onKeyDown={handleKeyDown}>
      <div className="page-header">
        <div>
          <h2>📝 <span className="accent">Daily Entry</span></h2>
          <p className="page-subtitle">Add or edit a team member&apos;s daily report</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Team Member</label>
            <select className="form-select" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}>
              <option value="">Select a member...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {carryoverHint && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
            padding: 'var(--sp-sm) var(--sp-md)',
            background: 'var(--lime-subtle)', border: '1px solid var(--lime-border)',
            borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-md)'
          }}>
            <span>💡</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>
              Yesterday&apos;s work: {carryoverHint.substring(0, 100)}{carryoverHint.length > 100 ? '...' : ''}
            </span>
            <button className="btn btn-ghost" style={{ fontSize: '0.78rem' }} onClick={() => { setYesterdayWork(carryoverHint); setCarryoverHint(null); toast('Carried over!', 'success'); }}>
              Apply
            </button>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Yesterday&apos;s Work Completed</label>
          <MentionTextarea value={yesterdayWork} onChange={setYesterdayWork} projects={projects} placeholder="What did you complete yesterday? Use @ to tag projects" rows={2} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Issue Faced</label>
            <MentionTextarea value={issueFaced} onChange={setIssueFaced} projects={projects} placeholder="Any blockers or issues? Use @ to tag projects" rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Solution</label>
            <MentionTextarea value={solution} onChange={setSolution} projects={projects} placeholder="How was it resolved?" rows={2} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Current / Today&apos;s Work</label>
          <MentionTextarea value={currentWork} onChange={setCurrentWork} projects={projects} placeholder="What are you working on today? Use @ to tag projects" rows={2} />
        </div>

        <div className="form-group">
          <label className="form-label">Description / Notes</label>
          <MentionTextarea value={description} onChange={setDescription} projects={projects} placeholder="Any additional notes..." rows={2} />
        </div>

        <div className="form-group">
          <label className="form-label">Project Tags</label>
          <div className="tag-selector">
            {projects.map(p => (
              <span
                key={p.id}
                className={`tag-option ${selectedProjects.includes(p.id) ? 'selected' : ''}`}
                style={selectedProjects.includes(p.id) ? { borderColor: p.color + '40', background: p.color + '15', color: p.color } : {}}
                onClick={() => toggleProject(p.id)}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--sp-lg)' }}>
          <span className="form-hint" style={{ color: status.includes('✅') ? 'var(--success)' : 'var(--lime)' }}>{status}</span>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            <button className="btn btn-glass" onClick={clearFields}>Clear</button>
            <button className="btn btn-lime btn-lg" onClick={handleSave}>
              💾 Save Entry <span className="kbd" style={{ marginLeft: 8 }}>Ctrl+Enter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's preview */}
      {todayReports.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--sp-md)' }}>
            Today&apos;s Entries ({todayReports.length}/{members.length})
          </h3>
          {todayReports.map(r => {
            const m = memberMap[r.memberId];
            if (!m) return null;
            return (
              <div key={r.id} className="member-report-card" style={{ padding: 'var(--sp-md)' }}>
                <div className="member-name-row" style={{ fontSize: '0.92rem' }}>
                  <div className="avatar avatar-sm">{getInitials(m.name)}</div>
                  <span className="member-name-text" style={{ fontSize: '0.95rem' }}>{m.name}</span>
                </div>
                <div className="card-divider" />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {r.currentWork && <div><strong style={{ color: 'var(--lime)' }}>Working on:</strong> {r.currentWork.substring(0, 80)}</div>}
                  {r.issueFaced && <div style={{ color: 'var(--danger)' }}><strong>⚠️ Issue:</strong> {r.issueFaced.substring(0, 80)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Loading...</div></div>}>
      <EntryForm />
    </Suspense>
  );
}
