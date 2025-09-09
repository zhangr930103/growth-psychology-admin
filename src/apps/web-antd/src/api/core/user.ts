import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 用户列表查询参数类型
 */
export interface UserListParams {
  page: number;
  size: number;
  username?: string;
  company_name?: string;
  register_start_time?: number;
  register_end_time?: number;
}

/**
 * 用户数据类型
 */
export interface UserData {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  gender: string;
  job_number: string;
  department: string;
  email: string;
  invite_code: string;
  company_name: string;
  status: 'active' | 'inactive';
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  register_time: number;
}

/**
 * 用户列表响应类型
 */
export interface UserListResponse {
  list: UserData[];
  total: number;
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const response = await requestClient.post<any>('/admin/detail');
  
  // 映射API返回的字段到UserInfo类型
  return {
    ...response,
    userId: String(response.id), // 将API返回的id映射到userId，并转换为字符串
  };
}

/**
 * 获取用户列表
 */
export async function getUserListApi(params: UserListParams): Promise<UserListResponse> {
  return requestClient.post<UserListResponse>('/users/list', params);
}
