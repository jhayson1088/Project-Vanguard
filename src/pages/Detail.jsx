import PublicationEditor from "../components/PublicationEditor";
import React, { useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  MessageCircle,
  Send,
  CheckCheck,
  Paperclip,
  Clock3,
  ExternalLink,
  ShieldCheck,
  Banknote,
  BookOpen,
} from "lucide-react";
import { useApp } from "../context";
import { api, fileToData, MOCK_MODE } from "../api";
import {
  Avatar,
  Badge,
  ErrorBox,
  Loading,
  Select,
  time,
  money,
  useData,
} from "../components/UI";
const LocationPicker = lazy(() => import("../components/LocationPicker"));
export default function Detail() {
  const { id } = useParams(),
    { user, settings, notify, refreshProfile } = useApp(),
    {
      data: issue,
      loading,
      error,
      reload,
    } = useData(() => api.issue(id), [id]),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(""),
    [status, setStatus] = useState(""),
    [progressNote, setProgressNote] = useState(""),
    [files, setFiles] = useState([]);
  async function comment(e) {
    e.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      await api.comment(id, text);
      setText("");
      await reload();
      await refreshProfile();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    try {
      const picked = Array.from(e.target.files);
      if (picked.some((f) => f.size > 5 * 1024 * 1024))
        throw new Error("Each attachment must be smaller than 5 MB.");
      if (
        picked.some(
          (f) => !f.type.startsWith("image/") && f.type !== "application/pdf",
        )
      )
        throw new Error("Choose an image or PDF document.");
      setFiles(await Promise.all(picked.map(fileToData)));
      setActionError("");
    } catch (e) {
      setActionError(e.message);
    }
  }
  async function save(e) {
    e.preventDefault();
    setActionError("");
    const nextStatus = status || (issue.status === "Ongoing" ? "Ongoing" : "");
    if (
      nextStatus === "Ongoing" &&
      issue.status === "Ongoing" &&
      !progressNote.trim() &&
      !files.length
    ) {
      setActionError(
        "Add a progress note or supporting file to save an ongoing update.",
      );
      return;
    }
    if (nextStatus === "Cancelled" && !progressNote.trim()) {
      setActionError(
        "Enter a cancellation reason before cancelling this issue.",
      );
      return;
    }
    if (
      status === "Completed" &&
      !files.length &&
      !issue.attachments.some(
        (a) => MOCK_MODE || (a.kind === "progress" && a.administratorUploaded),
      )
    ) {
      setActionError(
        "Attach a supporting image or document before completing this issue.",
      );
      return;
    }
    setBusy(true);
    try {
      await api.status(
        id,
        nextStatus,
        files,
        progressNote.trim() ||
          (files.length ? "Progress documentation added." : ""),
      );
      setFiles([]);
      setStatus("");
      setProgressNote("");
      await reload();
      await refreshProfile();
      notify("Issue updated. Thanks for keeping the community informed.");
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="page">
        <ErrorBox error={error} retry={reload} />
      </div>
    );
  return (
    <div className="page detail-page">
      <Link
        to={user.role === "admin" ? "/admin/tickets" : "/"}
        className="back-link"
      >
        <ArrowLeft size={16} /> Back to{" "}
        {user.role === "admin" ? "ticket queue" : "campus feed"}
      </Link>
      <div className="detail-layout">
        <article className="panel detail-main">
          <div className="detail-ticket">
            <span>{issue.ticketNumber || `VG-${issue.id}`}</span>
            <Badge>{issue.status}</Badge>
          </div>
          <h1>{issue.title}</h1>
          <div className="detail-author">
            <Avatar name={issue.reporter} image={issue.reporterImage} />
            <div>
              <strong>{issue.reporter}</strong>
              <span>Reported {time(issue.createdAt)}</span>
            </div>
            <button
              className="button small"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.read(id, !issue.readBy.includes(user.id));
                  window.dispatchEvent(new Event("issue-read-updated"));
                  await reload();
                  await refreshProfile();
                } catch (e) {
                  notify(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <CheckCheck size={16} />
              {issue.readBy.includes(user.id)
                ? "Marked as read"
                : "Mark as read"}
            </button>
          </div>
          <div className="detail-tags">
            <Badge>{issue.category}</Badge>
            <span
              className={`severity severity-${issue.severity.toLowerCase()}`}
            >
              <span />
              {issue.severity} priority
            </span>
          </div>
          <p className="detail-description">{issue.description}</p>
          {issue.image && (
            <img className="detail-image" src={issue.image} alt={issue.title} />
          )}
          <div className="location-section">
            <h3>
              <MapPin size={18} /> Issue location
            </h3>
            <strong>{issue.building}</strong>
            <p>{issue.location}</p>
            {issue.coordinates && (
              <>
                <Suspense fallback={<Loading />}>
                  <LocationPicker value={issue.coordinates} readOnly />
                </Suspense>
                <span className="coordinates">
                  {issue.coordinates.lat}, {issue.coordinates.lng}
                </span>
              </>
            )}
          </div>
          <section id="comments" className="comments-section">
            <h2>
              <MessageCircle size={20} /> Conversation{" "}
              <span>{issue.comments.length}</span>
            </h2>
            {issue.comments.length === 0 && (
              <p className="muted">Be the first to share a helpful update.</p>
            )}
            {issue.comments.map((c) => (
              <div className="comment" key={c.id}>
                <Avatar name={c.name} image={c.image} />
                <div>
                  <strong>
                    {c.name}
                    <span>{time(c.createdAt)}</span>
                  </strong>
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
            <form onSubmit={comment} className="comment-form">
              <Avatar name={user.name} image={user.image} />
              <div>
                <label className="sr-only" htmlFor="comment">
                  Your comment
                </label>
                <textarea
                  id="comment"
                  required
                  maxLength={2000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share a helpful update…"
                />
                <button
                  className="button primary small"
                  disabled={busy || !text.trim()}
                >
                  <Send size={15} /> Post comment
                </button>
              </div>
            </form>
          </section>
          {!MOCK_MODE &&
            user.role === "admin" &&
            issue.status === "Completed" && <PublicationEditor issueId={id} />}
        </article>
        <aside className="detail-aside">
          {!MOCK_MODE &&
            user.role === "admin" &&
            issue.status === "Completed" && (
              <section className="panel">
                <h3>
                  <BookOpen size={18} />
                  Publication
                </h3>
                <p className="muted">
                  Create a campus article about this completed issue.
                </p>
                <a className="button primary small" href="#publication-editor">
                  Prepare article
                </a>
              </section>
            )}
          {user.role === "admin" && (
            <section className="panel assessment-card">
              <div className="aside-card-heading">
                <Sparkles size={19} />
                <h3>AI assessment</h3>
                <span className="demo-pill">
                  {MOCK_MODE ? "DEMO" : "ESTIMATE"}
                </span>
              </div>
              <div className="assessment-stat">
                <span>Credibility score</span>
                <strong>
                  {issue.credibility != null
                    ? `${issue.credibility}%`
                    : "Not assessed"}
                </strong>
              </div>
              {issue.credibility != null && (
                <progress value={issue.credibility} max="100" />
              )}
              <div className="assessment-stat">
                <span>
                  {issue.credibility == null
                    ? "Reporter estimated budget"
                    : "Estimated budget"}
                </span>
                <strong>{money(issue.budget)}</strong>
              </div>
              <p>{!MOCK_MODE && issue.ai_details}</p>
              {!MOCK_MODE && user.role === "admin" && issue.image && (
                <button
                  className="button small"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setActionError("");
                    try {
                      const result = await api.assess(id);
                      await reload();
                      if (result.ai_state !== "assessed") {
                        setActionError(
                          result.ai_details ||
                            "AI assessment did not complete. Please retry.",
                        );
                      } else {
                        notify(
                          "AI assessment completed. Score and budget updated.",
                        );
                      }
                    } catch (e) {
                      setActionError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy
                    ? "Please wait…"
                    : issue.ai_state === "assessed"
                      ? "Reassess issue"
                      : "Run AI assessment"}
                </button>
              )}
              <p>
                Estimates for administrative review, not guaranteed assessments.{" "}
                {MOCK_MODE &&
                  "Seed scores and AI budgets are fictional; new reports are not AI-assessed."}
              </p>
            </section>
          )}
          {user.role === "admin" &&
            !["Completed", "Cancelled"].includes(issue.status) && (
              <section className="panel admin-actions">
                <h3>
                  <ShieldCheck size={19} /> Manage this issue
                </h3>
                <form onSubmit={save}>
                  <Select
                    label="Update status"
                    required
                    value={
                      status || (issue.status === "Ongoing" ? "Ongoing" : "")
                    }
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Choose a status</option>
                    {issue.status === "Ongoing" && (
                      <option value="Ongoing">
                        Ongoing — save progress update
                      </option>
                    )}
                    {settings.statuses
                      .filter(
                        (s) =>
                          (
                            settings.transitions?.[
                              issue.status.toLowerCase()
                            ] ||
                            {
                              Pending: ["verified", "cancelled"],
                              Verified: ["ongoing", "cancelled"],
                              Ongoing: ["completed", "cancelled"],
                            }[issue.status] ||
                            []
                          ).includes(s.toLowerCase()) && s !== issue.status,
                      )
                      .map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                  </Select>
                  <label>
                    {status === "Cancelled"
                      ? "Cancellation reason *"
                      : "Progress note"}
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      placeholder="Describe the work completed, current progress, or next steps…"
                    />
                  </label>
                  <label className="attachment-upload">
                    <Paperclip size={18} />
                    <strong>Supporting documentation</strong>
                    <span>Images or PDF · 5 MB each</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={upload}
                    />
                  </label>
                  {files.map((f) => (
                    <div className="file-name" key={f.name}>
                      {f.name}
                    </div>
                  ))}
                  <p className="field-hint">
                    Completion requires a supporting image or document. Progress
                    attachments can also be added when work is ongoing.
                  </p>
                  <button className="button primary" disabled={busy}>
                    {busy ? "Saving…" : "Save update"}
                  </button>
                </form>
              </section>
            )}
          <ErrorBox error={actionError} />
          <section className="panel history-card">
            <h3>
              <Clock3 size={18} /> Status trail
            </h3>
            <div className="trail-current">
              <span>Current status</span>
              <Badge>{issue.status}</Badge>
            </div>
            <div className="timeline">
              {issue.history.map((h, index) => (
                <div className="timeline-item" key={index}>
                  <span className={`timeline-dot ${h.status.toLowerCase()}`} />
                  <strong>
                    {h.previousStatus
                      ? `${h.previousStatus} → ${h.status}`
                      : h.status}
                  </strong>
                  <span>{h.name}</span>
                  <time dateTime={h.date}>
                    {new Date(h.date).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                  {h.note && <p className="trail-note">{h.note}</p>}
                </div>
              ))}
            </div>
          </section>
          <section className="panel attachments-card">
            <h3>
              <Paperclip size={18} /> Progress documentation
            </h3>
            {issue.attachments.length === 0 ? (
              <p className="muted">No supporting documents yet.</p>
            ) : (
              issue.attachments.map((f, index) => (
                <a
                  key={index}
                  href={f.url}
                  download={f.name}
                  className="file-link"
                >
                  <Paperclip size={16} />
                  {f.name}
                  <ExternalLink size={14} />
                </a>
              ))
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
