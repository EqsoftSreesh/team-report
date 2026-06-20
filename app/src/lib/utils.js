// ─── Date Utilities ───

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
}

export function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── @Mention Utilities ───

export function parseMentions(text, projects = []) {
  if (!text) return [];
  const mentions = [];
  const regex = /@([A-Za-z][A-Za-z0-9 ]*)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim();
    const project = projects.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (project) {
      mentions.push({ project, start: match.index, end: match.index + match[0].length });
    }
  }
  return mentions;
}

export function renderTextWithMentions(text, projects = []) {
  if (!text) return '';
  const mentions = parseMentions(text, projects);
  if (mentions.length === 0) return escapeHtml(text);

  let result = '';
  let lastIdx = 0;
  mentions.forEach(m => {
    result += escapeHtml(text.substring(lastIdx, m.start));
    result += `<span class="mention-tag" style="color:${m.project.color}" title="${m.project.name}">@${m.project.name}</span>`;
    lastIdx = m.end;
  });
  result += escapeHtml(text.substring(lastIdx));
  return result;
}

export function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
