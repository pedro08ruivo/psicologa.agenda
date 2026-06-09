import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import AppLayout from './components/AppLayout';
import PatientForm from './components/PatientForm';
import AgendaPage from './pages/AgendaPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import {
  fetchCurrentUser,
  updateAppointmentById,
  exportBackup,
  syncR2Backup,
  TOKEN_KEY,
} from './services/api';

function App() {
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncingBackup, setIsSyncingBackup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    window.setTimeout(() => setSuccessMessage(''), 5000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  useEffect(() => {
    const verifyExistingSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setAuthChecked(true);
        return;
      }

      try {
        const result = await fetchCurrentUser();
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      } catch (_error) {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setAuthChecked(true);
      }
    };

    verifyExistingSession();
  }, []);

  const handleLoginSuccess = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setErrorMessage('');
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleExportBackup = async () => {
    try {
      showError('');
      await exportBackup();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleSyncBackup = async () => {
    try {
      showError('');
      setSuccessMessage('');
      setIsSyncingBackup(true);
      const result = await syncR2Backup();
      showSuccess(result.message || 'Sincronizacao com R2 concluida com sucesso.');
    } catch (error) {
      showError(error.message);
    } finally {
      setIsSyncingBackup(false);
    }
  };

  const handlePasswordChanged = (message) => {
    setShowChangePassword(false);
    showSuccess(message);
  };

  const cancelAppointmentGlobal = async (appointment) => {
    try {
      showError('');
      await updateAppointmentById(appointment.id, {
        date: appointment.date,
        startTime: appointment.startTime || appointment.time,
        durationMinutes: appointment.durationMinutes || appointment.duration,
        status: 'cancelada',
      });
      showSuccess('Paciente desmarcado com sucesso.');
    } catch (error) {
      showError(error.message);
      throw error;
    }
  };

  if (!authChecked) {
    return <div className="notice">Verificando sessao...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      {successMessage && <div className="notice notice-success global-notice-bar">{successMessage}</div>}
      {errorMessage && <div className="notice notice-error global-notice-bar">{errorMessage}</div>}

      <Routes>
        <Route
          element={
            <AppLayout
              currentUser={currentUser}
              onLogout={handleLogout}
              onTogglePassword={() => setShowChangePassword((prev) => !prev)}
              showChangePassword={showChangePassword}
            />
          }
        >
          <Route
            index
            element={
              <>
                {showChangePassword && (
                  <div className="main-content">
                    <ChangePassword
                      onSuccess={handlePasswordChanged}
                      onCancel={() => setShowChangePassword(false)}
                    />
                  </div>
                )}
                <AgendaPage
                  showSuccess={showSuccess}
                  showError={showError}
                  onExportBackup={handleExportBackup}
                  onSyncBackup={handleSyncBackup}
                  isSyncingBackup={isSyncingBackup}
                />
              </>
            }
          />
          <Route path="pacientes" element={<PatientsPage />} />
          <Route path="pacientes/novo" element={<PatientForm />} />
          <Route
            path="pacientes/:id"
            element={<PatientDetailPage onCancelAppointment={cancelAppointmentGlobal} />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
