import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CONSULTATION_TYPES, PAYMENT_METHODS, APPOINTMENT_STATUS } from '../constants';
import QuickPatientModal from './QuickPatientModal';
import { formatCpfDisplay } from '../utils/cpf';

const NEW_PATIENT_VALUE = '__new__';

const AppointmentForm = ({ onAdd, selectedDate, patients, onPatientCreated }) => {
  const [formData, setFormData] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    time: '',
    duration: '50',
    patientId: '',
    consultationType: 'psicoterapia',
    price: 150,
    paymentMethod: 'pix',
    status: 'agendada',
    chargeFirstSessionDeposit: true,
    isRecurringWeekly: false,
    sessionNote: '',
  });
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const [localPatients, setLocalPatients] = useState(patients);

  useEffect(() => {
    setLocalPatients(patients);
  }, [patients]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: format(selectedDate, 'yyyy-MM-dd'),
    }));
  }, [selectedDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const checked = e.target.checked;

    if (name === 'patientId' && value === NEW_PATIENT_VALUE) {
      setShowQuickPatient(true);
      return;
    }

    if (name === 'consultationType') {
      const selectedType = CONSULTATION_TYPES.find((type) => type.value === value);
      setFormData((prev) => ({
        ...prev,
        consultationType: value,
        price: selectedType ? selectedType.defaultPrice : prev.price,
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value,
    }));
  };

  const handleQuickPatientCreated = (patient) => {
    setLocalPatients((prev) => [...prev, patient].sort((a, b) => a.name.localeCompare(b.name)));
    onPatientCreated?.(patient);
    setFormData((prev) => ({ ...prev, patientId: patient.id }));
  };

  const resetForm = () => {
    setFormData({
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '',
      duration: '50',
      patientId: '',
      consultationType: 'psicoterapia',
      price: 150,
      paymentMethod: 'pix',
      status: 'agendada',
      chargeFirstSessionDeposit: true,
      isRecurringWeekly: false,
      sessionNote: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const created = onAdd({
      ...formData,
      price: Number(formData.price),
      duration: Number(formData.duration),
    });

    Promise.resolve(created).then((success) => {
      if (success) {
        resetForm();
      }
    });
  };

  const sortedPatients = [...localPatients].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="appointment-form">
      <h2>Adicionar Nova Consulta</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patientId">Paciente *</label>
          <select
            id="patientId"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um paciente</option>
            {sortedPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — CPF {formatCpfDisplay(p.cpf)}
                {p.phone ? ` — ${p.phone}` : ""}
              </option>
            ))}
            <option value={NEW_PATIENT_VALUE}>+ Cadastrar novo paciente</option>
          </select>
          <small className="field-hint">
            Não encontrou? <Link to="/pacientes/novo">Cadastrar paciente completo</Link>
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Data</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">Horário</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="duration">Duração (minutos)</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="50"
              step="5"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="consultationType">Tipo de Consulta</label>
            <select
              id="consultationType"
              name="consultationType"
              value={formData.consultationType}
              onChange={handleChange}
            >
              {CONSULTATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Preço (R$)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="paymentMethod">Método de Pagamento</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {APPOINTMENT_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="chargeFirstSessionDeposit"
                checked={formData.chargeFirstSessionDeposit}
                onChange={handleChange}
              />
              Cobrar 50% no primeiro agendamento
            </label>
            <label>
              <input
                type="checkbox"
                name="isRecurringWeekly"
                checked={formData.isRecurringWeekly}
                onChange={handleChange}
              />
              Sessão fixa semanal
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="sessionNote">Nota da sessão (opcional)</label>
          <textarea
            id="sessionNote"
            name="sessionNote"
            rows="3"
            placeholder="Anotações apenas desta consulta — o prontuário geral fica na ficha do paciente."
            value={formData.sessionNote}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-primary">Adicionar Consulta</button>
      </form>

      {showQuickPatient && (
        <QuickPatientModal
          onClose={() => setShowQuickPatient(false)}
          onCreated={handleQuickPatientCreated}
        />
      )}
    </div>
  );
};

export default AppointmentForm;
