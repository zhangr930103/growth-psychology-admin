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
  createFaqApi,
  updateFaqApi,
  type FaqData,
  type FaqListParams,
  type CreateFaqParams,
  type UpdateFaqParams
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
const editorKey = ref(0); // 编辑器唯一key

// 表单 ref
const formRef = ref();

// 弹窗表单数据
const formData = reactive({
  question: '',
  answer: '',
  is_featured: false,
  order_index: 0,
  is_wechat_display: false,
});

// 搜索参数接口
interface SearchParams {
  page?: number;
  size?: number;
  question?: string;
  creator?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 100,
  },
  fieldMappingTime: [['rangePicker', ['start_date', 'end_date']]],
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
          { label: '禁用', value: 'active' },
          { label: '启用', value: 'inactive' },
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

// 获取FAQ列表
const getFaqList = async (params: SearchParams) => {
  try {
    const apiParams: FaqListParams = {
      page: params.page || 1,
      size: params.size || 10,
      question: params.question,
      creator: params.creator,
      status: params.status,
      start_date: params.start_date,
      end_date: params.end_date,
    };

    const result = await getFaqListApi(apiParams);
    return result;
  } catch (error) {
    console.error('获取FAQ列表失败:', error);
    message.error('获取FAQ列表失败，请稍后重试');
    return {
      list: [],
      total: 0,
    };
  }
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
  formData.is_featured = false;
  formData.order_index = 0;
  formData.is_wechat_display = false;
  editingId.value = null;
};

const openCreateModal = async () => {
  resetFormData();
  editorKey.value++; // 强制重新创建编辑器
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const openEditModal = async (row: FaqData) => {
  resetFormData();
  editorKey.value++; // 强制重新创建编辑器
  editingId.value = row.id;
  formData.question = row.question;
  formData.is_featured = row.is_featured;
  formData.order_index = row.order_index;
  formData.is_wechat_display = row.is_wechat_display || false;
  modalVisible.value = true;

  // 等待 DOM 更新后再设置编辑器内容和重置表单校验状态
  await nextTick();
  // 延迟设置编辑器内容，确保编辑器完全初始化
  setTimeout(() => {
    formData.answer = row.answer;
  }, 100);
  formRef.value?.clearValidate();
};

const closeModal = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
  resetFormData();
  editorKey.value++; // 重置编辑器
};

const handleSubmit = async () => {
  try {
    // 使用 Form 组件的内置校验
    await formRef.value?.validate();

    modalLoading.value = true;

    if (editingId.value) {
      // 编辑
      const params: UpdateFaqParams = {
        id: editingId.value,
        question: formData.question,
        answer: formData.answer,
        is_featured: formData.is_featured,
        order_index: formData.order_index,
        is_wechat_display: formData.is_wechat_display,
      };

      await updateFaqApi(params);
      message.success('编辑FAQ成功');
    } else {
      // 新增
      const params: CreateFaqParams = {
        question: formData.question,
        answer: formData.answer,
        is_featured: formData.is_featured,
        order_index: formData.order_index,
        is_wechat_display: formData.is_wechat_display,
      };

      await createFaqApi(params);
      message.success('新增FAQ成功');
    }

    // 刷新列表
    gridApi.query();

    // 关闭弹窗
    closeModal();
  } catch (error) {
    // 校验失败时不做处理，表单会自动显示红色校验信息
    console.log('表单校验失败或API调用失败:', error);
    if (error && typeof error === 'object' && 'message' in error) {
      message.error('操作失败');
    }
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
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'question',
      title: '问题名称',
      showOverflow: 'tooltip',
    },
    {
      field: 'is_featured',
      title: '是否置顶',
      slots: { default: 'is_featured' },
    },
    {
      field: 'is_wechat_display',
      title: '是否客服显示',
      slots: { default: 'is_wechat_display' },
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
      field: 'updated_at',
      title: '发布时间',
      slots: { default: 'updated_at' },
    },
    {
      field: 'status',
      title: '是否启用',
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
          question: formValues.question,
          creator: formValues.creator,
          status: formValues.status,
          // 处理时间范围搜索
          start_date: formValues.start_date,
          end_date: formValues.end_date,
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

        <template #is_wechat_display="{ row }">
          <Tag :color="row.is_wechat_display ? 'blue' : 'gray'">
            {{ row.is_wechat_display ? '是' : '否' }}
          </Tag>
        </template>

        <template #created_at="{ row }">
          <span>
            {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
        </template>

        <template #updated_at="{ row }">
          <span>
            {{ row.updated_at ? dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </span>
        </template>

        <template #status="{ row }">
          <Tag :color="row.status === 'active' ? 'green' : 'red'">
            {{ row.status === 'active' ? '已启用' : '未启用' }}
          </Tag>
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
            :key="editorKey"
            v-model:model-value="formData.answer"
            placeholder="请输入问题的详细回答"
            :height="300"
            mode="default"
            @upload-success="(data, url, file) => console.log('上传成功:', { data, url, file })"
            @upload-error="(error, file) => console.error('上传失败:', { error, file })"
          />
        </Form.Item>

        <Form.Item label="是否首页顶置">
          <Radio.Group v-model:value="formData.is_featured">
            <Radio :value="true">是</Radio>
            <Radio :value="false">否</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="是否在客服微信页面显示">
          <Radio.Group v-model:value="formData.is_wechat_display">
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
      </Form>
    </Modal>
  </Spin>
</template>

<style scoped>
</style>
