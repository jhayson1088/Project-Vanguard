import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  CircleCheck,
  Clock3,
  Wrench,
  Plus,
  ArrowUpRight,
  Download,
  BarChart3,
  Save,
  Settings2,
} from "lucide-react";
import { api, MOCK_MODE } from "../api";
import { useApp } from "../context";
import {
  useData,
  Loading,
  ErrorBox,
  Badge,
  Empty,
  money,
  date,
  Select,
  campusDay,
} from "../components/UI";
import Filters, { filterIssues } from "../components/Filters";
export function TicketTable({ issues }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Issue / ticket</th>
            <th>Location</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((i) => (
            <tr key={i.id}>
              <td>
                <Link to={`/admin/tickets/${i.id}`}>
                  <span className="ticket-id">
                    {i.ticketNumber || `VG-${i.id}`}{" "}
                  </span>
                  <strong>{i.title}</strong>
                </Link>
              </td>
              <td>
                {i.building}
                <span className="cell-sub">{i.category}</span>
              </td>
              <td>
                <span
                  className={`severity severity-${i.severity.toLowerCase()}`}
                >
                  <span />
                  {i.severity}
                </span>
              </td>
              <td>
                <Badge>{i.status}</Badge>
              </td>
              <td>{date(i.createdAt)}</td>
              <td>
                <Link
                  to={`/admin/tickets/${i.id}`}
                  aria-label={`Review ticket VG-${i.id}`}
                >
                  <ArrowUpRight size={19} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function AdminDashboard() {
  const { data, loading, error, reload } = useData(async () => ({
    stats: await api.stats(),
    issues: await api.issues(),
  }));
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="page">
        <ErrorBox error={error} retry={reload} />
      </div>
    );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CAMPUS FACILITIES · ADMINISTRATION</div>
          <h1>A little oversight. A lot of impact.</h1>
          <p>Your campus maintenance overview, all in one place.</p>
        </div>
        <Link to="/admin/tickets" className="button primary">
          <ClipboardList size={18} /> Open ticket queue
        </Link>
      </div>
      <div className="admin-stats">
        {[
          {
            label: "Total reports",
            value: data.stats.total,
            icon: ClipboardList,
            color: "neutral",
          },
          ...Object.entries(data.stats.byStatus).map(([status, value]) => ({
            label: status,
            value,
            icon:
              status === "Completed"
                ? CircleCheck
                : status === "Ongoing"
                  ? Wrench
                  : Clock3,
            color: status === "Completed" ? "green" : "amber",
          })),
        ].map(({ label, value, icon: Icon, color }) => (
          <div className="panel admin-stat" key={label}>
            <span className={`stat-icon ${color}`}>
              <Icon size={21} />
            </span>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-chart-grid">
        <section className="panel chart-panel">
          <h2>Reports by category</h2>
          <p className="muted">Where your campus needs care</p>
          <Bars values={data.stats.byCategory} />
        </section>
        <section className="panel chart-panel">
          <h2>Priority breakdown</h2>
          <p className="muted">Plan the work that matters most</p>
          <Bars values={data.stats.bySeverity} type="severity" />
        </section>
      </div>
      <section className="panel queue-panel">
        <div className="section-heading">
          <h2>Needs your attention</h2>
          <Link to="/admin/tickets" className="text-button">
            View all tickets <ArrowUpRight size={16} />
          </Link>
        </div>
        <TicketTable
          issues={data.issues
            .filter((i) => !["Completed", "Cancelled"].includes(i.status))
            .slice(0, 5)}
        />
      </section>
    </div>
  );
}
function Bars({ values, type = "" }) {
  const max = Math.max(1, ...Object.values(values));
  return (
    <div className={`bars ${type}`}>
      {Object.entries(values).map(([label, value]) => (
        <div key={label} className="bar-row">
          <span>{label}</span>
          <div>
            <span
              className={label.toLowerCase().replaceAll(" ", "-")}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
export function TicketQueue() {
  const { user } = useApp(),
    { data, loading, error, reload } = useData(api.issues),
    [filters, setFilters] = useState({}),
    [page, setPage] = useState(1);
  const filtered = filterIssues(data || [], filters, user),
    pages = Math.max(1, Math.ceil(filtered.length / 8));
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CAMPUS FACILITIES · TICKET QUEUE</div>
          <h1>Good care starts here.</h1>
          <p>
            Review reports, coordinate work, and keep your community informed.
          </p>
        </div>
      </div>
      <section className="panel queue-panel">
        <Filters
          value={filters}
          onChange={(v) => {
            setFilters(v);
            setPage(1);
          }}
        />
        <ErrorBox error={error} retry={reload} />
        {loading ? (
          <Loading />
        ) : filtered.length ? (
          <>
            <TicketTable issues={filtered.slice((page - 1) * 8, page * 8)} />
            <div className="pagination">
              <span>{filtered.length} tickets</span>
              <button
                className="button small"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                {page} of {pages}
              </span>
              <button
                className="button small"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <Empty />
        )}
      </section>
    </div>
  );
}
export function Reports() {
  const { data, loading, error, reload } = useData(api.issues),
    [period, setPeriod] = useState("month"),
    [selected, setSelected] = useState(() =>
      new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
        .slice(0, 7),
    );
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="page">
        <ErrorBox error={error} retry={reload} />
      </div>
    );
  const issues = data.filter((i) =>
      campusDay(i.createdAt).startsWith(selected),
    ),
    group = (key) =>
      Object.fromEntries(
        [...new Set(data.map((i) => i[key]))].map((s) => [
          s,
          issues.filter((i) => i[key] === s).length,
        ]),
      );
  function download() {
    const rows = [
      [
        "Ticket",
        "Title",
        "Category",
        "Status",
        "Severity",
        "Submitted",
        "Estimated budget",
      ],
      ...issues.map((i) => [
        i.ticketNumber || `VG-${i.id}`,
        i.title,
        i.category,
        i.status,
        i.severity,
        i.createdAt,
        i.budget ?? "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(/^[=+@\-\t\r]/.test(String(cell)) ? `'${cell}` : cell).replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `vanguard-${selected}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE BIGGER PICTURE</div>
          <h1>Campus care, in perspective.</h1>
          <p>Track what’s happening and plan what comes next.</p>
        </div>
        <button className="button primary" onClick={download}>
          <Download size={17} /> Export report
        </button>
      </div>
      <section className="panel report-controls">
        <Select
          label="Report period"
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setSelected(
              new Date()
                .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
                .slice(0, e.target.value === "day" ? 10 : 7),
            );
          }}
        >
          <option value="day">Daily</option>
          <option value="month">Monthly</option>
        </Select>
        <label>
          {period === "day" ? "Date" : "Month"}
          <input
            type={period === "day" ? "date" : "month"}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          />
        </label>
        <div>
          <strong>{issues.length}</strong>
          <span>reports in this period</span>
        </div>
        <div>
          <strong>
            {money(issues.reduce((s, i) => s + (i.budget || 0), 0))}
          </strong>
          <span>total estimated budget</span>
        </div>
      </section>
      <div className="admin-chart-grid">
        <section className="panel chart-panel">
          <h2>By status</h2>
          <Bars values={group("status")} />
        </section>
        <section className="panel chart-panel">
          <h2>By priority</h2>
          <Bars values={group("severity")} type="severity" />
        </section>
        <section className="panel chart-panel">
          <h2>By category</h2>
          <Bars values={group("category")} />
        </section>
        <section className="panel chart-panel">
          <h2>Reports over time</h2>
          <p className="muted">Daily submissions for the selected period</p>
          <Bars
            values={Object.fromEntries(
              [...new Set(issues.map((i) => campusDay(i.createdAt)))]
                .sort()
                .map((d) => [
                  d,
                  issues.filter((i) => campusDay(i.createdAt) === d).length,
                ]),
            )}
          />
          {!issues.length && (
            <p className="muted">No submissions in this period.</p>
          )}
        </section>
      </div>
      <section className="panel queue-panel">
        <h2>Period details</h2>
        {issues.length ? (
          <TicketTable issues={issues} />
        ) : (
          <Empty
            title="No reports in this period"
            description="Choose a different date or month."
          />
        )}
      </section>
    </div>
  );
}
export function RewardSettings() {
  const { settings, setSettings, notify } = useApp(),
    [rewards, setRewards] = useState(settings.rewards.map((r) => ({ ...r }))),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setSettings(await api.updateSettings(rewards));
      notify("Reward rules saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">RECOGNIZE THE LITTLE THINGS</div>
          <h1>Reward community care.</h1>
          <p>Manage the point values used to recognize campus contributions.</p>
        </div>
      </div>
      <form className="panel settings-panel" onSubmit={submit}>
        <h2>Contribution rewards</h2>
        <p className="muted">
          {MOCK_MODE
            ? "These demo rules are editable. The prototype does not automatically award points."
            : "The backend applies these rules when it recognizes an eligible action."}
        </p>
        {rewards.map((r, index) => (
          <label className="reward-row" key={r.action}>
            <span>{r.action}</span>
            <span>
              <input
                aria-label={`${r.action} points`}
                type="number"
                min="0"
                max="10000"
                step="1"
                required
                value={r.points}
                onChange={(e) =>
                  setRewards(
                    rewards.map((a, n) =>
                      n === index
                        ? { ...a, points: Number(e.target.value) }
                        : a,
                    ),
                  )
                }
              />{" "}
              points
            </span>
          </label>
        ))}
        <h3>Level milestones</h3>
        <div className="level-list">
          {settings.levels.map((l) => (
            <div key={l.name}>
              <span>{l.name}</span>
              <strong>{l.points} points</strong>
            </div>
          ))}
        </div>
        <p className="field-hint">
          Level thresholds are supplied by campus settings.
        </p>
        <ErrorBox error={error} />
        <button className="button primary" disabled={busy}>
          <Save size={17} />
          {busy ? "Saving…" : "Save reward rules"}
        </button>
      </form>
    </div>
  );
}
