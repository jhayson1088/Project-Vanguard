import { createSeed, members } from "./seed.js";
const KEY = "vanguard-demo-v1";
function db() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    return data || createSeed();
  } catch {
    return createSeed();
  }
}
function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    throw new Error(
      "Your browser storage is full. Try a smaller attachment or clear demo data.",
    );
  }
}
function session() {
  try {
    return JSON.parse(localStorage.getItem("vanguard-session"));
  } catch {
    return null;
  }
}
function requireUser() {
  const user = session();
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}
function requireAdmin() {
  const user = requireUser();
  if (user.role !== "admin")
    throw new Error("Administrator access is required.");
  return user;
}
export function validateTransition(status, attachments, allowed) {
  if (!allowed.includes(status)) throw new Error("Choose a valid status.");
  if (status === "Completed" && !attachments.length)
    throw new Error(
      "Attach a supporting image or document before completing this issue.",
    );
}
export const mock = {
  async session() {
    return session();
  },
  async login({ role }) {
    const user = members[role] || members.user;
    localStorage.setItem("vanguard-session", JSON.stringify(user));
    return user;
  },
  async logout() {
    localStorage.removeItem("vanguard-session");
  },
  async settings() {
    return db().settings;
  },
  async updateSettings(rewards) {
    requireAdmin();
    const data = db();
    data.settings.rewards = rewards;
    save(data);
    return data.settings;
  },
  async issues() {
    requireUser();
    return db().issues;
  },
  async issue(id) {
    requireUser();
    const issue = db().issues.find((i) => i.id === Number(id));
    if (!issue) throw new Error("This issue could not be found.");
    return issue;
  },
  async createIssue(values) {
    const user = requireUser(),
      data = db();
    const existing = data.issues.find(
      (i) =>
        i.submissionKey &&
        i.submissionKey === values.submissionKey &&
        i.reporterId === user.id,
    );
    if (existing) return existing;
    const issue = {
      ...values,
      id: Math.max(...data.issues.map((i) => i.id)) + 1,
      reporter: user.name,
      reporterId: user.id,
      initials: user.initials,
      createdAt: new Date().toISOString(),
      status: data.settings.statuses[0],
      credibility: null,
      comments: [],
      readBy: [],
      attachments: [],
      history: [
        {
          status: data.settings.statuses[0],
          date: new Date().toISOString(),
          name: user.name,
        },
      ],
    };
    data.issues.unshift(issue);
    save(data);
    return issue;
  },
  async read(id, read) {
    const user = requireUser(),
      data = db(),
      issue = data.issues.find((i) => i.id === Number(id));
    issue.readBy = issue.readBy.filter((u) => u !== user.id);
    if (read) issue.readBy.push(user.id);
    save(data);
    return issue;
  },
  async comment(id, text) {
    const user = requireUser(),
      data = db(),
      issue = data.issues.find((i) => i.id === Number(id));
    if (!text.trim()) throw new Error("Write a comment first.");
    issue.comments.push({
      id: Date.now(),
      name: user.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });
    save(data);
    return issue;
  },
  async status(id, status, files, note = "") {
    const user = requireAdmin(),
      data = db(),
      issue = data.issues.find((i) => i.id === Number(id));
    const attachments = [...issue.attachments, ...files];
    if (status === "Cancelled") {
      if (["Completed", "Cancelled"].includes(issue.status))
        throw new Error("Closed issues cannot be cancelled.");
      if (!note.trim()) throw new Error("A cancellation reason is required.");
      issue.status = status;
      issue.attachments = attachments;
      issue.cancelledAt = new Date().toISOString();
      issue.history.push({
        status,
        note,
        date: issue.cancelledAt,
        name: user.name,
      });
      save(data);
      return issue;
    }

    if (issue.status === "Ongoing" && status === "Ongoing") {
      if (!note.trim())
        throw new Error("Describe the ongoing progress update.");
      issue.attachments = attachments;
      issue.history.push({
        status,
        note,
        date: new Date().toISOString(),
        name: user.name,
      });
      save(data);
      return issue;
    }
    validateTransition(status, attachments, data.settings.statuses);
    if (
      data.settings.statuses.indexOf(status) !==
      data.settings.statuses.indexOf(issue.status) + 1
    )
      throw new Error(
        "Move through the workflow in order: pending, verified, ongoing, completed.",
      );
    issue.status = status;
    issue.attachments = attachments;
    issue.history.push({
      status,
      note,
      date: new Date().toISOString(),
      name: user.name,
    });
    save(data);
    return issue;
  },
  async profile() {
    return requireUser();
  },
  async activity() {
    const user = requireUser();
    return db().activity.filter((a) => a.userId === user.id);
  },
  async stats() {
    requireUser();
    const issues = db().issues;
    return {
      total: issues.length,
      byStatus: Object.fromEntries(
        db().settings.statuses.map((s) => [
          s,
          issues.filter((i) => i.status === s).length,
        ]),
      ),
      byCategory: Object.fromEntries(
        db().settings.categories.map((c) => [
          c,
          issues.filter((i) => i.category === c).length,
        ]),
      ),
      bySeverity: Object.fromEntries(
        db().settings.severities.map((s) => [
          s,
          issues.filter((i) => i.severity === s).length,
        ]),
      ),
    };
  },
};
