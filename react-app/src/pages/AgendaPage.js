import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, startOfMonth } from "date-fns";
import DailyView from "../components/DailyView";
import WeeklyView from "../components/WeeklyView";
import MonthlyView from "../components/MonthlyView";
import YearlyView from "../components/YearlyView";
import CalendarToolbar, {
  filterAppointmentsInMonth,
  filterAppointmentsInYear,
} from "../components/CalendarToolbar";
import AppointmentForm from "../components/AppointmentForm";
import EditAppointmentModal from "../components/EditAppointmentModal";
import {
  fetchPatients,
  fetchAppointments,
  createAppointment,
  updateAppointmentById,
  deleteAppointmentById,
} from "../services/api";

function decorateAppointmentForView(appointment, patients) {
  const patient = patients.find((item) => item.id === appointment.patientId);
  return {
    ...appointment,
    time: appointment.startTime,
    duration: appointment.durationMinutes,
    patientName: patient ? patient.name : "Paciente",
    patientPhone: patient ? patient.phone : "",
    patientRecord: appointment.summary || "",
  };
}

function AgendaPage({ showSuccess, showError, onExportBackup, onSyncBackup, isSyncingBackup }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [activeView, setActiveView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [patientsData, appointmentsData] = await Promise.all([
        fetchPatients(),
        fetchAppointments(),
      ]);
      setPatients(patientsData);
      setAppointments(appointmentsData);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addAppointment = async (appointment) => {
    try {
      showError("");
      if (!appointment.patientId) {
        showError("Selecione um paciente cadastrado.");
        return false;
      }

      const payload = {
        date: appointment.date,
        startTime: appointment.time,
        durationMinutes: appointment.duration,
        patientId: appointment.patientId,
        consultationType: appointment.consultationType,
        price: appointment.price,
        status: appointment.status,
        paymentMethod: appointment.paymentMethod,
        summary: appointment.sessionNote || "",
        chargeFirstSessionDeposit: appointment.chargeFirstSessionDeposit,
        isRecurringWeekly: appointment.isRecurringWeekly,
      };

      await createAppointment(payload);
      await loadData();
      showSuccess("Consulta agendada com sucesso.");
      return true;
    } catch (error) {
      showError(error.message);
      return false;
    }
  };

  const deleteAppointment = async (id) => {
    try {
      showError("");
      await deleteAppointmentById(id);
      await loadData();
    } catch (error) {
      showError(error.message);
    }
  };

  const editAppointment = async (id, updates) => {
    try {
      showError("");
      await updateAppointmentById(id, updates);
      await loadData();
      setEditingAppointment(null);
      return true;
    } catch (error) {
      showError(error.message);
      return false;
    }
  };

  const cancelAppointment = async (appointment) => {
    try {
      showError("");
      await updateAppointmentById(appointment.id, {
        date: appointment.date,
        startTime: appointment.startTime || appointment.time,
        durationMinutes: appointment.durationMinutes || appointment.duration,
        status: "cancelada",
      });
      await loadData();
      showSuccess("Paciente desmarcado com sucesso.");
    } catch (error) {
      showError(error.message);
    }
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments
      .filter((apt) => apt.date === dateStr)
      .map((appointment) => decorateAppointmentForView(appointment, patients));
  };

  const financialSummary = appointments.reduce(
    (acc, appointment) => {
      const price = Number(appointment.price || 0);
      const deposit = appointment.chargeFirstSessionDeposit ? price * 0.5 : 0;

      if (
        appointment.status === "presente" ||
        appointment.status === "agendada" ||
        appointment.status === "remarcada"
      ) {
        acc.expectedRevenue += price;
      }
      if (appointment.status === "cancelada") {
        acc.cancellationFees += price * 0.5;
      }
      acc.depositTotal += deposit;
      return acc;
    },
    { expectedRevenue: 0, depositTotal: 0, cancellationFees: 0 }
  );

  const decoratedAppointments = appointments.map((appointment) =>
    decorateAppointmentForView(appointment, patients)
  );

  const handleSelectMonthFromYear = (monthDate) => {
    setSelectedDate(startOfMonth(monthDate));
    setActiveView("monthly");
  };

  const handleSelectDayFromYear = (day) => {
    setSelectedDate(day);
    setActiveView("daily");
  };

  const renderView = () => {
    const sharedProps = {
      onDelete: deleteAppointment,
      onEdit: setEditingAppointment,
      onCancel: cancelAppointment,
      selectedDate,
    };

    switch (activeView) {
      case "daily":
        return <DailyView appointments={getAppointmentsForDate(selectedDate)} {...sharedProps} />;
      case "weekly":
        return <WeeklyView appointments={decoratedAppointments} {...sharedProps} />;
      case "monthly":
        return <MonthlyView appointments={decoratedAppointments} {...sharedProps} />;
      case "yearly":
        return (
          <YearlyView
            appointments={decoratedAppointments}
            selectedDate={selectedDate}
            onSelectMonth={handleSelectMonthFromYear}
            onSelectDay={handleSelectDayFromYear}
          />
        );
      default:
        return null;
    }
  };

  const periodAppointmentCount =
    activeView === "daily"
      ? getAppointmentsForDate(selectedDate).length
      : activeView === "yearly"
        ? filterAppointmentsInYear(decoratedAppointments, selectedDate).length
        : activeView === "monthly"
          ? filterAppointmentsInMonth(decoratedAppointments, selectedDate).length
          : decoratedAppointments.length;

  return (
    <>
      <div className="view-tabs">
        <button
          className={`view-tab ${activeView === "daily" ? "active" : ""}`}
          onClick={() => setActiveView("daily")}
        >
          Diário
        </button>
        <button
          className={`view-tab ${activeView === "weekly" ? "active" : ""}`}
          onClick={() => setActiveView("weekly")}
        >
          Semanal
        </button>
        <button
          className={`view-tab ${activeView === "monthly" ? "active" : ""}`}
          onClick={() => setActiveView("monthly")}
        >
          Mensal
        </button>
        <button
          className={`view-tab ${activeView === "yearly" ? "active" : ""}`}
          onClick={() => setActiveView("yearly")}
        >
          Anual
        </button>
      </div>

      <main className="main-content">
        <AppointmentForm
          onAdd={addAppointment}
          selectedDate={selectedDate}
          patients={patients}
          onPatientCreated={(p) => {
            setPatients((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)));
          }}
        />
        {isLoading && <div className="notice">Carregando dados da API...</div>}

        <section className="financial-panel">
          <h2>Resumo Financeiro (MVP)</h2>
          <p className="page-hint">
            <Link to="/pacientes">Gerenciar pacientes e prontuários</Link>
          </p>
          <div className="backup-actions">
            <button type="button" className="btn btn-secondary" onClick={onExportBackup}>
              Baixar Cópia do Banco (Offline)
            </button>
            <button type="button" className="btn btn-primary" onClick={onSyncBackup} disabled={isSyncingBackup}>
              {isSyncingBackup ? "Sincronizando..." : "Sincronizar Cloud R2"}
            </button>
          </div>
          <div className="metrics-grid">
            <div className="metric-card">
              <span>Receita prevista</span>
              <strong>R$ {financialSummary.expectedRevenue.toFixed(2)}</strong>
            </div>
            <div className="metric-card">
              <span>Sinal 50% acumulado</span>
              <strong>R$ {financialSummary.depositTotal.toFixed(2)}</strong>
            </div>
            <div className="metric-card">
              <span>Multa por cancelamento</span>
              <strong>R$ {financialSummary.cancellationFees.toFixed(2)}</strong>
            </div>
          </div>
        </section>

        <CalendarToolbar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          activeView={activeView}
          appointmentCount={periodAppointmentCount}
        />
        {renderView()}
      </main>

      {editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={(updates) => editAppointment(editingAppointment.id, updates)}
          onCancel={cancelAppointment}
        />
      )}
    </>
  );
}

export default AgendaPage;
