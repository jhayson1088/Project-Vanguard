import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context";
import { time } from "./UI";

export default function IssueNotifications() {
  const { user } = useApp();
  const location = useLocation();
  const container = useRef(null);
  const [open, setOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let running = false;
    async function refresh() {
      if (running) return;
      running = true;
      try {
        const rows = await api.issues();
        if (active) {
          setIssues(
            rows.filter(
              (issue) =>
                issue.reporterId !== user.id && !issue.readBy.includes(user.id),
            ),
          );
          setError("");
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        running = false;
        if (active) setLoading(false);
      }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("issue-read-updated", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("issue-read-updated", refresh);
    };
  }, [user.id, location.pathname, open, retry]);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (
        event.type === "keydown"
          ? event.key === "Escape"
          : !container.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div className="notification-wrap" ref={container}>
      <button
        className="icon-button notification-button"
        aria-label={`Unread issues: ${issues.length}`}
        aria-expanded={open}
        aria-controls="issue-notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={22} />
        {issues.length > 0 && (
          <span className="notification-count">
            {issues.length > 99 ? "99+" : issues.length}
          </span>
        )}
      </button>
      {open && (
        <section
          id="issue-notifications"
          className="notification-panel issue-notification-panel"
          aria-label="Unread issue notifications"
        >
          <strong>
            Unread issues <span>({issues.length})</span>
          </strong>
          <p>
            Open an issue, then mark it as read. Your first read of another
            user’s issue may earn points.
          </p>
          {loading && <p role="status">Loading notifications…</p>}
          {error && (
            <div role="alert">
              <p>{error}</p>
              <button
                className="text-button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && !issues.length && <p>You’re all caught up.</p>}
          <div className="issue-notification-list">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                className="issue-notification"
                to={`/issues/${issue.id}`}
                onClick={() => setOpen(false)}
              >
                {issue.image && <img src={issue.image} alt="" loading="lazy" />}
                <div>
                  <strong>{issue.title}</strong>
                  <span>
                    {issue.building} · {issue.status}
                  </span>
                  <p>{issue.description}</p>
                  <time dateTime={issue.createdAt}>
                    {time(issue.createdAt)}
                  </time>
                </div>
                <span className="notification-unread-dot" aria-label="Unread" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
