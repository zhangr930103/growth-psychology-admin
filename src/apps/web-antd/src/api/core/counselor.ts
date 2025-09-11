import { requestClient } from '#/api/request';

/**
 * 咨询师列表查询参数类型
 */
export interface CounselorListParams {
  page: number;
  size: number;
  counselor_name?: string;
  creator?: string;
  status?: string;
}

/**
 * 时间段数据结构
 */
export interface TimeSlot {
  day: number; // 0-6 (周日到周六)
  startHour: number; // 0-23
  endHour: number; // 0-23
  startMinute?: number; // 0-59
  endMinute?: number; // 0-59
}

/**
 * 咨询师数据类型
 */
export interface CounselorData {
  id: number;
  counselor_name: string;
  school: string;
  major: string;
  personal_intro: string;
  avatar: string;
  credentials: any[];
  consulting_price: string;
  consulting_method: string;
  specializations: string[];
  expertise_areas: string[];
  consulting_status: string;
  location: string;
  total_duration: string;
  settlement_price: string;
  settlement_weight: string;
  duration_proof: any[];
  available_time_slots: TimeSlot[];
  is_online: boolean;
  status: string;
  creator_name: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  create_time: number;
  update_time: number;
}

/**
 * 咨询师列表响应类型
 */
export interface CounselorListResponse {
  list: CounselorData[];
  total: number;
}

/**
 * 创建咨询师参数类型
 */
export interface CreateCounselorParams {
  counselor_name: string;
  school: string;
  major: string;
  personal_intro: string;
  avatar: string;
  credentials: any[];
  consulting_price: number;
  consulting_method: string;
  specializations: string[];
  expertise_areas: string[];
  consulting_status: string;
  location: string;
  total_duration: number;
  settlement_price: number;
  settlement_weight: number;
  duration_proof: any[];
  available_time_slots: TimeSlot[];
}

/**
 * 创建咨询师响应类型
 */
export interface CreateCounselorResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 编辑咨询师参数类型
 */
export interface EditCounselorParams {
  id: number;
  counselor_name: string;
  school: string;
  major: string;
  personal_intro: string;
  avatar: string;
  credentials: any[];
  consulting_price: number;
  consulting_method: string;
  specializations: string[];
  expertise_areas: string[];
  consulting_status: string;
  location: string;
  total_duration: number;
  settlement_price: number;
  settlement_weight: number;
  duration_proof: any[];
  available_time_slots: TimeSlot[];
}

/**
 * 编辑咨询师响应类型
 */
export interface EditCounselorResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 删除咨询师参数类型
 */
export interface DeleteCounselorParams {
  id: number;
}

/**
 * 删除咨询师响应类型
 */
export interface DeleteCounselorResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * API响应包装类型
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  rid: string;
  data: T;
}

/**
 * 获取咨询师列表
 */
export async function getCounselorListApi(params: CounselorListParams): Promise<CounselorListResponse> {
  return requestClient.post<CounselorListResponse>('/counselors/list', params);
}

/**
 * 创建咨询师
 */
export async function createCounselorApi(params: CreateCounselorParams): Promise<CreateCounselorResponse> {
  return requestClient.post<CreateCounselorResponse>('/counselors/create', params);
}

/**
 * 编辑咨询师
 */
export async function editCounselorApi(params: EditCounselorParams): Promise<EditCounselorResponse> {
  return requestClient.post<EditCounselorResponse>('/counselors/edit', params);
}

/**
 * 删除咨询师
 */
export async function deleteCounselorApi(params: DeleteCounselorParams): Promise<DeleteCounselorResponse> {
  return requestClient.post<DeleteCounselorResponse>('/counselors/delete', params);
}
