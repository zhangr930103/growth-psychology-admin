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
  Radio,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { WangEditor } from '#/components';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({
  name: 'FaqManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 弹窗相关状态
const modalVisible = ref(false);
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

// 表单 ref
const formRef = ref();

// 弹窗表单数据
const formData = reactive({
  question: '',
  answer: '',
  isTop: false,
  isCustomerServiceDisplay: false,
  sortOrder: 0,
});

// FAQ数据类型定义
interface FaqData {
  id: number;
  question: string;
  answer: string;
  category: string;
  creatorName: string;
  creatorId: number;
  createTime: number;
  publishTime?: number;
  isTop: boolean; // 是否置顶
  isCustomerServiceDisplay: boolean; // 是否客服显示
  isEnabled: boolean; // 是否启用
  viewCount: number;
  sortOrder: number;
}

interface SearchParams {
  page?: number;
  size?: number;
  question?: string;
  category?: string;
  creator?: string;
  isEnabled?: boolean | string;
  createStartTime?: number;
  createEndTime?: number;
}

interface ApiResponse {
  list: FaqData[];
  total: number;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 100,
  },
  fieldMappingTime: [['rangePicker', ['createStartTime', 'createEndTime']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'question',
      label: '问题名称',
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
      fieldName: 'isEnabled',
      label: '是否启用',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '已启用', value: true },
          { label: '已停用', value: false },
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

// 模拟FAQ数据API
const getFaqList = async (params: SearchParams): Promise<ApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: FaqData[] = [
    {
      id: 1,
      question: '如何注册账号？',
      answer:
        '您可以通过手机号码或邮箱地址进行注册，按照页面提示填写相关信息即可完成注册。',
      category: 'account',
      creatorName: '张三',
      creatorId: 1,
      createTime: dayjs().subtract(30, 'day').unix(),
      publishTime: dayjs().subtract(25, 'day').unix(),
      isTop: true,
      isCustomerServiceDisplay: true,
      isEnabled: true,
      viewCount: 1256,
      sortOrder: 1,
    },
    {
      id: 2,
      question: '如何找回密码？',
      answer:
        '您可以在登录页面点击"忘记密码"，然后通过注册时使用的手机号码或邮箱进行密码重置。',
      category: 'account',
      creatorName: '李四',
      creatorId: 2,
      createTime: dayjs().subtract(25, 'day').unix(),
      publishTime: dayjs().subtract(20, 'day').unix(),
      isTop: false,
      isCustomerServiceDisplay: true,
      isEnabled: true,
      viewCount: 892,
      sortOrder: 2,
    },
    {
      id: 3,
      question: '订单支付失败怎么办？',
      answer:
        '如果支付失败，请检查银行卡余额是否充足，或者尝试更换其他支付方式。如仍有问题请联系客服。',
      category: 'payment',
      creatorName: '王五',
      creatorId: 3,
      createTime: dayjs().subtract(20, 'day').unix(),
      isTop: false,
      isCustomerServiceDisplay: false,
      isEnabled: false,
      viewCount: 0,
      sortOrder: 3,
    },
    {
      id: 4,
      question: '如何申请退款？',
      answer:
        '在订单详情页面点击"申请退款"按钮，填写退款原因并提交申请，客服会在24小时内处理您的申请。',
      category: 'order',
      creatorName: '赵六',
      creatorId: 4,
      createTime: dayjs().subtract(15, 'day').unix(),
      isTop: false,
      isCustomerServiceDisplay: true,
      isEnabled: false,
      viewCount: 0,
      sortOrder: 4,
    },
    {
      id: 5,
      question: '咨询服务如何收费？',
      answer:
        '咨询服务按照时长收费，具体费用标准请查看服务详情页面，我们提供多种套餐供您选择。',
      category: 'service',
      creatorName: '孙七',
      creatorId: 5,
      createTime: dayjs().subtract(10, 'day').unix(),
      publishTime: dayjs().subtract(8, 'day').unix(),
      isTop: true,
      isCustomerServiceDisplay: false,
      isEnabled: true,
      viewCount: 567,
      sortOrder: 5,
    },
    {
      id: 6,
      question: '系统维护期间无法访问怎么办？',
      answer:
        '系统维护期间服务会暂时中断，维护完成后会自动恢复。维护时间会提前在官网和App内通知。',
      category: 'technical',
      creatorName: '周八',
      creatorId: 6,
      createTime: dayjs().subtract(8, 'day').unix(),
      isTop: false,
      isCustomerServiceDisplay: true,
      isEnabled: false,
      viewCount: 0,
      sortOrder: 6,
    },
  ];

  // 模拟搜索过滤
  let filteredData = mockData;

  if (params.question) {
    filteredData = filteredData.filter((item) =>
      item.question.includes(params.question!),
    );
  }

  if (params.creator) {
    filteredData = filteredData.filter((item) =>
      item.creatorName.includes(params.creator!),
    );
  }

  if (params.isEnabled !== undefined && params.isEnabled !== '') {
    const enabledValue =
      params.isEnabled === 'true' || params.isEnabled === true;
    filteredData = filteredData.filter(
      (item) => item.isEnabled === enabledValue,
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
const handleEnable = (row: FaqData) => {
  console.log('启用FAQ:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: 'FAQ启用成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleDisable = (row: FaqData) => {
  console.log('禁用FAQ:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: 'FAQ禁用成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleDelete = (row: FaqData) => {
  console.log('删除FAQ:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: 'FAQ删除成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

// 弹窗相关函数
const resetFormData = () => {
  formData.question = '';
  formData.answer = '';
  formData.isTop = false;
  formData.isCustomerServiceDisplay = false;
  formData.sortOrder = 0;
  editingId.value = null;
};

const openCreateModal = async () => {
  resetFormData();
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const openEditModal = async (row: FaqData) => {
  resetFormData();
  editingId.value = row.id;
  formData.question = row.question;
  formData.answer = row.answer;
  formData.isTop = row.isTop;
  formData.isCustomerServiceDisplay = row.isCustomerServiceDisplay;
  formData.sortOrder = row.sortOrder;
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
    message.success(`${action}FAQ成功`);

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

const handleEdit = (row: FaqData) => {
  openEditModal(row);
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'question',
      title: '问题名称',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'answer',
      title: '问题答案',
      minWidth: 250,
      slots: { default: 'answer' },
    },
    {
      field: 'isTop',
      title: '是否置顶',
      width: 120,
      slots: { default: 'isTop' },
    },
    {
      field: 'isCustomerServiceDisplay',
      title: '是否客服显示',
      slots: { default: 'isCustomerServiceDisplay' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      slots: { default: 'createTime' },
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
    {
      field: 'publishTime',
      title: '发布时间',
      slots: { default: 'publishTime' },
    },
    {
      field: 'isEnabled',
      title: '是否启用',
      slots: { default: 'isEnabled' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 220,
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
        const result = await getFaqList({
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
    <Page auto-content-height title="常见问题管理">
      <Grid>
        <template #toolbar-actions>
          <Button type="primary" class="mr-4" @click="handleCreate">
            新增
          </Button>
        </template>
        <template #isTop="{ row }">
          <Tag :color="row.isTop ? 'red' : 'gray'">
            {{ row.isTop ? '是' : '否' }}
          </Tag>
        </template>

        <template #isCustomerServiceDisplay="{ row }">
          <Tag :color="row.isCustomerServiceDisplay ? 'blue' : 'gray'">
            {{ row.isCustomerServiceDisplay ? '是' : '否' }}
          </Tag>
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

        <template #isEnabled="{ row }">
          <Tag :color="row.isEnabled ? 'green' : 'red'">
            {{ row.isEnabled ? '已启用' : '已停用' }}
          </Tag>
        </template>

        <template #answer="{ row }">
          <div
            class="answer-content"
            v-html="row.answer"
            style="max-height: 100px; overflow: hidden; text-overflow: ellipsis;"
          />
        </template>

        <template #actions="{ row }">
          <Space>
            <Button type="link" size="small" @click="handleEdit(row)">
              编辑
            </Button>
            <Popconfirm
              v-if="!row.isEnabled"
              title="确定要启用吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleEnable(row)"
            >
              <Button type="link" size="small"> 启用 </Button>
            </Popconfirm>
            <Popconfirm
              v-if="row.isEnabled"
              title="确定要禁用吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDisable(row)"
            >
              <Button type="link" danger size="small"> 禁用 </Button>
            </Popconfirm>
            <Popconfirm
              title="确定要删除吗？"
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
      :title="editingId ? '编辑常见问题' : '新增常见问题'"
      :confirm-loading="modalLoading"
      width="800px"
      :style="{ top: '20px' }"
      ok-text="提交"
      cancel-text="取消"
      :body-style="{ height: '80vh', overflow: 'auto' }"
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
          label="问题名称"
          name="question"
          :rules="[{ required: true, message: '请输入问题名称' }]"
        >
          <Input
            v-model:value="formData.question"
            placeholder="请输入问题名称"
          />
        </Form.Item>

        <Form.Item
          label="问题答案"
          name="answer"
          :rules="[{ required: true, message: '请输入问题答案' }]"
        >
          <WangEditor
            v-model:model-value="formData.answer"
            placeholder="请输入问题的详细回答"
            :height="300"
            mode="default"
            @upload-success="(data, url, file) => console.log('上传成功:', { data, url, file })"
            @upload-error="(error, file) => console.error('上传失败:', { error, file })"
          />
        </Form.Item>

        <Form.Item label="是否置顶在首页">
          <Radio.Group v-model:value="formData.isTop">
            <Radio :value="true">是</Radio>
            <Radio :value="false">否</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="是否在客服聊天页面显示">
          <Radio.Group v-model:value="formData.isCustomerServiceDisplay">
            <Radio :value="true">是</Radio>
            <Radio :value="false">否</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="排序">
          <Input
            v-model:value="formData.sortOrder"
            type="number"
            placeholder="请输入排序值"
            style="width: 200px"
          />
          <div style="color: #999; font-size: 12px; margin-top: 5px">
            值越大越显示在前面
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </Spin>
</template>

<style scoped>
.answer-content {
  max-width: 300px;
  line-height: 1.5;
}

.answer-content :deep(p) {
  margin: 0 0 8px 0;
}

.answer-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.answer-content :deep(ul),
.answer-content :deep(ol) {
  margin: 0 0 8px 0;
  padding-left: 20px;
}

.answer-content :deep(blockquote) {
  margin: 0 0 8px 0;
  padding: 8px 12px;
  border-left: 4px solid #d9d9d9;
  background-color: #f6f6f6;
}
</style>
