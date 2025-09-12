import { requestClient } from '#/api/request';

/**
 * 评价列表查询参数类型
 */
export interface EvaluationListParams {
  page: number;
  size: number;
  question?: string;
  status?: 'pending' | 'approved' | 'rejected';
  evaluator_name?: string;
  start_time?: number;
  end_time?: number;
}

/**
 * 评价记录数据类型
 */
export interface EvaluationRecord {
  type: 'counselor';
  target_id: number;
  target_name: string;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  suggestions: string;
  service_rating: number;
  professional_rating: number;
  attitude_rating: number;
  environment_rating: number;
  is_anonymous: boolean;
  id: number;
  evaluator_id: number;
  evaluator_name: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: number;
  reviewer_name: string;
  review_time: string;
  review_comment: string;
  helpful_count: number;
  unhelpful_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  replies: any[];
}

/**
 * 评价列表响应类型
 */
export interface EvaluationListResponse {
  list: EvaluationRecord[];
  total: number;
}

/**
 * 获取评价列表
 */
export async function getEvaluationListApi(params: EvaluationListParams): Promise<EvaluationListResponse> {
  return requestClient.post<EvaluationListResponse>('/evaluations/list', params);
}
