import { requestClient } from '#/api/request';

/**
 * FAQ列表查询参数类型
 */
export interface FaqListParams {
  page: number;
  size: number;
  question?: string;
  category?: string;
  status?: string;
  is_featured?: boolean;
  keyword?: string;
}

/**
 * FAQ数据类型
 */
export interface FaqData {
  id: number;
  question: string;
  answer: string;
  category: string;
  status: string;
  order_index: number;
  is_featured: boolean;
  tags: string;
  keywords: string;
  view_count: number;
  creator_id: number;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

/**
 * FAQ列表响应类型
 */
export interface FaqListResponse {
  list: FaqData[];
  total: number;
}

/**
 * FAQ API响应包装类型
 */
export interface FaqApiResponse<T> {
  code: number;
  message: string;
  rid: string;
  data: T;
}

/**
 * 创建FAQ参数类型
 */
export interface CreateFaqParams {
  question: string;
  answer: string;
  category?: string;
  status?: string;
  order_index?: number;
  is_featured?: boolean;
  tags?: string;
  keywords?: string;
}

/**
 * 更新FAQ参数类型
 */
export interface UpdateFaqParams extends CreateFaqParams {
  id: number;
}

/**
 * FAQ操作响应类型
 */
export interface FaqOperationResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 获取FAQ列表
 */
export async function getFaqListApi(params: FaqListParams): Promise<FaqListResponse> {
  const response = await requestClient.post<FaqApiResponse<FaqListResponse>>('/faqs/list', params);
  return response.data;
}

/**
 * 创建FAQ
 */
export async function createFaqApi(params: CreateFaqParams): Promise<FaqOperationResponse> {
  return requestClient.post<FaqOperationResponse>('/faqs/create', params);
}

/**
 * 更新FAQ
 */
export async function updateFaqApi(params: UpdateFaqParams): Promise<FaqOperationResponse> {
  return requestClient.post<FaqOperationResponse>('/faqs/edit', params);
}

/**
 * 切换FAQ状态参数类型
 */
export interface ToggleFaqStatusParams {
  id: number;
  status: string;
}

/**
 * 切换FAQ状态（启用/禁用）
 */
export async function toggleFaqStatusApi(params: ToggleFaqStatusParams): Promise<FaqOperationResponse> {
  return requestClient.post<FaqOperationResponse>('/faqs/toggle-status', params);
}

/**
 * 删除FAQ
 */
export async function deleteFaqApi(id: number): Promise<FaqOperationResponse> {
  return requestClient.post<FaqOperationResponse>('/faqs/delete', { id });
}
