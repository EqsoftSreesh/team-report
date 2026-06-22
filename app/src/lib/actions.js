'use server';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Prisma connection
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// TEAMS
export async function getAllTeams() { return prisma.team.findMany(); }
export async function getTeamById(id) { return prisma.team.findUnique({ where: { id: parseInt(id) } }); }
export async function addTeam(data) { return prisma.team.create({ data }); }
export async function updateTeam(id, data) { return prisma.team.update({ where: { id: parseInt(id) }, data }); }
export async function deleteTeam(id) { return prisma.team.delete({ where: { id: parseInt(id) } }); }

// PROJECTS
export async function getAllProjects() { return prisma.project.findMany(); }
export async function getProjectById(id) { return prisma.project.findUnique({ where: { id: parseInt(id) } }); }
export async function getProjectsByTeam(teamId) { return prisma.project.findMany({ where: { teamId: parseInt(teamId) } }); }
export async function getActiveProjects() { return prisma.project.findMany({ where: { status: 'active' } }); }
export async function addProject(data) { return prisma.project.create({ data: { ...data, status: data.status || 'active' } }); }
export async function updateProject(id, data) { return prisma.project.update({ where: { id: parseInt(id) }, data }); }
export async function deleteProject(id) { return prisma.project.delete({ where: { id: parseInt(id) } }); }

// MEMBERS
export async function getAllMembers() { return prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, role: true, email: true } }); }
export async function getAllIncludingInactive() { return prisma.user.findMany({ select: { id: true, name: true, role: true, email: true, active: true } }); }
export async function getMemberById(id) { return prisma.user.findUnique({ where: { id: parseInt(id) }, select: { id: true, name: true, role: true, email: true } }); }
export async function addMember(name, role = 'MEMBER', email, password) {
  const hashedPassword = await bcrypt.hash(password || 'password123', 10);
  return prisma.user.create({
    data: { name: name.trim(), role: role.trim(), email: email || `${name.replace(/\s+/g, '').toLowerCase()}@example.com`, password: hashedPassword, active: true }
  });
}
export async function updateMember(id, data) { return prisma.user.update({ where: { id: parseInt(id) }, data }); }
export async function deactivateMember(id) { return prisma.user.update({ where: { id: parseInt(id) }, data: { active: false } }); }
export async function reactivateMember(id) { return prisma.user.update({ where: { id: parseInt(id) }, data: { active: true } }); }

// REPORTS
export async function getReportsByDate(dateStr) {
  const reports = await prisma.report.findMany({ where: { date: dateStr }, include: { projects: true, images: true } });
  return reports.map(r => ({ ...r, memberId: r.userId, projects: r.projects.map(p => p.id), images: r.images.map(i => i.base64) }));
}
export async function getReportByMemberAndDate(memberId, dateStr) {
  const report = await prisma.report.findUnique({ where: { userId_date: { userId: parseInt(memberId), date: dateStr } }, include: { projects: true, images: true } });
  if (!report) return null;
  return { ...report, memberId: report.userId, projects: report.projects.map(p => p.id), images: report.images.map(i => i.base64) };
}
export async function getReportsByMember(memberId) {
  const reports = await prisma.report.findMany({ where: { userId: parseInt(memberId) }, include: { projects: true, images: true } });
  return reports.map(r => ({ ...r, memberId: r.userId, projects: r.projects.map(p => p.id), images: r.images.map(i => i.base64) }));
}
export async function getReportsByDateRange(startDate, endDate) {
  const reports = await prisma.report.findMany({ where: { date: { gte: startDate, lte: endDate } }, include: { projects: true, images: true } });
  return reports.map(r => ({ ...r, memberId: r.userId, projects: r.projects.map(p => p.id), images: r.images.map(i => i.base64) }));
}
export async function saveReport(reportData) {
  const data = {
    date: reportData.date,
    yesterdayWork: reportData.yesterdayWork,
    issueFaced: reportData.issueFaced,
    solution: reportData.solution,
    currentWork: reportData.currentWork,
    description: reportData.description,
    userId: parseInt(reportData.memberId),
    projects: { set: (reportData.projects || []).map(id => ({ id: parseInt(id) })) }
  };
  const report = await prisma.report.upsert({
    where: { userId_date: { userId: data.userId, date: data.date } },
    update: data,
    create: data,
  });
  if (reportData.images) {
    await prisma.image.deleteMany({ where: { reportId: report.id } });
    for (const base64 of reportData.images) { await prisma.image.create({ data: { base64, reportId: report.id } }); }
  }
  return report.id;
}
export async function deleteReport(id) { return prisma.report.delete({ where: { id: parseInt(id) } }); }
export async function getAllReports() {
  const reports = await prisma.report.findMany({ include: { projects: true, images: true } });
  return reports.map(r => ({ ...r, memberId: r.userId, projects: r.projects.map(p => p.id), images: r.images.map(i => i.base64) }));
}

export async function searchReports(query) {
  const q = query.toLowerCase();
  const all = await getAllReports();
  return all.filter(r =>
    (r.yesterdayWork && r.yesterdayWork.toLowerCase().includes(q)) ||
    (r.issueFaced && r.issueFaced.toLowerCase().includes(q)) ||
    (r.solution && r.solution.toLowerCase().includes(q)) ||
    (r.currentWork && r.currentWork.toLowerCase().includes(q)) ||
    (r.description && r.description.toLowerCase().includes(q))
  );
}

export async function searchReportsFiltered({ query, memberId, startDate, endDate, projectId }) {
  let results = await getAllReports();
  if (memberId) results = results.filter(r => r.memberId === parseInt(memberId));
  if (startDate) results = results.filter(r => r.date >= startDate);
  if (endDate) results = results.filter(r => r.date <= endDate);
  if (projectId) results = results.filter(r => r.projects && r.projects.includes(parseInt(projectId)));
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
}

export async function getDatesWithEntries(year, month) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
  const reports = await getReportsByDateRange(start, end);
  const dateMap = {};
  reports.forEach(r => {
    if (!dateMap[r.date]) dateMap[r.date] = 0;
    dateMap[r.date]++;
  });
  return dateMap;
}

export async function detectRecurringIssues() {
  const all = await getAllReports();
  const members = await getAllIncludingInactive();
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
