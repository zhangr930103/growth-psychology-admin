import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';
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
