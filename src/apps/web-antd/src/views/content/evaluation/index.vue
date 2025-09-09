<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Spin, Switch, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({
  name: 'EvaluationManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 弹窗相关状态
const modalVisible = ref(false);
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

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
  evaluationName: string;
  evaluationTitle: string;
  creatorName: string;
  creatorId: number;
  createTime: number;
  publishTime?: number;
  publishStatus: 'published' | 'unpublished' | 'draft';
  evaluationCount: number;
  status: 'active' | 'inactive';
}

interface SearchParams {
  page?: number;
  size?: number;
  evaluationName?: string;
  creator?: string;
  publishStatus?: string;
  createStartTime?: number;
  createEndTime?: number;
}

interface ApiResponse {
  list: EvaluationData[];
  total: number;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 130,
  },
  fieldMappingTime: [['rangePicker', ['createStartTime', 'createEndTime']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'evaluationName',
      label: '评价名称',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Select',
      fieldName: 'creator',
      label: '创建人',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '张三', value: '张三' },
          { label: '李四', value: '李四' },
          { label: '王五', value: '王五' },
          { label: '赵六', value: '赵六' },
        ],
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
          { label: '草稿', value: 'draft' },
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

// 模拟评价管理数据API
const getEvaluationList = async (params: SearchParams): Promise<ApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: EvaluationData[] = [
    {
      id: 1,
      evaluationName: '咨询师的评价',
      evaluationTitle: '咨询师服务质量评价表',
      creatorName: '张三',
      creatorId: 1,
      createTime: dayjs().subtract(30, 'day').unix(),
      publishTime: dayjs().subtract(25, 'day').unix(),
      publishStatus: 'published',
      evaluationCount: 156,
      status: 'active',
    },
    {
      id: 2,
      evaluationName: '服务体验评价',
      evaluationTitle: '整体服务体验满意度调查',
      creatorName: '李四',
      creatorId: 2,
      createTime: dayjs().subtract(20, 'day').unix(),
      publishTime: dayjs().subtract(15, 'day').unix(),
      publishStatus: 'published',
      evaluationCount: 89,
      status: 'active',
    },
    {
      id: 3,
      evaluationName: '平台功能评价',
      evaluationTitle: '平台功能使用体验反馈',
      creatorName: '王五',
      creatorId: 3,
      createTime: dayjs().subtract(15, 'day').unix(),
      publishStatus: 'unpublished',
      evaluationCount: 0,
      status: 'active',
    },
    {
      id: 4,
      evaluationName: '课程质量评价',
      evaluationTitle: '在线课程质量评估表',
      creatorName: '赵六',
      creatorId: 4,
      createTime: dayjs().subtract(10, 'day').unix(),
      publishStatus: 'draft',
      evaluationCount: 0,
      status: 'active',
    },
    {
      id: 5,
      evaluationName: '客服评价',
      evaluationTitle: '客服服务质量评价调查',
      creatorName: '孙七',
      creatorId: 5,
      createTime: dayjs().subtract(8, 'day').unix(),
      publishTime: dayjs().subtract(5, 'day').unix(),
      publishStatus: 'published',
      evaluationCount: 234,
      status: 'active',
    },
    {
      id: 6,
      evaluationName: '活动满意度',
      evaluationTitle: '线上活动参与满意度调研',
      creatorName: '周八',
      creatorId: 6,
      createTime: dayjs().subtract(5, 'day').unix(),
      publishStatus: 'unpublished',
      evaluationCount: 0,
      status: 'inactive',
    },
  ];

  // 模拟搜索过滤
  let filteredData = mockData;

  if (params.evaluationName) {
    filteredData = filteredData.filter((item) =>
      item.evaluationName.includes(params.evaluationName!),
    );
  }

  if (params.creator) {
    filteredData = filteredData.filter((item) =>
      item.creatorName.includes(params.creator!),
    );
  }

  if (params.publishStatus) {
    filteredData = filteredData.filter((item) =>
      item.publishStatus === params.publishStatus,
    );
  }

  if (params.createStartTime && params.createEndTime) {
    filteredData = filteredData.filter(
      (item) =>
        item.createTime >= params.createStartTime! &&
        item.createTime <= params.createEndTime!,
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
const handleViewData = (row: EvaluationData) => {
  console.log('查看数据:', row);
  message.info('查看评价数据功能正在开发中...');
};

const handlePublish = (row: EvaluationData) => {
  console.log('发布/撤回:', row);
  const action = row.publishStatus === 'published' ? '撤回' : '发布';

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
  formData.evaluationName = row.evaluationName;
  formData.isPublished = row.publishStatus === 'published';

  // 创建一个示例模块（实际项目中应该从后端获取）
  const exampleModule = createNewModule();
  exampleModule.title = row.evaluationTitle;
  exampleModule.isRequired = true;

  // 根据评价名称推断类型，这里简化处理
  if (row.evaluationName.includes('服务')) {
    exampleModule.evaluationType = 'service_quality';
  } else if (row.evaluationName.includes('体验')) {
    exampleModule.evaluationType = 'product_experience';
  } else if (row.evaluationName.includes('课程')) {
    exampleModule.evaluationType = 'course_content';
  } else if (row.evaluationName.includes('客服')) {
    exampleModule.evaluationType = 'customer_service';
  } else if (row.evaluationName.includes('平台')) {
    exampleModule.evaluationType = 'platform_function';
  } else {
    exampleModule.evaluationType = 'activity_satisfaction';
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
    published: { color: 'green', text: '已发布' },
    unpublished: { color: 'orange', text: '未发布' },
    draft: { color: 'gray', text: '草稿' },
  };
  return statusMap[status as keyof typeof statusMap] || { color: 'gray', text: '未知' };
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'evaluationName',
      title: '评价名称',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'evaluationTitle',
      title: '评价题目',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      slots: { default: 'createTime' },
    },
    {
      field: 'creatorName',
      title: '创建人',
      width: 100,
    },
    {
      field: 'publishTime',
      title: '发布的时间',
      width: 180,
      slots: { default: 'publishTime' },
    },
    {
      field: 'publishStatus',
      title: '发布状态',
      width: 120,
      slots: { default: 'publishStatus' },
    },
    {
      field: 'evaluationCount',
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
      result: 'list',
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
          createStartTime: formValues.createStartTime
            ? (Date.parse(formValues.createStartTime) - 28800000) / 1000
            : undefined,
          createEndTime: formValues.createEndTime
            ? (Date.parse(formValues.createEndTime) - 28800000) / 1000 + 86399
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
          {{ dayjs(row.createTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>

      <template #publishTime="{ row }">
        <span v-if="row.publishTime">
          {{ dayjs(row.publishTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-300">-</span>
      </template>

      <template #publishStatus="{ row }">
        <Tag :color="getStatusTag(row.publishStatus).color">
          {{ getStatusTag(row.publishStatus).text }}
        </Tag>
      </template>

      <template #evaluationCount="{ row }">
        <span class="font-semibold text-blue-600 dark:text-blue-400">
          {{ row.evaluationCount }}
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
            v-if="row.publishStatus === 'published'"
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

@media (max-width: 768px) {
  .module-content {
    grid-template-columns: 1fr;
  }

  .module-actions {
    position: static;
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
