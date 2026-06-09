import React, { useState } from "react";
import { APPOINTMENT_STATUS, PAYMENT_METHODS } from "../constants";

const EditAppointmentModal = ({ appointment, onClose, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: appointment.date,
    startTime: appointment.startTime,
    durationMinutes: appointment.durationMinutes,
    status: appointment.status,
    paymentMethod: appointment.paymentMethod || "pix",
    price: appointment.price,
    summary: appointment.summary || "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...formData,
      durationMinutes: Number(formData.durationMinutes),
      price: Number(formData.price),
    });
  };

  const handleUnmark = () => {
    if (!onCancel) {
      return;
    }
    const confirmed = window.confirm(
      `Desmarcar o paciente desta consulta (${appointment.date} às ${appointment.startTime})?`
    );
    if (!confirmed) {
      return;
    }
    onCancel(appointment);
    onClose();
  };

  return (
    <div className="modal" style={{ display: "block" }}>
      <div className="modal-content">
        <button className="close-modal" onClick={onClose}>
          ×
        </button>
        <h2>Editar consulta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-date">Data</label>
              <input id="edit-date" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="edit-startTime">Horario</label>
              <input id="edit-startTime" name="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-durationMinutes">Duracao (minutos)</label>
              <input
                id="edit-durationMinutes"
                name="durationMinutes"
                type="number"
                min="50"
                step="5"
                value={formData.durationMinutes}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-price">Preco (R$)</label>
              <input id="edit-price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-status">Status</label>
              <select id="edit-status" name="status" value={formData.status} onChange={handleChange}>
                {APPOINTMENT_STATUS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-paymentMethod">Metodo de pagamento</label>
              <select id="edit-paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-summary">Nota da sessão</label>
            <textarea id="edit-summary" name="summary" rows="4" value={formData.summary} onChange={handleChange} />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              Salvar alteracoes
            </button>
            {appointment.status !== "cancelada" && onCancel && (
              <button type="button" className="btn btn-warning" onClick={handleUnmark}>
                Desmarcar paciente
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointmentModal;
