/**
 * Admin API service — all calls to /v1/admin/*
 */
import _api from './axios';
export const api = _api;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface KPI {
  total_users: number;
  active_users: number;
  total_tenders: number;
  active_tenders: number;
  tenders_today: number;
  pro_subscribers: number;
  business_subscribers: number;
  total_revenue: number;
  new_users_today: number;
  total_companies: number;
}

export interface ChartPoint { day: string; uzex: number; mc: number; mygov: number }
export interface PlanItem { name: string; value: number }
export interface RevenuePoint { day: string; click: number; payme: number }

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_admin: boolean;
  is_superadmin: boolean;
  is_verified: boolean;
  telegram_id?: string;
  current_plan: string;
  company_name?: string;
  created_at: string;
}

export interface AdminTender {
  id: number;
  external_id: string;
  source: string;
  title: string;
  organization?: string;
  category?: string;
  region?: string;
  status: string;
  amount?: number;
  currency: string;
  deadline?: string;
  published_at?: string;
  url?: string;
  is_deleted: boolean;
  created_at: string;
}

export interface AdminCompany {
  id: number;
  user_id: number;
  name: string;
  stir?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  is_deleted: boolean;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
}

export interface AdminPayment {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  provider: string;
  plan: string;
  status: string;
  transaction_id?: string;
  error_message?: string;
  paid_at?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface AdminSubscription {
  id: number;
  user_id: number;
  plan: string;
  is_active: boolean;
  starts_at: string;
  expires_at?: string;
  daily_requests_used: number;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface RevenueOverview {
  total_revenue: number;
  completed_payments: number;
  failed_payments: number;
  pending_payments: number;
  pro_subscribers: number;
  business_subscribers: number;
  free_users: number;
  mrr: number;
  arr: number;
}

export interface AdminNotification {
  id: number;
  user_id: number;
  type: string;
  channel: string;
  title: string;
  message: string;
  is_read: boolean;
  is_sent: boolean;
  created_at: string;
  user_email?: string;
}

export interface NotificationStats {
  total_sent: number;
  total_read: number;
  read_rate: number;
  by_channel: { channel: string; sent: number; delivered: number; delivery_rate: number }[];
  by_type: { type: string; count: number }[];
}

export interface AuditEntry {
  id: number;
  user_id?: number;
  admin_email?: string;
  action: string;
  resource_type?: string;
  resource_id?: number;
  details?: string;
  created_at: string;
}

export interface HealthCheck {
  overall: string;
  checks: Record<string, { status: string; latency_ms?: number; detail?: string; workers?: number }>;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export const dashboardApi = {
  kpi: () => api.get<{ data: KPI }>('/admin/dashboard/kpi').then(r => r.data.data),
  tenderChart: (days = 30) => api.get<{ data: ChartPoint[] }>(`/admin/dashboard/chart/tenders?days=${days}`).then(r => r.data.data),
  planChart: () => api.get<{ data: PlanItem[] }>('/admin/dashboard/chart/plans').then(r => r.data.data),
  revenueChart: (days = 30) => api.get<{ data: RevenuePoint[] }>(`/admin/dashboard/chart/revenue?days=${days}`).then(r => r.data.data),
};

// ── Users ──────────────────────────────────────────────────────────────────────

export interface CreateUserData { email: string; full_name: string; password: string; phone?: string; is_admin?: boolean; is_active?: boolean; is_verified?: boolean }

export const usersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminUser>>('/admin/users', { params }).then(r => r.data),
  get: (id: number) => api.get<{ data: AdminUser }>(`/admin/users/${id}`).then(r => r.data.data),
  create: (data: CreateUserData) =>
    api.post<{ data: AdminUser }>('/admin/users', data).then(r => r.data.data),
  updateRole: (id: number, data: Partial<{ is_admin: boolean; is_verified: boolean; is_active: boolean }>) =>
    api.patch<{ data: AdminUser }>(`/admin/users/${id}/role`, data).then(r => r.data.data),
  toggleActive: (id: number) => api.patch<{ data: { is_active: boolean } }>(`/admin/users/${id}/toggle-active`).then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
  sendMessage: (id: number, data: { title: string; message: string; channels: string[] }) =>
    api.post(`/admin/users/${id}/message`, data).then(r => r.data),
};

// ── Tenders ────────────────────────────────────────────────────────────────────

export interface CreateTenderData { title: string; organization?: string; category?: string; region?: string; amount?: number; currency?: string; deadline?: string; description?: string; source?: string; url?: string; contact_info?: string; requirements?: string }

export const tendersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminTender>>('/admin/tenders', { params }).then(r => r.data),
  create: (data: CreateTenderData) =>
    api.post<{ data: AdminTender }>('/admin/tenders', data).then(r => r.data.data),
  stats: () => api.get<{ data: { by_status: Record<string, number>; by_source: Record<string, number> } }>('/admin/tenders/stats').then(r => r.data.data),
  update: (id: number, data: Partial<AdminTender>) => api.patch<{ data: AdminTender }>(`/admin/tenders/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/tenders/${id}`),
  bulkDelete: (ids: number[]) => api.post('/admin/tenders/bulk-delete', { ids }).then(r => r.data),
};

// ── Companies ─────────────────────────────────────────────────────────────────

export interface CreateCompanyData { user_id: number; name: string; stir?: string; description?: string; contact_person?: string; contact_phone?: string; address?: string; website?: string }

export const companiesApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminCompany>>('/admin/companies', { params }).then(r => r.data),
  create: (data: CreateCompanyData) =>
    api.post<{ data: AdminCompany }>('/admin/companies', data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/companies/${id}`),
};

// ── Financials ─────────────────────────────────────────────────────────────────

export const financialsApi = {
  overview: () => api.get<{ data: RevenueOverview }>('/admin/financials/overview').then(r => r.data.data),
  payments: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminPayment>>('/admin/financials/payments', { params }).then(r => r.data),
  subscriptions: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminSubscription>>('/admin/financials/subscriptions', { params }).then(r => r.data),
  grantSubscription: (userId: number, plan: string, days: number) =>
    api.post(`/admin/financials/subscriptions/${userId}/grant?plan=${plan}&days=${days}`).then(r => r.data),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminNotification>>('/admin/notifications', { params }).then(r => r.data),
  stats: () => api.get<{ data: NotificationStats }>('/admin/notifications/stats').then(r => r.data.data),
  create: (data: { user_id: number; title: string; message: string; type?: string }) =>
    api.post('/admin/notifications', data).then(r => r.data),
  broadcast: (data: { title: string; message: string; channels: string[]; target: string }) =>
    api.post('/admin/notifications/broadcast', data).then(r => r.data),
};

// ── Audit Log ─────────────────────────────────────────────────────────────────

export const auditApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<Paginated<AuditEntry>>('/admin/audit-log', { params }).then(r => r.data),
  actions: () => api.get<string[]>('/admin/audit-log/actions').then(r => r.data),
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: (days = 30) => api.get<{ data: Record<string, unknown> }>(`/admin/analytics/overview?days=${days}`).then(r => r.data.data),
  retention: () => api.get<{ data: Record<string, number> }>('/admin/analytics/retention').then(r => r.data.data),
  pipeline: () => api.get<{ data: Record<string, unknown> }>('/admin/analytics/pipeline').then(r => r.data.data),
  categoryBreakdown: () => api.get<{ data: { category: string; count: number }[] }>('/admin/analytics/category-breakdown').then(r => r.data.data),
  regionBreakdown: () => api.get<{ data: { region: string; count: number }[] }>('/admin/analytics/region-breakdown').then(r => r.data.data),
  tenderAmounts: () => api.get<{ data: Record<string, any> }>('/admin/analytics/tender-amounts').then(r => r.data.data),
  applicationsSummary: () => api.get<{ data: Record<string, any> }>('/admin/analytics/applications-summary').then(r => r.data.data),
  sourceBreakdown: () => api.get<{ data: { source: string; count: number }[] }>('/admin/analytics/source-breakdown').then(r => r.data.data),
};

// ── Health ────────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => api.get<{ data: HealthCheck }>('/admin/health').then(r => r.data.data),
};

// ── Roles & Permissions ────────────────────────────────────────────────────────

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  is_system: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_system: boolean;
  permissions: Permission[];
  user_count: number;
}

export const rolesApi = {
  // Roles
  list: () => api.get<{ data: Role[] }>('/admin/roles').then(r => r.data.data),
  get: (id: number) => api.get<{ data: Role }>(`/admin/roles/${id}`).then(r => r.data.data),
  create: (data: { name: string; description?: string; permission_ids: number[] }) =>
    api.post<{ data: Role }>('/admin/roles', data).then(r => r.data.data),
  update: (id: number, data: { name?: string; description?: string; permission_ids?: number[] }) =>
    api.patch<{ data: Role }>(`/admin/roles/${id}`, data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/roles/${id}`).then(r => r.data),

  // Permissions
  listPermissions: () => api.get<{ data: Permission[] }>('/admin/roles/permissions').then(r => r.data.data),
  createPermission: (data: { name: string; resource: string; action: string; description?: string }) =>
    api.post<{ data: Permission }>('/admin/roles/permissions', data).then(r => r.data.data),
  deletePermission: (id: number) => api.delete(`/admin/roles/permissions/${id}`).then(r => r.data),

  // User-role assignment
  getUserRoles: (userId: number) => api.get<{ data: Role[] }>(`/admin/roles/users/${userId}/roles`).then(r => r.data.data),
  assignUserRoles: (userId: number, role_ids: number[]) =>
    api.put(`/admin/roles/users/${userId}/roles`, { role_ids }).then(r => r.data),

  // Admin management
  listAdmins: () => api.get<{ data: AdminUser[] }>('/admin/roles/admins/list').then(r => r.data.data),
  promote: (email: string, reason?: string) =>
    api.post('/admin/roles/admins/promote', { email, reason: reason || '' }).then(r => r.data),
  demote: (userId: number) => api.delete(`/admin/roles/admins/${userId}/demote`).then(r => r.data),
};

// ── Teams ─────────────────────────────────────────────────────────────────────

export interface AdminTeamMember {
  id: number; user_id: number; email?: string; full_name?: string; role: string; joined: string;
}
export interface AdminTeam {
  id: number; name: string; company_id: number; company_name?: string;
  owner_id: number; owner_email?: string; owner_name?: string;
  max_members: number; member_count: number; members: AdminTeamMember[]; created_at: string;
}
export interface AdminTeamStats { total_teams: number; total_members: number; avg_members: number; }

export const teamsApi = {
  list: () => api.get<{ data: AdminTeam[] }>('/admin/teams').then(r => r.data.data),
  create: (data: { name: string; company_id: number; owner_id: number; max_members?: number }) =>
    api.post<{ data: AdminTeam }>('/admin/teams', data).then(r => r.data.data),
  stats: () => api.get<{ data: AdminTeamStats }>('/admin/teams/stats').then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/teams/${id}`).then(r => r.data),
  removeMember: (teamId: number, memberId: number) =>
    api.delete(`/admin/teams/${teamId}/members/${memberId}`).then(r => r.data),
};

// ── Saved Searches ────────────────────────────────────────────────────────────

export interface AdminSavedSearch {
  id: number; user_id: number; user_email?: string; user_name?: string;
  name: string; filters: string; created_at: string;
}
export interface SavedSearchStats { total: number; total_users: number; avg_per_user: number; }

export const savedSearchesApi = {
  list: (userId?: number) =>
    api.get<{ data: AdminSavedSearch[] }>('/admin/saved-searches', { params: userId ? { user_id: userId } : {} }).then(r => r.data.data),
  stats: () => api.get<{ data: SavedSearchStats }>('/admin/saved-searches/stats').then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/saved-searches/${id}`).then(r => r.data),
};

// ── Win/Loss Journal ──────────────────────────────────────────────────────────

export interface TenderResultRead {
  id: number; tender_id: number; tender_title?: string; tender_source?: string;
  winner_name: string; winner_stir?: string; winning_amount?: number; currency: string;
  contract_number?: string; notes?: string; created_at: string;
}
export interface WinLossStats {
  total_results: number; total_won_amount: number; avg_winning_amount: number;
  by_source: { source: string; count: number }[];
}

export const winLossApi = {
  list: (limit?: number) =>
    api.get<{ data: TenderResultRead[] }>('/admin/win-loss', { params: limit ? { limit } : {} }).then(r => r.data.data),
  stats: () => api.get<{ data: WinLossStats }>('/admin/win-loss/stats').then(r => r.data.data),
};

// ── Pipeline ──────────────────────────────────────────────────────────────────

export interface PipelineApp {
  id: number; user_id: number; user_email?: string; tender_id: number; tender_title?: string;
  tender_amount?: number; stage: string; priority: string; bid_amount?: number;
  win_probability?: number; result?: string; created_at: string;
}
export interface PipelineStats {
  total: number; by_stage: Record<string, number>; total_bid_amount: number;
  won_count: number; lost_count: number;
}

export const pipelineApi = {
  list: (stage?: string) =>
    api.get<{ data: PipelineApp[] }>('/admin/pipeline', { params: stage ? { stage } : {} }).then(r => r.data.data),
  stats: () => api.get<{ data: PipelineStats }>('/admin/pipeline/stats').then(r => r.data.data),
  kanban: () =>
    api.get<{ data: Record<string, PipelineApp[]> }>('/admin/pipeline/kanban').then(r => r.data.data),
};

// ── Tender Matches ────────────────────────────────────────────────────────────

export interface AdminTenderMatch {
  id: number; tender_id: number; tender_title?: string; tender_source?: string;
  company_id: number; company_name?: string; score: number; text_score?: number;
  category_score?: number; region_score?: number; amount_score?: number;
  is_notified: boolean; is_saved: boolean; created_at: string;
}
export interface TenderMatchStats {
  total_matches: number; notified: number; saved: number; avg_score: number; high_score_count: number;
}

export const tenderMatchesApi = {
  list: (params?: { min_score?: number; is_saved?: boolean }) =>
    api.get<{ data: AdminTenderMatch[] }>('/admin/tender-matches', { params }).then(r => r.data.data),
  stats: () => api.get<{ data: TenderMatchStats }>('/admin/tender-matches/stats').then(r => r.data.data),
};

// ── Documents ─────────────────────────────────────────────────────────────────

export interface DocCheckItem { name: string; status: string; detail?: string }
export interface AdminDocumentCheck {
  id: number; user_id?: number; filename: string; file_type?: string; file_size_kb?: number;
  tender_name?: string; compliance_score: number; issues_count: number;
  checklist: DocCheckItem[]; missing_items: string[]; status: string; created_at: string;
}
export interface DocumentStats { total_checks: number; avg_compliance: number; total_issues: number; full_compliance: number; }

export const documentsApi = {
  list: (limit?: number) =>
    api.get<{ data: AdminDocumentCheck[] }>('/admin/documents', { params: limit ? { limit } : {} }).then(r => r.data.data),
  stats: () => api.get<{ data: DocumentStats }>('/admin/documents/stats').then(r => r.data.data),
  check: (file: globalThis.File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ data: AdminDocumentCheck }>('/admin/documents/check', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data);
  },
  download: async (id: number, filename: string) => {
    const resp = await api.get(`/admin/documents/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
  create: (data: Omit<AdminDocumentCheck, 'id' | 'status' | 'created_at'>) =>
    api.post<{ data: AdminDocumentCheck }>('/admin/documents', data).then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/documents/${id}`).then(r => r.data),
};

// ── API Keys ──────────────────────────────────────────────────────────────────

export interface AdminAPIKey {
  id: number; user_id: number; user_email?: string; name: string; key_prefix: string;
  scopes: string[]; last_used_at?: string; expires_at?: string; is_active: boolean; created_at: string;
}
export interface AdminAPIKeyCreated extends AdminAPIKey { full_key: string }

export const apiKeysApi = {
  list: () => api.get<{ data: AdminAPIKey[] }>('/admin/api-keys').then(r => r.data.data),
  create: (data: { user_id: number; name: string; scopes: string[]; expires_at?: string }) =>
    api.post<{ data: AdminAPIKeyCreated; message?: string }>('/admin/api-keys', data).then(r => r.data),
  toggle: (id: number) => api.patch<{ data: AdminAPIKey }>(`/admin/api-keys/${id}/toggle`).then(r => r.data.data),
  delete: (id: number) => api.delete(`/admin/api-keys/${id}`).then(r => r.data),
};

// ── Promo Codes ───────────────────────────────────────────────────────────────

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  plan: string;
  max_uses: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeStats {
  total: number;
  active: number;
  expired: number;
  exhausted: number;
  total_uses: number;
}

export const promoCodesApi = {
  list: (params?: { status?: string; plan?: string }) =>
    api.get<{ data: PromoCode[] }>('/admin/promo-codes', { params }).then(r => r.data.data),
  stats: () =>
    api.get<{ data: PromoCodeStats }>('/admin/promo-codes/stats').then(r => r.data.data),
  create: (data: { code: string; discount_type: string; discount_value: number; plan: string; max_uses: number; expires_at?: string; description?: string }) =>
    api.post<{ data: PromoCode }>('/admin/promo-codes', data).then(r => r.data.data),
  toggle: (id: number) =>
    api.patch<{ data: PromoCode }>(`/admin/promo-codes/${id}/toggle`).then(r => r.data.data),
  delete: (id: number) =>
    api.delete(`/admin/promo-codes/${id}`).then(r => r.data),
};

// ── API Endpoints ─────────────────────────────────────────────────────────────

export interface APIRoute {
  path: string;
  methods: string[];
  name: string;
  tags: string[];
  requires_auth: boolean;
}

export interface APIAuditStat { action: string; count: number }

export interface APIOverviewStats {
  total_routes: number;
  total_audit_entries: number;
  top_actions: APIAuditStat[];
  by_resource: { resource: string; count: number }[];
}

export interface APIPermissionRule {
  id: number;
  path: string;
  method: string;
  is_enabled: boolean;
  allowed_roles: string[] | null;
  blocked_user_ids: number[] | null;
  rate_limit: number | null;
  rate_window: number;
  description: string | null;
}

export const apiEndpointsApi = {
  routes: () => api.get<{ data: APIRoute[] }>('/admin/api-endpoints/routes').then(r => r.data.data),
  stats: () => api.get<{ data: APIOverviewStats }>('/admin/api-endpoints/stats').then(r => r.data.data),
  permissions: () => api.get<{ data: APIPermissionRule[] }>('/admin/api-endpoints/permissions').then(r => r.data.data),
  createPermission: (data: Omit<APIPermissionRule, 'id'>) => api.post<{ data: APIPermissionRule }>('/admin/api-endpoints/permissions', data).then(r => r.data.data),
  updatePermission: (id: number, data: Partial<APIPermissionRule>) => api.patch<{ data: APIPermissionRule }>(`/admin/api-endpoints/permissions/${id}`, data).then(r => r.data.data),
  deletePermission: (id: number) => api.delete(`/admin/api-endpoints/permissions/${id}`),
  togglePermission: (id: number) => api.post<{ data: APIPermissionRule }>(`/admin/api-endpoints/permissions/toggle/${id}`).then(r => r.data.data),
};

// ── AI Models ─────────────────────────────────────────────────────────────────

export interface AIStats {
  total_predictions: number;
  predictions_with_ml: number;
  total_matches: number;
  avg_match_score: number;
  tenders_with_amount: number;
}

export interface AIPredictionItem {
  id: number;
  user_id: number;
  user_email?: string;
  tender_id: number;
  tender_title?: string;
  amount: number;
  predicted_amount?: number;
  confidence?: number;
  status: string;
  created_at: string;
}

export interface AIDailyUsage { day: string; count: number }
export interface AITopUser { user_id: number; email: string; count: number }

export interface AIPriceEstimate {
  category: string;
  region: string;
  amount_min_mln: number;
  amount_max_mln: number;
  confidence: number;
  sample_count: number;
  avg_tender_amount_mln?: number;
}

export const aiModelsApi = {
  stats: () => api.get<{ data: AIStats }>('/admin/ai-models/stats').then(r => r.data.data),
  predictions: (status?: string) =>
    api.get<{ data: AIPredictionItem[] }>('/admin/ai-models/predictions', { params: status ? { status } : {} }).then(r => r.data.data),
  dailyUsage: (days = 7) =>
    api.get<{ data: AIDailyUsage[] }>(`/admin/ai-models/usage/daily?days=${days}`).then(r => r.data.data),
  topUsers: () =>
    api.get<{ data: AITopUser[] }>('/admin/ai-models/usage/top-users').then(r => r.data.data),
  predictPrice: (body: { category: string; region: string; amount_min_mln: number; amount_max_mln: number }) =>
    api.post<{ data: AIPriceEstimate }>('/admin/ai-models/predict/price', body).then(r => r.data.data),
};

// ── Email Templates ───────────────────────────────────────────────────────────

export interface AdminEmailTemplate {
  id: number;
  slug: string;
  name: string;
  subject: string;
  body: string;
  description?: string;
  category: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const emailTemplatesApi = {
  list: (category?: string) =>
    api.get<{ data: AdminEmailTemplate[] }>('/admin/email-templates', { params: category ? { category } : {} }).then(r => r.data.data),
  stats: () =>
    api.get<{ data: Record<string, number> }>('/admin/email-templates/stats').then(r => r.data.data),
  get: (slug: string) =>
    api.get<{ data: AdminEmailTemplate }>(`/admin/email-templates/${slug}`).then(r => r.data.data),
  update: (slug: string, data: { subject?: string; body?: string; description?: string; is_active?: boolean }) =>
    api.patch<{ data: AdminEmailTemplate }>(`/admin/email-templates/${slug}`, data).then(r => r.data.data),
};

// ── Integrations ──────────────────────────────────────────────────────────────

export interface CeleryStats {
  workers: number;
  active_tasks: number;
  reserved_tasks: number;
  scheduled_tasks: number;
  worker_names: string[];
}

export interface BeatTask {
  name: string;
  task: string;
  schedule: string;
  description: string;
  enabled: boolean;
}

export interface TriggerResponse {
  task_name: string;
  task_id: string;
  status: string;
}

export interface ScraperStatus {
  name: string;
  task_name: string;
  status: string;
  last_result?: { source: string; new_tenders: number } | null;
}

export interface MLModelInfo {
  name: string;
  task_name: string;
  status: string;
}

export interface BotInfo {
  username: string;
  registered_users: number;
  active_groups: number;
  webhook_url: string;
  token_masked: string;
}

export interface ConnectionTestResult {
  service: string;
  status: string;
  latency_ms?: number | null;
  detail?: string | null;
}

export const integrationsApi = {
  // Celery
  celeryStats: () =>
    api.get<{ data: CeleryStats }>('/admin/integrations/celery/stats').then(r => r.data.data),
  celerySchedule: () =>
    api.get<{ data: BeatTask[] }>('/admin/integrations/celery/schedule').then(r => r.data.data),
  triggerTask: (taskName: string) =>
    api.post<{ data: TriggerResponse }>(`/admin/integrations/celery/trigger/${encodeURIComponent(taskName)}`).then(r => r.data.data),

  // Scrapers
  scrapers: () =>
    api.get<{ data: ScraperStatus[] }>('/admin/integrations/scrapers').then(r => r.data.data),
  runScraper: (name: string) =>
    api.post<{ data: TriggerResponse }>(`/admin/integrations/scrapers/${name}/run`).then(r => r.data.data),

  // ML
  mlModels: () =>
    api.get<{ data: MLModelInfo[] }>('/admin/integrations/ml/models').then(r => r.data.data),
  retrainModel: (name: string) =>
    api.post<{ data: TriggerResponse }>(`/admin/integrations/ml/retrain/${encodeURIComponent(name)}`).then(r => r.data.data),

  // Telegram bot
  botInfo: () =>
    api.get<{ data: BotInfo }>('/admin/integrations/bot/info').then(r => r.data.data),
  botBroadcast: (message: string) =>
    api.post<{ data: { sent: number; failed: number; total: number } }>('/admin/integrations/bot/broadcast', { message }).then(r => r.data.data),

  // Connection tests
  testConnection: (service: string) =>
    api.post<{ data: ConnectionTestResult }>('/admin/integrations/connections/test', { service }).then(r => r.data.data),
};

// ── Settings ──────────────────────────────────────────────────────────────────

export const settingsApi = {
  getFlags: () => api.get<{ data: Record<string, boolean> }>('/admin/settings/flags').then(r => r.data.data),
  setFlag: (name: string, value: boolean) => api.patch(`/admin/settings/flags/${name}`, { value }).then(r => r.data),
  getConfig: () => api.get<{ data: Record<string, unknown> }>('/admin/settings/config').then(r => r.data.data),
  setConfig: (key: string, value: unknown) => api.patch(`/admin/settings/config/${key}`, { value }).then(r => r.data),
};

// ── Infrastructure ────────────────────────────────────────────────────────────

export interface DBTableStat { name: string; row_count: number; size_pretty: string; size_bytes: number }
export interface DBOverview { db_name: string; total_size_pretty: string; table_count: number; tables: DBTableStat[] }
export interface DBTablePreview { columns: string[]; rows: string[][]; table?: string; error?: string }

export interface SQLResult { columns: string[]; rows: string[][]; count: number }

export const infrastructureApi = {
  dbStats: () => api.get<{ data: DBOverview }>('/admin/infrastructure/db-stats').then(r => r.data.data),
  tablePreview: (table: string, limit = 10) =>
    api.get<{ data: DBTablePreview }>(`/admin/infrastructure/table/${table}`, { params: { limit } }).then(r => r.data.data),
  exportTableUrl: (table: string) =>
    `${api.defaults.baseURL || ''}/admin/infrastructure/export/${table}?token=${localStorage.getItem('tiq_admin_access') || ''}`,
  exportAllUrl: () =>
    `${api.defaults.baseURL || ''}/admin/infrastructure/export-all?token=${localStorage.getItem('tiq_admin_access') || ''}`,
  runQuery: (sql: string) =>
    api.post<{ data: SQLResult }>('/admin/infrastructure/query', { sql }).then(r => r.data.data),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportRow { label: string; value: number }
export interface ReportData {
  period: string; total_tenders: number; total_users: number; total_revenue: number;
  new_users: ReportRow[]; tender_by_source: ReportRow[]; revenue_by_plan: ReportRow[];
}

export const reportsApi = {
  generate: (type: string, from: string, to: string) =>
    api.get<{ data: ReportData }>('/admin/analytics/report', { params: { type, from, to } }).then(r => r.data.data),
  tendersByRegion: () =>
    api.get<{ data: ReportRow[] }>('/admin/tenders/stats/by-region').then(r => r.data.data),
  tendersByDate: (days = 30) =>
    api.get<{ data: ReportRow[] }>('/admin/tenders/stats/by-deadline', { params: { days } }).then(r => r.data.data),
};

// ── Tenders (extra) ───────────────────────────────────────────────────────────

export interface TenderDetail {
  id: number; title: string; description?: string; source: string; status: string;
  amount?: number; currency?: string; region?: string; deadline?: string; created_at: string;
}

export const tenderDetailApi = {
  byId: (id: number) => api.get<{ data: TenderDetail }>(`/admin/tenders/${id}`).then(r => r.data.data),
  search: (q: string, limit = 20) =>
    api.get<{ data: TenderDetail[] }>('/admin/tenders', { params: { search: q, page_size: limit } }).then(r => r.data.data),
  byRegion: () =>
    api.get<{ data: Array<{ region: string; count: number }> }>('/admin/tenders/stats/by-region').then(r => r.data.data),
  byDeadline: (days = 30) =>
    api.get<{ data: Array<{ date: string; count: number }> }>('/admin/tenders/stats/by-deadline', { params: { days } }).then(r => r.data.data),
};

// ── Price Strategy ────────────────────────────────────────────────────────────

export interface CategoryAmountStat { name: string; avg: number; min_val: number; max_val: number; count: number }
export interface RegionAmountStat { name: string; avg: number; count: number }
export interface BidHistoryItem { id: number; tender_id: number; tender_title: string; bid_amount?: number; status: string; created_at: string }
export interface PriceStrategyData { by_category: CategoryAmountStat[]; by_region: RegionAmountStat[]; bid_history: BidHistoryItem[] }

export const priceStrategyApi = {
  data: () => api.get<{ data: PriceStrategyData }>('/admin/ai-models/price-strategy').then(r => r.data.data),
};

// ── Competitors ───────────────────────────────────────────────────────────────

export interface CompetitorStat { name: string; stir?: string; wins: number; total_amount: number; avg_amount: number; last_win?: string }
export interface CompetitorOverview {
  total_companies: number; total_tenders: number; avg_amount: number;
  top: CompetitorStat[]; by_category: Array<{ name: string; count: number }>;
}

export const competitorsApi = {
  overview: (limit = 20) =>
    api.get<{ data: CompetitorOverview }>('/admin/competitors/overview', { params: { limit } }).then(r => r.data.data),
};

// ── WebSocket Monitor (Activity) ──────────────────────────────────────────────

export interface ActivityEvent { id: number; action: string; resource_type: string; resource_id?: number; user_id?: number; user_email?: string; details?: string; ip_address?: string; user_agent?: string; created_at: string }
export interface WSActivity { recent_actions: number; unique_users: number; events: ActivityEvent[]; channels: Record<string, number> }

export const wsMonitorApi = {
  activity: (limit = 20) =>
    api.get<{ data: WSActivity }>('/admin/health/activity', { params: { limit } }).then(r => r.data.data),
};

// ── Container Logs ──────────────────────────────────────────────────────────

export interface ContainerInfo {
  name: string;
  status: string;
  image: string;
  ports: string;
  created: string;
  health: string;
}

export interface ContainerLogs {
  container: string;
  lines: string[];
  count: number;
}

export interface LogArchiveItem {
  id: number;
  container: string;
  log_date: string;
  line_count: number;
  file_size: number;
  level_stats: { ERROR: number; WARNING: number; INFO: number; DEBUG: number; OTHER: number } | null;
}

export interface ArchiveDateSummary {
  log_date: string;
  containers: number;
  total_lines: number;
  total_size: number;
  error_count: number;
}

export interface ArchiveViewData {
  container: string;
  log_date: string;
  total_lines: number;
  offset: number;
  limit: number;
  lines: string[];
}

export const containerLogsApi = {
  containers: () =>
    api.get<{ data: ContainerInfo[] }>('/containers/containers').then(r => r.data.data),
  logs: (container: string, tail = 200) =>
    api.get<{ data: ContainerLogs }>(`/containers/logs/${container}`, { params: { tail } }).then(r => r.data.data),
  streamUrl: (container: string, tail = 50) => {
    const base = api.defaults.baseURL || '';
    const token = localStorage.getItem('tiq_admin_access') || '';
    return `${base}/containers/logs/${container}/stream?tail=${tail}&token=${token}`;
  },
  archives: (params?: { container?: string; date_from?: string; date_to?: string }) =>
    api.get<{ data: { archives: LogArchiveItem[]; dates: ArchiveDateSummary[] } }>('/containers/archives', { params }).then(r => r.data.data),
  viewArchive: (id: number, params?: { offset?: number; limit?: number; search?: string; level?: string }) =>
    api.get<{ data: ArchiveViewData }>(`/containers/archives/${id}/view`, { params }).then(r => r.data.data),
  downloadArchive: (id: number) =>
    `${api.defaults.baseURL || ''}/containers/archives/${id}/download?token=${localStorage.getItem('tiq_admin_access') || ''}`,
  triggerArchive: (targetDate?: string) =>
    api.post<{ data: { task_id: string; status: string } }>('/containers/archives/collect', null, { params: { target_date: targetDate } }).then(r => r.data.data),
};
