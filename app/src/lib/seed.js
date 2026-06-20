'use client';

import { TeamsDB, ProjectsDB, MembersDB, ReportsDB } from './db';

export async function seedDatabase() {
  // Check if already seeded
  const teamCount = await TeamsDB.getAll();
  if (teamCount.length > 0) return;

  console.log('🌱 Seeding database...');

  // ─── Teams ───
  const mobileId = await TeamsDB.add({ name: 'Mobile', color: '#C6FF33', icon: '📱' });
  const webId = await TeamsDB.add({ name: 'Web', color: '#33ffe0', icon: '🌐' });
  const desktopId = await TeamsDB.add({ name: 'Desktop', color: '#ff8833', icon: '🖥️' });

  // ─── Projects ───
  const projectMap = {};

  // Mobile projects
  projectMap['Beautysync'] = await ProjectsDB.add({ teamId: mobileId, name: 'Beautysync', color: '#2dd4bf', status: 'active', description: 'Beauty salon subscription app' });
  projectMap['Premium App'] = await ProjectsDB.add({ teamId: mobileId, name: 'Premium App', color: '#a78bfa', status: 'active', description: 'Premium accounting mobile app' });
  projectMap['Easy App'] = await ProjectsDB.add({ teamId: mobileId, name: 'Easy App', color: '#4ade80', status: 'active', description: 'Easy accounting app' });
  projectMap['Dispatch'] = await ProjectsDB.add({ teamId: mobileId, name: 'Dispatch', color: '#fb923c', status: 'active', description: 'Dispatch management app' });
  projectMap['EqualPlus'] = await ProjectsDB.add({ teamId: mobileId, name: 'EqualPlus', color: '#f472b6', status: 'active', description: 'EqualPlus mobile app' });
  projectMap['InsightPro'] = await ProjectsDB.add({ teamId: mobileId, name: 'InsightPro', color: '#facc15', status: 'active', description: 'InsightPro analytics app' });

  // Web projects
  projectMap['Premium Web'] = await ProjectsDB.add({ teamId: webId, name: 'Premium Web', color: '#a78bfa', status: 'active', description: 'Premium accounting web app' });
  projectMap['EqualOnline'] = await ProjectsDB.add({ teamId: webId, name: 'EqualOnline', color: '#a3e635', status: 'active', description: 'EqualOnline web platform' });
  projectMap['Eqsoft'] = await ProjectsDB.add({ teamId: webId, name: 'Eqsoft', color: '#60a5fa', status: 'active', description: 'Eqsoft company website' });
  projectMap['Labcare'] = await ProjectsDB.add({ teamId: webId, name: 'Labcare', color: '#e879f9', status: 'active', description: 'Labcare laboratory management' });

  // Desktop projects
  projectMap['GKS Smart'] = await ProjectsDB.add({ teamId: desktopId, name: 'GKS Smart', color: '#22d3ee', status: 'active', description: 'GKS Smart desktop application' });

  // ─── Members ───
  const memberIds = {};
  const members = [
    { name: 'Hridiklal', role: 'Developer' },
    { name: 'Kiran', role: 'Developer' },
    { name: 'Subitha Kp', role: 'Developer' },
    { name: 'Anugraha', role: 'Developer' },
    { name: 'Sreesh', role: 'Developer' },
    { name: 'Akhila', role: 'Developer' }
  ];

  for (const m of members) {
    memberIds[m.name] = await MembersDB.add(m.name, m.role);
  }

  // ─── June 19 Reports ───
  const j19 = '2026-06-19';

  await ReportsDB.save({
    memberId: memberIds['Hridiklal'], date: j19,
    yesterdayWork: '@Beautysync app store update, login ui and otp',
    issueFaced: '', solution: '',
    currentWork: '@Beautysync Monthly Subscription code merging, remove unwanted codes of the project',
    description: '',
    projects: [projectMap['Beautysync']]
  });

  await ReportsDB.save({
    memberId: memberIds['Kiran'], date: j19,
    yesterdayWork: '@Premium Web (Detailed report WORK over (Dynamic headings Based on tax master and additional charges))',
    issueFaced: 'Need to find the splitup to show in reports also additional charge need to show based on entries',
    solution: 'Taxmaster table only have sgst,cgst rate splitup so taken the taxable rate considered as igst. The additional charge is taken from the footer of respective reports.',
    currentWork: '@Premium Web : trail balance summary',
    description: 'It has been working, need a clarification for check',
    projects: [projectMap['Premium Web']]
  });

  await ReportsDB.save({
    memberId: memberIds['Subitha Kp'], date: j19,
    yesterdayWork: '@GKS Smart query and data checking',
    issueFaced: 'Finyear concept not occur in that time',
    solution: 'Then find the finyear issue, understood',
    currentWork: '@EqualOnline apps website new corrections and @Labcare : new dummy template of excel creations',
    description: 'CRM points confirmations not get and @Easy App db, server work pending',
    projects: [projectMap['GKS Smart'], projectMap['EqualOnline'], projectMap['Labcare']]
  });

  await ReportsDB.save({
    memberId: memberIds['Anugraha'], date: j19,
    yesterdayWork: 'Sale report printing issue completed, quantity issue',
    issueFaced: 'Report value not get in the print (not all data loaded in the time to press the print)',
    solution: 'Load all data after print, it has work',
    currentWork: '@Easy App client new points (plan to Rijul)',
    description: '',
    projects: [projectMap['Easy App']]
  });

  await ReportsDB.save({
    memberId: memberIds['Sreesh'], date: j19,
    yesterdayWork: '@EqualPlus app customer master error while add same ledgername solved. @Premium App opening balance update option, opening stock update completed',
    issueFaced: 'If updating the customer or add same ledgername in the ui show a "not such method" kind of error',
    solution: 'Customer update/add in the error field get reason of the error that I show in snackbar',
    currentWork: '@Premium App remaining points on the sheet (Need To Add Utility management in APP, Need To Show Network Status in APP)',
    description: '',
    projects: [projectMap['EqualPlus'], projectMap['Premium App']]
  });

  // ─── June 20 Reports ───
  const j20 = '2026-06-20';

  await ReportsDB.save({
    memberId: memberIds['Hridiklal'], date: j20,
    yesterdayWork: '@Beautysync app: Signuppage corrections, monthly subscription code merge and appstore deployment completed',
    issueFaced: 'Unwanted codes existing the project, it has increase the size of the app',
    solution: 'Commented all unwanted code',
    currentWork: '@InsightPro app, @EqualPlus app apple store deployment',
    description: '',
    projects: [projectMap['Beautysync'], projectMap['InsightPro'], projectMap['EqualPlus']]
  });

  await ReportsDB.save({
    memberId: memberIds['Kiran'], date: j20,
    yesterdayWork: '@Premium Web app: Trail balance, excel pdf finyear switch warning, and upgrade plan check completed',
    issueFaced: 'Trail balance not working properly in that code',
    solution: 'Entire trail balance code changed, need to check Rijul',
    currentWork: '',
    description: '',
    projects: [projectMap['Premium Web']]
  });

  await ReportsDB.save({
    memberId: memberIds['Anugraha'], date: j20,
    yesterdayWork: '@Easy App: product list item stock is zero, it show validation like message',
    issueFaced: '@Dispatch app: Bill item sequence not properly shows in the ERP through updating the app. ERP sequence checking like 0,1,2,3... but in the app like 1,2,3,4... need to check all sides',
    solution: 'To debug where did pass like that will change the sequence like ERP',
    currentWork: 'Continue to the solution',
    description: 'Emergency task: @Dispatch app bill item sequence',
    projects: [projectMap['Easy App'], projectMap['Dispatch']]
  });

  await ReportsDB.save({
    memberId: memberIds['Akhila'], date: j20,
    yesterdayWork: '@Premium App: History table details shows partially completed, quick category add option in all transactions completed',
    issueFaced: '@Premium App: paymode ui confused how to build',
    solution: 'Athul given a reference to build the UI',
    currentWork: 'Barcode scan in item row load the item (currently now a dropdown like), party list report side issue, spelling issue in the barcode and taxation',
    description: '',
    projects: [projectMap['Premium App']]
  });

  await ReportsDB.save({
    memberId: memberIds['Sreesh'], date: j20,
    yesterdayWork: '@Premium App: Utility management now in app to clear the data, and Network status latency (Ms) now show in all screen',
    issueFaced: 'Network latency properly show which one use it, clear data not working need to check backend',
    solution: 'Google officially latency checker API used to show the network status latency and clear data option check with Kiran',
    currentWork: '@Premium App: add feedback option and remaining works',
    description: '',
    projects: [projectMap['Premium App']]
  });

  await ReportsDB.save({
    memberId: memberIds['Subitha Kp'], date: j20,
    yesterdayWork: '@Eqsoft website assigned points completed',
    issueFaced: '', solution: '',
    currentWork: '@EqualOnline apps website new points from Unni sir (completed and firebase hosted link share to Rijul for testing). @Labcare : import excel data template for startup test, startup parameter, startup detailed range complete',
    description: 'Need to complete additional points assigned by Athul and send build. Need to connect Lady Best @Easy App : need to free storage for setup easy db and understand workflow',
    projects: [projectMap['Eqsoft'], projectMap['EqualOnline'], projectMap['Labcare'], projectMap['Easy App']]
  });

  console.log('✅ Database seeded!');
}
