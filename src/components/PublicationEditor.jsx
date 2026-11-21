import React, { useEffect, useState } from "react";
import { BookOpen, Sparkles, ExternalLink } from "lucide-react";
import { publications } from "../api/publications";
import { ErrorBox } from "./UI";
import ArticleContent from "./ArticleContent";

export default function PublicationEditor({ issueId }) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    title: "",
    summary: "",
    body: "",
    steps: "",
    assets: [],
  });
  const [sources, setSources] = useState({ assets: [], steps: [] });
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoaded(false);
    setError("");
    Promise.all([publications.draft(issueId), publications.sources(issueId)])
      .then(([draft, source]) => {
        if (!active) return;
        setSaved(draft);
        setSources(source);
        setLoaded(true);
        if (draft)
          setFields({
            title: draft.title,
            summary: draft.summary,
            body: draft.body,
            steps: draft.steps || "",
            assets: draft.assets || [],
          });
        else
          setFields({
            title: "",
            summary: "",
            body: "",
            steps: source.steps.map((step) => step.text).join("\n"),
            assets: [],
          });
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
  }, [issueId, retry]);
  async function generate() {
    setBusy("generate");
    setError("");
    setMessage("");
    try {
      const generated = await publications.generate(issueId);
      setFields((current) => ({
        ...current,
        ...generated,
        assets: current.assets,
      }));
      setPreview(false);
      setMessage(
        "Draft generated. Review the facts and edit the text before publishing. It has not been saved or published.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function save(event) {
    event.preventDefault();
    const publish = event.nativeEvent.submitter?.value === "publish";
    let newTab = null;
    if (publish) {
      newTab = window.open("about:blank", "_blank");
      if (newTab) newTab.opener = null;
    }
    setBusy(publish ? "publish" : "save");
    setError("");
    setMessage("");
    try {
      const result = await (publish
        ? publications.publish(issueId, fields)
        : publications.save(issueId, fields));
      setSaved(result);
      setMessage(
        publish
          ? "Article published. Anyone with the article link can read it."
          : "Draft saved privately. The published version is unchanged.",
      );
      if (publish && newTab)
        newTab.location.href = `${window.location.origin}/articles/${result.slug}`;
    } catch (e) {
      if (newTab) newTab.close();
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function unpublish() {
    setBusy("unpublish");
    setError("");
    setMessage("");
    try {
      setSaved(await publications.unpublish(issueId));
      setMessage(
        "Article unpublished. The draft is retained and the public link is no longer available.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  const change = (event) =>
    setFields({ ...fields, [event.target.name]: event.target.value });
  return (
    <section id="publication-editor" className="publication-editor">
      <div className="section-heading">
        <h2>
          <BookOpen size={20} />
          Issue publication
        </h2>
        <span className="badge">
          {saved?.published_at ? "Published" : "Private draft"}
        </span>
      </div>
      <p className="muted">
        Turn this completed issue into a campus article. Generate a draft with
        AI or write your own, then review it before publishing.
      </p>
      {saved?.published_at && (
        <a
          className="publication-open-link"
          href={`/articles/${saved.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open published article <ExternalLink size={15} />
        </a>
      )}
      <button
        type="button"
        className="button small"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? "Close editor" : "Prepare article"}
      </button>
      {open && (
        <>
          {loading && <p role="status">Loading article draft…</p>}
          <ErrorBox
            error={error}
            retry={
              !loaded && !loading
                ? () => setRetry((value) => value + 1)
                : undefined
            }
          />
          {!loading && loaded && (
            <>
              <div className="publication-toolbar">
                <button
                  type="button"
                  className="button small"
                  disabled={!!busy}
                  onClick={generate}
                >
                  <Sparkles size={16} />
                  {busy === "generate"
                    ? "Generating draft…"
                    : "Generate AI draft"}
                </button>
                <button
                  type="button"
                  className="button small"
                  onClick={() => setPreview((value) => !value)}
                >
                  {preview ? "Edit article" : "Preview article"}
                </button>
              </div>
              <p className="field-hint">
                Generating replaces the text in this editor. It does not change
                a saved or published article.
              </p>
              {message && (
                <p className="notice" role="status">
                  {message}
                </p>
              )}
              {preview ? (
                <ArticleContent
                  article={{
                    ...fields,
                    assets: fields.assets.map((asset) => ({
                      ...sources.assets.find(
                        (source) => source.key === asset.key,
                      ),
                      ...asset,
                    })),
                  }}
                  preview
                />
              ) : (
                <form onSubmit={save} className="publication-form">
                  <label>
                    Article title
                    <input
                      name="title"
                      value={fields.title}
                      onChange={change}
                      required
                      maxLength={200}
                      disabled={!!busy}
                    />
                  </label>
                  <label>
                    Short summary
                    <textarea
                      name="summary"
                      value={fields.summary}
                      onChange={change}
                      rows={2}
                      maxLength={600}
                      disabled={!!busy}
                    />
                  </label>
                  <label>
                    Article content
                    <textarea
                      name="body"
                      value={fields.body}
                      onChange={change}
                      rows={12}
                      required
                      maxLength={20000}
                      disabled={!!busy}
                    />
                  </label>
                  <label>
                    Steps to completion
                    <textarea
                      name="steps"
                      value={fields.steps}
                      onChange={change}
                      rows={6}
                      maxLength={10000}
                      disabled={!!busy}
                      placeholder="One recorded work step per line"
                    />
                  </label>
                  <p className="field-hint">
                    Imported from recorded status changes and progress notes.
                    Edit for publication; use one step per line.
                  </p>
                  <button
                    type="button"
                    className="button small"
                    disabled={!!busy}
                    onClick={() =>
                      setFields((current) => ({
                        ...current,
                        steps: sources.steps
                          .map((step) => step.text)
                          .join("\n"),
                      }))
                    }
                  >
                    Restore recorded steps
                  </button>
                  <fieldset className="publication-assets">
                    <legend>Photos and supporting documents</legend>
                    <p className="field-hint">
                      Select the assets to include publicly and add optional
                      captions.
                    </p>
                    {!sources.assets.length && (
                      <p className="muted">
                        No issue photos or supporting files are available.
                      </p>
                    )}
                    {sources.assets.map((source) => {
                      const selected = fields.assets.find(
                        (asset) => asset.key === source.key,
                      );
                      return (
                        <div className="publication-asset" key={source.key}>
                          <label className="publication-asset-select">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              disabled={!!busy}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setFields((current) => ({
                                  ...current,
                                  assets: checked
                                    ? [
                                        ...current.assets,
                                        { key: source.key, caption: "" },
                                      ]
                                    : current.assets.filter(
                                        (asset) => asset.key !== source.key,
                                      ),
                                }));
                              }}
                            />
                            {source.type === "image" && (
                              <img src={source.url} alt="" loading="lazy" />
                            )}
                            <span>{source.label}</span>
                          </label>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-button"
                          >
                            View source <ExternalLink size={12} />
                          </a>
                          {selected && (
                            <label>
                              Public caption
                              <input
                                value={selected.caption}
                                maxLength={300}
                                disabled={!!busy}
                                placeholder="Describe this photo or document"
                                onChange={(event) => {
                                  const caption = event.target.value;
                                  setFields((current) => ({
                                    ...current,
                                    assets: current.assets.map((asset) =>
                                      asset.key === source.key
                                        ? { ...asset, caption }
                                        : asset,
                                    ),
                                  }));
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </fieldset>
                  <p className="notice">
                    Publishing makes this reviewed text readable without signing
                    in, along with the selected photos and documents. Review the
                    work steps, captions, and files for private information.
                    Unselected files, comments, and user profiles stay private.
                  </p>
                  <div className="publication-toolbar">
                    <button
                      className="button"
                      type="submit"
                      value="save"
                      disabled={!!busy}
                    >
                      {busy === "save" ? "Saving…" : "Save private draft"}
                    </button>
                    <button
                      className="button primary"
                      type="submit"
                      value="publish"
                      disabled={!!busy}
                    >
                      {busy === "publish"
                        ? "Publishing…"
                        : saved?.published_at
                          ? "Republish and open"
                          : "Publish and open"}
                      <ExternalLink size={15} />
                    </button>
                  </div>
                </form>
              )}
              {saved?.published_at && (
                <button
                  type="button"
                  className="text-button publication-unpublish"
                  onClick={unpublish}
                  disabled={!!busy}
                >
                  {busy === "unpublish" ? "Unpublishing…" : "Unpublish article"}
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
