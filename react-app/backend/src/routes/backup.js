const express = require("express");
const path = require("path");
const fs = require("fs");
const { uploadDatabase, isR2Configured, getR2ConfigStatus } = require("../r2");

const router = express.Router();
const dbPath = path.join(__dirname, "../../prisma/dev.db");

router.get("/export", (_req, res) => {
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: "Arquivo de backup nao encontrado." });
  }

  return res.download(dbPath, "backup_psicoagenda.db");
});

router.post("/sync", async (_req, res) => {
  if (!isR2Configured()) {
    const status = getR2ConfigStatus();
    const detail =
      status.state === "partial"
        ? `Faltam: ${status.missing.join(", ")}`
        : "Configure R2_* no .env do backend.";
    return res.status(503).json({ error: `R2 nao configurado. ${detail}` });
  }

  try {
    await uploadDatabase();
    return res.json({ ok: true, message: "Sincronizacao com R2 concluida." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "Falha ao sincronizar backup com R2.",
    });
  }
});

module.exports = router;
