// db.js is a wrapper around the Server Actions to maintain backwards compatibility
// with the existing frontend UI code which expects TeamsDB.getAll() etc.

import * as actions from './actions';

export const TeamsDB = {
  getAll: actions.getAllTeams,
  getById: actions.getTeamById,
  add: actions.addTeam,
  update: actions.updateTeam,
  delete: actions.deleteTeam
};

export const ProjectsDB = {
  getAll: actions.getAllProjects,
  getById: actions.getProjectById,
  getByTeam: actions.getProjectsByTeam,
  getActive: actions.getActiveProjects,
  add: actions.addProject,
  update: actions.updateProject,
  delete: actions.deleteProject
};

export const MembersDB = {
  getAll: actions.getAllMembers,
  getAllIncludingInactive: actions.getAllIncludingInactive,
  getById: actions.getMemberById,
  add: actions.addMember,
  update: actions.updateMember,
  deactivate: actions.deactivateMember,
  reactivate: actions.reactivateMember
};

export const ReportsDB = {
  getByDate: actions.getReportsByDate,
  getByMemberAndDate: actions.getReportByMemberAndDate,
  getByMember: actions.getReportsByMember,
  getByDateRange: actions.getReportsByDateRange,
  save: actions.saveReport,
  delete: actions.deleteReport,
  getAll: actions.getAllReports,
  search: actions.searchReports,
  searchFiltered: actions.searchReportsFiltered,
  getDatesWithEntries: actions.getDatesWithEntries,
  detectRecurringIssues: actions.detectRecurringIssues
};
