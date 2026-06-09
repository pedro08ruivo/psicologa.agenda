require("dotenv").config();
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../prisma/dev.db");

const R2_KEYS = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];

function resolveEndpoint() {
  const explicit = process.env.R2_ENDPOINT?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  if (accountId) {
    return `https://${accountId}.r2.cloudflarestorage.com`;
  }
  return null;
}

function getDatabaseKey() {
  return process.env.R2_DATABASE_KEY?.trim() || "dev.db";
}

function getR2ConfigStatus() {
  const missing = [];
  const endpoint = resolveEndpoint();
  if (!endpoint) {
    missing.push("R2_ENDPOINT ou R2_ACCOUNT_ID");
  }
  if (!process.env.R2_ACCESS_KEY_ID?.trim()) {
    missing.push("R2_ACCESS_KEY_ID");
  }
  if (!process.env.R2_SECRET_ACCESS_KEY?.trim()) {
    missing.push("R2_SECRET_ACCESS_KEY");
  }
  if (!process.env.R2_BUCKET_NAME?.trim()) {
    missing.push("R2_BUCKET_NAME");
  }

  if (missing.length === R2_KEYS.length + 1) {
    return { state: "missing", missing: [...R2_KEYS, "R2_ENDPOINT ou R2_ACCOUNT_ID"] };
  }
  if (missing.length > 0) {
    return { state: "partial", missing };
  }

  return {
    state: "configured",
    endpoint,
    bucket: process.env.R2_BUCKET_NAME.trim(),
    databaseKey: getDatabaseKey(),
  };
}

function isR2Configured() {
  return getR2ConfigStatus().state === "configured";
}

function createS3Client() {
  const status = getR2ConfigStatus();
  if (status.state !== "configured") {
    throw new Error("R2 nao configurado.");
  }

  return new S3Client({
    region: "auto",
    endpoint: status.endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
    },
  });
}

async function downloadDatabase() {
  const status = getR2ConfigStatus();

  if (status.state === "missing") {
    console.log("ℹ️ R2 não configurado — usando banco local (prisma/dev.db).");
    console.log("   Para ativar: preencha R2_* no .env e rode npm run r2:check");
    return;
  }

  if (status.state === "partial") {
    console.warn("⚠️ R2 incompleto — faltam:", status.missing.join(", "));
    console.warn("   Usando banco local até corrigir o .env");
    return;
  }

  const s3 = createS3Client();
  const bucket = status.bucket;
  const key = status.databaseKey;

  console.log("Iniciando download do banco do R2...");
  try {
    const data = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const writeStream = fs.createWriteStream(dbPath);
    await new Promise((resolve, reject) => {
      data.Body.pipe(writeStream).on("error", reject).on("close", resolve);
    });
    console.log("✅ Banco de dados baixado com sucesso do R2.");
  } catch (error) {
    if (error.name === "NoSuchKey") {
      console.log("ℹ️ Nenhum banco de dados existente encontrado no R2. Iniciando vazio.");
    } else {
      console.error("❌ Erro ao baixar banco de dados do R2:", error.message || error);
    }
  }
}

async function uploadDatabase() {
  const status = getR2ConfigStatus();
  if (status.state !== "configured") {
    const err = new Error(
      status.state === "partial"
        ? `R2 incompleto. Faltam: ${status.missing.join(", ")}`
        : "R2 nao configurado. Preencha as variaveis no .env."
    );
    err.code = "R2_NOT_CONFIGURED";
    throw err;
  }

  if (!fs.existsSync(dbPath)) {
    throw new Error("Arquivo local dev.db nao encontrado para backup.");
  }

  const s3 = createS3Client();
  const bucket = status.bucket;
  const key = status.databaseKey;

  console.log("Realizando backup do banco para o R2...");
  const fileStream = fs.createReadStream(dbPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
    })
  );
  console.log("✅ Backup do banco atualizado no R2.");
}

module.exports = {
  downloadDatabase,
  uploadDatabase,
  isR2Configured,
  getR2ConfigStatus,
  createS3Client,
  getDatabaseKey,
};
