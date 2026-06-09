import React, { useState } from "react";
import { createPatient } from "../services/api";
import { isValidCpf, maskCpfInput } from "../utils/cpf";

function QuickPatientModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", cpf: "", phone: "", email: "" });
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
      });
      onCreated(patient);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal" style={{ display: "block" }}>
      <div className="modal-content">
        <button className="close-modal" type="button" onClick={onClose}>
          ×
        </button>
        <h2>Cadastrar paciente rápido</h2>
        {error && <div className="notice notice-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="quick-name">Nome *</label>
            <input id="quick-name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="quick-cpf">CPF *</label>
            <input
              id="quick-cpf"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="quick-phone">Telefone (opcional)</label>
            <input id="quick-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="quick-email">E-mail (opcional)</label>
            <input id="quick-email" name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Cadastrar e selecionar"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickPatientModal;
