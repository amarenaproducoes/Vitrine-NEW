export interface Category {
  id: string;
  name: string;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  activity: string;
  description: string;
  address: string;
  imageUrl: string;
  link: string;
  whatsappLink?: string;
  coupon?: string;
  couponDescription?: string;
  isAuthorized: boolean;
  orderIndex: number;
}

export interface SuccessCase {
  id: string;
  companyName: string;
  description: string;
  logoUrl: string;
  storeImageUrl: string;
  created_at?: string;
}

export interface AboutConfig {
  id: number;
  history: string;
  logoUrl: string | null;
}

export interface Lead {
  id: string;
  fullName: string;
  whatsapp: string;
  type: 'anunciante' | 'motorista' | 'comerciante' | 'contato';
  message?: string;
  created_at: string;
  contacted?: boolean;
  ip_address?: string;
}

export interface BrandTheme {
  primary: string;
  secondary: string;
  accent: string;
}
