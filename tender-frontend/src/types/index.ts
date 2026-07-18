export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_verified: boolean;
  telegram_id: string | null;
  telegram_username: string | null;
  language: string;
  notify_new_tenders: boolean;
  notify_match: boolean;
  notify_deadline: boolean;
  notify_results: boolean;
  notify_email: boolean;
  notify_telegram: boolean;
  theme: string;
  created_at: string;
  auth_type: "basic" | "uzex";
  inn: string | null;
  organization_name: string | null;
  region: string | null;
  district: string | null;
  director_name: string | null;
}

export interface UzexRegisterData {
  email: string;
  password: string;
  phone: string;
  inn: string;
  mfo: string;
  organization_name: string;
  account_number: string;
  region: string;
  district: string;
  address: string;
  director_name: string;
  eri_key_serial?: string;
  usb_token_id?: string;
  accept_terms: boolean;
}

export interface UzexLoginData {
  inn?: string;
  password?: string;
  eri_key_serial?: string;
  usb_token_id?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Company {
  id: number;
  user_id: number;
  name: string;
  stir: string | null;
  description: string | null;
  categories: string[] | null;
  regions: string[] | null;
  min_amount: number | null;
  max_amount: number | null;
  keywords: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  created_at: string;
}

export interface CompanyCreate {
  name: string;
  stir?: string;
  description?: string;
  categories?: string[];
  regions?: string[];
  min_amount?: number;
  max_amount?: number;
  keywords?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
}

export interface Tender {
  id: number;
  title: string;
  organization: string | null;
  category: string | null;
  region: string | null;
  status: string;
  amount: number | null;
  currency: string;
  deadline: string | null;
  source: string;
}

export interface TenderDetail extends Tender {
  external_id: string;
  description: string | null;
  published_at: string | null;
  url: string | null;
  created_at: string;
  match_score: number | null;
  is_saved: boolean;
  requirements: string | null;
  contact_info: string | null;
  document_urls: string | null;
}

export interface TenderFilter {
  category?: string;
  region?: string;
  status?: string;
  min_amount?: number;
  max_amount?: number;
  source?: string;
  search?: string;
}

export interface Subscription {
  id: number;
  plan: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  daily_requests_used: number;
  is_expired: boolean;
}

export interface PlanInfo {
  name: string;
  price_uzs: number;
  daily_requests: number;
  ml_access: boolean;
  api_access: boolean;
  document_analysis: boolean;
  max_saved_tenders: number;
  max_team_members: number;
}

export interface UsageStats {
  plan: string;
  daily_requests_used: number;
  daily_requests_limit: number;
  saved_tenders: number;
  max_saved_tenders: number;
  days_remaining: number | null;
}

export interface CompetitorRead {
  name: string;
  stir: string | null;
  total_wins: number;
  total_amount: number;
  avg_winning_amount: number;
  categories: string[];
  regions: string[];
  last_win_date: string | null;
}

export interface CompetitorAnalysis {
  total_competitors: number;
  top_competitors: CompetitorRead[];
  market_concentration: number;
  avg_tender_amount: number;
  total_tenders: number;
}

export interface MarketOverview {
  total_active_tenders: number;
  total_closed_tenders: number;
  avg_amount_by_category: Record<string, number>;
  tender_count_by_region: Record<string, number>;
  trend_direction: string;
  top_organizations: Array<Record<string, string | number>>;
}

export interface PriceHistory {
  date: string;
  amount: number;
  category: string;
  region: string | null;
  winner: string | null;
}

export interface PaymentRead {
  id: number;
  provider: string;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  paid_at: string | null;
  created_at: string;
}

export interface ChecklistItem {
  requirement: string;
  is_mandatory: boolean;
  category: string;
  notes: string | null;
}

export interface ChecklistResponse {
  tender_id: number | null;
  filename: string;
  total_pages: number;
  checklist: ChecklistItem[];
  summary: string;
  key_dates: Array<Record<string, string>>;
  required_documents: string[];
  estimated_budget: number | null;
}

export interface PricePredictResponse {
  predicted_amount: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
  currency: string;
  model_version: string;
  features_used: string[];
}

export interface WinProbabilityFactor {
  name: string;
  impact: number;
  detail: string;
}

export interface WinProbabilityResponse {
  win_probability: number;
  risk_level: string;
  recommendation: string;
  factors: WinProbabilityFactor[];
  model_version: string;
  confidence: number;
}

export interface SimilarityFactor {
  name: string;
  score: number;
  weight: number;
}

export interface TenderSimilarityResponse {
  overall_similarity: number;
  factors: SimilarityFactor[];
  level: string;
}

export interface RiskItem {
  name: string;
  category: string;
  score: number;
  level: string;
  label: string;
  details: string[];
}

export interface RiskAssessmentResponse {
  overall_score: number;
  overall_level: string;
  overall_label: string;
  verdict: string;
  risks: RiskItem[];
  recommendations: string[];
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface OptimalBidStrategy {
  name: string;
  description: string;
  bid_amount: number;
  win_probability: number;
  profit_margin: number;
  expected_value: number;
  recommended: boolean;
}

export interface OptimalBidChartPoint {
  bid_ratio: number;
  bid_amount: number;
  win_probability: number;
  expected_value: number;
  profit_margin: number;
}

export interface OptimalBidResponse {
  tender_amount: number;
  optimal_bid: number;
  optimal_ratio: number;
  win_probability: number;
  expected_value: number;
  profit_margin: number;
  strategies: OptimalBidStrategy[];
  chart_data: OptimalBidChartPoint[];
  recommendation: string;
}

export interface TrendHistoryPoint {
  month: string;
  count: number;
  avg_amount: number;
  total_amount: number;
  trend_count: number;
  trend_amount: number;
  is_forecast: boolean;
}

export interface TrendForecastPoint {
  month: string;
  predicted_count: number;
  predicted_avg_amount: number;
  predicted_total_amount: number;
  is_forecast: boolean;
}

export interface TrendSummary {
  count_trend: string;
  amount_trend: string;
  growth_rate: number;
  avg_monthly_count: number;
  avg_monthly_amount: number;
  total_months_analyzed: number;
  forecast_months: number;
  confidence: number;
  r2_count: number;
  r2_amount: number;
}

export interface TrendForecastResponse {
  history: TrendHistoryPoint[];
  forecast: TrendForecastPoint[];
  summary: TrendSummary;
  insights: string[];
}

export interface TenderApplication {
  id: number;
  user_id: number;
  tender_id: number;
  stage: string;
  priority: string;
  bid_amount: number | null;
  currency: string;
  notes: string | null;
  assigned_to: string | null;
  win_probability: number | null;
  result: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  tender_title?: string | null;
  tender_organization?: string | null;
  tender_category?: string | null;
  tender_region?: string | null;
  tender_amount?: number | null;
  tender_deadline?: string | null;
  tender_status?: string | null;
}

export interface ApplicationStats {
  total: number;
  by_stage: Record<string, number>;
  by_priority: Record<string, number>;
  total_bid_amount: number;
  won_count: number;
  lost_count: number;
  win_rate: number | null;
  avg_bid_amount: number | null;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export const CATEGORIES = [
  { value: "construction", label: "Qurilish" },
  { value: "it", label: "IT" },
  { value: "medical", label: "Tibbiyot" },
  { value: "education", label: "Ta'lim" },
  { value: "food", label: "Oziq-ovqat" },
  { value: "transport", label: "Transport" },
  { value: "energy", label: "Energetika" },
  { value: "agriculture", label: "Qishloq xo'jaligi" },
  { value: "consulting", label: "Konsalting" },
  { value: "other", label: "Boshqa" },
] as const;

export const REGIONS = [
  { value: "tashkent_city", label: "Toshkent shahri" },
  { value: "tashkent_region", label: "Toshkent viloyati" },
  { value: "andijan", label: "Andijon" },
  { value: "bukhara", label: "Buxoro" },
  { value: "fergana", label: "Farg'ona" },
  { value: "jizzakh", label: "Jizzax" },
  { value: "kashkadarya", label: "Qashqadaryo" },
  { value: "khorezm", label: "Xorazm" },
  { value: "namangan", label: "Namangan" },
  { value: "navoi", label: "Navoiy" },
  { value: "samarkand", label: "Samarqand" },
  { value: "sirdarya", label: "Sirdaryo" },
  { value: "surkhandarya", label: "Surxondaryo" },
  { value: "karakalpakstan", label: "Qoraqalpog'iston" },
] as const;

export const TENDER_STATUSES = [
  { value: "active", label: "Faol" },
  { value: "closed", label: "Yopilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
  { value: "awarded", label: "G'olib aniqlangan" },
] as const;
