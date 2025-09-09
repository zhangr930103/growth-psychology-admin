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
