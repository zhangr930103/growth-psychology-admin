<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Switch,
  Tag,
  Textarea,
  Select,
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

// 弹窗相关状态
const modalVisible = ref(false);
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

// 咨询时长数据查看弹窗相关状态
const durationModalVisible = ref(false);
const currentCounselorId = ref<number | null>(null);
const currentCounselorName = ref('');

// Excel导入相关状态
const importModalVisible = ref(false);
const uploadLoading = ref(false);

// 表单 ref
const formRef = ref();

// 弹窗表单数据
const formData = reactive({
  counselorName: '',
  school: '',
  major: '',
  personalIntro: '',
  specialization: '',
  expertise: '',
  counselingMethod: 'online',
  location: '',
  settlementPrice: '',
  isOnline: true,
});

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
interface CounselingRecord {
  id: number;
  clientName: string;
  sessionDate: number;
  duration: number; // 咨询时长(分钟)
  topic: string;
  counselorId: number;
}

interface CounselingRecordSearchParams {
  page?: number;
  size?: number;
  clientName?: string;
  sessionStartTime?: number;
  sessionEndTime?: number;
  counselorId: number;
}

interface CounselingRecordApiResponse {
  list: CounselingRecord[];
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

// 模拟咨询记录数据API
const getCounselingRecordList = async (
  params: CounselingRecordSearchParams,
): Promise<CounselingRecordApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockDataList: CounselingRecord[] = [
    {
      id: 1,
      clientName: '小张',
      sessionDate: dayjs().subtract(1, 'day').unix(),
      duration: 50,
      topic: '学习压力和焦虑情绪',
      counselorId: params.counselorId,
    },
    {
      id: 2,
      clientName: '小李',
      sessionDate: dayjs().subtract(3, 'day').unix(),
      duration: 45,
      topic: '人际关系困扰',
      counselorId: params.counselorId,
    },
    {
      id: 3,
      clientName: '小王',
      sessionDate: dayjs().subtract(5, 'day').unix(),
      duration: 60,
      topic: '情绪管理问题',
      counselorId: params.counselorId,
    },
    {
      id: 4,
      clientName: '小赵',
      sessionDate: dayjs().subtract(7, 'day').unix(),
      duration: 40,
      topic: '职场适应问题',
      counselorId: params.counselorId,
    },
    {
      id: 5,
      clientName: '小孙',
      sessionDate: dayjs().subtract(10, 'day').unix(),
      duration: 55,
      topic: '家庭关系调适',
      counselorId: params.counselorId,
    },
  ];

  // 模拟搜索过滤
  let filteredData = mockDataList;

  if (params.clientName) {
    filteredData = filteredData.filter((item) =>
      item.clientName.includes(params.clientName!),
    );
  }

  if (params.sessionStartTime && params.sessionEndTime) {
    filteredData = filteredData.filter(
      (item) =>
        item.sessionDate >= params.sessionStartTime! &&
        item.sessionDate <= params.sessionEndTime!,
    );
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

const handleEdit = (row: CounselorData) => {
  openEditModal(row);
};

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

// 弹窗相关函数
const resetFormData = () => {
  formData.counselorName = '';
  formData.school = '';
  formData.major = '';
  formData.personalIntro = '';
  formData.specialization = '';
  formData.expertise = '';
  formData.counselingMethod = 'online';
  formData.location = '';
  formData.settlementPrice = '';
  formData.isOnline = true;
  editingId.value = null;
};

const openCreateModal = async () => {
  resetFormData();
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const openEditModal = async (row: CounselorData) => {
  resetFormData();
  editingId.value = row.id;
  formData.counselorName = row.counselorName;
  formData.school = row.school;
  formData.major = row.major;
  formData.personalIntro = row.personalIntro;
  formData.specialization = row.specialization;
  formData.expertise = row.expertise;
  formData.counselingMethod = row.counselingMethod;
  formData.location = row.location;
  formData.settlementPrice = row.settlementPrice.toString();
  formData.isOnline = row.isOnline;

  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const closeModal = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
  resetFormData();
};

const handleSubmit = async () => {
  try {
    // 使用 Form 组件的内置校验
    await formRef.value?.validate();

    modalLoading.value = true;

    // 模拟API请求
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const action = editingId.value ? '编辑' : '新增';
    message.success(`${action}咨询师成功`);

    // 刷新列表
    gridApi.query();

    // 关闭弹窗
    closeModal();
  } catch (error) {
    // 校验失败时不做处理，表单会自动显示红色校验信息
    console.log('表单校验失败:', error);
  } finally {
    modalLoading.value = false;
  }
};

const handleCreate = () => {
  openCreateModal();
};

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
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('文件大小不能超过 5MB!');
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
    search: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 咨询时长查看弹窗搜索表单配置
const durationFormOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 100,
  },
  fieldMappingTime: [
    ['sessionRangePicker', ['sessionStartTime', 'sessionEndTime']],
  ],
  schema: [
    {
      component: 'Input',
      fieldName: 'clientName',
      label: '客户姓名',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'RangePicker',
      defaultValue: undefined,
      fieldName: 'sessionRangePicker',
      label: '咨询时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

// 咨询时长查看弹窗表格配置
const durationGridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'clientName',
      title: '客户姓名',
      showOverflow: 'tooltip',
    },
    {
      field: 'sessionDate',
      title: '咨询时间',
      slots: { default: 'sessionDate' },
    },
    {
      field: 'duration',
      title: '时长(分钟)',
      slots: { default: 'duration' },
    },
    {
      field: 'topic',
      title: '咨询主题',
      showOverflow: 'tooltip',
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
      query: async ({ page }, formValues) => {
        if (!currentCounselorId.value) return { list: [], total: 0 };

        const result = await getCounselingRecordList({
          page: page.currentPage,
          size: page.pageSize,
          counselorId: currentCounselorId.value,
          clientName: formValues.clientName,
          // 处理时间范围搜索
          sessionStartTime: formValues.sessionStartTime
            ? (Date.parse(formValues.sessionStartTime) - 28800000) / 1000
            : undefined,
          sessionEndTime: formValues.sessionEndTime
            ? (Date.parse(formValues.sessionEndTime) - 28800000) / 1000 + 86399
            : undefined,
        });
        return result;
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
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
            <Button
              v-if="row.status === 'enabled'"
              type="link"
              size="small"
              @click="handleToggleStatus(row)"
            >
              停用
            </Button>
            <Button
              v-else
              type="link"
              size="small"
              @click="handleToggleStatus(row)"
            >
              启用
            </Button>
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

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑咨询师' : '新增咨询师'"
      :confirm-loading="modalLoading"
      width="800px"
      @ok="handleSubmit"
      @cancel="closeModal"
    >
      <Form
        ref="formRef"
        :model="formData"
        layout="vertical"
        style="padding: 20px 0"
      >
        <Form.Item
          label="咨询师名称"
          name="counselorName"
          :rules="[{ required: true, message: '请输入咨询师名称' }]"
        >
          <Input
            v-model:value="formData.counselorName"
            placeholder="请输入咨询师名称"
          />
        </Form.Item>

        <Form.Item
          label="学校"
          name="school"
          :rules="[{ required: true, message: '请输入学校名称' }]"
        >
          <Input v-model:value="formData.school" placeholder="请输入学校名称" />
        </Form.Item>

        <Form.Item
          label="专业"
          name="major"
          :rules="[{ required: true, message: '请输入专业' }]"
        >
          <Input v-model:value="formData.major" placeholder="请输入专业" />
        </Form.Item>

        <Form.Item
          label="个人简介"
          name="personalIntro"
          :rules="[{ required: true, message: '请输入个人简介' }]"
        >
          <Textarea
            v-model:value="formData.personalIntro"
            placeholder="请输入个人简介（不超过500个字）"
            :rows="4"
          />
        </Form.Item>

        <Form.Item
          label="擅长流派"
          name="specialization"
          :rules="[{ required: true, message: '请输入擅长流派' }]"
        >
          <Input
            v-model:value="formData.specialization"
            placeholder="请输入擅长流派"
          />
        </Form.Item>

        <Form.Item
          label="擅长领域"
          name="expertise"
          :rules="[{ required: true, message: '请输入擅长领域' }]"
        >
          <Input
            v-model:value="formData.expertise"
            placeholder="请输入擅长领域，多个用逗号分隔"
          />
        </Form.Item>

        <Form.Item
          label="咨询方式"
          name="counselingMethod"
          :rules="[{ required: true, message: '请选择咨询方式' }]"
        >
          <Select
            v-model:value="formData.counselingMethod"
            placeholder="请选择咨询方式"
          >
            <Select.Option value="online">线上</Select.Option>
            <Select.Option value="offline">线下</Select.Option>
            <Select.Option value="both">线上+线下</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="所在位置"
          name="location"
          :rules="[{ required: true, message: '请输入所在位置' }]"
        >
          <Input
            v-model:value="formData.location"
            placeholder="请输入所在位置"
          />
        </Form.Item>

        <Form.Item
          label="结算价格"
          name="settlementPrice"
          :rules="[
            { required: true, message: '请输入结算价格' },
            { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入有效的价格' },
          ]"
        >
          <Input
            v-model:value="formData.settlementPrice"
            placeholder="请输入结算价格"
            addonBefore="¥"
          />
        </Form.Item>

        <Form.Item label="是否在线">
          <Switch v-model:checked="formData.isOnline" />
        </Form.Item>
      </Form>
    </Modal>

    <!-- 咨询时长查看弹窗 -->
    <Modal
      v-model:open="durationModalVisible"
      :title="`${currentCounselorName} - 咨询时长`"
      :footer="null"
      width="80vw"
      @cancel="closeDurationModal"
    >
      <div style="padding: 20px 0; min-height: 65vh">
        <DurationGrid>
          <template #sessionDate="{ row }">
            <span>
              {{ dayjs(row.sessionDate * 1000).format('YYYY-MM-DD HH:mm:ss') }}
            </span>
          </template>

          <template #duration="{ row }">
            <span class="font-medium text-blue-600">
              {{ row.duration }}分钟
            </span>
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
  </Spin>
</template>
