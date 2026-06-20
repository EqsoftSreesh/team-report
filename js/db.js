/* ===================================================
   DATABASE LAYER — Dexie.js IndexedDB Wrapper
   Persistent storage for team members & daily reports
   =================================================== */

const db = new Dexie('StandupTrackerDB');

// Schema definition
db.version(1).stores({
  members: '++id, name, role, active, createdAt',
  reports: '++id, memberId, date, [memberId+date], updatedAt'
});

// ==================== MEMBERS CRUD ====================

const MembersDB = {
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

const ReportsDB = {
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
    return db.reports
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async save(reportData) {
    // Upsert: update if exists, insert if not
    const existing = await this.getByMemberAndDate(reportData.memberId, reportData.date);
    const data = {
      ...reportData,
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      await db.reports.update(existing.id, data);
      return existing.id;
    } else {
      return db.reports.add(data);
    }
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
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.projects && r.projects.some(p => p.toLowerCase().includes(q)))
    );
  },

  async searchFiltered({ query, memberId, startDate, endDate, project }) {
    let results = await db.reports.toArray();

    if (memberId) {
      results = results.filter(r => r.memberId === memberId);
    }

    if (startDate) {
      results = results.filter(r => r.date >= startDate);
    }

    if (endDate) {
      results = results.filter(r => r.date <= endDate);
    }

    if (project) {
      results = results.filter(r => r.projects && r.projects.includes(project));
    }

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

    // Extract issue keywords (split by common delimiters, ignore short words)
    const issueEntries = all
      .filter(r => r.issueFaced && r.issueFaced.trim().length > 3)
      .map(r => ({
        memberId: r.memberId,
        memberName: memberMap[r.memberId] || 'Unknown',
        date: r.date,
        issue: r.issueFaced.trim(),
        solution: r.solution || ''
      }));

    // Group by similarity (simple keyword matching)
    const issueGroups = {};

    issueEntries.forEach(entry => {
      const words = entry.issue.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);

      // Create n-grams (2-3 word phrases) for matching
      const phrases = [];
      for (let i = 0; i < words.length; i++) {
        if (words[i]) phrases.push(words[i]);
        if (i < words.length - 1) phrases.push(`${words[i]} ${words[i + 1]}`);
        if (i < words.length - 2) phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }

      // Check if this issue matches any existing group
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
        // Use the longest meaningful phrase as key
        const bestPhrase = phrases
          .filter(p => p.split(' ').length >= 2)
          .sort((a, b) => b.length - a.length)[0] || entry.issue.substring(0, 50).toLowerCase();

        if (!issueGroups[bestPhrase]) {
          issueGroups[bestPhrase] = { keyword: bestPhrase, occurrences: [] };
        }
        issueGroups[bestPhrase].occurrences.push(entry);
      }
    });

    // Only return issues that appear more than once
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

// ==================== PROJECT TAGS ====================

const PROJECTS = [
  'Beautysync', 'Premium', 'Easy', 'Dispatch', 'Eqsoft',
  'EqualPlus', 'InsightPro', 'Labcare', 'GKS Smart', 'EqualOnline'
];

function getTagClass(project) {
  const map = {
    'Beautysync': 'tag-beautysync',
    'Premium': 'tag-premium',
    'Easy': 'tag-easy',
    'Dispatch': 'tag-dispatch',
    'Eqsoft': 'tag-eqsoft',
    'EqualPlus': 'tag-equalplus',
    'InsightPro': 'tag-insightpro',
    'Labcare': 'tag-labcare',
    'GKS Smart': 'tag-gkssmart',
    'EqualOnline': 'tag-equalonline'
  };
  return map[project] || 'tag-eqsoft';
}

// ==================== SEED DATA ====================

async function seedDatabase() {
  const memberCount = await db.members.count();
  if (memberCount > 0) return; // Already seeded

  console.log('Seeding database with initial data...');

  // Add team members
  const memberIds = {};
  const teamMembers = [
    { name: 'Hridiklal', role: 'Developer' },
    { name: 'Kiran', role: 'Developer' },
    { name: 'Subitha Kp', role: 'Developer' },
    { name: 'Anugraha', role: 'Developer' },
    { name: 'Sreesh', role: 'Developer' },
    { name: 'Akhila', role: 'Developer' }
  ];

  for (const m of teamMembers) {
    const id = await MembersDB.add(m.name, m.role);
    memberIds[m.name] = id;
  }

  // Seed June 19, 2026 entries
  const june19 = '2026-06-19';

  await ReportsDB.save({
    memberId: memberIds['Hridiklal'],
    date: june19,
    yesterdayWork: 'Beautysync app store update, login ui and otp',
    issueFaced: '',
    solution: '',
    currentWork: 'Beautysync Monthly Subscription code merging, remove unwanted codes of the project',
    description: '',
    projects: ['Beautysync']
  });

  await ReportsDB.save({
    memberId: memberIds['Kiran'],
    date: june19,
    yesterdayWork: 'Premium web (Detailed report WORK over (Dynamic headings Based on tax master and additional charges))',
    issueFaced: 'Need to find the splitup to show in reports also additional charge need to show based on entries',
    solution: 'Taxmaster table only have sgst,cgst rate splitup so taken the taxable rate considered as igst. The additional charge is taken from the footer of respective reports.',
    currentWork: 'Premium: trail balance summary',
    description: 'It has been working, need a clarification for check',
    projects: ['Premium']
  });

  await ReportsDB.save({
    memberId: memberIds['Subitha Kp'],
    date: june19,
    yesterdayWork: 'GKS SMART query and data checking',
    issueFaced: 'Finyear concept not occur in that time',
    solution: 'Then find the finyear issue, understood',
    currentWork: 'EqualOnline apps website new corrections and Labcare: new dummy template of excel creations',
    description: 'CRM points confirmations not get and easy db, server work pending',
    projects: ['GKS Smart', 'EqualOnline', 'Labcare']
  });

  await ReportsDB.save({
    memberId: memberIds['Anugraha'],
    date: june19,
    yesterdayWork: 'Sale report printing issue completed, quantity issue',
    issueFaced: 'Report value not get in the print (not all data loaded in the time to press the print)',
    solution: 'Load all data after print, it has work',
    currentWork: 'Easy client new points (plan to Rijul)',
    description: '',
    projects: ['Easy']
  });

  await ReportsDB.save({
    memberId: memberIds['Sreesh'],
    date: june19,
    yesterdayWork: 'EqualPlus app customer master error while add same ledgername solved. Premium app opening balance update option, opening stock update completed',
    issueFaced: 'If updating the customer or add same ledgername in the ui show a "not such method" kind of error',
    solution: 'Customer update/add in the error field get reason of the error that I show in snackbar',
    currentWork: 'Premium app remaining points on the sheet (Need To Add Utility management in APP, Need To Show Network Status in APP)',
    description: '',
    projects: ['EqualPlus', 'Premium']
  });

  // Seed June 20, 2026 entries
  const june20 = '2026-06-20';

  await ReportsDB.save({
    memberId: memberIds['Hridiklal'],
    date: june20,
    yesterdayWork: 'Beautysync app: Signuppage corrections, monthly subscription code merge and appstore deployment completed',
    issueFaced: 'Unwanted codes existing the project, it has increase the size of the app',
    solution: 'Commented all unwanted code',
    currentWork: 'InsightPro app, EqualPlus app apple store deployment',
    description: '',
    projects: ['Beautysync', 'InsightPro', 'EqualPlus']
  });

  await ReportsDB.save({
    memberId: memberIds['Kiran'],
    date: june20,
    yesterdayWork: 'Premium web app: Trail balance, excel pdf finyear switch warning, and upgrade plan check completed',
    issueFaced: 'Trail balance not working properly in that code',
    solution: 'Entire trail balance code changed, need to check Rijul',
    currentWork: '',
    description: '',
    projects: ['Premium']
  });

  await ReportsDB.save({
    memberId: memberIds['Anugraha'],
    date: june20,
    yesterdayWork: 'Easy app: product list item stock is zero, it show validation like message',
    issueFaced: 'Dispatch app: Bill item sequence not properly shows in the ERP through updating the app. ERP sequence checking like 0,1,2,3... but in the app like 1,2,3,4... need to check all sides',
    solution: 'To debug where did pass like that will change the sequence like ERP',
    currentWork: 'Continue to the solution',
    description: 'Emergency task: Dispatch app bill item sequence',
    projects: ['Easy', 'Dispatch']
  });

  await ReportsDB.save({
    memberId: memberIds['Akhila'],
    date: june20,
    yesterdayWork: 'Premium app: History table details shows partially completed, quick category add option in all transactions completed',
    issueFaced: 'Premium app: paymode ui confused how to build',
    solution: 'Athul given a reference to build the UI',
    currentWork: 'Barcode scan in item row load the item (currently now a dropdown like), party list report side issue, spelling issue in the barcode and taxation',
    description: '',
    projects: ['Premium']
  });

  await ReportsDB.save({
    memberId: memberIds['Sreesh'],
    date: june20,
    yesterdayWork: 'Premium app: Utility management now in app to clear the data, and Network status latency (Ms) now show in all screen',
    issueFaced: 'Network latency properly show which one use it, clear data not working need to check backend',
    solution: 'Google officially latency checker API used to show the network status latency and clear data option check with Kiran',
    currentWork: 'Premium app: add feedback option and remaining works',
    description: '',
    projects: ['Premium']
  });

  await ReportsDB.save({
    memberId: memberIds['Subitha Kp'],
    date: june20,
    yesterdayWork: 'Eqsoft website assigned points completed',
    issueFaced: '',
    solution: '',
    currentWork: 'EqualOnline apps website new points from Unni sir (completed and firebase hosted link share to Rijul for testing). Labcare: import excel data template for startup test, startup parameter, startup detailed range complete',
    description: 'Need to complete additional points assigned by Athul and send build. Need to connect Lady Best Equal Easy app: need to free storage for setup easy db and understand workflow',
    projects: ['Eqsoft', 'EqualOnline', 'Labcare', 'Easy']
  });

  console.log('Database seeded successfully!');
}

// ==================== UTILITY ====================

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
}
