import IssueNotifications from "./IssueNotifications";
import BrandMark from "./BrandMark";
import HeaderProfile from "./HeaderProfile";
import React, { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import {
  Shield,
  LayoutGrid,
  Plus,
  UserRound,
  ChartNoAxesCombined,
  ClipboardList,
  Settings2,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Sprout,
  CircleHelp,
  GraduationCap,
} from "lucide-react";
import { useApp } from "../context";
import { api, MOCK_MODE } from "../api";
import { Avatar, Modal } from "./UI";
export default function Layout() {
  const { user, setUser, notify } = useApp(),
    [mobile, setMobile] = useState(false),
    [help, setHelp] = useState(false),
    [query, setQuery] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  const admin = location.pathname.startsWith("/admin");
  const links = [
    { to: "/", label: "Campus feed", icon: LayoutGrid },
    { to: "/submit", label: "Report an issue", icon: Plus },
    { to: "/profile", label: "My profile", icon: UserRound },
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <Link to="/" className="brand">
          <BrandMark />
          <span>
            vanguard
            <span className="brand-caption">A BETTER CAMPUS, TOGETHER</span>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <div className="workspace-label">YOUR CAMPUS</div>
        <div className="campus-switch">
          <div className="campus-icon">
            <GraduationCap size={21} />
          </div>
          <div>
            <strong>ISAT University</strong>
            <span>Campus community</span>
          </div>
          <ChevronRight size={15} />
        </div>
        <div className="nav-group-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end onClick={() => setMobile(false)}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        {user.role === "admin" && (
          <>
            <div className="nav-group-label">ADMINISTRATION</div>
            <nav aria-label="Administration">
              {[
                { to: "/admin", label: "Overview", icon: ChartNoAxesCombined },
                {
                  to: "/admin/tickets",
                  label: "Ticket queue",
                  icon: ClipboardList,
                },
                {
                  to: "/admin/reports",
                  label: "Reports & insights",
                  icon: ChartNoAxesCombined,
                },
                {
                  to: "/admin/settings",
                  label: "Reward settings",
                  icon: Settings2,
                },
              ].map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end onClick={() => setMobile(false)}>
                  <Icon size={19} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
        <div className="sidebar-bottom">
          <div className="care-card">
            <span className="care-icon">
              <Sprout size={23} />
            </span>
            <strong>
              Small reports.
              <br />
              Meaningful change.
            </strong>
            <p>A better campus starts with you.</p>
            <Link to="/submit">
              Make a difference <Plus size={15} />
            </Link>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={18} /> Help & getting started
          </button>
          <div className="sidebar-profile">
            <Avatar
              name={user.name}
              image={user.image}
              initials={user.initials}
            />
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role === "admin"
                  ? "Campus administrator"
                  : "Campus contributor"}
              </span>
            </div>
            <button
              className="icon-button"
              title="Sign out"
              onClick={async () => {
                try {
                  await api.logout();
                  setUser(null);
                  navigate("/signin");
                } catch (e) {
                  notify(e.message);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && <div className="nav-scrim" onClick={() => setMobile(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {admin
                ? "Administration"
                : location.pathname === "/submit"
                  ? "Report an issue"
                  : location.pathname === "/profile"
                    ? "My profile"
                    : "Campus feed"}
            </strong>
          </div>
          <div className="top-actions">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/?q=${encodeURIComponent(query)}`);
              }}
            >
              <Search size={17} />
              <input
                aria-label="Search campus issues"
                placeholder="Search anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <span className="top-divider" />
            <IssueNotifications />
            <HeaderProfile />
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="footer">
          <span>Made for our campus. Built around our community.</span>
          <span>
            {MOCK_MODE
              ? "Demo workspace · Fictional data"
              : "Read/unread preference saved on this browser"}
            <span className="footer-dot">·</span>Vanguard
          </span>
        </footer>
      </div>
      {help && (
        <Modal title="Let’s care for our campus" onClose={() => setHelp(false)}>
          <p>
            Spot a problem? Select <strong>Report an issue</strong>, add the
            location and a description, and submit your report. A photo helps
            the facilities team assess it.
          </p>
          <p>
            Open any issue to follow its progress, leave a comment, or mark it
            as read. Find your contribution history under{" "}
            <strong>My profile</strong>.
          </p>
          <p className="notice">
            {MOCK_MODE
              ? "You’re in demo mode. Reports and comments are saved in this browser. AI assessments are fictional examples."
              : "AI assessments are estimates for administrative review."}
          </p>
          <button className="button primary" onClick={() => setHelp(false)}>
            Got it
          </button>
        </Modal>
      )}
    </div>
  );
}
