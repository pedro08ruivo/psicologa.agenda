import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPatient } from "../services/api";
import { isValidCpf, maskCpfInput } from "../utils/cpf";

function PatientForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", cpf: "", phone: "", email: "", notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "cpf") {
      setForm((prev) => ({ ...prev, cpf: maskCpfInput(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidCpf(form.cpf)) {
      setError("Informe um CPF valido.");
      return;
    }

    setSaving(true);
    try {
      const patient = await createPatient({
        name: form.name,
        cpf: form.cpf,
        phone: form.phone || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
      });
      navigate(`/pacientes/${patient.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="main-content">
      <section className="patient-page-panel">
        <h2>Cadastrar paciente</h2>
        <p className="page-hint">O identificador do paciente sera gerado automaticamente pelo sistema.</p>
        {error && <div className="notice notice-error">{error}</div>}
        <form onSubmit={handleSubmit}>
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
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Telefone (opcional)</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">E-mail (opcional)</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Prontuário / observações gerais (opcional)</label>
            <textarea id="notes" name="notes" rows="6" value={form.notes} onChange={handleChange} />
          </div>
          <div className="form-actions-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Cadastrar paciente"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/pacientes")}>
              Voltar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default PatientForm;
