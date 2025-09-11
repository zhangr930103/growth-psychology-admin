import { requestClient } from '#/api/request';

/**
 * 活动列表查询参数类型
 */
export interface ActivityListParams {
  page: number;
  size: number;
  activity_name?: string;
  creator?: string;
  is_enabled?: boolean;
  create_start_time?: number;
  create_end_time?: number;
}

/**
 * 活动数据类型
 */
export interface ActivityData {
  id: number;
  activity_name: string;
  activity_content: string;
  instructor: string;
  activity_time: string;
  registration_deadline: string;
  duration: number;
  min_participants: number;
  max_registrations: number;
  is_enabled: boolean;
  creator_name: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  create_time: number;
  update_time: number;
}

/**
 * 活动列表响应类型
 */
export interface ActivityListResponse {
  list: ActivityData[];
  total: number;
}

/**
 * 创建活动参数类型
 */
export interface CreateActivityParams {
  activity_name: string;
  activity_content: string;
  instructor: string;
  activity_time: string;
  registration_deadline: string;
  duration: number;
  min_participants: number;
  max_registrations: number;
  is_enabled: boolean;
}

/**
 * 更新活动参数类型
 */
export interface UpdateActivityParams extends CreateActivityParams {
  id: number;
}

/**
 * 活动操作响应类型
 */
export interface ActivityOperationResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 获取活动列表
 */
export async function getActivityListApi(params: ActivityListParams): Promise<ActivityListResponse> {
  return requestClient.post<ActivityListResponse>('/activities/list', params);
}

/**
 * 创建活动
 */
export async function createActivityApi(params: CreateActivityParams): Promise<ActivityOperationResponse> {
  return requestClient.post<ActivityOperationResponse>('/activities/create', params);
}

/**
 * 更新活动
 */
export async function updateActivityApi(params: UpdateActivityParams): Promise<ActivityOperationResponse> {
  return requestClient.post<ActivityOperationResponse>('/activities/edit', params);
}

/**
 * 启用活动
 */
export async function enableActivityApi(id: number): Promise<ActivityOperationResponse> {
  return requestClient.post<ActivityOperationResponse>('/activities/enable', {}, {
    params: { id }
  });
}

/**
 * 禁用活动
 */
export async function disableActivityApi(id: number): Promise<ActivityOperationResponse> {
  return requestClient.post<ActivityOperationResponse>('/activities/disable', {}, {
    params: { id }
  });
}

/**
 * 删除活动
 */
export async function deleteActivityApi(id: number): Promise<ActivityOperationResponse> {
  return requestClient.post<ActivityOperationResponse>('/activities/delete', { id });
}
