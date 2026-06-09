/**
 * Valida variáveis R2 e testa acesso ao bucket.
 * Uso: npm run r2:check
 */
require("dotenv").config();
const { getR2ConfigStatus, createS3Client } = require("../src/r2");
const { HeadBucketCommand } = require("@aws-sdk/client-s3");

async function main() {
  const status = getR2ConfigStatus();

  console.log("--- Configuração R2 ---");
  if (status.state === "missing") {
    console.log("Status: não configurado (modo só local).");
    console.log("\nPreencha no arquivo .env:");
    status.missing.forEach((key) => console.log(`  ${key}=`));
    console.log("\nOu defina R2_ACCOUNT_ID + demais chaves (endpoint é montado automaticamente).");
    console.log("Guia: https://developers.cloudflare.com/r2/api/s3/tokens/");
    process.exit(0);
  }

  if (status.state === "partial") {
    console.log("Status: incompleto — faltam variáveis:");
    status.missing.forEach((key) => console.log(`  - ${key}`));
    process.exit(1);
  }

  console.log("Status: variáveis OK");
  console.log(`Endpoint: ${status.endpoint}`);
  console.log(`Bucket: ${status.bucket}`);
  console.log(`Chave do backup: ${status.databaseKey}`);

  const s3 = createS3Client();
  await s3.send(new HeadBucketCommand({ Bucket: status.bucket }));
  console.log("\n✅ Conexão com o bucket R2 bem-sucedida.");
}

main().catch((error) => {
  console.error("\n❌ Falha ao acessar R2:", error.message || error);
  process.exit(1);
});
