export const formatWhatsApp = (value: string | null | undefined) => {
  if (!value) return '';
  let v = value.replace(/\D/g, '');
  
  // Se tiver 12 ou 13 dígitos e começar com 55, remove o 55
  if ((v.length === 12 || v.length === 13) && v.startsWith('55')) {
    v = v.slice(2);
  }
  
  // Limita a 11 dígitos (padrão celular Brasil)
  v = v.slice(0, 11);
  
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

export const getCleanWhatsApp = (value: string | null | undefined) => {
  if (!value) return '';
  let v = value.replace(/\D/g, '');
  
  // Se tiver 12 ou 13 dígitos e começar com 55, remove o 55
  if ((v.length === 12 || v.length === 13) && v.startsWith('55')) {
    v = v.slice(2);
  }
  
  return v.slice(0, 11);
};
