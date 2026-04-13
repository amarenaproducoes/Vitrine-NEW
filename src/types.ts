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
  images?: string[];
  videoUrl?: string;
  link: string;
  whatsappLink?: string;
  coupon?: string;
  couponDescription?: string;
  isAuthorized: boolean;
  cashbackEnabled: boolean;
  orderIndex: number;
  displayId?: number;
  googleReviewLink?: string;
  websiteUrl?: string;
  giftCardEnabled?: boolean;
}

export interface GiftCard {
  card_number: string;
  value: number;
  is_active: boolean;
  created_at: string;
}

export interface ActiveGiftCard {
  id: string;
  card_number: string;
  whatsapp: string;
  customer_name: string;
  partner_id: string;
  activated_at: string;
  expires_at: string;
  used: boolean;
  used_at?: string;
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
  cashback_label?: string;
  whatsapp: string;
  customer_name?: string;
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
  mission_vision_values?: string;
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

export interface FeaturedCoupon {
  slot_id: number;
  partner_id: string | null;
}

export interface WelcomeMessage {
  id: string;
  ref_id: string;
  title: string;
  message: string;
  logo_url: string | null;
  created_at?: string;
}

export interface CouponCampaign {
  id: string;
  ref_id: string;
  title: string;
  message: string;
  logo_url: string | null;
  partner_id: string;
  custom_coupon: string | null;
  custom_description: string | null;
  expires_at: string | null;
  created_at?: string;
}

export interface CouponCampaignAccessLog {
  id: string;
  campaign_id: string;
  ip_address: string;
  created_at: string;
}
