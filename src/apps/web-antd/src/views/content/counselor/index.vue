<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { useVbenForm, z } from '#/adapter/form';
import { upload_file } from '#/api/examples/upload';
import {
  getCounselorListApi,
  createCounselorApi,
  editCounselorApi,
  deleteCounselorApi,
  toggleCounselorStatusApi,
  getCounselingDurationListApi,
  createCounselingDurationApi,
  auditCounselingDurationApi,
  importCounselorExcelApi,
  searchCitiesApi,
  type ImportCounselorResponse,
  type CounselorListParams,
  type CreateCounselorParams,
  type EditCounselorParams,
  type CounselingDurationListParams,
  type CreateCounselingDurationParams,
  type AuditCounselingDurationParams,
  type CounselingDurationRecord as ApiCounselingDurationRecord,
  type CounselorData as ApiCounselorData,
} from '#/api/core/counselor';
import {
  Button,
  message,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Upload,
  Alert,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import FullCalendarWeekPicker from '#/components/date/FullCalendarWeekPicker.vue';

defineOptions({
  name: 'CounselorManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 咨询时长数据查看弹窗相关状态
const durationModalVisible = ref(false);
const currentCounselorId = ref<number | null>(null);
const currentCounselorName = ref('');

// 咨询时长弹窗模式状态
const durationModalMode = ref<'add' | 'view'>('add');

// 审核弹窗相关状态
const currentAuditRecord = ref<CounselingDurationRecord | null>(null);

// Excel导入相关状态
const importModalVisible = ref(false);
const uploadLoading = ref(false);

// 导入结果相关状态
const importResultVisible = ref(false);
const importResult = ref<{
  success_count: number;
  error_count: number;
  total_count: number;
  server_message?: string; // 服务器原始消息
}>({
  success_count: 0,
  error_count: 0,
  total_count: 0,
  server_message: undefined
});

// 咨询师表单相关状态
const counselorModalMode = ref<'add' | 'edit'>('add');
const currentEditCounselor = ref<CounselorData | null>(null);

// 可咨询时间数据
const counselorAvailableTimeSlots = ref<TimeSlot[]>([]);

// 城市搜索相关状态
const cityOptions = ref<{ value: string }[]>([]);
const citySearchLoading = ref(false);

// 时间段数据结构
interface TimeSlot {
  day: number; // 0-6 (周日到周六)
  startHour: number; // 0-23
  endHour: number; // 0-23
  startMinute?: number; // 0-59
  endMinute?: number; // 0-59
}

// 本地组件使用的类型定义（保持向后兼容）
interface CounselorData {
  id: number;
  counselorName: string;
  school: string;
  major: string;
  personalIntro: string;
  counselingDuration: number; // 咨询时长(小时)
  specialization: string; // 擅长流派
  expertise: string; // 擅长领域
  counselingMethod: string; // 咨询方式
  location: string; // 所在位置
  settlementPrice: number; // 结算价格
  isOnline: boolean; // 是否在线
  creatorName: string;
  createTime: number;
  updateTime?: number;
  status: 'enabled' | 'disabled';
  // 新增字段
  avatar?: string | any[]; // 头像
  credentials?: any[]; // 学信网认证
  consultingPrice?: number; // 咨询价格设置
  consultingMethodType?: string; // 咨询方式类型
  specializations?: string[]; // 擅长流派数组
  expertiseAreas?: string[]; // 擅长领域数组
  consultingStatus?: string; // 咨询状态
  durationProof?: any[]; // 时长证明
  settlementWeight?: number; // 结算权重
  totalDuration?: number; // 总咨询时长
  otherSpecialization?: string; // 其他擅长流派
  availableTimeSlots?: TimeSlot[]; // 可咨询时间段
}

// API数据适配器函数
const adaptApiDataToLocal = (apiData: ApiCounselorData): CounselorData => {
  return {
    id: apiData.id,
    counselorName: apiData.counselor_name,
    school: apiData.school,
    major: apiData.major,
    personalIntro: apiData.personal_intro,
    counselingDuration: Number(apiData.total_duration) || 0,
    specialization: Array.isArray(apiData.specializations)
      ? apiData.specializations.join(', ')
      : '',
    expertise: Array.isArray(apiData.expertise_areas)
      ? apiData.expertise_areas.join(', ')
      : '',
    counselingMethod: apiData.consulting_method,
    location: apiData.location,
    settlementPrice: Number(apiData.settlement_price) || 0,
    isOnline: apiData.is_online,
    creatorName: apiData.creator_name,
    createTime:
      apiData.create_time ||
      Math.floor(new Date(apiData.created_at).getTime() / 1000),
    updateTime:
      apiData.update_time ||
      Math.floor(new Date(apiData.updated_at).getTime() / 1000),
    status: apiData.status as 'enabled' | 'disabled',
    avatar: apiData.avatar,
    credentials: apiData.credentials,
    consultingPrice: Number(apiData.consulting_price) || 0,
    consultingMethodType: apiData.consulting_method,
    specializations: apiData.specializations,
    expertiseAreas: apiData.expertise_areas,
    consultingStatus: apiData.consulting_status,
    durationProof: apiData.duration_proof,
    settlementWeight: Number(apiData.settlement_weight) || 0,
    totalDuration: Number(apiData.total_duration) || 0,
    availableTimeSlots: apiData.available_time_slots,
  };
};

// 咨询时长数据适配器函数：将API数据转换为本地格式
const adaptDurationApiDataToLocal = (apiData: ApiCounselingDurationRecord): CounselingDurationRecord => {
  return {
    id: apiData.id,
    counselorId: apiData.counselor_id,
    createTime: apiData.create_time || Math.floor(new Date(apiData.created_at).getTime() / 1000),
    duration: Number(apiData.duration) || 0,
    certificate: apiData.certificate,
    auditStatus: apiData.audit_status as 'pending' | 'approved' | 'rejected',
    operatorName: apiData.operator_name,
    creatorName: apiData.creator_name,
    auditTime: apiData.audit_time_stamp || Math.floor(new Date(apiData.audit_time).getTime() / 1000),
    auditComment: apiData.audit_comment,
  };
};

// 创建咨询时长数据适配器函数：将表单数据转换为API格式
const adaptDurationFormToApi = (formData: any, counselorId: number): CreateCounselingDurationParams => {
  // 处理上传文件的URL提取
  const extractFileUrl = (fileList: any[]): string => {
    if (!Array.isArray(fileList) || fileList.length === 0) return '';

    const file = fileList[0];
    if (typeof file === 'string') return file;
    return file?.response?.file_url || file?.url || '';
  };

  return {
    counselor_id: counselorId,
    duration: Number(formData.duration) || 0,
    certificate: extractFileUrl(formData.certificate || []),
  };
};

// 表单数据适配器函数：将表单数据转换为API格式
const adaptFormDataToApi = (formData: any): CreateCounselorParams => {
  // 处理上传文件的URL提取
  const extractFileUrls = (fileList: any[]): string[] => {
    if (!Array.isArray(fileList)) return [];
    return fileList.map(file => {
      if (typeof file === 'string') return file;
      return file?.response?.file_url || file?.url || '';
    }).filter(Boolean);
  };

  // 处理单个文件的URL提取
  const extractSingleFileUrl = (fileList: any[]): string => {
    const urls = extractFileUrls(fileList);
    return urls[0] || '';
  };

  // 处理其他擅长流派
  let finalSpecializations = formData.specializations || [];
  if (finalSpecializations.includes('other') && formData.otherSpecialization) {
    // 如果选择了其他，则用用户输入的内容替换'other'
    finalSpecializations = finalSpecializations.map((spec: string) =>
      spec === 'other' ? formData.otherSpecialization : spec
    );
  }

  return {
    counselor_name: formData.counselorName || '',
    school: formData.school || '',
    major: formData.major || '',
    personal_intro: formData.personalIntro || '',
    avatar: extractSingleFileUrl(formData.avatar || []),
    credentials: extractFileUrls(formData.credentials || []).map(url => ({ url })),
    consulting_price: Number(formData.consultingPrice) || 0,
    consulting_method: formData.consultingMethod || '',
    specializations: finalSpecializations,
    expertise_areas: formData.expertiseAreas || [],
    consulting_status: formData.consultingStatus || '',
    location: formData.location || '',
    total_duration: Number(formData.totalDuration) || 0,
    settlement_price: Number(formData.consultingPrice) || 0, // 使用咨询价格作为结算价格
    settlement_weight: Number(formData.settlementWeight) || 0,
    duration_proof: extractFileUrls(formData.durationProof || []).map(url => ({ url })),
    available_time_slots: formData.availableTimeSlots || [],
  };
};

// 编辑表单数据适配器函数：将表单数据转换为编辑API格式
const adaptFormDataToEditApi = (formData: any, counselorId: number): EditCounselorParams => {
  // 处理上传文件的URL提取
  const extractFileUrls = (fileList: any[]): string[] => {
    if (!Array.isArray(fileList)) return [];
    return fileList.map(file => {
      if (typeof file === 'string') return file;
      return file?.response?.file_url || file?.url || '';
    }).filter(Boolean);
  };

  // 处理单个文件的URL提取
  const extractSingleFileUrl = (fileList: any[]): string => {
    const urls = extractFileUrls(fileList);
    return urls[0] || '';
  };

  // 处理其他擅长流派
  let finalSpecializations = formData.specializations || [];
  if (finalSpecializations.includes('other') && formData.otherSpecialization) {
    // 如果选择了其他，则用用户输入的内容替换'other'
    finalSpecializations = finalSpecializations.map((spec: string) =>
      spec === 'other' ? formData.otherSpecialization : spec
    );
  }

  return {
    id: counselorId,
    counselor_name: formData.counselorName || '',
    school: formData.school || '',
    major: formData.major || '',
    personal_intro: formData.personalIntro || '',
    avatar: extractSingleFileUrl(formData.avatar || []),
    credentials: extractFileUrls(formData.credentials || []).map(url => ({ url })),
    consulting_price: Number(formData.consultingPrice) || 0,
    consulting_method: formData.consultingMethod || '',
    specializations: finalSpecializations,
    expertise_areas: formData.expertiseAreas || [],
    consulting_status: formData.consultingStatus || '',
    location: formData.location || '',
    total_duration: Number(formData.totalDuration) || 0,
    settlement_price: Number(formData.consultingPrice) || 0, // 使用咨询价格作为结算价格
    settlement_weight: Number(formData.settlementWeight) || 0,
    duration_proof: extractFileUrls(formData.durationProof || []).map(url => ({ url })),
    available_time_slots: formData.availableTimeSlots || [],
  };
};

interface SearchParams {
  page?: number;
  size?: number;
  counselorName?: string;
  creator?: string;
  status?: string;
}

interface ApiResponse {
  list: CounselorData[];
  total: number;
}

// 咨询时长记录相关类型定义
interface CounselingDurationRecord {
  id: number;
  counselorId: number;
  createTime: number;
  duration: number; // 咨询时长(小时)
  certificate?: string; // 凭证图片URL
  auditStatus: 'pending' | 'approved' | 'rejected'; // 审核状态：待审核、审核通过、审核不通过
  operatorName: string; // 操作人名称
  creatorName: string; // 创建人
  auditTime?: number; // 审核时间
  auditComment?: string; // 审核备注
}

interface CounselingDurationSearchParams {
  page?: number;
  size?: number;
  auditStatus?: string;
  startTime?: number;
  endTime?: number;
  counselorId: number;
}

interface CounselingDurationApiResponse {
  list: CounselingDurationRecord[];
  total: number;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 130,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'counselorName',
      label: '咨询师名称',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      fieldName: 'creator',
      label: '创建人',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
        ],
      },
    },
  ],
  showCollapseButton: true,
  submitOnChange: false,
  submitOnEnter: true,
};

// 咨询师管理数据API
const getCounselorList = async (params: SearchParams): Promise<ApiResponse> => {
  try {
    // 转换参数格式以匹配API接口
    const apiParams: CounselorListParams = {
      page: params.page || 1,
      size: params.size || 10,
      counselor_name: params.counselorName,
      creator: params.creator,
      status: params.status,
    };

    // 调用真实API
    const response = await getCounselorListApi(apiParams);

    // 转换API返回的数据格式
    const adaptedList = response.list.map(adaptApiDataToLocal);

    return {
      list: adaptedList,
      total: response.total,
    };
  } catch (error) {
    // 如果API调用失败，返回空数据
    return {
      list: [],
      total: 0,
    };
  }
};

// 咨询时长记录数据API
const getCounselingDurationList = async (
  params: CounselingDurationSearchParams,
): Promise<CounselingDurationApiResponse> => {
  try {
    // 转换参数格式以匹配API接口
    const apiParams: CounselingDurationListParams = {
      page: params.page || 1,
      size: params.size || 10,
      counselor_id: params.counselorId,
      audit_status: params.auditStatus,
      start_time: params.startTime,
      end_time: params.endTime,
    };

    // 调用真实API
    const response = await getCounselingDurationListApi(apiParams);

    // 转换API返回的数据格式
    const adaptedList = response.list.map(adaptDurationApiDataToLocal);

    return {
      list: adaptedList,
      total: response.total,
    };
  } catch (error) {
    // 如果API调用失败，返回空数据
    return {
      list: [],
      total: 0,
    };
  }
};

// 操作函数
const handleViewDuration = (row: CounselorData) => {
  currentCounselorId.value = row.id;
  currentCounselorName.value = row.counselorName;
  durationModalVisible.value = true;

  // 延迟执行查询，确保弹窗打开后再加载数据
  setTimeout(() => {
    durationGridApi.query();
  }, 100);
};

// 关闭咨询时长查看弹窗
const closeDurationModal = () => {
  durationModalVisible.value = false;
  currentCounselorId.value = null;
  currentCounselorName.value = '';
};

// 咨询时长弹窗确认按钮处理
const handleDurationModalConfirm = () => {
  message.success('操作成功');
  closeDurationModal();
};

const handleToggleStatus = async (row: CounselorData) => {
  const action = row.status === 'enabled' ? '停用' : '启用';
  const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled';

  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用状态切换API
    await toggleCounselorStatusApi({
      id: row.id,
      status: newStatus,
    });

    message.success({
      content: `咨询师${action}成功`,
    });

    // 刷新列表
    gridApi.query();
  } catch (error) {
    message.error({
      content: `${action}失败，请重试`,
    });
  } finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

const handleDelete = async (row: CounselorData) => {
  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用删除API
    await deleteCounselorApi({ id: row.id });

    message.success({
      content: '咨询师删除成功',
    });

    // 刷新列表
    gridApi.query();
  } catch (error) {
    message.error({
      content: '删除失败，请重试',
    });
  } finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

const handleEdit = (row: CounselorData) => {
  counselorModalMode.value = 'edit';
  currentEditCounselor.value = row;

  // 准备表单数据
  const formData = {
    counselorName: row.counselorName,
    school: row.school,
    major: row.major,
    personalIntro: row.personalIntro,
    avatar: prepareFileListForUpload(row.avatar),
    credentials: prepareFileListForUpload(row.credentials),
    consultingPrice: row.consultingPrice || row.settlementPrice || '',
    consultingMethod: mapConsultingMethodToValue(row.consultingMethodType || row.counselingMethod),
    specializations: prepareSpecializationsForEdit(getSpecializationsList(row)).specializations,
    expertiseAreas: row.expertiseAreas || [row.expertise].filter(Boolean) || [],
    consultingStatus: row.consultingStatus || (row.isOnline ? 'online' : 'offline'),
    durationProof: prepareFileListForUpload(row.durationProof), // 时长证明
    location: row.location, // 直接使用位置字符串
    settlementWeight: row.settlementWeight || 0, // 结算权重
    totalDuration: row.totalDuration || row.counselingDuration || 0, // 总咨询时长
    otherSpecialization: prepareSpecializationsForEdit(getSpecializationsList(row)).otherSpecialization || row.otherSpecialization || '',
  };


  // 咨询方式映射函数
  function mapConsultingMethodToValue(method: string): string {
    const methodMap: Record<string, string> = {
      '线上': 'video',
      '视频': 'video',
      '语音': 'voice',
      '线下': 'face_to_face',
      '面对面': 'face_to_face',
      '线上+线下': 'video', // 默认选择视频
    };
    return methodMap[method] || method || 'video';
  }

  // 获取擅长流派列表函数：统一处理数组和字符串格式
  function getSpecializationsList(row: CounselorData): string[] {
    // 如果有 specializations 数组，优先使用
    if (row.specializations && Array.isArray(row.specializations)) {
      return row.specializations;
    }

    // 如果没有数组但有 specialization 字符串，转换为数组
    if (row.specialization) {
      // 如果是逗号分隔的字符串，分割并清理
      if (row.specialization.includes(',')) {
        return row.specialization.split(',').map(s => s.trim()).filter(Boolean);
      }
      // 单个字符串
      return [row.specialization];
    }

    return [];
  }

  // 擅长流派编辑准备函数：处理"其他"流派的回显
  function prepareSpecializationsForEdit(specializations: string[]): {
    specializations: string[];
    otherSpecialization: string;
  } {
    // 预定义的擅长流派选项
    const predefinedSpecializations = [
      'cbt',
      'postmodern',
      'psychoanalysis',
      'humanistic',
      'family_therapy',
      'other'
    ];

    const resultSpecializations: string[] = [];
    let otherSpecialization = '';

    specializations.forEach(spec => {
      if (predefinedSpecializations.includes(spec)) {
        // 如果是预定义选项，直接添加
        resultSpecializations.push(spec);
      } else {
        // 如果不是预定义选项，认为是自定义的"其他"流派
        if (!resultSpecializations.includes('other')) {
          resultSpecializations.push('other');
        }
        // 将自定义流派名称保存到 otherSpecialization（如果有多个自定义的，用逗号分隔）
        if (otherSpecialization) {
          otherSpecialization += ', ' + spec;
        } else {
          otherSpecialization = spec;
        }
      }
    });

    return {
      specializations: resultSpecializations,
      otherSpecialization
    };
  }

  // 文件数据转换函数：将API返回的文件数据转换为上传组件格式
  function prepareFileListForUpload(fileData: any): any[] {
    if (!fileData) return [];

    // 如果是字符串（单个文件URL）
    if (typeof fileData === 'string' && fileData) {
      return [{
        uid: Date.now().toString(),
        name: '文件',
        status: 'done',
        url: fileData,
        response: { file_url: fileData }
      }];
    }

    // 如果是数组
    if (Array.isArray(fileData)) {
      return fileData.map((file, index) => {
        // 如果数组元素是字符串
        if (typeof file === 'string') {
          return {
            uid: `${Date.now()}-${index}`,
            name: '文件',
            status: 'done',
            url: file,
            response: { file_url: file }
          };
        }

        // 如果数组元素是对象，且有url属性
        if (file && typeof file === 'object' && file.url) {
          return {
            uid: file.uid || `${Date.now()}-${index}`,
            name: file.name || '文件',
            status: 'done',
            url: file.url,
            response: { file_url: file.url }
          };
        }

        // 其他情况，尝试直接使用
        return {
          uid: `${Date.now()}-${index}`,
          name: '文件',
          status: 'done',
          url: file,
          response: { file_url: file }
        };
      }).filter(item => item.url);
    }

    return [];
  }

  // 设置可咨询时间数据（如果有的话）
  counselorAvailableTimeSlots.value = row.availableTimeSlots || [];

  // 先打开弹窗，再设置表单值（确保表单组件已渲染）
  counselorModalApi.open();

  // 设置弹窗标题
  counselorModalApi.setState({
    title: '编辑咨询师',
  });

  // 延迟设置表单值，确保表单组件已经渲染完成
  setTimeout(() => {
    counselorFormApi.setValues({
      ...formData,
      availableTimeSlots: counselorAvailableTimeSlots.value,
    });
  }, 100);
};

// 咨询时长表单 Schema 配置（动态配置）
const getDurationFormSchema = (isReadonly = false) => [
  {
    component: 'InputNumber',
    fieldName: 'duration',
    label: '时长',
    rules: isReadonly ? undefined : z.number().min(0.01, '请输入有效的时长').max(999999.99, '时长不能超过999999.99'),
    componentProps: {
      placeholder: '请输入咨询时长',
      min: 0.01,
      max: 999999.99,
      step: 0.01,
      precision: 2,
      style: { width: '100%' },
      disabled: isReadonly,
    },
  },
  {
    component: 'Upload',
    fieldName: 'certificate',
    label: '上传凭证',
    componentProps: {
      customRequest: upload_file,
      disabled: isReadonly,
      maxCount: 1,
      multiple: false,
      showUploadList: true,
      listType: 'picture-card',
      beforeUpload: (file: File) => {
        if (isReadonly) return false;
        const isValidSize = file.size / 1024 / 1024 < 10;
        const validExtensions = ['jpg', 'png', 'jpeg'];
        const fileExtension = file.name?.split('.').pop()?.toLowerCase();
        const isValidType = validExtensions.includes(fileExtension || '');
        if (!isValidSize) {
          message.error('文件大小不能超过 10MB');
          return Upload.LIST_IGNORE;
        }
        if (!isValidType) {
          message.error('仅支持 .jpg, .png, .jpeg 格式的图片');
          return Upload.LIST_IGNORE;
        }
        return true;
      },
      onPreview: (file: any) => {
        // 获取图片URL进行预览
        const imageUrl = file.url || file.response?.file_url || file.thumbUrl;
        if (imageUrl) {
          window.open(imageUrl, '_blank');
        } else {
          message.warning('无法预览该图片');
        }
      },
    },
    renderComponentContent: () => {
      return {
        default: () => (isReadonly ? '查看图片' : '上传图片'),
      };
    },
  },
];

// 审核表单 Schema 配置
const auditFormSchema = [
  {
    component: 'RadioGroup',
    fieldName: 'auditStatus',
    label: '审核',
    rules: z.enum(['approved', 'rejected']).describe('请选择审核状态'),
    componentProps: {
      options: [
        { label: '审核通过', value: 'approved' },
        { label: '审核不通过', value: 'rejected' },
      ],
    },
  },
  {
    component: 'Textarea',
    fieldName: 'auditComment',
    label: '不通过原因',
    dependencies: {
      triggerFields: ['auditStatus'],
      show: (values: any) => values.auditStatus === 'rejected',
    },
    rules: z.string().optional().describe('审核不通过原因'),
    componentProps: {
      placeholder: '请输入审核不通过的原因',
      rows: 3,
    },
  },
];

// 城市搜索函数
const handleCitySearch = async (searchText: string) => {
  if (!searchText || searchText.length < 2) {
    cityOptions.value = [];
    return;
  }

  try {
    citySearchLoading.value = true;
    const response = await searchCitiesApi({ keyword: searchText });
    // API 返回的数据结构：{data: {list: [{name: "北京市"}]}}
    const cities = response.list || [];
    cityOptions.value = cities.map(city => ({ value: city.name }));
  } catch (error) {
    console.error('城市搜索失败:', error);
    cityOptions.value = [];
  } finally {
    citySearchLoading.value = false;
  }
};

// 咨询师表单 Schema 配置 - 使用函数返回动态Schema
const getCounselorFormSchema = () => [
  {
    component: 'Input',
    fieldName: 'counselorName',
    label: '咨询师姓名',
    rules: z.string().min(1, '请输入咨询师姓名'),
    componentProps: {
      placeholder: '请输入咨询师姓名',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'Upload',
    fieldName: 'avatar',
    label: '头像',
    componentProps: {
      customRequest: upload_file,
      maxCount: 1,
      multiple: false,
      showUploadList: true,
      listType: 'picture-card',
      beforeUpload: (file: File) => {
        const isValidSize = file.size / 1024 / 1024 < 10;
        const validExtensions = ['jpg', 'png', 'jpeg'];
        const fileExtension = file.name?.split('.').pop()?.toLowerCase();
        const isValidType = validExtensions.includes(fileExtension || '');
        if (!isValidSize) {
          message.error('文件大小不能超过 10MB');
          return Upload.LIST_IGNORE;
        }
        if (!isValidType) {
          message.error('仅支持 .jpg, .png, .jpeg 格式的图片');
          return Upload.LIST_IGNORE;
        }
        return true;
      },
      onPreview: (file: any) => {
        // 获取图片URL进行预览
        const imageUrl = file.url || file.response?.file_url || file.thumbUrl;
        if (imageUrl) {
          window.open(imageUrl, '_blank');
        } else {
          message.warning('无法预览该图片');
        }
      },
    },
    renderComponentContent: () => {
      return {
        default: () => '上传照片',
      };
    },
  },
  {
    component: 'Input',
    fieldName: 'school',
    label: '学校',
    rules: z.string().min(1, '请输入学校'),
    componentProps: {
      placeholder: '请输入',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'Input',
    fieldName: 'major',
    label: '专业',
    rules: z.string().min(1, '请输入专业'),
    componentProps: {
      placeholder: '请输入',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'Upload',
    fieldName: 'credentials',
    label: '上传学信网认证',
    componentProps: {
      customRequest: upload_file,
      maxCount: 5,
      multiple: true,
      showUploadList: true,
      listType: 'picture-card',
      beforeUpload: (file: File) => {
        const isValidSize = file.size / 1024 / 1024 < 10;
        if (!isValidSize) {
          message.error('文件大小不能超过 10MB');
          return Upload.LIST_IGNORE;
        }
        return true;
      },
      onPreview: (file: any) => {
        // 获取图片URL进行预览
        const imageUrl = file.url || file.response?.file_url || file.thumbUrl;
        if (imageUrl) {
          window.open(imageUrl, '_blank');
        } else {
          message.warning('无法预览该图片');
        }
      },
    },
    renderComponentContent: () => {
      return {
        default: () => '上传学信网',
      };
    },
  },
  {
    component: 'Textarea',
    fieldName: 'personalIntro',
    label: '个人简介',
    rules: z
      .string()
      .min(1, '请输入个人简介')
      .max(200, '个人简介不能超过200个字'),
    componentProps: {
      placeholder: '请您填写您的个人简介（不超过200个字）',
      rows: 4,
      maxlength: 200,
      showCount: true,
      style: {
        width: '100%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'Slot',
    fieldName: 'availableTimeSlots',
    label: '可咨询时间',
    slot: 'availableTimeSlots',
    rules: z.array(z.any()).min(1, '请选择可咨询时间').refine((val) => val && val.length > 0, {
      message: '请选择可咨询时间',
    }),
  },
  {
    component: 'InputNumber',
    fieldName: 'consultingPrice',
    label: '咨询价格设置',
    rules: z.number().min(1, '请输入咨询价格'),
    componentProps: {
      placeholder: '请输入咨询价格',
      min: 1,
      addonAfter: '￥',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'RadioGroup',
    fieldName: 'consultingMethod',
    label: '咨询方式',
    rules: z.string().min(1, '请选择咨询方式'),
    componentProps: {
      options: [
        { label: '视频', value: 'video' },
        { label: '语音', value: 'voice' },
        { label: '面对面', value: 'face_to_face' },
      ],
    },
  },
  {
    component: 'CheckboxGroup',
    fieldName: 'specializations',
    label: '擅长流派（最多四个）',
    rules: z.array(z.string()).min(1, '请选择擅长流派').max(4, '最多选择四个'),
    componentProps: {
      options: [
        { label: '认知行为疗法(CBT)', value: 'cbt' },
        { label: '后现代疗法', value: 'postmodern' },
        { label: '精神分析/动力学', value: 'psychoanalysis' },
        { label: '人本存在疗法', value: 'humanistic' },
        { label: '家庭治疗', value: 'family_therapy' },
        { label: '其他', value: 'other' },
      ],
    },
  },
  {
    component: 'Input',
    fieldName: 'otherSpecialization',
    label: '',
    dependencies: {
      triggerFields: ['specializations'],
      show: (values: any) => values.specializations?.includes('other'),
    },
    componentProps: {
      placeholder: '请输入',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'CheckboxGroup',
    fieldName: 'expertiseAreas',
    label: '擅长领域（最多四个）',
    rules: z.array(z.string()).min(1, '请选择擅长领域').max(4, '最多选择四个'),
    componentProps: {
      options: [
        { label: '情绪与压力困扰', value: 'emotion_stress' },
        { label: '人际与亲密关系', value: 'relationship' },
        { label: '生涯规划', value: 'career_planning' },
        { label: '自我成长与探索', value: 'self_growth' },
        { label: '家庭关系（家庭咨询）', value: 'family_relations' },
      ],
    },
  },
  {
    component: 'AutoComplete',
    fieldName: 'location',
    label: '所在位置',
    rules: z.string().min(1, '请输入所在位置'),
    componentProps: {
      placeholder: '请输入城市名称进行搜索',
      options: cityOptions.value,
      filterOption: false,
      onSearch: handleCitySearch,
      notFoundContent: citySearchLoading.value ? '搜索中...' : '暂无数据',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'settlementWeight',
    label: '结算权重',
    rules: z.number().min(0, '请输入结算权重').max(100, '权重不能超过100%'),
    componentProps: {
      placeholder: '请输入人结算权重',
      min: 0,
      max: 100,
      step: 0.1,
      addonAfter: '%',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'totalDuration',
    label: '咨询时长',
    rules: z.number().min(0, '请输入咨询时长').max(999999.99, '时长不能超过999999.99'),
    componentProps: {
      placeholder: '请输入咨询时长',
      min: 0,
      max: 999999.99,
      step: 0.01,
      precision: 2,
      addonAfter: '小时',
      style: {
        width: '70%',
        boxSizing: 'border-box',
      },
    },
  },
  {
    component: 'RadioGroup',
    fieldName: 'consultingStatus',
    label: '咨询状态',
    rules: z.string().min(1, '请选择咨询状态'),
    componentProps: {
      options: [
        { label: '下线', value: 'offline' },
        { label: '上线', value: 'online' },
      ],
      defaultValue: 'offline',
    },
  },
  {
    component: 'Upload',
    fieldName: 'durationProof',
    label: '上传时长证明',
    componentProps: {
      customRequest: upload_file,
      maxCount: 5,
      multiple: true,
      showUploadList: true,
      listType: 'picture-card',
      beforeUpload: (file: File) => {
        const isValidSize = file.size / 1024 / 1024 < 10;
        const validExtensions = ['jpg', 'png', 'jpeg'];
        const fileExtension = file.name?.split('.').pop()?.toLowerCase();
        const isValidType = validExtensions.includes(fileExtension || '');
        if (!isValidSize) {
          message.error('文件大小不能超过 10MB');
          return Upload.LIST_IGNORE;
        }
        if (!isValidType) {
          message.error('仅支持 .jpg, .png, .jpeg 格式的图片');
          return Upload.LIST_IGNORE;
        }
        return true;
      },
      onPreview: (file: any) => {
        // 获取图片URL进行预览
        const imageUrl = file.url || file.response?.file_url || file.thumbUrl;
        if (imageUrl) {
          window.open(imageUrl, '_blank');
        } else {
          message.warning('无法预览该图片');
        }
      },
    },
    renderComponentContent: () => {
      return {
        default: () => '上传证明',
      };
    },
  },
];

// 创建咨询时长表单（动态模式）
const [DurationForm, durationFormApi] = useVbenForm({
  schema: getDurationFormSchema(false), // 默认为编辑模式
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 120,
  },
});

// 创建咨询时长弹窗（统一处理新增和查看）
const [DurationModal, durationModalApi] = useVbenModal({
  title: '咨询时长',
  onConfirm: async () => {
    if (durationModalMode.value === 'view') return;

    try {
      // 开启loading
      durationModalApi.setState({ loading: true });

      const validationResult = await durationFormApi.validate();
      if (!validationResult.valid) {
        durationModalApi.setState({ loading: false });
        return;
      }

      const formValues = await durationFormApi.getValues();

      // 确保有咨询师ID
      if (!currentCounselorId.value) {
        throw new Error('缺少咨询师ID，无法创建咨询时长记录');
      }

      // 将表单数据转换为API格式
      const apiData = adaptDurationFormToApi(formValues, currentCounselorId.value);

      // 调用创建咨询时长API
      await createCounselingDurationApi(apiData);

      message.success('新增咨询时长成功');

      // 关闭弹窗
      durationModalApi.close();

      // 重置表单
      durationFormApi.resetForm();

      // 刷新列表
      durationGridApi.query();
    } catch (error) {
      message.error({ content: '提交失败，请重试', key: 'add_duration' });
    } finally {
      // 关闭loading
      durationModalApi.setState({ loading: false });
    }
  },
  onCancel: () => {
    durationFormApi.resetForm();
    durationModalApi.close();
  },
});

// 创建审核表单
const [AuditForm, auditFormApi] = useVbenForm({
  schema: auditFormSchema,
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 100,
  },
});

// 创建审核弹窗
const [AuditModal, auditModalApi] = useVbenModal({
  title: '审核',
  onConfirm: async () => {
    try {
      // 开启loading
      auditModalApi.setState({ loading: true });

      const validationResult = await auditFormApi.validate();
      if (!validationResult.valid) {
        auditModalApi.setState({ loading: false });
        return;
      }

      const formValues = await auditFormApi.getValues();

      // 确保有审核记录ID
      if (!currentAuditRecord.value?.id) {
        throw new Error('缺少审核记录ID，无法进行审核');
      }

      // 将表单数据转换为API格式
      const apiData: AuditCounselingDurationParams = {
        id: currentAuditRecord.value.id,
        audit_status: formValues.auditStatus,
        audit_comment: formValues.auditComment,
      };

      // 调用审核API
      await auditCounselingDurationApi(apiData);

      const statusText =
        formValues.auditStatus === 'approved' ? '审核通过' : '审核不通过';
      message.success(`${statusText}成功`);

      // 关闭弹窗
      auditModalApi.close();

      // 重置表单
      auditFormApi.resetForm();

      // 刷新列表
      durationGridApi.query();
    } catch (error) {
      message.error({ content: '审核失败，请重试', key: 'audit' });
    } finally {
      // 关闭loading
      auditModalApi.setState({ loading: false });
    }
  },
  onCancel: () => {
    auditFormApi.resetForm();
    auditModalApi.close();
  },
});

// 创建咨询师表单
const [CounselorForm, counselorFormApi] = useVbenForm({
  schema: getCounselorFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 180,
  },
});

// 创建咨询师弹窗
const [CounselorModal, counselorModalApi] = useVbenModal({
  title: '新增咨询师',
  onConfirm: async () => {
    try {
      // 开启loading
      counselorModalApi.setState({ loading: true });

      // 先检查可咨询时间是否已选择
      if (!counselorAvailableTimeSlots.value || counselorAvailableTimeSlots.value.length === 0) {
        message.error('请选择可咨询时间');
        counselorModalApi.setState({ loading: false });
        return;
      }

      // 在验证前设置可咨询时间数据到表单中
      counselorFormApi.setValues({
        availableTimeSlots: counselorAvailableTimeSlots.value,
      });

      const validationResult = await counselorFormApi.validate();
      if (!validationResult.valid) {
        counselorModalApi.setState({ loading: false });
        return;
      }

      const formValues = await counselorFormApi.getValues();

      // 将可咨询时间数据合并到表单数据中
      const submitData = {
        ...formValues,
        availableTimeSlots: counselorAvailableTimeSlots.value,
      };

      if (counselorModalMode.value === 'add') {
        // 新增咨询师：调用创建API
        const apiData = adaptFormDataToApi(submitData);

        await createCounselorApi(apiData);
        message.success('新增咨询师成功');
      } else {
        // 编辑咨询师：调用编辑API
        if (!currentEditCounselor.value?.id) {
          throw new Error('缺少咨询师ID，无法进行编辑');
        }

        const editApiData = adaptFormDataToEditApi(submitData, currentEditCounselor.value.id);

        await editCounselorApi(editApiData);
        message.success('编辑咨询师成功');
      }

      // 关闭弹窗
      counselorModalApi.close();

      // 重置表单
      counselorFormApi.resetForm();
      counselorAvailableTimeSlots.value = [];

      // 刷新列表
      gridApi.query();
    }finally {
      // 关闭loading
      counselorModalApi.setState({ loading: false });
    }
  },
  onCancel: () => {
    counselorFormApi.resetForm();
    counselorModalApi.close();
    currentEditCounselor.value = null;
    counselorAvailableTimeSlots.value = [];
  },
});

// 新增咨询师按钮点击事件
const handleCreate = () => {
  counselorModalMode.value = 'add';
  currentEditCounselor.value = null;

  // 重置表单并打开弹窗
  counselorFormApi.resetForm();
  counselorAvailableTimeSlots.value = [];

  // 初始化可咨询时间字段用于验证
  counselorFormApi.setValues({
    availableTimeSlots: [],
  });

  counselorModalApi.open();

  // 设置弹窗标题
  counselorModalApi.setState({
    title: '新增咨询师',
  });
};

// 新增咨询时长按钮点击事件
const handleAddDuration = () => {
  if (!currentCounselorId.value) {
    message.warning('请先选择咨询师');
    return;
  }

  // 设置为新增模式
  durationModalMode.value = 'add';

  // 更新表单Schema为编辑模式
  durationFormApi.updateSchema(getDurationFormSchema(false));

  // 重置表单并打开弹窗
  durationFormApi.resetForm();
  durationModalApi.open();

  // 动态设置弹窗标题和按钮
  durationModalApi.setState({
    title: '新增咨询时长',
    showConfirmButton: true,
    cancelText: '取消',
  });
};

// Excel导入相关函数
const handleExcelImport = () => {
  importModalVisible.value = true;
};

const closeImportModal = () => {
  importModalVisible.value = false;
};

// 显示导入结果
const showImportResult = () => {
  importResultVisible.value = true;
};

// 关闭导入结果弹窗
const closeImportResult = () => {
  importResultVisible.value = false;
  // 重置结果数据
  importResult.value = {
    success_count: 0,
    error_count: 0,
    total_count: 0,
    server_message: undefined
  };
};


// 自定义上传处理
const customUpload = async (options: any) => {
  const { file, onSuccess, onError } = options;

  // 验证文件类型
  const isExcel =
    file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel';

  if (!isExcel) {
    message.error('只能上传Excel文件(.xlsx, .xls)!');
    onError(new Error('文件类型错误'));
    return;
  }

  // 验证文件大小
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB!');
    onError(new Error('文件大小超限'));
    return;
  }

  uploadLoading.value = true;

  try {
    // 调用真实的导入API
    const response: ImportCounselorResponse = await importCounselorExcelApi(file);
    
    // 打印响应内容用于调试
    console.log('导入API响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应code:', response?.code);
    console.log('响应message:', response?.message);
    
    // 验证响应是否有效
    if (!response || typeof response !== 'object') {
      throw new Error('API返回无效响应');
    }
    
    // 处理导入结果
    let successCount = 0;
    let errorCount = 0;
    
    // 从 message 中解析成功数量，如："成功导入5条咨询师记录"
    if (response.message) {
      const successMatch = response.message.match(/成功导入(\d+)条/);
      if (successMatch && successMatch[1]) {
        successCount = parseInt(successMatch[1], 10);
      } else {
        // 如果无法解析数量，但响应成功，至少设置为1
        successCount = (response.code === 200 || response.code === 201) ? 1 : 0;
      }
      
      // 检查message中是否包含失败信息
      const failureMatch = response.message.match(/失败(\d+)条/);
      if (failureMatch && failureMatch[1]) {
        errorCount = parseInt(failureMatch[1], 10);
      } else {
        errorCount = 0;
      }
    } else {
      // 没有message时的处理
      if (response.code === 200 || response.code === 201) {
        successCount = 1;
        errorCount = 0;
      } else {
        successCount = 0;
        errorCount = 1;
      }
    }
    
    // 准备结果数据
    importResult.value = {
      success_count: successCount,
      error_count: errorCount,
      total_count: successCount + errorCount,
      server_message: response.message || (response.code === 200 ? '导入成功' : '导入失败')
    };

    // 关闭导入弹窗
    closeImportModal();
    
    // 显示导入结果
    showImportResult();

    // 刷新列表（如果有成功导入的数据）
    if (successCount > 0) {
      gridApi.query();
    }

    onSuccess();
  } catch (error: any) {
    console.error('导入失败:', error);
    
    // 解析错误信息
    let errorMessage = '导入失败，请重试';
    
    // 如果是ImportCounselorResponse类型的错误（来自API函数的错误处理）
    if (error && typeof error === 'object' && error.code && error.message) {
      errorMessage = error.message;
      
      // 显示导入结果（即使是错误也要显示）
      importResult.value = {
        success_count: 0,
        error_count: 1,
        total_count: 1,
        server_message: error.message
      };
      
      closeImportModal();
      showImportResult();
      
      onError(error);
      return;
    }
    
    // 处理其他类型的错误（网络错误等）
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    message.error(errorMessage);
    onError(error);
  } finally {
    uploadLoading.value = false;
  }
};

// 获取在线状态
const getOnlineStatus = (isOnline: boolean) => {
  return isOnline
    ? { color: 'green', text: '在线' }
    : { color: 'gray', text: '离线' };
};

// 获取审核状态
const getAuditStatus = (status: string) => {
  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待审核' },
    approved: { color: 'green', text: '审核通过' },
    rejected: { color: 'red', text: '审核不通过' },
  };
  return statusMap[status] || { color: 'gray', text: '未知' };
};

// 审核时长按钮
const handleAudit = (row: CounselingDurationRecord) => {
  currentAuditRecord.value = row;
  auditFormApi.resetForm();
  // 设置默认审核状态为通过
  auditFormApi.setValues({ auditStatus: 'approved' });
  auditModalApi.open();
};

// 查看咨询时长详情
const handleView = (row: CounselingDurationRecord) => {
  // 设置为查看模式
  durationModalMode.value = 'view';

  // 更新表单Schema为只读模式
  durationFormApi.updateSchema(getDurationFormSchema(true));

  // 准备表单数据
  const formData = {
    duration: row.duration,
    certificate: row.certificate
      ? [
          {
            url: row.certificate,
            name: '凭证图片',
            status: 'done',
            response: { file_url: row.certificate },
          },
        ]
      : [],
  };

  // 设置表单值并打开弹窗
  durationFormApi.setValues(formData);
  durationModalApi.open();

  // 动态设置弹窗标题和按钮
  durationModalApi.setState({
    title: '查看咨询时长',
    showConfirmButton: false,
    cancelText: '关闭',
  });
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq' },
    {
      field: 'counselorName',
      title: '咨询师名称',
      showOverflow: 'tooltip',
    },
    {
      field: 'school',
      title: '学校',
      showOverflow: 'tooltip',
    },
    {
      field: 'major',
      title: '专业',
      showOverflow: 'tooltip',
    },
    {
      field: 'personalIntro',
      title: '个人简介',
      showOverflow: 'tooltip',
    },
    {
      field: 'counselingDuration',
      title: '咨询时长',
      slots: { default: 'counselingDuration' },
    },
    {
      field: 'specialization',
      title: '擅长流派',
      showOverflow: 'tooltip',
    },
    {
      field: 'expertise',
      title: '擅长领域',
      showOverflow: 'tooltip',
    },
    {
      field: 'counselingMethod',
      title: '咨询方式',
      showOverflow: 'tooltip',
    },
    {
      field: 'location',
      title: '所在位置',
    },
    {
      field: 'settlementPrice',
      title: '结算价重',
      slots: { default: 'settlementPrice' },
    },
    {
      field: 'isOnline',
      title: '是否在线',
      slots: { default: 'isOnline' },
    },
    {
      field: 'actions',
      title: '操作',
      minWidth: 200,
      slots: { default: 'actions' },
    },
  ],
  height: 'auto',
  keepSource: true,
  autoResize: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getCounselorList({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
        return result;
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 咨询时长查看弹窗表单配置
const durationFormOptions: VbenFormProps = {
  collapsed: true,
  commonConfig: {
    labelWidth: 100,
  },
  schema: [], // 空数组表示不显示任何搜索条件
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: false,
};

// 咨询时长查看弹窗表格配置
const durationGridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'createTime',
      title: '创建时间',
      slots: { default: 'createTime' },
    },
    {
      field: 'duration',
      title: '小时',
      slots: { default: 'duration' },
    },
    {
      field: 'certificate',
      title: '凭证',
      slots: { default: 'certificate' },
    },
    {
      field: 'auditStatus',
      title: '审核状态',
      slots: { default: 'auditStatus' },
    },
    {
      field: 'operatorName',
      title: '操作人',
      showOverflow: 'tooltip',
    },
    {
      field: 'actions',
      title: '操作',
      slots: { default: 'durationActions' },
    },
  ],
  height: 600,
  keepSource: true,
  autoResize: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        if (!currentCounselorId.value) return { list: [], total: 0 };

        const result = await getCounselingDurationList({
          page: page.currentPage,
          size: page.pageSize,
          counselorId: currentCounselorId.value,
        });
        return result;
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [DurationGrid, durationGridApi] = useVbenVxeGrid({
  formOptions: durationFormOptions,
  gridOptions: durationGridOptions,
});

// 监听可咨询时间变化，同步到表单用于验证
watch(
  () => counselorAvailableTimeSlots.value,
  (newValue) => {
    // 只有在表单已经初始化时才设置值
    if (counselorFormApi) {
      counselorFormApi.setValues({
        availableTimeSlots: newValue,
      });
    }
  },
  { deep: true },
);

// 监听城市搜索相关状态变化，更新表单schema
watch(
  () => [cityOptions.value, citySearchLoading.value],
  () => {
    if (counselorFormApi) {
      counselorFormApi.updateSchema(getCounselorFormSchema());
    }
  },
  { deep: true },
);
</script>

<template>
  <Spin :spinning="spinning" tip="正在处理，请稍候...">
    <Page auto-content-height title="咨询师管理">
      <Grid>
        <template #toolbar-actions>
          <Button type="primary" class="mr-4" @click="handleCreate">
            新建
          </Button>
          <Button class="mr-4" @click="handleExcelImport"> excel导入 </Button>
        </template>

        <template #counselingDuration="{ row }">
          <span>{{ row.counselingDuration }}小时</span>
        </template>

        <template #settlementPrice="{ row }">
          <span class="font-medium text-green-600">
            ¥{{ row.settlementPrice }}
          </span>
        </template>

        <template #isOnline="{ row }">
          <Tag :color="getOnlineStatus(row.isOnline).color">
            {{ getOnlineStatus(row.isOnline).text }}
          </Tag>
        </template>

        <template #actions="{ row }">
          <Space>
            <Button type="link" size="small" @click="handleViewDuration(row)">
              咨询时长
            </Button>
            <Popconfirm
              v-if="row.status === 'enabled'"
              title="确定要停用这个咨询师吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleToggleStatus(row)"
            >
              <Button type="link" size="small">停用</Button>
            </Popconfirm>
            <Popconfirm
              v-else
              title="确定要启用这个咨询师吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleToggleStatus(row)"
            >
              <Button type="link" size="small">启用</Button>
            </Popconfirm>
            <Button type="link" size="small" @click="handleEdit(row)">
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个咨询师吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="() => handleDelete(row)"
            >
              <Button type="link" danger size="small"> 删除 </Button>
            </Popconfirm>
          </Space>
        </template>
      </Grid>
    </Page>

    <!-- 咨询时长查看弹窗 -->
    <Modal
      v-model:open="durationModalVisible"
      :title="`${currentCounselorName} - 咨询时长`"
      width="70vw"
      @cancel="closeDurationModal"
      @ok="handleDurationModalConfirm"
    >
      <div style="padding: 20px 0; min-height: 65vh">
        <DurationGrid>
          <template #toolbar-actions>
            <Button type="primary" @click="handleAddDuration"> 新增 </Button>
          </template>

          <template #createTime="{ row }">
            <span>
              {{ dayjs(row.createTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
            </span>
          </template>

          <template #duration="{ row }">
            <span class="font-medium text-blue-600">
              {{ row.duration }}小时
            </span>
          </template>

          <template #certificate="{ row }">
            <div v-if="row.certificate">
              <a :href="row.certificate" target="_blank">
                <Button type="link" size="small">查看</Button>
              </a>
            </div>
            <div v-else class="text-gray-400">暂无凭证</div>
          </template>

          <template #auditStatus="{ row }">
            <Tag :color="getAuditStatus(row.auditStatus).color">
              {{ getAuditStatus(row.auditStatus).text }}
            </Tag>
          </template>

          <template #durationActions="{ row }">
            <Space>
              <Button type="link" size="small" @click="handleView(row)">
                查看
              </Button>
              <Button
                v-if="row.auditStatus === 'pending'"
                type="link"
                size="small"
                @click="handleAudit(row)"
              >
                审核
              </Button>
            </Space>
          </template>
        </DurationGrid>
      </div>
    </Modal>

    <!-- Excel导入弹窗 -->
    <Modal
      v-model:open="importModalVisible"
      title="Excel批量导入咨询师"
      :footer="null"
      width="600px"
      @cancel="closeImportModal"
    >
      <div style="padding: 20px 0">
        <Alert
          message="导入说明"
          type="info"
          show-icon
          class="mb-4"
        >
          <template #description>
            <div class="space-y-3">
              <p>选择Excel文件直接上传导入，支持.xlsx和.xls格式，文件大小不超过10MB</p>
            </div>
          </template>
        </Alert>

        <Upload.Dragger
          :custom-request="customUpload"
          :multiple="false"
          accept=".xlsx,.xls"
          :show-upload-list="false"
        >
          <div class="p-8">
            <div class="mb-4">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <p class="text-lg">
              <span v-if="uploadLoading">正在导入...</span>
              <span v-else>点击或拖拽Excel文件到此处导入</span>
            </p>
            <p class="text-gray-500">支持 .xlsx、.xls 格式，最大10MB</p>
          </div>
        </Upload.Dragger>
      </div>
    </Modal>

    <!-- 导入结果弹窗 -->
    <Modal
      v-model:open="importResultVisible"
      title="导入结果"
      width="600px"
      @cancel="closeImportResult"
      @ok="closeImportResult"
    >
      <template #footer>
        <Button type="primary" @click="closeImportResult">确定</Button>
      </template>
      
      <div style="padding: 20px 0">
        <!-- 服务器消息 -->
        <div v-if="importResult.server_message" class="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <span class="text-blue-800 dark:text-blue-200 font-medium">{{ importResult.server_message }}</span>
          </div>
        </div>

      </div>
    </Modal>
    <!-- 咨询时长弹窗（统一处理新增和查看） -->
    <DurationModal class="w-[500px]" :z-index="9999">
      <DurationForm />
    </DurationModal>

    <!-- 审核弹窗 -->
    <AuditModal class="w-[40vw]" :z-index="9999">
      <AuditForm />
    </AuditModal>

    <!-- 咨询师弹窗 -->
    <CounselorModal class="w-[70vw]" style="max-width: 1200px">
      <div class="counselor-form-container">
        <CounselorForm>
          <template #availableTimeSlots>
            <div class="mt-4">
              <FullCalendarWeekPicker
                v-model="counselorAvailableTimeSlots"
                :current-week="new Date()"
              >
                <template #extra="{ selectedTimeSlots }">
                  <div
                    class="mt-4 w-full max-w-none rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20"
                  >
                    <div class="text-sm text-green-700 dark:text-green-300">
                      <p class="mb-2 font-medium">已选择时间段：</p>
                      <div class="space-y-1 text-xs">
                        <div
                          v-for="slot in selectedTimeSlots"
                          :key="`${slot.day}-${slot.startHour}-${slot.endHour}`"
                        >
                          {{
                            [
                              '周一',
                              '周二',
                              '周三',
                              '周四',
                              '周五',
                              '周六',
                              '周日',
                            ][slot.day]
                          }}： {{ String(slot.startHour).padStart(2, '0') }}:{{
                            String(slot.startMinute || 0).padStart(2, '0')
                          }}
                          - {{ String(slot.endHour).padStart(2, '0') }}:{{
                            String(slot.endMinute || 0).padStart(2, '0')
                          }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </FullCalendarWeekPicker>
            </div>
          </template>
        </CounselorForm>
      </div>
    </CounselorModal>
  </Spin>
</template>
