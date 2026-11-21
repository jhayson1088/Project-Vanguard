import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
} from "react-router-dom";
import { AppProvider, useApp } from "./context";
import Layout from "./components/Layout";
import { Loading, ErrorBox } from "./components/UI";
import Feed from "./pages/Feed";
import SignIn from "./pages/SignIn";
import Submit from "./pages/Submit";
import Detail from "./pages/Detail";
import Profile from "./pages/Profile";
import PublicArticle from "./pages/PublicArticle";
import {
  AdminDashboard,
  TicketQueue,
  Reports,
  RewardSettings,
} from "./pages/Admin";
import "./styles.css";
function Protected({ admin = false }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/signin" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
function App() {
  const { ready, error } = useApp();
  if (!ready) return <Loading />;
  if (error)
    return (
      <div className="startup-error">
        <h1>Let’s get you connected.</h1>
        <ErrorBox error={error} />
        <p>Check your API connection and refresh to try again.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route index element={<Feed />} />
          <Route path="submit" element={<Submit />} />
          <Route path="issues/:id" element={<Detail />} />
          <Route path="profile" element={<Profile />} />
          <Route element={<Protected admin />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/tickets" element={<TicketQueue />} />
            <Route path="admin/tickets/:id" element={<Detail />} />
            <Route path="admin/reports" element={<Reports />} />
            <Route path="admin/settings" element={<RewardSettings />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="page empty">
                <h1>This path is off campus.</h1>
                <Link className="button primary" to="/">
                  Back to campus feed
                </Link>
              </div>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/articles/:slug" element={<PublicArticle />} />
        <Route
          path="/*"
          element={
            <AppProvider>
              <App />
            </AppProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
