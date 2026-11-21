import React, { useState } from "react";
import BrandMark from "../components/BrandMark";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Shield,
  GraduationCap,
  Mail,
  LockKeyhole,
  Leaf,
  Check,
  Users,
} from "lucide-react";
import { useApp } from "../context";
import { api, MOCK_MODE } from "../api";
import { ErrorBox } from "../components/UI";
export default function SignIn() {
  const { user, setUser, setSettings } = useApp(),
    [role, setRole] = useState("user"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  if (user) return <Navigate to="/" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await api.login({ email, password, role });
      setSettings(await api.settings());
      setUser(await api.profile());
      navigate(u.role === "admin" ? "/admin" : "/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="signin-page">
      <section className="signin-story">
        <div className="brand light">
          <BrandMark />
          <span>vanguard</span>
        </div>
        <div>
          <div className="eyebrow">CARE STARTS WITH COMMUNITY</div>
          <h1>
            Your campus.
            <br />
            Your voice.
            <br />A better tomorrow.
          </h1>
          <p>
            Join the community making ISAT University a better place, one report
            at a time.
          </p>
        </div>
        <div className="signin-story-footer">
          <Leaf size={22} />
          <span>A shared space. A shared responsibility.</span>
        </div>
      </section>
      <section className="signin-form">
        <div className="signin-inner">
          <div className="signin-badge">
            <BrandMark />
          </div>
          <h2>Welcome to Vanguard</h2>
          <p>Let’s take care of our campus, together.</p>
          <form onSubmit={submit}>
            {MOCK_MODE && (
              <>
                <div className="demo-notice">
                  DEMO WORKSPACE <span>Explore with fictional campus data</span>
                </div>
                <fieldset className="role-choices">
                  <legend>How would you like to explore?</legend>
                  <button
                    type="button"
                    className={role === "user" ? "chosen" : ""}
                    onClick={() => setRole("user")}
                  >
                    <Users size={20} />
                    <strong>Community member</strong>
                    <span>Report and follow issues</span>
                  </button>
                  <button
                    type="button"
                    className={role === "admin" ? "chosen" : ""}
                    onClick={() => setRole("admin")}
                  >
                    <Shield size={20} />
                    <strong>Administrator</strong>
                    <span>Review and manage work</span>
                  </button>
                </fieldset>
              </>
            )}
            <label>
              {MOCK_MODE ? "University email" : "University username"}
              <input
                type={MOCK_MODE ? "email" : "text"}
                required={!MOCK_MODE}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  MOCK_MODE
                    ? "alex.morgan@vanguard.edu"
                    : "Your university username"
                }
                autoComplete="username"
              />
            </label>
            {!MOCK_MODE && (
              <label>
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            )}
            <ErrorBox error={error} />
            <button className="button primary" disabled={busy}>
              {busy
                ? "Signing in…"
                : MOCK_MODE
                  ? "Enter demo workspace"
                  : "Sign in"}
            </button>
          </form>
          <p className="signin-disclaimer">
            {MOCK_MODE
              ? "No password needed. Demo changes stay in this browser. AI scores are fictional examples."
              : "Use your university account. Your session is secured by your campus administrator."}
          </p>
        </div>
        <span className="signin-bottom">
          ISAT University · CAMPUS CARE, TOGETHER
        </span>
      </section>
    </div>
  );
}
