<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Spin, Switch, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getEvaluationListApi } from '#/api/core';

defineOptions({
  name: 'EvaluationManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 弹窗相关状态
const modalVisible = ref(false);
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

// 数据查看弹窗相关状态
const dataModalVisible = ref(false);
const dataModalLoading = ref(false);
const currentEvaluationId = ref<number | null>(null);
const currentEvaluationName = ref('');

// 评价详情弹窗相关状态
const detailModalVisible = ref(false);
const currentDetailData = ref<EvaluationDataRecord | null>(null);
const currentEvaluationDimensions = ref<Array<{
  id: number;
  title: string;
  question: string;
  score: number;
}>>([]);

// 滚动容器 ref
const modulesListRef = ref<HTMLElement>();

// 表单 ref
const formRef = ref();

// 评价模块类型定义
interface EvaluationModule {
  id: string;
  evaluationType: string | undefined;
  title: string;
  isRequired: boolean;
}

// 弹窗表单数据
const formData = reactive({
  evaluationName: '',
  modules: [] as EvaluationModule[],
  isPublished: false,
});

// 评价类型选项
const evaluationTypeOptions = [
  { label: '服务质量评价', value: 'service_quality' },
  { label: '产品体验评价', value: 'product_experience' },
  { label: '课程内容评价', value: 'course_content' },
  { label: '客服服务评价', value: 'customer_service' },
  { label: '平台功能评价', value: 'platform_function' },
  { label: '活动满意度评价', value: 'activity_satisfaction' },
];

// 类型定义
interface EvaluationData {
  id: number;
  name: string;                    // 评价名称
  type: string;                    // 评价类型
  title: string;                   // 评价标题
  content: string;                 // 评价内容
  rating: number;                  // 总评分
  service_rating: number;          // 服务评分
  professional_rating: number;     // 专业评分
  attitude_rating: number;         // 态度评分
  environment_rating: number;      // 环境评分
  target_id: number;               // 评价目标ID
  target_name: string;             // 评价目标名称
  evaluator_id: number;            // 评价人 ID
  evaluator_name: string;          // 评价人名称
  publishStatus: 'published' | 'unpublished';
  status: 'approved' | 'pending';
  reviewer_name: string;           // 审核人名称
  review_time: string;             // 审核时间
  review_comment: string;          // 审核意见
  helpful_count: number;           // 有用投票数
  unhelpful_count: number;         // 无用投票数
  reply_count: number;             // 回复数量
  is_anonymous: boolean;           // 是否匿名
  is_required: boolean;            // 是否必填
  is_published: boolean;           // 是否发布
  created_at: string;              // 创建时间
}


// 评价数据相关类型定义
interface EvaluationDataRecord {
  id: number;
  consultantName: string;
  evaluationTime: number;
  evaluationScore: number;
  comment?: string;
  evaluatorName: string;
  evaluatorId: number;
  evaluationId: number;
}

interface EvaluationDataSearchParams {
  page?: number;
  size?: number;
  consultantName?: string;
  evaluatorName?: string;
  evaluationStartTime?: number;
  evaluationEndTime?: number;
  evaluationId: number;
}

interface EvaluationDataApiResponse {
  list: EvaluationDataRecord[];
  total: number;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 130,
  },
  fieldMappingTime: [['rangePicker', ['start_time', 'end_time']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '评价名称',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      fieldName: 'creator',
      label: '创建人',
      componentProps: {
        placeholder: '请输入创建人姓名',
      },
    },
    {
      component: 'Select',
      fieldName: 'publishStatus',
      label: '状态',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '已发布', value: 'published' },
          { label: '未发布', value: 'unpublished' },
        ],
      },
    },
    {
      component: 'RangePicker',
      defaultValue: undefined,
      fieldName: 'rangePicker',
      label: '创建时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ],
  showCollapseButton: true,
  submitOnChange: false,
  submitOnEnter: true,
};

// 获取评价列表
const getEvaluationList = getEvaluationListApi;

// 评价数据API - 调用真实API
const getEvaluationDataList = async (params: EvaluationDataSearchParams): Promise<EvaluationDataApiResponse> => {
  // TODO: 需要在evaluation.ts中添加对应的API方法
  // 暂时返回空数据，等待后端API实现
  console.log('评价数据查询参数:', params);
  return {
    list: [],
    total: 0,
  };
};

// 操作函数
const handleViewData = (row: EvaluationData) => {
  currentEvaluationId.value = row.id;
  currentEvaluationName.value = row.name;
  dataModalVisible.value = true;
  dataModalLoading.value = true;

  // 延迟执行查询，确保弹窗打开后再加载数据
  setTimeout(() => {
    dataGridApi.query();
    // 模拟加载完成
    setTimeout(() => {
      dataModalLoading.value = false;
    }, 500);
  }, 100);
};

// 获取评价维度数据
const getEvaluationDimensions = (recordId: number) => {
  const dimensionsData = {
    1: [5, 5, 5, 5], // 优秀评价
    2: [4, 4, 5, 4], // 良好评价
    3: [5, 4, 5, 5], // 很好评价
    4: [4, 5, 4, 5], // 良好评价
    5: [5, 5, 5, 5], // 优秀评价
    6: [4, 4, 4, 4], // 一般评价
    7: [5, 4, 5, 4], // 良好评价
    8: [4, 5, 4, 5], // 良好评价
  };

  const scores = dimensionsData[recordId as keyof typeof dimensionsData] || [4, 4, 4, 4];

  return [
    {
      id: 1,
      title: '信任与连接',
      question: '我认为我的咨询师是值得信赖的，我能在一个安全、不受评判的氛围中坦诚地表达自己的想法和感受；',
      score: scores[0] || 4,
    },
    {
      id: 2,
      title: '专业与目标',
      question: '咨询师能清晰地理解我的核心问题，并和我一起制定了明确、可行的咨询目标和计划；',
      score: scores[1] || 4,
    },
    {
      id: 3,
      title: '赋能与效果',
      question: '通过咨询，我获得了新的视角、知识或技巧，这帮助我更好地应对当前面临的挑战；',
      score: scores[2] || 4,
    },
    {
      id: 4,
      title: '倾听与沟通',
      question: '我的咨询师能够积极、专注地倾听，并能用易于理解的方式与我沟通。',
      score: scores[3] || 4,
    },
  ];
};

// 查看评价详情
const handleViewDetail = (row: EvaluationDataRecord) => {
  currentDetailData.value = row;
  currentEvaluationDimensions.value = getEvaluationDimensions(row.id);
  detailModalVisible.value = true;
};

// 关闭评价详情弹窗
const closeDetailModal = () => {
  detailModalVisible.value = false;
  currentDetailData.value = null;
  currentEvaluationDimensions.value = [];
};

// 关闭数据查看弹窗
const closeDataModal = () => {
  dataModalVisible.value = false;
  currentEvaluationId.value = null;
  currentEvaluationName.value = '';
};

const handlePublish = (row: EvaluationData) => {
  console.log('发布/撤回:', row);
  const action = (row.status === 'approved' || row.publishStatus === 'published') ? '撤回' : '发布';

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: `评价${action}成功`,
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleEdit = (row: EvaluationData) => {
  openEditModal(row);
};

const handleDelete = (row: EvaluationData) => {
  console.log('删除评价:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: '评价删除成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

// 生成唯一ID
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// 创建新模块
const createNewModule = (): EvaluationModule => ({
  id: generateId(),
  evaluationType: undefined,
  title: '',
  isRequired: false,
});

// 添加模块
const addModule = async () => {
  // 只有在有现有模块时才校验现有模块数据完整性
  if (formData.modules.length > 0) {
    try {
      // 使用表单校验来显示红色错误信息
      await formRef.value?.validateFields(
        formData.modules.map((_, index) => [
          ['modules', index, 'evaluationType'],
          ['modules', index, 'title']
        ]).flat()
      );
    } catch (error) {
      // 校验失败，不添加新模块，让用户看到红色校验信息
      return;
    }
  }

  // 如果校验通过（或没有现有模块），添加新模块
  formData.modules.push(createNewModule());

  // 等待 DOM 更新后滚动到新添加的模块位置
  await nextTick();
  if (modulesListRef.value) {
    modulesListRef.value.scrollTo({
      top: modulesListRef.value.scrollHeight,
      behavior: 'smooth'
    });
  }
};

// 删除模块
const removeModule = (id: string) => {
  const index = formData.modules.findIndex(module => module.id === id);
  if (index > -1) {
    formData.modules.splice(index, 1);
  }
};

// 弹窗相关函数
const resetFormData = () => {
  formData.evaluationName = '';
  formData.modules = [createNewModule()];
  formData.isPublished = false;
  editingId.value = null;
};

const openCreateModal = async () => {
  resetFormData();
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const openEditModal = async (row: EvaluationData) => {
  resetFormData();
  editingId.value = row.id;
  formData.evaluationName = row.name;
  formData.isPublished = (row.status === 'approved' || row.publishStatus === 'published');

  // 创建一个示例模块（实际项目中应该从后端获取）
  const exampleModule = createNewModule();
  exampleModule.title = row.title;
  exampleModule.isRequired = row.is_required;

  // 根据评价类型设置模块类型
  if (row.type) {
    exampleModule.evaluationType = row.type;
  } else {
    // 如果没有type字段，根据名称推断
    if (row.name.includes('服务')) {
      exampleModule.evaluationType = 'service_quality';
    } else if (row.name.includes('体验')) {
      exampleModule.evaluationType = 'product_experience';
    } else if (row.name.includes('课程')) {
      exampleModule.evaluationType = 'course_content';
    } else if (row.name.includes('客服')) {
      exampleModule.evaluationType = 'customer_service';
    } else if (row.name.includes('平台')) {
      exampleModule.evaluationType = 'platform_function';
    } else {
      exampleModule.evaluationType = 'activity_satisfaction';
    }
  }

  formData.modules = [exampleModule];
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

    // 额外校验：确保至少有一个模块
    if (formData.modules.length === 0) {
      message.error('请至少添加一个评价模块');
      return;
    }

    modalLoading.value = true;

    // 模拟API请求
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const action = editingId.value ? '编辑' : '新增';
    message.success(`${action}评价成功`);

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

// 获取状态标签
const getStatusTag = (status: string) => {
  const statusMap = {
    // API返回的状态映射
    published: { color: 'green', text: '已发布' },
    unpublished: { color: 'orange', text: '未发布' },
    // 兼容可能的其他字段名
    approved: { color: 'green', text: '已发布' },
    pending: { color: 'orange', text: '未发布' },
  };
  return statusMap[status as keyof typeof statusMap] || { color: 'orange', text: '未发布' };
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'name',
      title: '评价名称',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'title',
      title: '评价题目',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
      slots: { default: 'createTime' },
    },
    {
      field: 'evaluator_name',
      title: '创建人',
      width: 100,
    },
    {
      field: 'review_time',
      title: '发布的时间',
      width: 180,
      slots: { default: 'publishTime' },
    },
    {
      field: 'status',
      title: '发布状态',
      width: 120,
      slots: { default: 'publishStatus' },
    },
    {
      field: 'helpful_count',
      title: '评价数',
      width: 100,
      slots: { default: 'evaluationCount' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 250,
      slots: { default: 'actions' },
    },
  ],
  height: 'auto',
  keepSource: true,
  autoResize: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'data',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getEvaluationList({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
          // 处理时间范围搜索
          start_time: formValues.start_time
            ? Math.floor((Date.parse(formValues.start_time) - 28800000) / 1000)
            : undefined,
          end_time: formValues.end_time
            ? Math.floor((Date.parse(formValues.end_time) - 28800000) / 1000) + 86399
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

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 数据查看弹窗搜索表单配置
const dataFormOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 100,
  },
  fieldMappingTime: [['evaluationRangePicker', ['evaluationStartTime', 'evaluationEndTime']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'consultantName',
      label: '咨询师',
      componentProps: {
        placeholder: '请输入咨询师姓名',
      },
    },
    {
      component: 'Input',
      fieldName: 'evaluatorName',
      label: '评价人',
      componentProps: {
        placeholder: '请输入评价人姓名',
      },
    },
    {
      component: 'RangePicker',
      defaultValue: undefined,
      fieldName: 'evaluationRangePicker',
      label: '评价时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

// 数据查看弹窗表格配置
const dataGridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq' },
    {
      field: 'consultantName',
      title: '咨询师',
      showOverflow: 'tooltip',
    },
    {
      field: 'evaluatorName',
      title: '评价人',
      showOverflow: 'tooltip',
    },
    {
      field: 'evaluationTime',
      title: '评价时间',
      slots: { default: 'dataEvaluationTime' },
    },
    {
      field: 'evaluationScore',
      title: '评价分数',
      slots: { default: 'dataEvaluationScore' },
    },
    {
      field: 'comment',
      title: '评价内容',
      showOverflow: 'tooltip',
    },
    {
      field: 'actions',
      title: '操作',
      slots: { default: 'dataActions' },
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
      query: async ({ page }, formValues) => {
        if (!currentEvaluationId.value) return { list: [], total: 0 };

        const result = await getEvaluationDataList({
          page: page.currentPage,
          size: page.pageSize,
          evaluationId: currentEvaluationId.value,
          consultantName: formValues.consultantName,
          evaluatorName: formValues.evaluatorName,
          // 处理时间范围搜索
          evaluationStartTime: formValues.evaluationStartTime
            ? (Date.parse(formValues.evaluationStartTime) - 28800000) / 1000
            : undefined,
          evaluationEndTime: formValues.evaluationEndTime
            ? (Date.parse(formValues.evaluationEndTime) - 28800000) / 1000 + 86399
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

const [DataGrid, dataGridApi] = useVbenVxeGrid({
  formOptions: dataFormOptions,
  gridOptions: dataGridOptions,
});
</script>

<template>
  <Spin :spinning="spinning" tip="正在处理，请稍候...">
    <Page auto-content-height title="评价管理">
    <Grid>
      <template #toolbar-actions>
        <Button type="primary" class="mr-4" @click="handleCreate">
          新建
        </Button>
      </template>

      <template #createTime="{ row }">
        <span>
          {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>

      <template #publishTime="{ row }">
        <span v-if="row.review_time">
          {{ dayjs(row.review_time).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-300">-</span>
      </template>

      <template #publishStatus="{ row }">
        <Tag :color="getStatusTag(row.status).color">
          {{ getStatusTag(row.status).text }}
        </Tag>
      </template>

      <template #evaluationCount="{ row }">
        <span class="font-semibold text-blue-600 dark:text-blue-400">
          {{ row.helpful_count }}
        </span>
      </template>

      <template #actions="{ row }">
        <Space>
          <Button
            type="link"
            size="small"
            @click="handleViewData(row)"
          >
            数据
          </Button>
          <Popconfirm
            v-if="row.status === 'approved' || row.publishStatus === 'published'"
            title="确定要撤回这个评价吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handlePublish(row)"
          >
            <Button type="link" size="small"> 撤回 </Button>
          </Popconfirm>
          <Button
            v-else
            type="link"
            size="small"
            @click="handlePublish(row)"
          >
            发布
          </Button>
          <Button
            type="link"
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个评价吗？"
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
    :title="editingId ? '编辑评价' : '新增评价'"
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
        label="评价名称"
        name="evaluationName"
        :rules="[{ required: true, message: '请输入评价名称' }]"
      >
        <Input
          v-model:value="formData.evaluationName"
          placeholder="请输入评价名称"
        />
      </Form.Item>

      <!-- 动态模块列表 -->
      <div class="modules-section">
        <div class="modules-header">
          <Button
            type="primary"
            size="small"
            @click="addModule"
          >
            新增
          </Button>
        </div>

        <div ref="modulesListRef" class="modules-list">
          <div v-if="formData.modules.length === 0" class="empty-modules">
            <div class="empty-text">
              暂无评价模块，请点击上方"新增"按钮添加模块
            </div>
          </div>
          <div
            v-for="(module, index) in formData.modules"
            :key="module.id"
            class="module-item"
          >
            <div class="module-content">
              <Form.Item
                :label="`评价类型 ${index + 1}`"
                :name="['modules', index, 'evaluationType']"
                :rules="[{ required: true, message: '请选择评价类型' }]"
              >
                <Select
                  v-model:value="module.evaluationType"
                  placeholder="请选择类型"
                  :options="evaluationTypeOptions"
                />
              </Form.Item>

              <Form.Item
                :label="`标题 ${index + 1}`"
                :name="['modules', index, 'title']"
                :rules="[{ required: true, message: '请输入标题' }]"
              >
                <Input
                  v-model:value="module.title"
                  placeholder="请输入标题"
                />
              </Form.Item>

              <Form.Item :label="`是否必填 ${index + 1}`">
                <Switch v-model:checked="module.isRequired" />
              </Form.Item>
            </div>

            <div class="module-actions">
              <Button
                danger
                size="small"
                @click="removeModule(module.id)"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Form.Item label="是否发布">
        <Switch v-model:checked="formData.isPublished" />
      </Form.Item>
    </Form>
  </Modal>

  <!-- 数据查看弹窗 -->
  <Modal
    v-model:open="dataModalVisible"
    :title="`${currentEvaluationName} - 评价数据`"
    :footer="null"
    width="80vw"
    @cancel="closeDataModal"
  >
      <div style="padding: 20px 0; min-height: 65vh;">
        <DataGrid>
        <template #dataEvaluationTime="{ row }">
          <span>
            {{ dayjs(row.evaluationTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
        </template>

        <template #dataEvaluationScore="{ row }">
          <span
            :class="[
              'font-semibold',
              row.evaluationScore >= 90 ? 'text-green-600' :
              row.evaluationScore >= 80 ? 'text-blue-600' :
              row.evaluationScore >= 70 ? 'text-orange-600' : 'text-red-600'
            ]"
          >
            {{ row.evaluationScore }}分
          </span>
        </template>

        <template #dataActions="{ row }">
          <Button
            type="link"
            size="small"
            @click="handleViewDetail(row)"
          >
            详情
          </Button>
        </template>
        </DataGrid>
      </div>
  </Modal>

  <!-- 评价详情弹窗 -->
  <Modal
    v-model:open="detailModalVisible"
    title="评价详情"
    :footer="null"
    width="60vw"
    @cancel="closeDetailModal"
  >
    <div class="h-[75vh] overflow-y-auto md:py-5 py-2.5 leading-relaxed bg-transparent dark:text-gray-300">
      <div class="mb-5">
        <div
          v-for="(dimension, index) in currentEvaluationDimensions"
          :key="dimension.id"
          class="border-2 border-blue-500 rounded-lg md:p-5 p-4 mb-5 bg-white dark:bg-gray-800"
        >
          <div class="text-blue-600 dark:text-blue-400 font-bold text-base mb-4">
            {{ index + 1 }}、{{ dimension.title }}
          </div>

          <div class="mb-5 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            <span class="font-medium dark:text-gray-200">问题：</span>{{ dimension.question }}
          </div>

          <div class="flex justify-center my-5">
            <span
              v-for="star in 5"
              :key="star"
              class="md:text-2xl text-xl mx-0.5 transition-colors duration-200"
              :class="star <= dimension.score ? 'text-yellow-400' : 'text-gray-300'"
            >
              ★
            </span>
          </div>
        </div>
      </div>
    </div>
  </Modal>
  </Spin>

</template>

<style scoped>
.modules-section {
  margin: 20px 0;
}

.modules-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 16px;
}

.modules-list {
  max-height: 400px;
  overflow-y: auto;
  space-y: 16px;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background-color: #fafafa;
  scroll-behavior: smooth;
}

.dark .modules-list {
  border-color: #374151;
  background-color: #242424;
}

/* 自定义滚动条样式 */
.modules-list::-webkit-scrollbar {
  width: 6px;
}

.modules-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dark .modules-list::-webkit-scrollbar-track {
  background: #242424;
}

.modules-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dark .modules-list::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.modules-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.dark .modules-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.empty-modules {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  padding: 20px;
}

.empty-text {
  color: #999;
  font-size: 14px;
  text-align: center;
}

.dark .empty-text {
  color: #a1a1aa;
}

.module-item {
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  background-color: #ffffff;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.dark .module-item {
  border-color: #4b5563;
  background-color: #242424;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.module-content {
  display: grid;
  grid-template-columns: 1fr 1fr 200px;
  gap: 16px;
  align-items: start;
}

.module-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.module-actions .ant-btn {
  min-width: 60px;
}
</style>
