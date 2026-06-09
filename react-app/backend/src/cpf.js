function normalizeCpf(cpf) {
  return String(cpf || "").replace(/\D/g, "");
}

function formatCpf(digits) {
  const d = normalizeCpf(digits);
  if (d.length !== 11) return d;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isValidCpf(cpf) {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(digits[10]);
}

function parseCpfInput(cpf) {
  const normalized = normalizeCpf(cpf);
  if (!normalized) {
    return { error: "CPF e obrigatorio." };
  }
  if (!isValidCpf(normalized)) {
    return { error: "CPF invalido." };
  }
  return { value: normalized };
}

function parsePhoneInput(phone) {
  if (phone === undefined) return { omit: true };
  const trimmed = phone?.trim();
  return { value: trimmed || null };
}

module.exports = {
  normalizeCpf,
  formatCpf,
  isValidCpf,
  parseCpfInput,
  parsePhoneInput,
};
