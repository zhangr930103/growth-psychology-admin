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
 * 禁用用户参数类型
 */
export interface DisableUserParams {
  user_id: number;
}

/**
 * 禁用用户响应类型
 */
export interface DisableUserResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 启用用户参数类型
 */
export interface EnableUserParams {
  user_id: number;
}

/**
 * 启用用户响应类型
 */
export interface EnableUserResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 导出用户列表参数类型
 */
export interface ExportUserParams {
  username?: string;
  company_name?: string;
  register_start_time?: number;
  register_end_time?: number;
}

/**
 * 导出用户列表响应类型（数据直接在根级别）
 */
export interface ExportUserResponse {
  code: number;
  message: string;
  rid: string;
  download_url: string;
  filename: string;
  file_size: number;
  export_time: string;
}

/**
 * 获取用户列表
 */
export async function getUserListApi(params: UserListParams): Promise<UserListResponse> {
  return requestClient.post<UserListResponse>('/users/list', params);
}

/**
 * 禁用用户
 */
export async function disableUserApi(params: DisableUserParams): Promise<DisableUserResponse> {
  return requestClient.post<DisableUserResponse>('/users/disable', {}, {
    params: { user_id: params.user_id }
  });
}

/**
 * 启用用户
 */
export async function enableUserApi(params: EnableUserParams): Promise<EnableUserResponse> {
  return requestClient.post<EnableUserResponse>('/users/enable', {}, {
    params: { user_id: params.user_id }
  });
}

/**
 * 导出用户列表
 */
export async function exportUserListApi(params: ExportUserParams): Promise<ExportUserResponse> {
  return requestClient.post<ExportUserResponse>('/users/export', params);
}
