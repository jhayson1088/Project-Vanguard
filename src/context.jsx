import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
const Context = createContext(null);
export const useApp = () => useContext(Context);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null),
    [settings, setSettings] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  useEffect(() => {
    api
      .session()
      .then(async (u) => {
        setUser(u);
        if (u) {
          setSettings(await api.settings());
          setUser(await api.profile());
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
    const expired = () => {
      setUser(null);
      setToast("Your session expired. Please sign in again.");
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const refreshProfile = async () => setUser(await api.profile());
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        settings,
        setSettings,
        ready,
        error,
        notify: setToast,
        refreshProfile,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
