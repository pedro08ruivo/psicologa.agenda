import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  fetchClinicalNotes,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
} from "../services/api";

function PatientClinicalNotes({ patientId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchClinicalNotes(patientId);
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      await createClinicalNote(patientId, { content: newContent });
      setNewContent("");
      setShowForm(false);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (noteId) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await updateClinicalNote(patientId, noteId, { content: editContent });
      setEditingId(null);
      setEditContent("");
      await loadNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Excluir esta evolução clínica?")) return;
    try {
      await deleteClinicalNote(patientId, noteId);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="clinical-notes-section">
      <div className="section-header-row">
        <h3>Prontuário evolutivo</h3>
        {!showForm && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            Nova evolução
          </button>
        )}
      </div>
      <p className="page-hint">Registros cronológicos de evolução do atendimento (separados do prontuário geral).</p>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <div className="notice">Carregando evoluções...</div>}

      {showForm && (
        <form className="note-form" onSubmit={handleCreate}>
          <textarea
            rows="5"
            placeholder="Descreva a evolução clínica..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
          />
          <div className="form-actions-row">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              Salvar evolução
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowForm(false);
                setNewContent("");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!loading && notes.length === 0 && !showForm && (
        <div className="empty-slot">Nenhuma evolução registrada.</div>
      )}

      <ul className="clinical-notes-list">
        {notes.map((note) => (
          <li key={note.id} className="clinical-note-item">
            <div className="clinical-note-meta">
              {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm")}
            </div>
            {editingId === note.id ? (
              <>
                <textarea rows="4" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                <div className="form-actions-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                    onClick={() => handleUpdate(note.id)}
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent("");
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="clinical-note-content">{note.content}</p>
                <div className="form-actions-row">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingId(note.id);
                      setEditContent(note.content);
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(note.id)}>
                    Excluir
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PatientClinicalNotes;
