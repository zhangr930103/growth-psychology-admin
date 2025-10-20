import { requestClient } from '#/api/request';

/**
 * 问卷列表查询参数类型
 */
export interface QuestionnaireListParams {
  page: number;
  size: number;
  title?: string;
  status?: 'published' | 'unpublished';
  creator?: string;
  create_start_time?: number;
  create_end_time?: number;
}

/**
 * 问卷数据类型
 */
export interface QuestionnaireData {
  id: number;
  title: string;
  description: string;
  notice: string; // 测评须知
  category: string; // 问卷分类
  status: 'published' | 'unpublished';
  is_anonymous: boolean;
  allow_multiple_submissions: boolean;
  start_time: string;
  end_time: string;
  survey_url: string; // 问卷星地址
  creator_id: number;
  creator_name: string;
  created_at: string;
  updated_at?: string;
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
 * 创建问卷参数类型
 */
export interface CreateQuestionnaireParams {
  title: string;
  description: string;
  status: 'published' | 'unpublished';
  category?: string; // 问卷分类
  survey_url?: string; // 问卷星地址
  notice?: string; // 测评须知
}

/**
 * 编辑问卷参数类型
 */
export interface EditQuestionnaireParams extends CreateQuestionnaireParams {
  id: number;
}

/**
 * 切换问卷状态参数类型
 */
export interface ToggleQuestionnaireStatusParams {
  id: number;
}

/**
 * 问卷回答列表查询参数类型
 */
export interface QuestionnaireResponsesListParams {
  page: number;
  size: number;
  questionnaire_id: number;
  respondent_name?: string;
  start_time?: number;
  end_time?: number;
}

/**
 * 问卷答案类型
 */
export interface QuestionnaireAnswer {
  id: number;
  response_id: number;
  question_id: number;
  answer_text?: string;
  answer_options?: string[];
  answer_rating?: number;
  created_at: string;
}

/**
 * 问卷回答记录类型
 */
export interface QuestionnaireResponse {
  id: number;
  questionnaire_id: number;
  respondent_id?: number;
  respondent_name: string;
  ip_address: string;
  created_at: string;
  survey_url: string; // 问卷星URL
  average_score: number; // 平均评分
  answers: QuestionnaireAnswer[];
}

/**
 * 问卷回答列表响应类型
 */
export interface QuestionnaireResponsesListResponse {
  list: QuestionnaireResponse[];
  total: number;
}

/**
 * 获取问卷列表
 */
export async function getQuestionnaireListApi(params: QuestionnaireListParams): Promise<QuestionnaireListResponse> {
  return requestClient.post<QuestionnaireListResponse>('/questionnaires/list', params);
}

/**
 * 创建问卷
 */
export async function createQuestionnaireApi(params: CreateQuestionnaireParams): Promise<void> {
  return requestClient.post<void>('/questionnaires/create', params);
}

/**
 * 编辑问卷
 */
export async function editQuestionnaireApi(params: EditQuestionnaireParams): Promise<void> {
  return requestClient.post<void>('/questionnaires/edit', params);
}

/**
 * 删除问卷
 */
export async function deleteQuestionnaireApi(params: DeleteQuestionnaireParams): Promise<void> {
  return requestClient.post<void>('/questionnaires/delete', params);
}

/**
 * 切换问卷状态
 */
export async function toggleQuestionnaireStatusApi(params: ToggleQuestionnaireStatusParams): Promise<void> {
  return requestClient.post<void>('/questionnaires/toggle-status', params);
}

/**
 * 获取问卷回答列表
 */
export async function getQuestionnaireResponsesApi(questionnaireId: number, params: Omit<QuestionnaireResponsesListParams, 'questionnaire_id'>): Promise<QuestionnaireResponsesListResponse> {
  return requestClient.post<QuestionnaireResponsesListResponse>(`/questionnaires/${questionnaireId}/responses`, {
    ...params,
    questionnaire_id: questionnaireId,
  });
}
