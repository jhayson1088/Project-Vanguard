import DogCompanion from "../components/DogCompanion";
import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ClipboardList, Leaf } from "lucide-react";
import { useApp } from "../context";
import { api } from "../api";
import {
  Avatar,
  useData,
  Loading,
  ErrorBox,
  Empty,
  time,
} from "../components/UI";
export default function Profile() {
  const { user, settings } = useApp(),
    { data, loading, error, reload } = useData(api.activity);
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVERY CONTRIBUTION COUNTS</div>
          <h1>Good deeds. A growing friendship.</h1>
          <p>
            Care for your campus, earn contribution points, and watch your buddy
            grow.
          </p>
        </div>
        <Link to="/submit" className="button primary">
          <ClipboardList size={17} /> Report an issue
        </Link>
      </div>
      <div className="companion-profile-identity">
        <Avatar name={user.name} image={user.image} />
        <div>
          <strong>{user.name}</strong>
          <span>
            {user.role === "admin"
              ? "Campus administrator"
              : "Campus contributor"}{" "}
            · ISAT University
          </span>
        </div>
      </div>
      <div className="profile-layout companion-profile-layout">
        <DogCompanion user={user} settings={settings} />
        <section className="panel activity-panel">
          <div className="section-heading">
            <h2>Your contribution history</h2>
            <Sparkles size={21} />
          </div>
          <p className="muted">The small actions that make a better campus.</p>
          <ErrorBox error={error} retry={reload} />
          {loading ? (
            <Loading />
          ) : !data?.length ? (
            <Empty
              title="Your story starts here"
              description="Submit an issue to start contributing to your campus."
            />
          ) : (
            data.map((a) => (
              <div className="activity-row" key={a.id}>
                <span className="stat-icon green">
                  <Sparkles size={20} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.description}</p>
                  <time>{time(a.date)}</time>
                </div>
                <strong className="activity-points">
                  +{a.points}
                  <span>points</span>
                </strong>
              </div>
            ))
          )}
          <div className="notice">
            <Leaf size={20} />
            <p>
              Your points reflect activity recognized by the campus team. They
              refresh from your account after interactions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
