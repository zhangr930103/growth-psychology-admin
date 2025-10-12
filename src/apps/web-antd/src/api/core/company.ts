import { requestClient } from '#/api/request';

/**
 * 公司列表查询参数类型
 */
export interface CompanyListParams {
  page: number;
  size: number;
  company_name?: string;
  creator?: string;
  create_start_time?: number;
  create_end_time?: number;
}

/**
 * 公司数据类型
 */
export interface CompanyData {
  id: number;
  company_name: string;
  notification_method: string;
  banner: string;
  recharge_amount: string;
  balance: string;
  creator: string;
  creator_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  create_time: number;
  consultation_address?: string;
}

/**
 * 公司列表响应类型
 */
export interface CompanyListResponse {
  list: CompanyData[];
  total: number;
}

/**
 * 创建公司参数类型
 */
export interface CreateCompanyParams {
  company_name: string;
  notification_method?: string;
  banner?: string;
  recharge_amount?: number;
  consultation_address?: string;
}

/**
 * 创建公司响应类型
 */
export interface CreateCompanyResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 编辑公司参数类型
 */
export interface UpdateCompanyParams {
  id: number;
  company_name: string;
  notification_method?: string;
  banner?: string;
  consultation_address?: string;
}

/**
 * 编辑公司响应类型
 */
export interface UpdateCompanyResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 充值记录查询参数类型
 */
export interface RechargeListParams {
  page: number;
  size: number;
  company_id: number;
}

/**
 * 充值记录数据类型
 */
export interface RechargeRecord {
  id: number;
  company_id: number;
  company_name: string;
  recharge_amount: string;
  recharge_time: number;
  operator: string;
  operator_id: number;
  status: 'success' | 'pending' | 'failed';
  remark: string;
  certificate: string;
  created_at: string;
}

/**
 * 充值记录列表响应类型
 */
export interface RechargeListResponse {
  list: RechargeRecord[];
  total: number;
}

/**
 * 新增充值记录参数类型
 */
export interface CreateRechargeParams {
  recharge_amount: number;
  certificate: string;
  company_id: number;
}

/**
 * 新增充值记录响应类型
 */
export interface CreateRechargeResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 获取公司列表
 */
export async function getCompanyListApi(params: CompanyListParams): Promise<CompanyListResponse> {
  return requestClient.post<CompanyListResponse>('/companies/list', params);
}

/**
 * 创建公司
 */
export async function createCompanyApi(params: CreateCompanyParams): Promise<CreateCompanyResponse> {
  return requestClient.post<CreateCompanyResponse>('/companies/create', params);
}

/**
 * 更新公司
 */
export async function updateCompanyApi(params: UpdateCompanyParams): Promise<UpdateCompanyResponse> {
  return requestClient.post<UpdateCompanyResponse>('/companies/edit', params);
}

/**
 * 删除公司
 */
export async function deleteCompanyApi(id: number) {
  return requestClient.post('/companies/delete', { id });
}

/**
 * 获取充值记录列表
 */
export async function getRechargeListApi(params: RechargeListParams): Promise<RechargeListResponse> {
  return requestClient.post<RechargeListResponse>('/companies/recharge/list', params);
}

/**
 * 新增充值记录
 */
export async function createRechargeApi(params: CreateRechargeParams): Promise<CreateRechargeResponse> {
  return requestClient.post<CreateRechargeResponse>('/companies/recharge/create', params);
}
