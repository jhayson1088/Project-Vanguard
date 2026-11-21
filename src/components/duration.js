export function issueDuration(issue, now = Date.now()) {
  const completed = ["Completed", "Cancelled"].includes(issue.status);
  const end = completed
    ? (issue.status === "Cancelled" ? issue.cancelledAt : issue.completedAt) ||
      issue.history?.find((entry) => entry.status === issue.status)?.date
    : now;
  if (end == null) return "Closure time unavailable";
  const startTime = new Date(issue.createdAt).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime))
    return "Duration unavailable";
  const hours = Math.floor(Math.max(0, endTime - startTime) / 3600000);
  return `${completed ? `${issue.status} in` : "Open for"} ${Math.floor(hours / 24)}d ${hours % 24}h`;
}
