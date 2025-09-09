import { requestClient } from '#/api/request';

/**
 * 意见反馈列表参数类型
 */
export interface FeedbackListParams {
  page: number;
  size: number;
}

/**
 * 意见反馈项数据类型
 */
export interface FeedbackItem {
  title: string;
  content: string;
  image: string;
  id: number;
  feedback_user: string;
  feedback_user_id: number;
  created_at: string;
  updated_at: string;
  feedback_time: number;
}

/**
 * 意见反馈列表响应类型
 */
export interface FeedbackListResponse {
  list: FeedbackItem[];
  total: number;
}

/**
 * 获取意见反馈列表
 */
export async function getFeedbackListApi(params: FeedbackListParams): Promise<FeedbackListResponse> {
  return requestClient.post<FeedbackListResponse>('/feedback/list', params);
}
