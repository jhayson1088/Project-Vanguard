import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context";
import { Avatar } from "./UI";

export default function HeaderProfile() {
  const { user, setUser, notify } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.type === "keydown") {
        if (event.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
      } else if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await api.logout();
      setUser(null);
      navigate("/signin", { replace: true });
    } catch (e) {
      notify(e.message);
      setBusy(false);
    }
  }
  return (
    <div
      className="header-profile"
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        ref={trigger}
        className="header-avatar-button"
        aria-label="Open account options"
        aria-expanded={open}
        aria-controls="header-account-options"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={user.name} image={user.image} initials={user.initials} />
      </button>
      {open && (
        <div id="header-account-options" className="header-account-options">
          <strong>{user.name}</strong>
          <Link to="/profile" onClick={() => setOpen(false)}>
            <UserRound size={17} />
            My profile
          </Link>
          <button type="button" onClick={logout} disabled={busy}>
            <LogOut size={17} />
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
