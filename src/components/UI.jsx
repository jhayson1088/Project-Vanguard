import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  LoaderCircle,
  MapPin,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
export const campusDay = (value) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
export const money = (n) =>
  n == null
    ? "Not assessed"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(n);
export const date = (value) =>
  new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
export const time = (value) =>
  new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
export function Avatar({ name, initials, image, className = "" }) {
  const [failedImage, setFailedImage] = useState(null);
  return (
    <span className={`avatar ${className}`} aria-label={name}>
      {image && image !== failedImage ? (
        <img src={image} alt="" onError={() => setFailedImage(image)} />
      ) : (
        initials ||
        name
          ?.split(" ")
          .map((x) => x[0])
          .slice(0, 2)
          .join("")
      )}
    </span>
  );
}
export function Badge({ children, kind = "" }) {
  return (
    <span
      className={`badge ${String(children).toLowerCase().replaceAll(" ", "-")} ${kind}`}
    >
      {children}
    </span>
  );
}
export function ErrorBox({ error, retry }) {
  return (
    error && (
      <div className="error-box" role="alert">
        <AlertCircle size={19} />
        <div>
          {error}
          {retry && <button onClick={retry}>Try again</button>}
        </div>
      </div>
    )
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Loading campus updates…
    </div>
  );
}
export function Empty({
  title = "No issues found",
  description = "Try adjusting your search or filters.",
}) {
  return (
    <div className="empty">
      <Search size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Select({ label, children, ...props }) {
  return (
    <label className="select-wrap">
      {label && <span>{label}</span>}
      <span className="select-control">
        <select {...props}>{children}</select>
        <ChevronDown size={14} />
      </span>
    </label>
  );
}
export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const previous = document.activeElement;
    const target = document.querySelector(".modal");
    target?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            const items = e.currentTarget.querySelectorAll(
              "button,input,select,textarea,a[href]",
            );
            const first = items[0],
              last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function useData(fetcher, deps = []) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function reload() {
    setError("");
    setLoading(true);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, deps);
  return { data, setData, error, loading, reload };
}
