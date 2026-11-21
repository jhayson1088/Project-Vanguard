import { MOCK_MODE, request } from "./client";
import { mock } from "./mock";
const title = (s) => s.charAt(0).toUpperCase() + s.slice(1);
let config, currentUser;
// Fixed workflow choices from the existing Django contract; API OPTIONS takes precedence.
const contract = {
  statuses: ["pending", "verified", "ongoing", "completed", "cancelled"],
  severities: ["low", "medium", "high", "critical"],
};
const rewardLabels = {
  submit: "Submit ticket",
  confirmed: "Ticket verified",
  read: "First read of another user’s issue",
};
async function list(path) {
  let results = [];
  while (path) {
    const page = await request(path);
    if (Array.isArray(page)) return page;
    results.push(...page.results);
    if (!page.next) break;
    const next = new URL(page.next, window.location.origin);
    const base = new URL(
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
      window.location.origin,
    );
    if (next.origin !== base.origin)
      throw new Error(
        "The API returned a pagination link on an unexpected host.",
      );
    path =
      next.pathname.replace(base.pathname.replace(/\/$/, ""), "") + next.search;
  }
  return results;
}
function normalizeUser(u) {
  const levels = config?.levels || [],
    index = levels.findIndex((l) => l.number === u.level),
    floor = levels[index]?.points || 0,
    next = levels[index + 1];
  return {
    id: u.id,
    name: u.display_name || "Campus member",
    image: u.image,
    role: u.role === "administrator" ? "admin" : "user",
    department: "Campus community",
    email: "University account",
    initials: (u.display_name || "Campus member")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join(""),
    points: u.total_points,
    level: `Level ${u.level}`,
    levelNumber: u.level,
    nextLevel: next ? `Level ${next.number}` : "Highest level",
    levelStart: floor,
    nextThreshold: u.next_level_points ?? Math.max(u.total_points, floor + 1),
  };
}
function normalizeIssue(i) {
  return {
    ...i,
    ticketNumber: i.ticket_number || `VG-${i.id}`,
    category:
      config?.categoryRecords.find((c) => c.id === i.category)?.name ||
      String(i.category),
    severity: title(i.severity),
    status: title(i.status),
    reporter: i.reporter.display_name,
    reporterId: i.reporter.id,
    reporterImage: i.reporter.image,
    initials: i.reporter.display_name
      .split(" ")
      .map((x) => x[0])
      .slice(0, 2)
      .join(""),
    createdAt: i.created_at,
    completedAt: i.completed_at,
    cancelledAt: i.cancelled_at,
    image: i.image_url,
    credibility: i.ai_score,
    budget:
      i.ai_estimated_budget == null
        ? i.budget == null
          ? null
          : Number(i.budget)
        : Number(i.ai_estimated_budget),
    reporterBudget: i.budget == null ? null : Number(i.budget),
    aiEstimatedBudget:
      i.ai_estimated_budget == null ? null : Number(i.ai_estimated_budget),
    coordinates:
      i.latitude != null
        ? { lat: Number(i.latitude), lng: Number(i.longitude) }
        : null,
    readBy: i.is_read ? [currentUser?.id] : [],
    commentCount: i.comment_count ?? 0,
    comments: [],
    attachments: [],
    history: [],
  };
}
async function hydrate(i) {
  const issue = normalizeIssue(i);
  const [comments, attachments, history] = await Promise.all([
    list(`/issues/${i.id}/comments/`),
    list(`/issues/${i.id}/attachments/`),
    list(`/issues/${i.id}/history/`),
  ]);
  issue.comments = comments.map((c) => ({
    id: c.id,
    name: c.author.display_name,
    image: c.author.image,
    text: c.content,
    createdAt: c.created_at,
  }));
  issue.attachments = attachments.map((a) => ({
    name: a.description || `Attachment ${a.id}`,
    url: a.download_url,
    type: a.file_type,
    kind: a.kind,
    administratorUploaded: a.administrator_uploaded,
  }));
  issue.history = [
    {
      status: "Pending",
      date: i.created_at,
      name: i.reporter.display_name,
      note: "Issue submitted.",
    },
    ...history.map((h) => ({
      status: title(h.new_status),
      previousStatus: title(h.old_status),
      note: h.note,
      date: h.created_at,
      name: h.actor.display_name,
    })),
  ];
  return issue;
}
const live = {
  async session() {
    try {
      const u = await request("/me/", { skipSessionEvent: true });
      currentUser = u;
      return normalizeUser(u);
    } catch (e) {
      if (e.status === 401 || e.status === 403) return null;
      throw e;
    }
  },
  async login({ email, password }) {
    await request("/auth/login/", {
      method: "POST",
      body: { username: email, password },
    });
    currentUser = await request("/me/");
    await live.settings();
    return normalizeUser(currentUser);
  },
  async logout() {
    await request("/auth/logout/", { method: "POST" });
    currentUser = null;
    config = null;
  },
  async settings() {
    const [categories, rewards, levels, metadata] = await Promise.all([
      list("/categories/"),
      list("/reward-settings/"),
      list("/levels/"),
      request("/configuration/"),
    ]);
    config = {
      categoryRecords: categories,
      categories: categories.filter((c) => c.active).map((c) => c.name),
      statuses: metadata.statuses.map(title),
      severities: metadata.severities.map(title),
      buildings: metadata.buildings,
      transitions: metadata.transitions,
      levels: levels.map((l) => ({
        ...l,
        name: `Level ${l.number}`,
        points: l.minimum_points,
      })),
      rewards: rewards.map((r) => ({
        ...r,
        action: rewardLabels[r.code] || r.code,
      })),
    };
    return config;
  },
  async updateSettings(rewards) {
    for (const r of rewards)
      await request(`/reward-settings/${r.id}/`, {
        method: "PATCH",
        body: { points: r.points, enabled: r.enabled },
      });
    return live.settings();
  },
  async issues() {
    return (await list("/issues/")).map(normalizeIssue);
  },
  async issue(id) {
    return hydrate(await request(`/issues/${id}/`));
  },
  async comments(id) {
    return (await list(`/issues/${id}/comments/`)).map((c) => ({
      id: c.id,
      name: c.author.display_name,
      image: c.author.image,
      text: c.content,
      createdAt: c.created_at,
    }));
  },
  async assessmentReadiness() {
    return request("/assessment/readiness/");
  },
  async assess(id) {
    return request(`/issues/${id}/assess/`, { method: "POST" });
  },
  async createIssue(values) {
    const body = new FormData(),
      category = config.categoryRecords.find((c) => c.name === values.category);
    const fields = {
      submission_key: values.submissionKey,
      title: values.title,
      description: values.description,
      category: category?.id,
      building: values.building,
      location: values.location,
      severity: values.severity.toLowerCase(),
      budget: values.budget,
      image: values.image,
      latitude: values.coordinates?.lat,
      longitude: values.coordinates?.lng,
    };
    Object.entries(fields).forEach(([key, value]) => {
      if (value != null) body.append(key, value);
    });
    return normalizeIssue(await request("/issues/", { method: "POST", body }));
  },
  async read(id, read) {
    return request(`/issues/${id}/read/`, {
      method: "POST",
      body: { read },
    });
  },
  comment: (id, text) =>
    request(`/issues/${id}/comments/`, {
      method: "POST",
      body: { content: text },
    }),
  async status(id, status, files, note = "") {
    for (const f of files) {
      const body = new FormData();
      body.append("file", f.file);
      body.append("kind", "progress");
      body.append("description", f.name);
      await request(`/issues/${id}/attachments/`, { method: "POST", body });
    }
    return request(`/issues/${id}/status/`, {
      method: "POST",
      body: { status: status.toLowerCase(), note },
    });
  },
  async profile() {
    currentUser = await request("/me/");
    return normalizeUser(currentUser);
  },
  async activity() {
    return (await list("/points/ledger/")).map((a) => ({
      id: a.id,
      title: rewardLabels[a.action] || a.action,
      description: `Ticket #${a.issue}`,
      points: a.points,
      date: a.created_at,
    }));
  },
  async stats(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const data = await request(`/dashboard/${query ? `?${query}` : ""}`);
    return {
      total: data.total,
      daily: data.daily,
      monthly: data.monthly,
      byStatus: Object.fromEntries(
        contract.statuses.map((s) => [
          title(s),
          data.by_status.find((r) => r.status === s)?.count || 0,
        ]),
      ),
      byCategory: Object.fromEntries(
        data.by_category.map((r) => [r.category__name, r.count]),
      ),
      bySeverity: Object.fromEntries(
        contract.severities.map((s) => [
          title(s),
          data.by_severity.find((r) => r.severity === s)?.count || 0,
        ]),
      ),
    };
  },
};
export const api = MOCK_MODE ? mock : live;
export { MOCK_MODE };
export const fileToData = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, url: reader.result, file });
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
