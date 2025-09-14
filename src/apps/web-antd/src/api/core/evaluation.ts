import { requestClient } from '#/api/request';

/**
 * 评价列表查询参数类型
 */
export interface EvaluationListParams {
  page: number;
  size: number;
  name?: string;                              // 评价名称搜索
  creator?: string;                           // 创建人搜索
  publishStatus?: 'published' | 'unpublished'; // 发布状态筛选
  start_time?: number;                        // 开始时间戳
  end_time?: number;                          // 结束时间戳
}

/**
 * 评价记录数据类型 - 完全按照API文档定义
 */
export interface EvaluationRecord {
  id: number;
  name: string;                               // 评价名称
  type: string;                               // 评价类型 (如: "counselor")
  title: string;                              // 评价标题
  content: string;                            // 评价内容
  rating: number;                             // 总评分(1-5)
  service_rating: number;                     // 服务评分
  professional_rating: number;               // 专业评分
  attitude_rating: number;                   // 态度评分
  environment_rating: number;                // 环境评分
  target_id: number;                         // 评价目标ID
  target_name: string;                       // 评价目标名称 (如: "李咨询师")
  evaluator_id: number;                      // 评价人ID
  evaluator_name: string;                    // 评价人名称 (如: "张三")
  publishStatus: 'published' | 'unpublished'; // 发布状态
  status: 'approved' | 'pending';            // 审核状态
  reviewer_name: string;                     // 审核人名称 (如: "管理员")
  publish_time: string;                      // 发布时间 (ISO格式: "2024-01-02T10:00:00")
  review_comment: string;                    // 审核意见 (如: "评价客观真实")
  helpful_count: number;                     // 有用投票数
  unhelpful_count: number;                   // 无用投票数
  reply_count: number;                       // 回复数量
  is_anonymous: boolean;                     // 是否匿名
  is_required: boolean;                      // 是否必填
  is_published: boolean;                     // 是否发布
  created_at: string;                        // 创建时间 (ISO格式: "2024-01-01T14:00:00")
}

/**
 * 评价列表响应类型
 */
export interface EvaluationListResponse {
  list: EvaluationRecord[];
  total: number;
}

/**
 * API响应数据部分类型 - 按照API文档定义
 */
export interface EvaluationListData {
  list: EvaluationRecord[];
  total: number;                              // 总数量: 45
}

/**
 * 完整的API响应类型 - 按照API文档定义
 */
export interface EvaluationListApiResponse {
  code: number;                               // 状态码: 200
  data: EvaluationListData;                   // 数据部分
  message: string;                            // 响应消息: "查询成功"
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
 * 评价数据查询参数类型
 */
export interface EvaluationDataSearchParams {
  page?: number;
  size?: number;
  consultantName?: string;
  evaluatorName?: string;
  evaluationStartTime?: number;
  evaluationEndTime?: number;
  evaluationId: number;
}

/**
 * 评价数据记录类型
 */
export interface EvaluationDataRecord {
  id: number;
  consultantName: string;
  evaluationTime: number;
  evaluationScore: number;
  comment?: string;
  evaluatorName: string;
  evaluatorId: number;
  evaluationId: number;
}

/**
 * 评价数据响应类型
 */
export interface EvaluationDataApiResponse {
  list: EvaluationDataRecord[];
  total: number;
}

/**
 * 获取评价列表
 */
export async function getEvaluationListApi(params: EvaluationListParams): Promise<EvaluationListResponse> {
  return requestClient.post<EvaluationListResponse>('/evaluations/list', params);
}

/**
 * 创建评价项目类型
 */
export interface CreateEvaluationItem {
  type: string;                               // 评价类型，如"评分"、"评论"
  title: string;                              // 评价标题，长度2-200字符
  is_required?: boolean;                      // 是否必填，默认false
}

/**
 * 创建评价请求参数类型
 */
export interface CreateEvaluationParams {
  name: string;                               // 评价名称，长度2-200字符
  items: CreateEvaluationItem[];              // 评价项目数组，至少包含一个项目
  publishStatus?: 'published' | 'unpublished'; // 发布状态，默认"unpublished"
}

/**
 * 创建评价响应类型
 */
export interface CreateEvaluationResponse {
  code: number;                               // 状态码: 200
  message: string;                            // 响应消息，如: "评价创建成功，共创建1个项目"
  rid: string;                                // 请求ID
}

/**
 * 获取评价数据详情列表
 */
export async function getEvaluationDataListApi(params: EvaluationDataSearchParams): Promise<EvaluationDataApiResponse> {
  return requestClient.post<EvaluationDataApiResponse>('/evaluations/data/list', params);
}

/**
 * 创建评价
 */
export async function createEvaluationApi(params: CreateEvaluationParams): Promise<CreateEvaluationResponse> {
  return await requestClient.post<CreateEvaluationResponse>('/evaluations/create', params);
}
