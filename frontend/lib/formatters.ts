/** Formata um CPF (com ou sem máscara) como 000.000.000-00. Valores incompletos são devolvidos como estão. */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return "";
  const digitos = value.replace(/\D/g, "");
  if (digitos.length !== 11) return value;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
