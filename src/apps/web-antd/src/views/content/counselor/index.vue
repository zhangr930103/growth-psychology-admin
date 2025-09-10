<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { useVbenForm, z } from '#/adapter/form';
import { upload_file } from '#/api/examples/upload';
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

defineOptions({
  name: 'CounselorManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 移除了弹窗相关状态

// 咨询时长数据查看弹窗相关状态
const durationModalVisible = ref(false);
const currentCounselorId = ref<number | null>(null);
const currentCounselorName = ref('');

// 咨询时长弹窗模式状态
const durationModalMode = ref<'add' | 'view'>('add');

// 审核弹窗相关状态
const currentAuditRecord = ref<CounselingDurationRecord | null>(null);

// 移除未使用的状态变量

// Excel导入相关状态
const importModalVisible = ref(false);
const uploadLoading = ref(false);

// 移除了表单相关状态

// 类型定义
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
}

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

// 模拟咨询师管理数据API
const getCounselorList = async (params: SearchParams): Promise<ApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: CounselorData[] = [
    {
      id: 1,
      counselorName: '姓名',
      school: '北京师范大学',
      major: '心理学',
      personalIntro:
        '拥有多年心理咨询经验，擅长认知行为疗法，专注于青少年心理健康问题的治疗和干预。',
      counselingDuration: 120,
      specialization: '认知行为疗法',
      expertise: '青少年心理、认知行为疗法',
      counselingMethod: '线上',
      location: '北京',
      settlementPrice: 200,
      isOnline: true,
      creatorName: '张三',
      createTime: dayjs().subtract(30, 'day').unix(),
      updateTime: dayjs().subtract(25, 'day').unix(),
      status: 'enabled',
    },
    {
      id: 2,
      counselorName: '李心理师',
      school: '华东师范大学',
      major: '应用心理学',
      personalIntro:
        '国家二级心理咨询师，专注于婚姻家庭治疗和情绪管理，帮助客户建立健康的人际关系。',
      counselingDuration: 85,
      specialization: '家庭系统治疗',
      expertise: '婚姻家庭、情绪管理',
      counselingMethod: '线上+线下',
      location: '上海',
      settlementPrice: 180,
      isOnline: true,
      creatorName: '李四',
      createTime: dayjs().subtract(25, 'day').unix(),
      updateTime: dayjs().subtract(20, 'day').unix(),
      status: 'enabled',
    },
    {
      id: 3,
      counselorName: '王咨询师',
      school: '中南大学',
      major: '临床心理学',
      personalIntro:
        '临床心理学硕士，擅长焦虑症、抑郁症的心理治疗，采用整合性治疗方法。',
      counselingDuration: 95,
      specialization: '整合式治疗',
      expertise: '焦虑症、抑郁症治疗',
      counselingMethod: '线下',
      location: '长沙',
      settlementPrice: 220,
      isOnline: false,
      creatorName: '王五',
      createTime: dayjs().subtract(20, 'day').unix(),
      status: 'disabled',
    },
    {
      id: 4,
      counselorName: '赵心理',
      school: '西南大学',
      major: '发展与教育心理学',
      personalIntro:
        '儿童青少年心理专家，在学习障碍、注意力缺陷等方面有丰富经验。',
      counselingDuration: 75,
      specialization: '游戏治疗',
      expertise: '儿童心理、学习障碍',
      counselingMethod: '线上',
      location: '重庆',
      settlementPrice: 160,
      isOnline: true,
      creatorName: '赵六',
      createTime: dayjs().subtract(15, 'day').unix(),
      updateTime: dayjs().subtract(10, 'day').unix(),
      status: 'enabled',
    },
    {
      id: 5,
      counselorName: '孙老师',
      school: '华中师范大学',
      major: '心理健康教育',
      personalIntro:
        '学校心理健康教育专家，专注于学生心理危机干预和心理健康促进工作。',
      counselingDuration: 110,
      specialization: '危机干预',
      expertise: '危机干预、心理健康教育',
      counselingMethod: '线上+线下',
      location: '武汉',
      settlementPrice: 150,
      isOnline: true,
      creatorName: '孙七',
      createTime: dayjs().subtract(12, 'day').unix(),
      status: 'enabled',
    },
  ];

  // 模拟搜索过滤
  let filteredData = mockData;

  if (params.counselorName) {
    filteredData = filteredData.filter((item) =>
      item.counselorName.includes(params.counselorName!),
    );
  }

  if (params.creator) {
    filteredData = filteredData.filter((item) =>
      item.creatorName.includes(params.creator!),
    );
  }

  if (params.status) {
    filteredData = filteredData.filter((item) => item.status === params.status);
  }

  // 模拟分页
  const { page = 1, size = 10 } = params;
  const total = filteredData.length;
  const start = (page - 1) * size;
  const end = start + size;
  const list = filteredData.slice(start, end);

  return {
    list,
    total,
  };
};

// 模拟咨询时长记录数据API
const getCounselingDurationList = async (
  params: CounselingDurationSearchParams,
): Promise<CounselingDurationApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockDataList: CounselingDurationRecord[] = [
    {
      id: 1,
      counselorId: params.counselorId,
      createTime: dayjs().subtract(1, 'day').unix(),
      duration: 2,
      certificate: 'https://picsum.photos/300/200?random=1',
      auditStatus: 'pending',
      operatorName: '管理员A',
      creatorName: '张三',
    },
    {
      id: 2,
      counselorId: params.counselorId,
      createTime: dayjs().subtract(3, 'day').unix(),
      duration: 1.5,
      certificate: 'https://picsum.photos/300/200?random=2',
      auditStatus: 'approved',
      operatorName: '管理员B',
      creatorName: '李四',
      auditTime: dayjs().subtract(2, 'day').unix(),
    },
    {
      id: 3,
      counselorId: params.counselorId,
      createTime: dayjs().subtract(5, 'day').unix(),
      duration: 3,
      auditStatus: 'rejected',
      operatorName: '管理员C',
      creatorName: '王五',
      auditTime: dayjs().subtract(4, 'day').unix(),
      auditComment: '凭证不清晰，请重新上传',
    },
    {
      id: 4,
      counselorId: params.counselorId,
      createTime: dayjs().subtract(7, 'day').unix(),
      duration: 2.5,
      certificate: 'https://picsum.photos/300/200?random=3',
      auditStatus: 'approved',
      operatorName: '管理员D',
      creatorName: '赵六',
      auditTime: dayjs().subtract(6, 'day').unix(),
    },
  ];

  // 直接返回所有数据，不做过滤
  let filteredData = mockDataList;

  // 模拟分页
  const { page = 1, size = 10 } = params;
  const total = filteredData.length;
  const start = (page - 1) * size;
  const end = start + size;
  const list = filteredData.slice(start, end);

  return {
    list,
    total,
  };
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

const handleToggleStatus = (row: CounselorData) => {
  console.log('切换状态:', row);
  const action = row.status === 'enabled' ? '停用' : '启用';

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: `咨询师${action}成功`,
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

// 已在下方重新定义handleEdit

const handleDelete = (row: CounselorData) => {
  console.log('删除咨询师:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: '咨询师删除成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

// 弹窗操作函数（已简化）
const handleEdit = (row: CounselorData) => {
  console.log('编辑咨询师', row.id);
  message.info('编辑功能已禁用');
};

// 咨询时长表单 Schema 配置（动态配置）
const getDurationFormSchema = (isReadonly = false) => [
  {
    component: 'InputNumber',
    fieldName: 'duration',
    label: '时长',
    rules: isReadonly ? undefined : z.number().min(0.1, '请输入有效的时长'),
    componentProps: {
      placeholder: '请输入咨询时长',
      min: 0,
      step: 0.5,
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
    },
    renderComponentContent: () => {
      return {
        default: () => isReadonly ? '查看图片' : '上传图片',
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

      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 获取上传凭证URL
      const certificateUrl = formValues.certificate?.[0]?.response?.file_url || '';

      console.log('新增咨询时长:', {
        counselorId: currentCounselorId.value,
        duration: formValues.duration,
        certificateUrl,
      });

      message.success('新增咨询时长成功');

      // 关闭弹窗
      durationModalApi.close();

      // 重置表单
      durationFormApi.resetForm();

      // 刷新列表
      durationGridApi.query();
    } catch (error) {
      console.error('提交失败:', error);
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

      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('审核咨询时长:', {
        recordId: currentAuditRecord.value?.id,
        auditStatus: formValues.auditStatus,
        auditComment: formValues.auditComment,
      });

      const statusText = formValues.auditStatus === 'approved' ? '审核通过' : '审核不通过';
      message.success(`${statusText}成功`);

      // 关闭弹窗
      auditModalApi.close();

      // 重置表单
      auditFormApi.resetForm();

      // 刷新列表
      durationGridApi.query();
    } catch (error) {
      console.error('审核失败:', error);
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

// 新增咨询师按钮点击事件
const handleCreate = () => {
  console.log('新增咨询师');
  message.info('新增功能已禁用');
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
    cancelText: '取消'
  });
};

// 移除重复定义

// Excel导入相关函数
const handleExcelImport = () => {
  importModalVisible.value = true;
};

const closeImportModal = () => {
  importModalVisible.value = false;
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
  const isLt5M = file.size / 1024 / 1024 < 10;
  if (!isLt5M) {
    message.error('文件大小不能超过 10MB!');
    onError(new Error('文件大小超限'));
    return;
  }

  uploadLoading.value = true;

  try {
    // 创建 FormData
    const formData = new FormData();
    formData.append('file', file);

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 在实际项目中，这里应该调用真实的导入接口
    // const response = await fetch('/api/counselor/import', {
    //   method: 'POST',
    //   body: formData,
    // });
    // const result = await response.json();

    message.success('Excel文件导入成功！');

    // 刷新列表
    gridApi.query();

    // 关闭弹窗
    closeImportModal();

    onSuccess();
  } catch (error) {
    console.error('导入失败:', error);
    message.error('导入失败，请重试');
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
  console.log('查看咨询时长详情', row.id);

  // 设置为查看模式
  durationModalMode.value = 'view';

  // 更新表单Schema为只读模式
  durationFormApi.updateSchema(getDurationFormSchema(true));

  // 准备表单数据
  const formData = {
    duration: row.duration,
    certificate: row.certificate ? [{
      url: row.certificate,
      name: '凭证图片',
      status: 'done',
      response: { file_url: row.certificate }
    }] : [],
  };

  // 设置表单值并打开弹窗
  durationFormApi.setValues(formData);
  durationModalApi.open();

  // 动态设置弹窗标题和按钮
  durationModalApi.setState({
    title: '查看咨询时长',
    showConfirmButton: false,
    cancelText: '关闭'
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

// 咨询时长查看弹窗表单配置 - 已移除搜索条件
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
  height: '60vh',
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
              @confirm="handleDelete(row)"
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
      :footer="null"
      width="70vw"
      @cancel="closeDurationModal"
    >
      <div style="padding: 20px 0; min-height: 65vh">
        <DurationGrid>
          <template #toolbar-actions>
            <Button type="primary" @click="handleAddDuration">
              新增
            </Button>
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
              <Button v-if="row.auditStatus === 'pending'" type="link" size="small"
                     @click="handleAudit(row)">
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
          description="选择Excel文件直接上传导入，支持.xlsx和.xls格式，文件大小不超过5MB"
          type="info"
          show-icon
          class="mb-4"
        />

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
            <p class="text-gray-500">支持 .xlsx、.xls 格式，最大5MB</p>
          </div>
        </Upload.Dragger>
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
  </Spin>
</template>
