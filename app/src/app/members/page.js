'use client';

import { useState, useEffect } from 'react';
import { MembersDB } from '@/lib/db';
import Modal from '@/components/ui/Modal';
import { getInitials } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function MembersPage() {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ name: '', role: 'Developer' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const m = await MembersDB.getAllIncludingInactive();
    setMembers(m);
    setLoading(false);
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast('Name is required', 'error');
    
    if (editMember) {
      await MembersDB.update(editMember.id, { name: form.name.trim(), role: form.role.trim() });
      toast('Member updated!', 'success');
    } else {
      await MembersDB.add(form.name, form.role);
      toast('Member added!', 'success');
    }
    
    setShowModal(false);
    load();
  };

  const toggleActive = async (member) => {
    if (member.active) {
      await MembersDB.deactivate(member.id);
      toast(`${member.name} deactivated`, 'info');
    } else {
      await MembersDB.reactivate(member.id);
      toast(`${member.name} activated`, 'success');
    }
    load();
  };

  const openEdit = (member) => {
    setEditMember(member);
    setForm({ name: member.name, role: member.role });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditMember(null);
    setForm({ name: '', role: 'Developer' });
    setShowModal(true);
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  const activeCount = members.filter(m => m.active).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>👥 <span className="accent">Team Members</span></h2>
          <p className="page-subtitle">{activeCount} active team members</p>
        </div>
        <button className="btn btn-lime" onClick={openAdd}>+ Add Member</button>
      </div>

      <div className="members-grid">
        {members.map(member => (
          <div key={member.id} className="member-card" style={{ opacity: member.active ? 1 : 0.5 }}>
            <div className="avatar" style={{ background: member.active ? 'var(--lime)' : 'var(--surface-3)', color: member.active ? 'var(--black)' : 'var(--text-muted)' }}>
              {getInitials(member.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: member.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{member.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{member.role}</div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => openEdit(member)}>✏️</button>
              <button 
                className="btn btn-ghost btn-icon" 
                title={member.active ? "Deactivate" : "Activate"}
                onClick={() => toggleActive(member)}
              >
                {member.active ? '🚫' : '✅'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMember ? "Edit Member" : "Add Member"} onConfirm={handleSave}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <input className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="e.g. Developer, Designer, Manager" />
        </div>
        {editMember && (
          <div className="form-hint" style={{ marginTop: 'var(--sp-md)' }}>
            Note: Deactivating a member removes them from the entry dropdowns but keeps their historical reports intact.
          </div>
        )}
      </Modal>
    </div>
  );
}
