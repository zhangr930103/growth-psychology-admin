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
import { 
  getFaqListApi, 
  toggleFaqStatusApi, 
  deleteFaqApi,
  type FaqData,
  type FaqListParams 
} from '#/api/core/faq';

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
  category: '',
  is_featured: false,
  order_index: 0,
  tags: '',
  keywords: '',
});

// 搜索参数接口
interface SearchParams {
  page?: number;
  size?: number;
  question?: string;
  category?: string;
  creator?: string;
  status?: string;
  is_featured?: boolean;
  keyword?: string;
  createStartTime?: number;
  createEndTime?: number;
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
      fieldName: 'status',
      label: '状态',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '激活', value: 'active' },
          { label: '非激活', value: 'inactive' },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
      componentProps: {
        placeholder: '请输入关键词',
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

// 获取FAQ列表
const getFaqList = async (params: SearchParams) => {
  const apiParams: FaqListParams = {
    page: params.page || 1,
    size: params.size || 10,
    question: params.question,
    category: params.category,
    status: params.status,
    keyword: params.keyword,
  };
  
  return await getFaqListApi(apiParams);
};

// 操作函数
const handleEnable = async (row: FaqData) => {
  try {
    spinning.value = true;
    await toggleFaqStatusApi({ id: row.id, status: 'active' });
    message.success('FAQ启用成功');
    gridApi.query();
  } catch (error) {
    message.error('FAQ启用失败');
  } finally {
    spinning.value = false;
  }
};

const handleDisable = async (row: FaqData) => {
  try {
    spinning.value = true;
    await toggleFaqStatusApi({ id: row.id, status: 'inactive' });
    message.success('FAQ禁用成功');
    gridApi.query();
  } catch (error) {
    message.error('FAQ禁用失败');
  } finally {
    spinning.value = false;
  }
};

const handleDelete = async (row: FaqData) => {
  try {
    spinning.value = true;
    await deleteFaqApi(row.id);
    message.success('FAQ删除成功');
    gridApi.query();
  } catch (error) {
    message.error('FAQ删除失败');
  } finally {
    spinning.value = false;
  }
};

// 弹窗相关函数
const resetFormData = () => {
  formData.question = '';
  formData.answer = '';
  formData.category = '';
  formData.is_featured = false;
  formData.order_index = 0;
  formData.tags = '';
  formData.keywords = '';
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
  formData.category = row.category;
  formData.is_featured = row.is_featured;
  formData.order_index = row.order_index;
  formData.tags = row.tags;
  formData.keywords = row.keywords;
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
      showOverflow: 'tooltip',
    },
    {
      field: 'answer',
      title: '问题答案',
      slots: { default: 'answer' },
    },
    {
      field: 'category',
      title: '分类',
    },
    {
      field: 'is_featured',
      title: '是否置顶',
      slots: { default: 'is_featured' },
    },
    {
      field: 'order_index',
      title: '排序',
    },
    {
      field: 'created_at',
      title: '创建时间',
      slots: { default: 'created_at' },
    },
    {
      field: 'creator_name',
      title: '创建人',
    },
    {
      field: 'view_count',
      title: '查看次数',
    },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status' },
    },
    {
      field: 'actions',
      title: '操作',
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
        <template #is_featured="{ row }">
          <Tag :color="row.is_featured ? 'red' : 'gray'">
            {{ row.is_featured ? '是' : '否' }}
          </Tag>
        </template>

        <template #created_at="{ row }">
          <span>
            {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
        </template>

        <template #status="{ row }">
          <Tag :color="row.status === 'active' ? 'green' : 'red'">
            {{ row.status === 'active' ? '激活' : '非激活' }}
          </Tag>
        </template>

        <template #answer="{ row }">
          <div
            class="answer-content"
            v-html="row.answer"
          />
        </template>

        <template #actions="{ row }">
          <Space>
            <Button type="link" size="small" @click="handleEdit(row)">
              编辑
            </Button>
            <Popconfirm
              v-if="row.status !== 'active'"
              title="确定要启用吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleEnable(row)"
            >
              <Button type="link" size="small"> 启用 </Button>
            </Popconfirm>
            <Popconfirm
              v-if="row.status === 'active'"
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
      width="70vw"
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

        <Form.Item label="分类">
          <Input
            v-model:value="formData.category"
            placeholder="请输入分类"
          />
        </Form.Item>

        <Form.Item label="是否置顶">
          <Radio.Group v-model:value="formData.is_featured">
            <Radio :value="true">是</Radio>
            <Radio :value="false">否</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="排序">
          <Input
            v-model:value="formData.order_index"
            type="number"
            placeholder="请输入排序值"
          />
          <div style="color: #999; font-size: 12px; margin-top: 5px">
            值越大越显示在前面
          </div>
        </Form.Item>

        <Form.Item label="标签">
          <Input
            v-model:value="formData.tags"
            placeholder="请输入标签（多个标签用逗号分隔）"
          />
        </Form.Item>

        <Form.Item label="关键词">
          <Input
            v-model:value="formData.keywords"
            placeholder="请输入关键词（多个关键词用逗号分隔）"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Spin>
</template>

<style scoped>
.answer-content {
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
