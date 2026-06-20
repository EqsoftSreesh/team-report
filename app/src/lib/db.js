'use client';

import Dexie from 'dexie';

// ==================== DATABASE SCHEMA ====================

const db = new Dexie('StandupTrackerDB_v2');

db.version(1).stores({
  teams: '++id, name, color, icon',
  projects: '++id, teamId, name, color, status',
  members: '++id, name, role, active, createdAt',
  reports: '++id, memberId, date, [memberId+date], updatedAt'
});

// ==================== TEAMS CRUD ====================

export const TeamsDB = {
  async getAll() {
    return db.teams.toArray();
  },
  async getById(id) {
    return db.teams.get(id);
  },
  async add(data) {
    return db.teams.add(data);
  },
  async update(id, data) {
    return db.teams.update(id, data);
  },
  async delete(id) {
    return db.teams.delete(id);
  }
};

// ==================== PROJECTS CRUD ====================

export const ProjectsDB = {
  async getAll() {
    return db.projects.toArray();
  },
  async getById(id) {
    return db.projects.get(id);
  },
  async getByTeam(teamId) {
    return db.projects.where('teamId').equals(teamId).toArray();
  },
  async getActive() {
    return db.projects.where('status').equals('active').toArray();
  },
  async add(data) {
    return db.projects.add({ ...data, status: data.status || 'active' });
  },
  async update(id, data) {
    return db.projects.update(id, data);
  },
  async delete(id) {
    return db.projects.delete(id);
  }
};

// ==================== MEMBERS CRUD ====================

export const MembersDB = {
  async getAll() {
    return db.members.where('active').equals(1).toArray();
  },
  async getAllIncludingInactive() {
    return db.members.toArray();
  },
  async getById(id) {
    return db.members.get(id);
  },
  async add(name, role = 'Developer') {
    return db.members.add({
      name: name.trim(),
      role: role.trim(),
      active: 1,
      createdAt: new Date().toISOString()
    });
  },
  async update(id, data) {
    return db.members.update(id, data);
  },
  async deactivate(id) {
    return db.members.update(id, { active: 0 });
  },
  async reactivate(id) {
    return db.members.update(id, { active: 1 });
  }
};

// ==================== REPORTS CRUD ====================

export const ReportsDB = {
  async getByDate(dateStr) {
    return db.reports.where('date').equals(dateStr).toArray();
  },
  async getByMemberAndDate(memberId, dateStr) {
    return db.reports.where('[memberId+date]').equals([memberId, dateStr]).first();
  },
  async getByMember(memberId) {
    return db.reports.where('memberId').equals(memberId).toArray();
  },
  async getByDateRange(startDate, endDate) {
    return db.reports.where('date').between(startDate, endDate, true, true).toArray();
  },
  async save(reportData) {
    const existing = await this.getByMemberAndDate(reportData.memberId, reportData.date);
    const data = { ...reportData, updatedAt: new Date().toISOString() };
    if (existing) {
      await db.reports.update(existing.id, data);
      return existing.id;
    }
    return db.reports.add(data);
  },
  async delete(id) {
    return db.reports.delete(id);
  },
  async getAll() {
    return db.reports.toArray();
  },
  async search(query) {
    const q = query.toLowerCase();
    const all = await db.reports.toArray();
    return all.filter(r =>
      (r.yesterdayWork && r.yesterdayWork.toLowerCase().includes(q)) ||
      (r.issueFaced && r.issueFaced.toLowerCase().includes(q)) ||
      (r.solution && r.solution.toLowerCase().includes(q)) ||
      (r.currentWork && r.currentWork.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  },
  async searchFiltered({ query, memberId, startDate, endDate, projectId }) {
    let results = await db.reports.toArray();
    if (memberId) results = results.filter(r => r.memberId === memberId);
    if (startDate) results = results.filter(r => r.date >= startDate);
    if (endDate) results = results.filter(r => r.date <= endDate);
    if (projectId) results = results.filter(r => r.projects && r.projects.includes(projectId));
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r =>
        (r.yesterdayWork && r.yesterdayWork.toLowerCase().includes(q)) ||
        (r.issueFaced && r.issueFaced.toLowerCase().includes(q)) ||
        (r.solution && r.solution.toLowerCase().includes(q)) ||
        (r.currentWork && r.currentWork.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    return results;
  },
  async getDatesWithEntries(year, month) {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    const reports = await this.getByDateRange(start, end);
    const dateMap = {};
    reports.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = 0;
      dateMap[r.date]++;
    });
    return dateMap;
  },
  async detectRecurringIssues() {
    const all = await db.reports.toArray();
    const members = await db.members.toArray();
    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m.name; });

    const issueEntries = all
      .filter(r => r.issueFaced && r.issueFaced.trim().length > 3)
      .map(r => ({
        memberId: r.memberId,
        memberName: memberMap[r.memberId] || 'Unknown',
        date: r.date,
        issue: r.issueFaced.trim(),
        solution: r.solution || ''
      }));

    const issueGroups = {};
    issueEntries.forEach(entry => {
      const words = entry.issue.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      const phrases = [];
      for (let i = 0; i < words.length; i++) {
        if (words[i]) phrases.push(words[i]);
        if (i < words.length - 1) phrases.push(`${words[i]} ${words[i + 1]}`);
        if (i < words.length - 2) phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
      let matched = false;
      for (const key of Object.keys(issueGroups)) {
        const keyWords = key.split(' ');
        const matchScore = keyWords.filter(kw => phrases.some(p => p.includes(kw))).length;
        if (matchScore >= Math.min(2, keyWords.length)) {
          issueGroups[key].occurrences.push(entry);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const bestPhrase = phrases.filter(p => p.split(' ').length >= 2).sort((a, b) => b.length - a.length)[0] || entry.issue.substring(0, 50).toLowerCase();
        if (!issueGroups[bestPhrase]) issueGroups[bestPhrase] = { keyword: bestPhrase, occurrences: [] };
        issueGroups[bestPhrase].occurrences.push(entry);
      }
    });

    return Object.values(issueGroups)
      .filter(g => g.occurrences.length > 1)
      .map(g => ({
        keyword: g.keyword,
        occurrences: g.occurrences.sort((a, b) => a.date.localeCompare(b.date)),
        count: g.occurrences.length,
        firstSeen: g.occurrences[0].date,
        lastSeen: g.occurrences[g.occurrences.length - 1].date,
        members: [...new Set(g.occurrences.map(o => o.memberName))]
      }))
      .sort((a, b) => b.count - a.count);
  }
};

export default db;
