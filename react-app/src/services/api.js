const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
const TOKEN_KEY = "psicoagenda_token";

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    let message = "Erro ao comunicar com o servidor.";
    try {
      const errorData = await response.json();
      if (errorData.error) {
        message = errorData.error;
      }
    } catch (_error) {
      // keep fallback message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function fetchPatients() {
  const result = await request("/patients");
  return result.data || [];
}

export async function createPatient(payload) {
  return request("/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchPatientById(id) {
  return request(`/patients/${id}`);
}

export async function updatePatient(id, payload) {
  return request(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePatient(id) {
  return request(`/patients/${id}`, { method: "DELETE" });
}

export async function fetchClinicalNotes(patientId) {
  const result = await request(`/patients/${patientId}/notes`);
  return result.data || [];
}

export async function createClinicalNote(patientId, payload) {
  return request(`/patients/${patientId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateClinicalNote(patientId, noteId, payload) {
  return request(`/patients/${patientId}/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteClinicalNote(patientId, noteId) {
  return request(`/patients/${patientId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

export async function fetchAppointments() {
  const result = await request("/appointments");
  return result.data || [];
}

export async function createAppointment(payload) {
  return request("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAppointmentById(id, payload) {
  return request(`/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAppointmentById(id) {
  return request(`/appointments/${id}`, { method: "DELETE" });
}

export async function fetchPatientHistoryById(id) {
  return request(`/patients/${id}/history`);
}

export async function login(username, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchCurrentUser() {
  return request("/auth/me");
}

export async function changePassword(currentPassword, newPassword) {
  return request("/auth/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function syncR2Backup() {
  return request("/backup/sync", { method: "POST" });
}

export async function exportBackup() {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}/backup/export`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = "Falha ao baixar backup.";
    try {
      const errorData = await response.json();
      if (errorData.error) {
        message = errorData.error;
      }
    } catch (_error) {
      // keep fallback message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "backup_psicoagenda.db";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export { TOKEN_KEY };
