/* ===================================================
   MEMBERS — Team member management
   =================================================== */

const MembersModule = {
  async init() {
    await this.render();
  },

  async render() {
    const panel = document.getElementById('panel-members');
    const members = await MembersDB.getAllIncludingInactive();

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">👥 Team Members</h2>
          <p class="section-subtitle">Manage your team roster</p>
        </div>
        <button class="btn btn-primary" id="btn-add-member">+ Add Member</button>
      </div>

      <div class="member-list" id="members-list">
        ${members.map(m => `
          <div class="member-item ${m.active ? '' : 'style="opacity:0.5;"'}">
            <div class="member-avatar">${getInitials(m.name)}</div>
            <div class="member-info">
              <div class="name">${escapeHtml(m.name)} ${!m.active ? '<span style="font-size:0.72rem;color:var(--accent-warning);">(inactive)</span>' : ''}</div>
              <div class="role">${escapeHtml(m.role)}</div>
            </div>
            <div class="member-actions">
              <button class="btn btn-ghost btn-icon" onclick="MembersModule.editMember(${m.id})" title="Edit">✏️</button>
              ${m.active
                ? `<button class="btn btn-ghost btn-icon" onclick="MembersModule.deactivate(${m.id})" title="Deactivate">🚫</button>`
                : `<button class="btn btn-ghost btn-icon" onclick="MembersModule.reactivate(${m.id})" title="Reactivate">✅</button>`
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('btn-add-member').addEventListener('click', () => this.showAddModal());
  },

  showAddModal() {
    App.showModal('Add Team Member', `
      <div class="form-group">
        <label class="form-label" for="new-member-name">Name</label>
        <input type="text" class="form-input" id="new-member-name" placeholder="Full name">
      </div>
      <div class="form-group">
        <label class="form-label" for="new-member-role">Role</label>
        <input type="text" class="form-input" id="new-member-role" placeholder="e.g. Developer, QA, Designer" value="Developer">
      </div>
    `, async () => {
      const name = document.getElementById('new-member-name').value.trim();
      const role = document.getElementById('new-member-role').value.trim();
      if (!name) {
        showToast('Please enter a name', 'error');
        return false;
      }
      await MembersDB.add(name, role || 'Developer');
      showToast(`${name} added to team!`, 'success');
      await this.render();
      // Re-render entry form to include new member
      await EntryModule.render();
      EntryModule.bindEvents();
      App.updateStats();
      return true;
    });
  },

  async editMember(id) {
    const member = await MembersDB.getById(id);
    if (!member) return;

    App.showModal('Edit Team Member', `
      <div class="form-group">
        <label class="form-label" for="edit-member-name">Name</label>
        <input type="text" class="form-input" id="edit-member-name" value="${escapeHtml(member.name)}">
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-member-role">Role</label>
        <input type="text" class="form-input" id="edit-member-role" value="${escapeHtml(member.role)}">
      </div>
    `, async () => {
      const name = document.getElementById('edit-member-name').value.trim();
      const role = document.getElementById('edit-member-role').value.trim();
      if (!name) {
        showToast('Name is required', 'error');
        return false;
      }
      await MembersDB.update(id, { name, role });
      showToast('Member updated!', 'success');
      await this.render();
      return true;
    });
  },

  async deactivate(id) {
    const member = await MembersDB.getById(id);
    if (confirm(`Deactivate ${member.name}? They won't appear in entry forms but their history is preserved.`)) {
      await MembersDB.deactivate(id);
      showToast(`${member.name} deactivated`, 'info');
      await this.render();
      App.updateStats();
    }
  },

  async reactivate(id) {
    const member = await MembersDB.getById(id);
    await MembersDB.reactivate(id);
    showToast(`${member.name} reactivated!`, 'success');
    await this.render();
    App.updateStats();
  }
};
