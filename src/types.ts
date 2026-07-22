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
  page_number?: number;
  displayId?: number;
  googleReviewLink?: string;
  websiteUrl?: string;
  giftCardEnabled?: boolean;
  is_online_only?: boolean;
  directLink?: string;
  useGoogleMapsAsDirect?: boolean;
  directLinkClicks?: number;
  approval_status?: string;
  approval_token?: string;
  approval_feedback?: string;
  validation_clicks?: number;
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
  featured_coupons_title?: string;
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
  partnerName?: string | null;
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
  direct_link?: string | null;
  use_google_maps_as_direct?: boolean;
}

export interface CouponCampaignAccessLog {
  id: string;
  campaign_id: string;
  ip_address: string;
  created_at: string;
}

export interface SequenceComboPartner {
  id: string;
  partner_id: string;
  partner_name: string;
  sequence_pattern: string;
  benefit_description: string;
  product_name?: string;
  is_active: boolean;
  created_at?: string;
}

export interface SequenceComboCoupon {
  id: string;
  token: string;
  resgate_token: string;
  initiator_whatsapp: string;
  initiator_name: string;
  initiator_has_sequence: boolean;
  partner_id: string;
  partner_name: string;
  benefit_description: string;
  coupon_code: string;
  friend_whatsapp?: string | null;
  friend_first_name?: string | null;
  friend_full_name?: string | null;
  status: 'awaiting_friend' | 'unlocked' | 'redeemed';
  created_at?: string;
  unlocked_at?: string | null;
}

export interface SequenceComboLead {
  id: string;
  coupon_id?: string | null;
  initiator_whatsapp: string;
  friend_whatsapp: string;
  friend_first_name: string;
  is_registered_member: boolean;
  created_at?: string;
  updated_at?: string;
}
