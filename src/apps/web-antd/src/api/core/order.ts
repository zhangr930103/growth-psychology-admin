import { requestClient } from '#/api/request';

/**
 * 咨询订单列表查询参数类型
 */
export interface ConsultationOrderListParams {
  page: number;
  size: number;
  order_code?: string;
  consultant?: string;
  status?: string;
  create_start_time?: number;
  create_end_time?: number;
}

/**
 * 咨询订单数据类型
 */
export interface ConsultationOrderData {
  id: number;
  order_code: string;
  consultant: string;
  appointment_time: string;
  consultation_method: 'online' | 'offline' | 'phone';
  consultation_address: string;
  situation: string;
  customer: string;
  customer_id: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  create_time: number;
}

/**
 * 咨询订单列表响应类型
 */
export interface ConsultationOrderListResponse {
  list: ConsultationOrderData[];
  total: number;
}

/**
 * 获取咨询订单列表
 */
export async function getConsultationOrderListApi(
  params: ConsultationOrderListParams
): Promise<ConsultationOrderListResponse> {
  return requestClient.post<ConsultationOrderListResponse>('/orders/consultation/list', params);
}

/**
 * 团队活动订单列表查询参数类型
 */
export interface ActivityOrderListParams {
  page: number;
  size: number;
  order_code?: string;
  activity_name?: string;
  status?: string;
  create_start_time?: number;
  create_end_time?: number;
}

/**
 * 团队活动订单数据类型
 */
export interface ActivityOrderData {
  id: number;
  order_code: string;
  activity_name: string;
  activity_time: string; // ISO 字符串格式
  activity_method: 'online' | 'offline' | 'hybrid';
  activity_address?: string;
  registrant: string;
  registrant_id: number;
  status: 'waiting' | 'formed' | 'completed' | 'cancelled';
  created_at: string; // ISO 字符串格式
  updated_at: string; // ISO 字符串格式
  registration_time: number; // 时间戳
  create_time: number; // 时间戳
  evaluations?: EvaluationItem[]; // 评价数据
}

/**
 * 团队活动订单列表响应类型
 */
export interface ActivityOrderListResponse {
  code: number;
  message: string;
  rid: string;
  data: {
    list: ActivityOrderData[];
    total: number;
  };
}

/**
 * 获取团队活动订单列表
 */
export async function getActivityOrderListApi(
  params: ActivityOrderListParams
): Promise<ActivityOrderListResponse> {
  return requestClient.post<ActivityOrderListResponse>('/orders/activity/list', params);
}

/**
 * 评价项目数据类型
 */
export interface EvaluationItem {
  title: string;
  content: string;
  rating: number;
}

/**
 * 咨询订单详情数据类型
 */
export interface ConsultationOrderDetailData {
  id: number;
  order_code: string;
  consultant: string;
  appointment_time: string; // ISO 字符串格式
  consultation_method: 'online' | 'offline' | 'phone';
  consultation_address: string;
  situation: string;
  customer: string;
  customer_id: number | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string; // ISO 字符串格式
  updated_at: string; // ISO 字符串格式
  create_time: number; // 时间戳
  evaluations?: EvaluationItem[]; // 评价数据
}

/**
 * 获取咨询订单详情
 */
export async function getConsultationOrderDetailApi(
  orderId: string | number
): Promise<ConsultationOrderDetailData> {
  return requestClient.get<ConsultationOrderDetailData>(`/orders/consultation/${orderId}`);
}

/**
 * 获取团队活动订单详情
 */
export async function getActivityOrderDetailApi(
  orderId: string | number
): Promise<ActivityOrderData> {
  return requestClient.get<ActivityOrderData>(`/orders/activity/${orderId}`);
}
