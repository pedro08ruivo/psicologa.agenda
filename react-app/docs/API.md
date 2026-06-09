# API (REST)

Base URL local: `http://localhost:4000`

Rotas protegidas exigem header: `Authorization: Bearer <token>`

## Healthcheck

- `GET /health` (público)

## Autenticação

- `POST /auth/login`
- `GET /auth/me`
- `PUT /auth/password`

## Pacientes

- `GET /patients` — lista (ordem por nome)
- `POST /patients` — criar

```json
{
  "name": "Maria Souza",
  "cpf": "12345678901",
  "phone": "11999999999",
  "email": "maria@email.com",
  "notes": "Prontuário geral..."
}
```

- `cpf` — **obrigatório**, 11 dígitos, único no sistema
- `phone` — **opcional**

- `GET /patients/:id` — ficha + `appointmentCount`, `clinicalNoteCount`
- `PUT /patients/:id` — atualizar `name`, `cpf`, `phone`, `email`, `notes`
- `DELETE /patients/:id` — só se não houver consultas (409 caso contrário)
- `GET /patients/:id/history` — paciente + consultas

### Evoluções clínicas (prontuário evolutivo)

- `GET /patients/:id/notes` — lista (`createdAt` desc)
- `POST /patients/:id/notes` — `{ "content": "...", "appointmentId": "opcional" }`
- `PUT /patients/:id/notes/:noteId` — `{ "content": "..." }`
- `DELETE /patients/:id/notes/:noteId` — 204

## Agendamentos

- `GET /appointments`
- `POST /appointments` — requer `patientId`
- `PUT /appointments/:id`
- `DELETE /appointments/:id`

```json
{
  "date": "2026-04-23",
  "startTime": "17:00",
  "durationMinutes": 50,
  "patientId": "clxxx...",
  "consultationType": "psicoterapia",
  "price": 150,
  "status": "agendada",
  "summary": "Nota da sessão (opcional)"
}
```

## Backup

- `GET /backup/export`
- `POST /backup/sync`

## Regras de negócio

- Não permitir conflito de horário.
- Status: `agendada`, `confirmada`, `presente`, `falta`, `cancelada`, `remarcada`.
- `Patient.id` é gerado pelo sistema (cuid); não é editável pela API.
