const express = require("express");
const prisma = require("../prisma");
const { parseCpfInput, parsePhoneInput } = require("../cpf");

const router = express.Router();

function mapAppointment(a) {
  const iso = a.startsAt.toISOString();
  const date = iso.split("T")[0];
  const startTime = iso.split("T")[1].substring(0, 5);

  return {
    ...a,
    date,
    startTime,
    chargeFirstSessionDeposit: a.chargeFirstDeposit,
    isRecurringWeekly: a.recurringWeekly,
    price: Number(a.price),
  };
}

router.get("/", async (_req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ data: patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar pacientes no banco de dados." });
  }
});

router.post("/", async (req, res) => {
  const { name, cpf, phone, email, notes } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Nome e obrigatorio." });
  }

  const cpfParsed = parseCpfInput(cpf);
  if (cpfParsed.error) {
    return res.status(400).json({ error: cpfParsed.error });
  }

  const phoneParsed = parsePhoneInput(phone);
  if (phoneParsed.error) {
    return res.status(400).json({ error: phoneParsed.error });
  }

  try {
    const newPatient = await prisma.patient.create({
      data: {
        name: name.trim(),
        cpf: cpfParsed.value,
        phone: phoneParsed.value,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });
    return res.status(201).json(newPatient);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "CPF ja cadastrado para outro paciente." });
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao criar paciente no banco de dados." });
  }
});

router.get("/:id/history", async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findUnique({ where: { id } });

    if (!patient) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: id },
      orderBy: { startsAt: "desc" },
    });

    return res.json({
      patient,
      appointments: appointments.map(mapAppointment),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar historico do paciente." });
  }
});

router.get("/:id/notes", async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }

    const notes = await prisma.clinicalNote.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ data: notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar evolucoes do paciente." });
  }
});

router.post("/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { content, appointmentId } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Conteudo da evolucao e obrigatorio." });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }

    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, patientId: id },
      });
      if (!appointment) {
        return res.status(400).json({ error: "Consulta invalida para este paciente." });
      }
    }

    const note = await prisma.clinicalNote.create({
      data: {
        patientId: id,
        content: content.trim(),
        authorUserId: req.authUser.id,
        appointmentId: appointmentId || null,
      },
    });

    return res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar evolucao clinica." });
  }
});

router.put("/:id/notes/:noteId", async (req, res) => {
  const { id, noteId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Conteudo da evolucao e obrigatorio." });
  }

  try {
    const existing = await prisma.clinicalNote.findFirst({
      where: { id: noteId, patientId: id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Evolucao nao encontrada." });
    }

    const updated = await prisma.clinicalNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar evolucao clinica." });
  }
});

router.delete("/:id/notes/:noteId", async (req, res) => {
  const { id, noteId } = req.params;

  try {
    const existing = await prisma.clinicalNote.findFirst({
      where: { id: noteId, patientId: id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Evolucao nao encontrada." });
    }

    await prisma.clinicalNote.delete({ where: { id: noteId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir evolucao clinica." });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        _count: { select: { appointments: true, clinicalNotes: true } },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }

    const { _count, ...rest } = patient;
    return res.json({
      ...rest,
      appointmentCount: _count.appointments,
      clinicalNoteCount: _count.clinicalNotes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar paciente." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, cpf, phone, email, notes } = req.body;

  if (name !== undefined && !name?.trim()) {
    return res.status(400).json({ error: "Nome nao pode ser vazio." });
  }

  let cpfValue;
  if (cpf !== undefined) {
    const cpfParsed = parseCpfInput(cpf);
    if (cpfParsed.error) {
      return res.status(400).json({ error: cpfParsed.error });
    }
    cpfValue = cpfParsed.value;
  }

  let phoneValue;
  if (phone !== undefined) {
    const phoneParsed = parsePhoneInput(phone);
    phoneValue = phoneParsed.value;
  }

  try {
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }

    if (!cpfValue && !existing.cpf) {
      return res.status(400).json({ error: "CPF e obrigatorio." });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(cpfValue !== undefined && { cpf: cpfValue }),
        ...(phone !== undefined && { phone: phoneValue }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    });

    return res.json(updated);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "CPF ja cadastrado para outro paciente." });
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar paciente." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.patient.findUnique({
      where: { id },
      include: { _count: { select: { appointments: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }

    if (existing._count.appointments > 0) {
      return res.status(409).json({
        error: "Nao e possivel excluir paciente com consultas registradas.",
      });
    }

    await prisma.clinicalNote.deleteMany({ where: { patientId: id } });
    await prisma.digitalContract.deleteMany({ where: { patientId: id } });
    await prisma.patient.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir paciente." });
  }
});

module.exports = router;
