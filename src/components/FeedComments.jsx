import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { api, MOCK_MODE } from "../api";
import { useApp } from "../context";
import { Avatar, ErrorBox, time } from "./UI";

export default function FeedComments({ issueId, onCount }) {
  const { user } = useApp();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [visible, setVisible] = useState(3);
  const fetchComments = async () =>
    MOCK_MODE ? (await api.issue(issueId)).comments : api.comments(issueId);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchComments()
      .then((rows) => {
        if (active) {
          setComments(rows);
          onCount(rows.length);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [issueId, retry, onCount]);

  async function submit(e) {
    e.preventDefault();
    if (posting || !text.trim()) return;
    setPosting(true);
    setError("");
    try {
      const result = await api.comment(issueId, text.trim());
      const rows = MOCK_MODE
        ? result.comments
        : [
            ...comments,
            {
              id: result.id,
              name: result.author.display_name,
              image: result.author.image,
              text: result.content,
              createdAt: result.created_at,
            },
          ];
      setComments(rows);
      onCount(rows.length);
      setText("");
      setVisible(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <section
      id={`feed-comments-${issueId}`}
      className="feed-comments"
      aria-label="Issue comments"
    >
      {loading ? (
        <p role="status">Loading comments…</p>
      ) : (
        <>
          {comments.length > visible && (
            <button
              type="button"
              className="text-button"
              onClick={() => setVisible((count) => count + 3)}
            >
              Show more comments
            </button>
          )}
          {!comments.length && (
            <p className="muted">Be the first to comment.</p>
          )}
          {comments.slice(-visible).map((comment) => (
            <div className="feed-comment" key={comment.id}>
              <Avatar name={comment.name} image={comment.image} />
              <div>
                <div className="feed-comment-bubble">
                  <strong>{comment.name}</strong>
                  <p>{comment.text}</p>
                </div>
                <time dateTime={comment.createdAt}>
                  {time(comment.createdAt)}
                </time>
              </div>
            </div>
          ))}
        </>
      )}
      <ErrorBox error={error} retry={() => setRetry((value) => value + 1)} />
      <form className="feed-comment-form" onSubmit={submit}>
        <Avatar name={user.name} image={user.image} />
        <label className="sr-only" htmlFor={`feed-comment-input-${issueId}`}>
          Write a comment
        </label>
        <textarea
          id={`feed-comment-input-${issueId}`}
          rows={2}
          maxLength={3000}
          placeholder="Write a comment…"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={posting}
        />
        <button
          className="button primary small"
          disabled={loading || posting || !text.trim()}
        >
          <Send size={15} />
          {posting ? "Posting…" : "Post"}
        </button>
      </form>
    </section>
  );
}
