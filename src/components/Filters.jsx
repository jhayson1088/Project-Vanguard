import { Search, SlidersHorizontal, X } from "lucide-react";
import React, { useState } from "react";
import { useApp } from "../context";
import { Select, campusDay } from "./UI";
export default function Filters({ value, onChange }) {
  const { settings, user } = useApp(),
    [expanded, setExpanded] = useState(false);
  const update = (key, val) => onChange({ ...value, [key]: val });
  const active = Object.values(value).filter(Boolean).length;
  return (
    <div className="filter-box">
      <div className="filter-row">
        <label className="feed-search">
          <Search size={18} />
          <input
            aria-label="Search issues"
            placeholder="Search issues, locations, or keywords..."
            value={value.q || ""}
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
        <button
          className={`button filter-toggle ${expanded ? "selected" : ""}`}
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={16} />
          Filters{active > 0 && <span>{active}</span>}
        </button>
      </div>
      <div className="filter-selects">
        <Select
          aria-label="Category"
          value={value.category || ""}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">All categories</option>
          {settings.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select
          aria-label="Status"
          value={value.status || ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {settings.statuses.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select
          aria-label="Building"
          value={value.building || ""}
          onChange={(e) => update("building", e.target.value)}
        >
          <option value="">All buildings</option>
          {settings.buildings
            .filter((b) => b !== "All campus")
            .map((c) => (
              <option key={c}>{c}</option>
            ))}
        </Select>
        <Select
          aria-label="Severity"
          value={value.severity || ""}
          onChange={(e) => update("severity", e.target.value)}
        >
          <option value="">All priorities</option>
          {settings.severities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      {expanded && (
        <div className="advanced-filters">
          <label>
            Submitted after
            <input
              type="date"
              value={value.after || ""}
              onChange={(e) => update("after", e.target.value)}
            />
          </label>
          <label>
            Maximum budget (₱)
            <input
              type="number"
              min="0"
              placeholder="Any budget"
              value={value.budget || ""}
              onChange={(e) => update("budget", e.target.value)}
            />
          </label>
          {user.role === "admin" && (
            <label>
              Minimum credibility (%)
              <input
                type="number"
                min="0"
                max="100"
                value={value.credibility || ""}
                onChange={(e) => update("credibility", e.target.value)}
                placeholder="Any score"
              />
            </label>
          )}
          {active > 0 && (
            <button className="text-button" onClick={() => onChange({})}>
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export function filterIssues(issues, filters, user, tab = "all") {
  return issues.filter(
    (i) =>
      (!filters.q ||
        `${i.title} ${i.description} ${i.building} ${i.location} VG-${i.id}`
          .toLowerCase()
          .includes(filters.q.toLowerCase())) &&
      (!filters.category || i.category === filters.category) &&
      (!filters.status || i.status === filters.status) &&
      (!filters.building || i.building === filters.building) &&
      (!filters.severity || i.severity === filters.severity) &&
      (!filters.after || campusDay(i.createdAt) >= filters.after) &&
      (!filters.budget ||
        ((i.reporterBudget ?? i.budget) != null &&
          Number(i.reporterBudget ?? i.budget) <= Number(filters.budget))) &&
      (!filters.credibility ||
        (i.credibility != null &&
          i.credibility >= Number(filters.credibility))) &&
      (tab !== "mine" || i.reporterId === user.id) &&
      (tab !== "unread" || !i.readBy.includes(user.id)),
  );
}
