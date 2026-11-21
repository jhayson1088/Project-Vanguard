import React, { useEffect, useState } from "react";
import { issueDuration } from "./duration";
import FeedComments from "./FeedComments";
import { Link } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  CheckCheck,
  MoreHorizontal,
  Sparkles,
  Banknote,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import { Avatar, Badge, time, money } from "./UI";
import { useApp } from "../context";
import { api, MOCK_MODE } from "../api";
export default function IssueCard({ issue, onUpdate }) {
  const { user, notify, refreshProfile } = useApp();
  const read = issue.readBy.includes(user.id);
  const [reading, setReading] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [commentCount, setCommentCount] = useState(null);
  useEffect(() => {
    if (["Completed", "Cancelled"].includes(issue.status)) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [issue.id, issue.status]);
  async function toggle() {
    if (reading) return;
    setReading(true);
    try {
      await api.read(issue.id, !read);
      window.dispatchEvent(new Event("issue-read-updated"));
      onUpdate();
      await refreshProfile();
    } catch (e) {
      notify(e.message);
    } finally {
      setReading(false);
    }
  }
  return (
    <article
      className={`issue-card compact-issue-card ${issue.image ? "has-preview" : ""} ${issue.status === "Completed" ? "completed-card" : ""}`}
    >
      {issue.image && (
        <Link to={`/issues/${issue.id}`} className="issue-image">
          <img
            src={issue.image}
            alt={`Reported maintenance issue: ${issue.title}`}
            loading="lazy"
          />
        </Link>
      )}
      <div className="issue-card-content">
        <div className="issue-card-heading">
          <div className="card-author">
            <Avatar
              name={issue.reporter}
              image={issue.reporterImage}
              initials={issue.initials}
            />
            <div>
              <strong>
                {issue.reporter}
                {issue.reporterId === user.id && (
                  <span className="you-label">You</span>
                )}
              </strong>
              <span>
                {time(issue.createdAt)}
                <span className="metadata-dot">·</span>
                <span className="category-label">{issue.category}</span>
              </span>
            </div>
          </div>
          <div className="issue-summary">
            <span className="compact-ticket">
              {issue.ticketNumber || `VG-${issue.id}`}
            </span>
            <Link className="issue-title" to={`/issues/${issue.id}`}>
              <h2>{issue.title}</h2>
            </Link>
            <p className="issue-description">{issue.description}</p>
          </div>
          <div className="issue-status-summary">
            <span
              className={`severity severity-${issue.severity.toLowerCase()}`}
            >
              <span />
              {issue.severity} priority
            </span>
            <span className="issue-duration">
              <Clock3 size={16} /> {issueDuration(issue, now)}
            </span>
            <Badge>{issue.status}</Badge>
            {!read && (
              <button
                className={read ? "read-button is-read" : "read-button"}
                onClick={toggle}
                disabled={reading}
                aria-pressed={read}
              >
                <CheckCheck size={17} />
                {reading ? "Saving…" : read ? "Marked as read" : "Mark as read"}
              </button>
            )}
          </div>
        </div>
        <div className="issue-location">
          <MapPin size={14} />
          <span>
            {issue.building}
            <span className="metadata-dot">·</span>
            {issue.location}
          </span>
        </div>
        {issue.credibility != null && (
          <div className="ai-strip">
            <span>
              <Sparkles size={14} />
              <strong>{issue.credibility}%</strong> credibility
            </span>
            <span>
              <Banknote size={15} />
              <strong>{money(issue.budget)}</strong> est. budget
            </span>
            <span className="ai-label">
              {MOCK_MODE ? "Demo AI" : "AI estimate"}
            </span>
          </div>
        )}
        <div className="card-footer">
          <button
            type="button"
            aria-expanded={commentsOpen}
            aria-controls={`feed-comments-${issue.id}`}
            onClick={() => setCommentsOpen((open) => !open)}
          >
            <MessageCircle size={17} />
            {commentCount ?? issue.commentCount ?? issue.comments.length}{" "}
            <span>comments</span>
          </button>
          <Link className="details-link" to={`/issues/${issue.id}`}>
            View issue <ArrowUpRight size={15} />
          </Link>
        </div>
        {commentsOpen && (
          <FeedComments issueId={issue.id} onCount={setCommentCount} />
        )}
      </div>
    </article>
  );
}
