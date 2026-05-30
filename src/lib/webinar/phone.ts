export type PhoneRegion = "BR" | "US";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** BR: (DD) 9 XXXX-XXXX — o 9 após o DDD é fixo. */
export function formatPhoneBR(raw: string): string {
  let digits = digitsOnly(raw).slice(0, 11);

  if (digits.length > 2) {
    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    digits = rest.startsWith("9") ? ddd + rest : ddd + "9" + rest;
    digits = digits.slice(0, 11);
  }

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const nine = digits.slice(2, 3);
  const part1 = digits.slice(3, 7);
  const part2 = digits.slice(7, 11);

  if (digits.length <= 3) return `(${ddd}) ${nine}`;
  if (digits.length <= 7) return `(${ddd}) ${nine} ${part1}`;
  return `(${ddd}) ${nine} ${part1}-${part2}`;
}

/** US: (XXX) XXX-XXXX */
export function formatPhoneUS(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;

  const area = digits.slice(0, 3);
  const mid = digits.slice(3, 6);
  const last = digits.slice(6, 10);

  if (digits.length <= 6) return `(${area}) ${mid}`;
  return `(${area}) ${mid}-${last}`;
}

export function formatPhone(raw: string, region: PhoneRegion): string {
  return region === "US" ? formatPhoneUS(raw) : formatPhoneBR(raw);
}

export function validatePhone(value: string, region: PhoneRegion): boolean {
  const digits = digitsOnly(value);
  if (region === "US") return digits.length === 10;
  return digits.length === 11 && digits[2] === "9";
}

export function phoneValidationMessage(region: PhoneRegion): string {
  return region === "US"
    ? "Informe um telefone válido: (XXX) XXX-XXXX"
    : "Informe um telefone válido: (DD) 9 XXXX-XXXX";
}
