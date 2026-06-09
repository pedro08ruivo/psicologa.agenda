/**
 * Preenche CPF de pacientes antigos (antes do campo existir).
 * Uso: node scripts/backfill-patient-cpf.js
 */
require("dotenv").config();
const prisma = require("../src/prisma");
const { isValidCpf } = require("../src/cpf");

function buildValidCpfFromSeed(seed) {
  const base = String(100000000 + (seed % 899999999)).padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(base[i]) * (10 - i);
  }
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  const withD1 = base + d1;
  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(withD1[i]) * (11 - i);
  }
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  const full = withD1 + d2;
  return isValidCpf(full) ? full : null;
}

async function main() {
  const patients = await prisma.patient.findMany({ where: { cpf: null } });
  let seed = 1;
  for (const patient of patients) {
    let cpf = null;
    while (!cpf) {
      cpf = buildValidCpfFromSeed(seed);
      seed += 1;
    }
    await prisma.patient.update({
      where: { id: patient.id },
      data: { cpf },
    });
    console.log(`CPF atribuido a ${patient.name}: ${cpf}`);
  }
  console.log("Concluido.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
