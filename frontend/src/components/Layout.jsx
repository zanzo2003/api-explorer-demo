import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="layout">
      <nav className="navbar">
        <span className="navbar-brand">
          🔍 API <span>Explorer</span>
        </span>
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Explorer
          </NavLink>
          <NavLink
            to="/upload"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            + Add API
          </NavLink>
        </div>
      </nav>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
