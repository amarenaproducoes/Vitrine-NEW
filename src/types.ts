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
  cashbackEnabled: boolean;
  orderIndex: number;
  displayId?: number;
}

export interface PartnerAccessLog {
  id: string;
  partner_id: string;
  created_at: string;
  ip_address: string;
}

export interface CashbackConfig {
  id: number;
  label: string;
  value: number;
  probability: number;
}

export interface CashbackLog {
  id: string;
  store_name: string;
  cashback_value: number;
  ip_address: string;
  created_at: string;
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

export interface CommercialBannerData {
  id: number;
  imageUrl: string;
  linkUrl?: string | null;
}
