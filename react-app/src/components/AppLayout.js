import React from "react";
import { NavLink, Outlet } from "react-router-dom";

function AppLayout({ currentUser, onLogout, onTogglePassword, showChangePassword }) {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Agenda Psicológica</h1>
        <p>Sistema de Gerenciamento de Consultas</p>
        <nav className="main-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "main-nav-link active" : "main-nav-link")}>
            Agenda
          </NavLink>
          <NavLink to="/pacientes" className={({ isActive }) => (isActive ? "main-nav-link active" : "main-nav-link")}>
            Pacientes
          </NavLink>
        </nav>
        <div className="header-user">
          <span>Conectada: {currentUser?.name || currentUser?.username}</span>
          <button className="btn btn-secondary" type="button" onClick={onTogglePassword}>
            {showChangePassword ? "Fechar" : "Alterar senha"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default AppLayout;
