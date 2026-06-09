import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  fetchPatientById,
  updatePatient,
  deletePatient,
  fetchPatientHistoryById,
} from "../services/api";
import PatientClinicalNotes from "../components/PatientClinicalNotes";
import { formatCpfDisplay, isValidCpf, maskCpfInput } from "../utils/cpf";

function truncateId(id) {
  if (!id || id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function PatientDetailPage({ onCancelAppointment }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ficha");
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({ name: "", cpf: "", phone: "", email: "", notes: "" });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadPatient = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchPatientById(id);
      setPatient(data);
      setForm({
        name: data.name || "",
        cpf: formatCpfDisplay(data.cpf || ""),
        phone: data.phone || "",
        email: data.email || "",
        notes: data.notes || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadHistory = useCallback(async () => {
    try {
      const result = await fetchPatientHistoryById(id);
      setHistory(result.appointments || []);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    loadPatient();
    loadHistory();
  }, [loadPatient, loadHistory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "cpf") {
      setForm((prev) => ({ ...prev, cpf: maskCpfInput(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValidCpf(form.cpf)) {
      setError("Informe um CPF valido.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updatePatient(id, {
        name: form.name,
        cpf: form.cpf,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
      });
      setPatient(updated);
      setSuccess("Ficha do paciente salva com sucesso.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // ignore
    }
  };

  const handleDeletePatient = async () => {
    if (!window.confirm("Excluir este paciente permanentemente? So e possivel se nao houver consultas.")) {
      return;
    }
    try {
      await deletePatient(id);
      navigate("/pacientes");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnmark = async (appointment) => {
    if (!onCancelAppointment) return;
    const confirmed = window.confirm(
      `Desmarcar consulta em ${appointment.date} às ${appointment.startTime}?`
    );
    if (!confirmed) return;
    try {
      await onCancelAppointment({ ...appointment, patientId: id, patientName: form.name });
      await loadHistory();
    } catch (_err) {
      // erro exibido globalmente em App
    }
  };

  if (loading) {
    return (
      <main className="main-content">
        <div className="notice">Carregando ficha do paciente...</div>
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="main-content">
        <div className="notice notice-error">{error || "Paciente nao encontrado."}</div>
        <Link to="/pacientes" className="btn btn-secondary">
          Voltar
        </Link>
      </main>
    );
  }

  return (
    <main className="main-content">
      <section className="patient-page-panel">
        <div className="section-header-row">
          <div>
            <Link to="/pacientes" className="back-link">
              ← Pacientes
            </Link>
            <h2>{patient.name}</h2>
            <span className="patient-id-muted" title={patient.id}>
              ID: {truncateId(patient.id)}
              <button type="button" className="btn-copy-id" onClick={handleCopyId}>
                {copied ? "Copiado" : "Copiar"}
              </button>
            </span>
          </div>
        </div>

        {success && <div className="notice notice-success">{success}</div>}
        {error && <div className="notice notice-error">{error}</div>}

        <div className="patient-tabs">
          <button
            type="button"
            className={`patient-tab ${activeTab === "ficha" ? "active" : ""}`}
            onClick={() => setActiveTab("ficha")}
          >
            Ficha e prontuário
          </button>
          <button
            type="button"
            className={`patient-tab ${activeTab === "evolucoes" ? "active" : ""}`}
            onClick={() => setActiveTab("evolucoes")}
          >
            Evoluções
          </button>
          <button
            type="button"
            className={`patient-tab ${activeTab === "consultas" ? "active" : ""}`}
            onClick={() => setActiveTab("consultas")}
          >
            Histórico de consultas
          </button>
        </div>

        {activeTab === "ficha" && (
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nome *</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="cpf">CPF *</label>
                <input
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Telefone (opcional)</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">E-mail (opcional)</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="notes">Prontuário / observações gerais</label>
              <textarea
                id="notes"
                name="notes"
                rows="10"
                value={form.notes}
                onChange={handleChange}
                placeholder="Informações permanentes sobre o paciente..."
              />
            </div>
            <div className="form-actions-row">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar ficha"}
              </button>
              {(patient.appointmentCount || 0) === 0 && (
                <button type="button" className="btn btn-danger" onClick={handleDeletePatient}>
                  Excluir paciente
                </button>
              )}
            </div>
          </form>
        )}

        {activeTab === "evolucoes" && <PatientClinicalNotes patientId={id} />}

        {activeTab === "consultas" && (
          <div className="patient-history-section">
            {history.length === 0 ? (
              <div className="empty-slot">Sem consultas registradas.</div>
            ) : (
              history.map((apt) => (
                <div key={apt.id} className="history-item history-item-row">
                  <div>
                    {format(new Date(`${apt.date}T00:00:00`), "dd/MM/yyyy")} - {apt.startTime} |{" "}
                    <span className={`status-badge status-${apt.status}`}>{apt.status}</span> | R${" "}
                    {Number(apt.price).toFixed(2)}
                  </div>
                  {apt.status !== "cancelada" && onCancelAppointment && (
                    <button type="button" className="btn btn-warning btn-sm" onClick={() => handleUnmark(apt)}>
                      Desmarcar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default PatientDetailPage;
