import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  MapPin,
  Sparkles,
  Check,
  X,
  ClipboardCheck,
  ImagePlus,
  ShieldCheck,
  Info,
  Plus,
} from "lucide-react";
import { useApp } from "../context";
import { api, fileToData, MOCK_MODE } from "../api";
import { createSubmissionKey } from "../api/submissionKey";
import { ErrorBox, Select } from "../components/UI";
const LocationPicker = lazy(() => import("../components/LocationPicker"));
export default function Submit() {
  const { settings, refreshProfile } = useApp(),
    [values, setValues] = useState({
      title: "",
      description: "",
      category: "",
      building: "",
      location: "",
      severity: settings.severities[1] || settings.severities[0],
      budget: "",
    }),
    [photo, setPhoto] = useState(null),
    [map, setMap] = useState(false),
    [coordinates, setCoordinates] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [created, setCreated] = useState(null),
    [aiCheck, setAiCheck] = useState(null),
    [checkingAI, setCheckingAI] = useState(!MOCK_MODE),
    [skipAI, setSkipAI] = useState(false),
    [phase, setPhase] = useState(""),
    [submissionKey] = useState(() => createSubmissionKey());
  async function checkAI() {
    setCheckingAI(true);
    setSkipAI(false);
    try {
      const result = await api.assessmentReadiness();
      setAiCheck(result);
      return result;
    } catch (e) {
      const result = { ready: false, message: e.message };
      setAiCheck(result);
      return result;
    } finally {
      setCheckingAI(false);
    }
  }
  useEffect(() => {
    if (!MOCK_MODE) checkAI();
  }, []);
  function change(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    try {
      setPhoto(await fileToData(file));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!MOCK_MODE && photo && !skipAI) {
        setPhase("Checking AI connection…");
        const readiness = await checkAI();
        if (!readiness.ready) {
          setError(
            "AI is unavailable. Retry the connection check or choose to submit without an AI estimate.",
          );
          return;
        }
      }
      setPhase(
        !MOCK_MODE && photo
          ? "Submitting report and requesting AI assessment…"
          : "Submitting report…",
      );
      const result = await api.createIssue({
        ...values,
        submissionKey,
        title: values.title.trim(),
        description: values.description.trim(),
        budget: values.budget === "" ? null : Number(values.budget),
        image: MOCK_MODE ? photo?.url : photo?.file,
        coordinates,
      });
      setCreated(result);
      await refreshProfile();
      window.scrollTo(0, 0);
    } catch (e) {
      setError(
        [
          e.message,
          ...Object.entries(e.fields || {})
            .filter(([k]) => k !== "detail")
            .map(([k, v]) => `${k}: ${v}`),
        ].join(" "),
      );
    } finally {
      setBusy(false);
    }
  }
  if (created)
    return (
      <div className="page">
        <section className="success-card">
          <div className="success-icon">
            <ClipboardCheck size={35} />
          </div>
          <div className="eyebrow">THANK YOU FOR SPEAKING UP</div>
          <h1>One report. A step toward better.</h1>
          <p>Your issue has been shared with our facilities team.</p>
          {!MOCK_MODE && (
            <p role="status">
              {created.ai_state === "assessed"
                ? `AI assessment completed: ${created.credibility}% evidence consistency, estimated repair budget ₱${created.aiEstimatedBudget?.toLocaleString("en-PH")}.`
                : `Report saved. AI assessment ${created.ai_state || "unavailable"}. ${created.ai_details || "An administrator can retry from the issue page."}`}
            </p>
          )}
          <div className="ticket-confirmation">
            <span>YOUR TICKET</span>
            <strong>{created.ticketNumber || `VG-${created.id}`}</strong>
            <span className="badge pending">{created.status}</span>
          </div>
          <p>
            The team will review the details and update the status. You can
            follow progress and join the conversation on your issue.
          </p>
          <Link className="button primary" to={`/issues/${created.id}`}>
            View your issue
          </Link>
          <Link className="text-button" to="/">
            Back to campus feed
          </Link>
        </section>
      </div>
    );
  return (
    <div className="page form-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">A SMALL STEP FOR A BETTER CAMPUS</div>
          <h1>What needs a little care?</h1>
          <p>Help our team find it, understand it, and make it right.</p>
        </div>
      </div>
      <div className="form-layout">
        <form className="panel report-form" onSubmit={submit}>
          <div className="form-section-heading">
            <span className="small-icon">
              <ClipboardCheck size={20} />
            </span>
            <div>
              <h2>Issue details</h2>
              <p>Tell us what you’ve noticed.</p>
            </div>
          </div>
          <label>
            Issue title <span className="required">*</span>
            <input
              required
              name="title"
              value={values.title}
              onChange={change}
              maxLength={150}
              pattern=".*\S.*"
              placeholder="e.g. Leaking faucet in the Science Building"
            />
          </label>
          <label>
            Description <span className="required">*</span>
            <textarea
              required
              name="description"
              rows={5}
              minLength={15}
              value={values.description}
              onChange={change}
              placeholder="What’s happening? Include any details that could help our facilities team."
            />
            <span className="field-hint">
              At least 15 characters. A little detail makes a big difference.
            </span>
          </label>
          <div className="two-columns">
            <Select
              label="Category *"
              required
              name="category"
              value={values.category}
              onChange={change}
            >
              <option value="">Select a category</option>
              {settings.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Select
              label="Priority *"
              required
              name="severity"
              value={values.severity}
              onChange={change}
            >
              {settings.severities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="form-divider" />
          <div className="form-section-heading">
            <span className="small-icon">
              <MapPin size={20} />
            </span>
            <div>
              <h2>Where is it?</h2>
              <p>Point our team in the right direction.</p>
            </div>
          </div>
          <div className="two-columns">
            <label>
              Building *
              <input
                required
                name="building"
                list="buildings"
                value={values.building}
                onChange={change}
                placeholder="Select or enter a building"
              />
              <datalist id="buildings">
                {settings.buildings
                  .filter((b) => b !== "All campus")
                  .map((c) => (
                    <option key={c} value={c} />
                  ))}
              </datalist>
            </label>
            <label>
              Specific location *
              <input
                required
                name="location"
                value={values.location}
                onChange={change}
                placeholder="Floor, room, or nearest landmark"
              />
            </label>
          </div>
          <button
            type="button"
            className="button map-toggle"
            onClick={() => {
              setMap(!map);
              if (!coordinates) setCoordinates({ lat: 14.5995, lng: 120.9842 });
            }}
          >
            <MapPin size={16} />
            {map ? "Hide location map" : "Choose a location on the map"}
            <span>Optional</span>
          </button>
          {map && (
            <div className="map-picker">
              <Suspense fallback={<div className="loading">Loading map…</div>}>
                <LocationPicker value={coordinates} onChange={setCoordinates} />
              </Suspense>
              <p>Drag the marker or click the map to move it.</p>
              <span className="coordinates">
                {coordinates?.lat}, {coordinates?.lng}
                {values.location && ` · ${values.building}, ${values.location}`}
              </span>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setCoordinates(null);
                  setMap(false);
                }}
              >
                Remove map location
              </button>
            </div>
          )}
          <div className="form-divider" />
          <div className="form-section-heading">
            <span className="small-icon">
              <Camera size={20} />
            </span>
            <div>
              <h2>A picture helps</h2>
              <p>Optional, but worth a thousand words.</p>
            </div>
          </div>
          {photo ? (
            <div className="upload-preview">
              <img src={photo.url} alt="Your selected issue photo" />
              <button
                className="icon-button"
                type="button"
                aria-label="Remove photo"
                onClick={() => setPhoto(null)}
              >
                <X />
              </button>
            </div>
          ) : (
            <label className="upload-area">
              <ImagePlus size={28} />
              <strong>Choose a photo of the issue</strong>
              <span>JPG, PNG, or WebP · Up to 5 MB</span>
              <input type="file" accept="image/*" onChange={upload} />
            </label>
          )}
          <label className="budget-field">
            Your estimated budget (₱)
            <input
              type="number"
              name="budget"
              value={values.budget}
              onChange={change}
              min="0"
              step="1"
              placeholder="Optional — leave blank if you’re unsure"
            />
          </label>
          <div className="notice">
            <Sparkles size={18} />
            <p>
              AI credibility and budget assessments are estimates for
              administrative review. They are not guaranteed assessments.{" "}
              {MOCK_MODE &&
                "Demo assessments are fictional. New demo reports are not AI-assessed."}
            </p>
          </div>
          <ErrorBox error={error} />
          {!MOCK_MODE && (
            <div className="notice" role="status" aria-live="polite">
              <Sparkles size={18} />
              <div>
                <strong>
                  {checkingAI
                    ? "Checking AI connection…"
                    : aiCheck?.ready
                      ? "AI connection available"
                      : "AI assessment unavailable"}
                </strong>
                <p>{aiCheck?.message}</p>
                {!photo && <p>Add a photo to receive an AI assessment.</p>}
                <button
                  type="button"
                  className="button small"
                  disabled={checkingAI || busy}
                  onClick={checkAI}
                >
                  Check again
                </button>
                {photo && !checkingAI && !aiCheck?.ready && (
                  <label>
                    <input
                      type="checkbox"
                      checked={skipAI}
                      onChange={(e) => setSkipAI(e.target.checked)}
                    />{" "}
                    Submit my report even if AI assessment is unavailable
                  </label>
                )}
              </div>
            </div>
          )}
          {busy && (
            <p role="status" aria-live="polite">
              {phase} Please keep this page open.
            </p>
          )}
          <div className="form-actions">
            <Link to="/" className="button">
              Cancel
            </Link>
            <button
              className="button primary"
              disabled={
                busy ||
                (!MOCK_MODE &&
                  photo &&
                  (checkingAI || (!aiCheck?.ready && !skipAI)))
              }
            >
              {busy ? (
                "Submitting…"
              ) : (
                <>
                  <Plus size={17} /> Submit issue
                </>
              )}
            </button>
          </div>
        </form>
        <aside className="form-aside panel">
          <div className="small-icon pale">
            <ShieldCheck size={23} />
          </div>
          <h3>Good reports help good things happen.</h3>
          <p>A few things to keep in mind:</p>
          <ul>
            <li>Be specific about the location.</li>
            <li>Describe what’s wrong and when you noticed it.</li>
            <li>Include a clear photo if you can.</li>
            <li>Avoid sharing personal or sensitive information.</li>
          </ul>
          <div className="notice">
            <Info size={18} />
            <p>
              Immediate danger? Contact campus security directly. This feed is
              for maintenance reports.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
