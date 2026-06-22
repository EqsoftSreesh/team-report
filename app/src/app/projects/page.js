'use client';

import { useState, useEffect } from 'react';
import { MembersDB, ProjectsDB, TeamsDB } from '@/lib/db';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

export default function ProjectsPage() {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editProject, setEditProject] = useState(null);

  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', color: '#C6FF33', icon: '📁' });
  const [projectForm, setProjectForm] = useState({ teamId: '', name: '', color: '#ffffff', status: 'active', description: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [t, p] = await Promise.all([TeamsDB.getAll(), ProjectsDB.getAll()]);
    setTeams(t);
    setProjects(p);
    setLoading(false);
  }

  const handleSaveTeam = async () => {
    if (!teamForm.name) return toast('Name is required', 'error');
    await TeamsDB.add(teamForm);
    toast('Team created!', 'success');
    setShowTeamModal(false);
    load();
  };

  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.teamId) return toast('Name and Team are required', 'error');
    
    if (editProject) {
      await ProjectsDB.update(editProject.id, {
        ...projectForm,
        teamId: parseInt(projectForm.teamId)
      });
      toast('Project updated!', 'success');
    } else {
      await ProjectsDB.add({
        ...projectForm,
        teamId: parseInt(projectForm.teamId)
      });
      toast('Project created!', 'success');
    }
    
    setShowProjectModal(false);
    setEditProject(null);
    load();
  };

  const openEditProject = (project) => {
    setEditProject(project);
    setProjectForm({
      teamId: project.teamId,
      name: project.name,
      color: project.color || '#ffffff',
      status: project.status || 'active',
      description: project.description || ''
    });
    setShowProjectModal(true);
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📦 <span className="accent">Project Management</span></h2>
          <p className="page-subtitle">Manage teams, projects, and @mention tags</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
          <button className="btn btn-glass" onClick={() => { setTeamForm({ name: '', color: '#C6FF33', icon: '📁' }); setShowTeamModal(true); }}>+ Add Team</button>
          <button className="btn btn-lime" onClick={() => { setProjectForm({ teamId: teams[0]?.id || '', name: '', color: '#ffffff', status: 'active', description: '' }); setEditProject(null); setShowProjectModal(true); }}>+ Add Project</button>
        </div>
      </div>

      {teams.map(team => {
        const teamProjects = projects.filter(p => p.teamId === team.id);
        
        return (
          <div key={team.id} className="team-section">
            <div className="team-header">
              <span className="team-icon">{team.icon}</span>
              <span style={{ color: team.color }}>{team.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 8 }}>({teamProjects.length})</span>
            </div>

            <div className="project-grid">
              {teamProjects.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--sp-md)' }}>No projects in this team</div>
              ) : (
                teamProjects.map(proj => (
                  <div key={proj.id} className="project-card" onClick={() => openEditProject(proj)}>
                    <div className="project-dot" style={{ background: proj.color }} />
                    <div className="project-name">{proj.name}</div>
                    <div className="project-team">{proj.description || 'No description'}</div>
                    <div className="project-stats">
                      <span style={{ color: proj.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>
                        ● {proj.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Add Team Modal */}
      <Modal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} title="Add Team / Category" onConfirm={handleSaveTeam}>
        <div className="form-group">
          <label className="form-label">Team Name</label>
          <input className="form-input" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} placeholder="e.g. Mobile, Web, Design" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Icon (Emoji)</label>
            <input className="form-input" value={teamForm.icon} onChange={e => setTeamForm({...teamForm, icon: e.target.value})} placeholder="📱" />
          </div>
          <div className="form-group">
            <label className="form-label">Theme Color</label>
            <input type="color" className="form-input" style={{ padding: '2px 8px', height: 42 }} value={teamForm.color} onChange={e => setTeamForm({...teamForm, color: e.target.value})} />
          </div>
        </div>
      </Modal>

      {/* Add/Edit Project Modal */}
      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title={editProject ? "Edit Project" : "Add Project"} onConfirm={handleSaveProject}>
        <div className="form-group">
          <label className="form-label">Team</label>
          <select className="form-select" value={projectForm.teamId} onChange={e => setProjectForm({...projectForm, teamId: e.target.value})}>
            <option value="">Select a team...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input className="form-input" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} placeholder="e.g. Beautysync" />
          <div className="form-hint">This will be the @mention tag (e.g. @{projectForm.name || 'Project'})</div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tag Color</label>
            <input type="color" className="form-input" style={{ padding: '2px 8px', height: 42 }} value={projectForm.color} onChange={e => setProjectForm({...projectForm, color: e.target.value})} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
