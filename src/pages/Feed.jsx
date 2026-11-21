import campusPhoto from "../asset/Iloilo Science and Technology University sign.png";
import DashboardCompanion from "../components/DashboardCompanion";
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  Wrench,
  CircleCheck,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Megaphone,
  Leaf,
  Check,
  ArrowUpRight,
  MapPin,
  GraduationCap,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { api, MOCK_MODE } from "../api";
import { useApp } from "../context";
import { useData, Loading, ErrorBox, Empty, Avatar } from "../components/UI";
import IssueCard from "../components/IssueCard";
import Filters, { filterIssues } from "../components/Filters";
export default function Feed() {
  const { user, settings } = useApp(),
    { data, loading, error, reload } = useData(api.issues),
    [params] = useSearchParams(),
    [filters, setFilters] = useState({ q: params.get("q") || "" }),
    [tab, setTab] = useState("all"),
    [sort, setSort] = useState("newest"),
    [visible, setVisible] = useState(4);
  useEffect(
    () => setFilters((f) => ({ ...f, q: params.get("q") || "" })),
    [params],
  );
  useEffect(() => setVisible(4), [filters, tab]);
  const issues = data || [],
    filtered = filterIssues(issues, filters, user, tab).sort((a, b) =>
      sort === "newest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt),
    );
  const community = Array.from(
    new Map(
      issues.map((issue) => [
        issue.reporterId,
        {
          id: issue.reporterId,
          name: issue.reporter,
          image: issue.reporterImage,
        },
      ]),
    ).values(),
  ).slice(0, 4);
  if (!community.length) community.push(user);
  const counts = {
    reported: issues.length,
    ongoing: issues.filter((i) => i.status === "Ongoing").length,
    resolved: issues.filter((i) => i.status === "Completed").length,
  };
  return (
    <div className="page feed-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">OUR CAMPUS, OUR RESPONSIBILITY</div>
          <h1>
            A better campus starts with us<span className="title-dot">.</span>
          </h1>
          <p>Spot an issue. Share an update. Make a difference.</p>
        </div>
        <Link to="/submit" className="button primary">
          <Plus size={18} /> Report an issue
        </Link>
      </div>
      <section className="welcome-banner">
        <div className="banner-content">
          <span className="banner-kicker">
            <span /> THE ISAT UNIVERSITY COMMUNITY
          </span>
          <h2>
            Little things.
            <br />A better place for everyone.
          </h2>
          <p>
            From a leaky tap to a brighter walkway,
            <br className="desktop-break" /> your voice helps our campus thrive.
          </p>
          <div className="banner-community">
            <div className="avatar-stack">
              {community.map((member) => (
                <Avatar
                  key={member.id}
                  name={member.name}
                  image={member.image}
                />
              ))}
            </div>
            <span>Good people. Shared spaces. Real change.</span>
          </div>
        </div>
        <div className="banner-visual">
          <img
            src={campusPhoto}
            alt="Iloilo Science and Technology University campus sign"
          />
          <div className="banner-image-shade" />
          <span className="campus-photo-label">
            <MapPin size={13} /> ISAT University
          </span>
          <div className="floating-note">
            <span>
              <Leaf size={19} />
            </span>
            <div>
              One campus.<strong>Countless ways to care.</strong>
            </div>
          </div>
        </div>
      </section>
      <section className="stats-row" aria-label="Campus issue statistics">
        <div className="stat-card">
          <span className="stat-icon neutral">
            <ClipboardList size={21} />
          </span>
          <div>
            <span>Issues reported</span>
            <strong>{counts.reported.toString().padStart(2, "0")}</strong>
          </div>
          <span className="stat-caption">Every report matters</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon amber">
            <Wrench size={21} />
          </span>
          <div>
            <span>In progress</span>
            <strong>{counts.ongoing.toString().padStart(2, "0")}</strong>
          </div>
          <span className="stat-caption">Care in action</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">
            <CircleCheck size={21} />
          </span>
          <div>
            <span>Issues resolved</span>
            <strong>{counts.resolved.toString().padStart(2, "0")}</strong>
          </div>
          <span className="stat-caption positive">
            <TrendingUp size={13} /> Making a difference
          </span>
        </div>
      </section>
      <div className="feed-layout">
        <section className="feed-main">
          <div className="section-heading">
            <h2>
              The campus feed <span>What’s happening around you</span>
            </h2>
            <span className="live-label">
              <span /> {MOCK_MODE ? "Demo community" : "Campus community"}
            </span>
          </div>
          <div className="feed-tabs">
            <div>
              {[
                { id: "all", label: "All issues" },
                { id: "mine", label: "My reports" },
                { id: "unread", label: "Unread" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={tab === t.id ? "active" : ""}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === "all" && <span>{issues.length}</span>}
                  {t.id === "unread" && (
                    <span>
                      {issues.filter((i) => !i.readBy.includes(user.id)).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <label className="sort-control">
              Sort by:{" "}
              <select
                aria-label="Sort issues"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
          <Filters value={filters} onChange={setFilters} />
          <div className="result-label">
            {filtered.length} {filtered.length === 1 ? "issue" : "issues"} in
            your campus
          </div>
          <ErrorBox error={error} retry={reload} />
          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <Empty />
          ) : (
            <div className="issue-list">
              {filtered.slice(0, visible).map((i) => (
                <IssueCard key={i.id} issue={i} onUpdate={reload} />
              ))}
            </div>
          )}
          {filtered.length > visible && (
            <button
              className="button load-more"
              onClick={() => setVisible((v) => v + 4)}
            >
              Load more campus updates <ChevronDown size={17} />
            </button>
          )}
        </section>
        <aside className="feed-aside">
          <section className="contribution-card">
            <div className="aside-card-heading">
              <span className="small-icon">
                <Sparkles size={17} />
              </span>
              <h3>Your campus impact</h3>
              <Link to="/profile" aria-label="View profile">
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="impact-companion-grid">
              <div className="impact-profile">
                <Avatar name={user.name} image={user.image} />
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.level}</span>
                </div>
              </div>
              <div
                className="points-number"
                aria-label={`${user.points} contribution points`}
              >
                {user.points}
              </div>
              <DashboardCompanion user={user} settings={settings} />
            </div>
            <div className="progress-label">
              <span>Next: {user.nextLevel}</span>
              <strong>
                {user.points} / {user.nextThreshold}
              </strong>
            </div>
            <progress
              value={user.points - user.levelStart}
              max={user.nextThreshold - user.levelStart}
            />
            <p>
              You’re {user.nextThreshold - user.points} points away from your
              next milestone. Keep caring!
            </p>
            <Link to="/profile" className="impact-link">
              View your contributions <ChevronRight size={15} />
            </Link>
          </section>
          {MOCK_MODE && (
            <section className="notice-card">
              <div className="aside-card-heading">
                <span className="small-icon orange">
                  <Megaphone size={17} />
                </span>
                <h3>Campus noticeboard</h3>
              </div>
              <span className="notice-tag">FROM CAMPUS FACILITIES</span>
              <h4>A little heads-up for your week</h4>
              <p>
                Routine water system maintenance is scheduled for Monday, 8–10
                AM in the Science Building.
              </p>
              <div className="notice-footer">
                <span>Nov 21, 2026</span>
                <span>Facilities Office</span>
              </div>
            </section>
          )}
          <section className="how-card">
            <span className="small-icon pale">
              <Lightbulb size={20} />
            </span>
            <h3>A good report goes a long way.</h3>
            <p>
              Add a clear photo and a specific location. It helps our team find
              the issue and fix it faster.
            </p>
            <Link to="/submit">
              Make your first move <ArrowUpRight size={15} />
            </Link>
          </section>
          <div className="community-note">
            <ShieldLeaf />
            <p>
              A shared space.
              <br />A shared responsibility.
            </p>
            <span>Thank you for looking out for campus.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
function ShieldLeaf() {
  return (
    <div className="community-seal">
      <Leaf size={25} />
    </div>
  );
}
