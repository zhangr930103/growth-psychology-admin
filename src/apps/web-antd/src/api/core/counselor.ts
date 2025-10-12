import { requestClient } from '#/api/request';

/**
 * 咨询师列表查询参数类型
 */
export interface CounselorListParams {
  page: number;
  size: number;
  counselor_name?: string;
  creator?: string;
  status?: string;
}

/**
 * 时间段数据结构
 */
export interface TimeSlot {
  day: number; // 0-6 (周日到周六)
  startHour: number; // 0-23
  endHour: number; // 0-23
  startMinute?: number; // 0-59
  endMinute?: number; // 0-59
}

/**
 * 咨询师数据类型
 */
export interface CounselorData {
  id: number;
  counselor_name: string;
  phone: string;
  school: string;
  major: string;
  personal_intro: string;
  avatar: string;
  credentials: any[];
  consulting_price: string;
  consulting_method: string;
  specializations: string[];
  expertise_areas: string[];
  consulting_status: string;
  location: string;
  total_duration: string;
  settlement_price: string;
  settlement_weight: string;
  duration_proof: any[];
  available_time_slots: TimeSlot[];
  is_online: boolean;
  status: string;
  creator_name: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  create_time: number;
  update_time: number;
}

/**
 * 咨询师列表响应类型
 */
export interface CounselorListResponse {
  list: CounselorData[];
  total: number;
}

/**
 * 创建咨询师参数类型
 */
export interface CreateCounselorParams {
  counselor_name: string;
  phone: string;
  school: string;
  major: string;
  personal_intro: string;
  avatar: string;
  credentials: any[];
  consulting_price: number;
  consulting_method: string;
  specializations: string[];
  expertise_areas: string[];
  consulting_status: string;
  location: string;
  total_duration: number;
  settlement_price: number;
  settlement_weight: number;
  duration_proof: any[];
  available_time_slots: TimeSlot[];
}

/**
 * 创建咨询师响应类型
 */
export interface CreateCounselorResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 编辑咨询师参数类型
 */
export interface EditCounselorParams {
  id: number;
  counselor_name: string;
  phone: string;
  school: string;
  major: string;
  personal_intro: string;
  avatar: string;
  credentials: any[];
  consulting_price: number;
  consulting_method: string;
  specializations: string[];
  expertise_areas: string[];
  consulting_status: string;
  location: string;
  total_duration: number;
  settlement_price: number;
  settlement_weight: number;
  duration_proof: any[];
  available_time_slots: TimeSlot[];
}

/**
 * 编辑咨询师响应类型
 */
export interface EditCounselorResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 删除咨询师参数类型
 */
export interface DeleteCounselorParams {
  id: number;
}

/**
 * 删除咨询师响应类型
 */
export interface DeleteCounselorResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 切换咨询师状态参数类型
 */
export interface ToggleStatusParams {
  id: number;
  status: 'enabled' | 'disabled';
}

/**
 * 切换咨询师状态响应类型
 */
export interface ToggleStatusResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 咨询时长列表查询参数类型
 */
export interface CounselingDurationListParams {
  page: number;
  size: number;
  counselor_id: number;
  audit_status?: string;
  start_time?: number;
  end_time?: number;
}

/**
 * 咨询时长记录数据类型
 */
export interface CounselingDurationRecord {
  id: number;
  counselor_id: number;
  duration: string;
  certificate: string;
  audit_status: string;
  operator_name: string;
  creator_name: string;
  audit_time: string;
  audit_comment: string;
  created_at: string;
  updated_at: string;
  create_time: number;
  audit_time_stamp: number;
}

/**
 * 咨询时长列表响应类型
 */
export interface CounselingDurationListResponse {
  list: CounselingDurationRecord[];
  total: number;
}

/**
 * 创建咨询时长参数类型
 */
export interface CreateCounselingDurationParams {
  counselor_id: number;
  duration: number;
  certificate: string;
}

/**
 * 创建咨询时长响应类型
 */
export interface CreateCounselingDurationResponse {
  code: number;
  message: string;
  rid: string;
}

/**
 * 审批咨询时长参数类型
 */
export interface AuditCounselingDurationParams {
  id: number;
  audit_status: 'approved' | 'rejected';
  audit_comment?: string;
}

/**
 * 审批咨询时长响应类型
 */
export interface AuditCounselingDurationResponse {
  code: number;
  message: string;
  rid: string;
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
 * 获取咨询师列表
 */
export async function getCounselorListApi(params: CounselorListParams): Promise<CounselorListResponse> {
  return requestClient.post<CounselorListResponse>('/counselors/list', params);
}

/**
 * 创建咨询师
 */
export async function createCounselorApi(params: CreateCounselorParams): Promise<CreateCounselorResponse> {
  return requestClient.post<CreateCounselorResponse>('/counselors/create', params);
}

/**
 * 编辑咨询师
 */
export async function editCounselorApi(params: EditCounselorParams): Promise<EditCounselorResponse> {
  return requestClient.post<EditCounselorResponse>('/counselors/edit', params);
}

/**
 * 删除咨询师
 */
export async function deleteCounselorApi(params: DeleteCounselorParams): Promise<DeleteCounselorResponse> {
  return requestClient.post<DeleteCounselorResponse>('/counselors/delete', params);
}

/**
 * 切换咨询师状态（启用/停用）
 */
export async function toggleCounselorStatusApi(params: ToggleStatusParams): Promise<ToggleStatusResponse> {
  return requestClient.post<ToggleStatusResponse>('/counselors/toggle-status', params);
}

/**
 * 获取咨询时长列表
 */
export async function getCounselingDurationListApi(params: CounselingDurationListParams): Promise<CounselingDurationListResponse> {
  return requestClient.post<CounselingDurationListResponse>('/counselors/duration/list', params);
}

/**
 * 创建咨询时长记录
 */
export async function createCounselingDurationApi(params: CreateCounselingDurationParams): Promise<CreateCounselingDurationResponse> {
  return requestClient.post<CreateCounselingDurationResponse>('/counselors/duration/create', params);
}

/**
 * 审批咨询时长记录
 */
export async function auditCounselingDurationApi(params: AuditCounselingDurationParams): Promise<AuditCounselingDurationResponse> {
  return requestClient.post<AuditCounselingDurationResponse>('/counselors/duration/audit', params);
}

/**
 * 导入咨询师响应类型
 */
export interface ImportCounselorResponse {
  code: number;
  message: string;
  rid: string;
  data?: any;
}

/**
 * 城市搜索参数类型
 */
export interface CitySearchParams {
  keyword: string;
}

/**
 * 城市数据项
 */
export interface CityItem {
  name: string;
}

/**
 * 城市搜索响应类型
 */
export interface CitySearchResponse {
  list: CityItem[];
}

/**
 * 搜索城市
 */
export async function searchCitiesApi(params: CitySearchParams): Promise<CitySearchResponse> {
  return requestClient.get<CitySearchResponse>('/counselors/cities', {
    params
  });
}

/**
 * Excel 批量导入咨询师
 */
export async function importCounselorExcelApi(file: File): Promise<ImportCounselorResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    console.log('开始上传文件:', file.name, '大小:', file.size);
    
    // 创建一个新的RequestClient实例用于文件上传，避免双重数据提取
    const { RequestClient } = await import('@vben/request');
    const { useAppConfig } = await import('@vben/hooks');
    const { useAccessStore } = await import('@vben/stores');
    
    const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
    const accessStore = useAccessStore();
    
    const uploadClient = new RequestClient({
      baseURL: apiURL,
      // 不设置 responseReturn，获取完整响应
    });
    
    // 添加请求拦截器处理认证
    uploadClient.addRequestInterceptor({
      fulfilled: async (config) => {
        if (accessStore.accessToken) {
          config.headers.Authorization = `Bearer ${accessStore.accessToken}`;
        }
        return config;
      },
    });
    
    const response = await uploadClient.post('/counselors/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('API完整响应:', response);
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
    
    // 确保返回正确的数据结构
    const result = response.data;
    
    return {
      code: result?.code || response.status || 200,
      message: result?.message || '导入成功',
      rid: result?.rid || '',
      data: result?.data || result
    };
  } catch (error: any) {
    console.error('导入API调用失败:', error);
    
    // 如果是HTTP错误，尝试从错误响应中获取信息
    if (error.response) {
      const errorData = error.response.data || {};
      return {
        code: errorData.code || error.response.status || 500,
        message: errorData.message || errorData.error || '导入失败',
        rid: errorData.rid || '',
        data: null
      };
    }
    
    // 重新抛出网络错误等其他错误
    throw error;
  }
}
