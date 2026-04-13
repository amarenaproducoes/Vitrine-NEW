export const formatWhatsApp = (value: string | null | undefined) => {
  if (!value) return '';
  const v = value.replace(/\D/g, '').slice(0, 11);
  let formatted = v;
  if (v.length > 0) {
    formatted = `(${v.slice(0, 2)}`;
    if (v.length > 2) {
      formatted += `) ${v.slice(2, 7)}`;
    }
    if (v.length > 7) {
      formatted += `-${v.slice(7, 11)}`;
    }
  }
  return formatted;
};
