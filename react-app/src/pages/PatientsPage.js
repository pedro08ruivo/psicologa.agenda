import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchPatients } from "../services/api";
import { formatCpfDisplay, normalizeCpf } from "../utils/cpf";

function truncateId(id) {
  if (!id || id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchPatients();
        setPatients(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const cpfDigits = normalizeCpf(q);
    const matchesCpf =
      cpfDigits.length > 0 &&
      p.cpf &&
      (normalizeCpf(p.cpf).includes(cpfDigits) || formatCpfDisplay(p.cpf).toLowerCase().includes(q));
    return (
      p.name.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      matchesCpf ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <main className="main-content">
      <section className="patient-page-panel">
        <div className="section-header-row">
          <h2>Pacientes</h2>
          <Link to="/pacientes/novo" className="btn btn-primary">
            Cadastrar paciente
          </Link>
        </div>

        <div className="form-group">
          <label htmlFor="patient-search">Buscar por nome, CPF, telefone ou ID</label>
          <input
            id="patient-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite para filtrar..."
          />
        </div>

        {loading && <div className="notice">Carregando pacientes...</div>}
        {error && <div className="notice notice-error">{error}</div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-slot">
            {search ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado."}
          </div>
        )}

        <div className="patients-table">
          {filtered.map((patient) => (
            <div key={patient.id} className="patient-row-card">
              <div>
                <strong>{patient.name}</strong>
                <div>CPF: {formatCpfDisplay(patient.cpf)}</div>
                {patient.phone && <div>{patient.phone}</div>}
                {patient.email && <div className="patient-row-email">{patient.email}</div>}
                <span className="patient-id-muted" title={patient.id}>
                  ID: {truncateId(patient.id)}
                </span>
              </div>
              <Link to={`/pacientes/${patient.id}`} className="btn btn-secondary">
                Abrir ficha
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default PatientsPage;
