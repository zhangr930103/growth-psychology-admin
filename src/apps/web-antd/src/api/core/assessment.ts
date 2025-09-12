import { requestClient } from '#/api/request';

/**
 * 问卷列表查询参数类型
 */
export interface QuestionnaireListParams {
  page: number;
  size: number;
  title?: string;
  status?: 'draft' | 'published' | 'unpublished';
  creator?: string;
}

/**
 * 问卷数据类型
 */
export interface QuestionnaireData {
  title: string;
  description: string;
  is_anonymous: boolean;
  allow_multiple_submissions: boolean;
  start_time: string;
  end_time: string;
  id: number;
  status: 'draft' | 'published' | 'unpublished';
  creator_id: number;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

/**
 * 问卷列表响应类型
 */
export interface QuestionnaireListResponse {
  list: QuestionnaireData[];
  total: number;
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
 * 删除问卷参数类型
 */
export interface DeleteQuestionnaireParams {
  id: number;
}

/**
 * 获取问卷列表
 */
export async function getQuestionnaireListApi(params: QuestionnaireListParams): Promise<QuestionnaireListResponse> {
  return requestClient.post<QuestionnaireListResponse>('/questionnaires/list', params);
}

/**
 * 删除问卷
 */
export async function deleteQuestionnaireApi(params: DeleteQuestionnaireParams): Promise<void> {
  return requestClient.post<void>('/questionnaires/delete', params);
}
