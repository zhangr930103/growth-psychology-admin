<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, DatePicker, Form, Input, InputNumber, message, Modal, Popconfirm, Radio, Space, Spin, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import { WangEditor } from '#/components';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getActivityListApi, createActivityApi, updateActivityApi, deleteActivityApi, toggleActivityStatusApi, type ActivityData as ApiActivityData, type ActivityListParams, type CreateActivityParams, type UpdateActivityParams, type ToggleActivityStatusParams } from '#/api';

defineOptions({
  name: 'ActivityManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 弹窗相关状态
const modalVisible = ref(false);
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

// 查看活动内容弹窗
const contentModalVisible = ref(false);
const currentActivityContent = ref('');

// 编辑器key，用于强制重新渲染编辑器
const editorKey = ref(0);

// 表单 ref
const formRef = ref();

// 弹窗表单数据
const formData = reactive({
  activityName: '',
  activityContent: '',
  instructor: '',
  activityTime: null as any,
  registrationDeadline: null as any,
  duration: 0,
  minParticipants: 0,
  maxRegistrations: 0,
  isEnabled: true,
});

// 活动数据类型定义（前端使用的驼峰格式）
interface ActivityData {
  id: number;
  activityName: string;
  activityContent: string;
  instructor: string;
  activityTime: number;
  registrationDeadline: number;
  duration: number;
  minParticipants: number;
  maxRegistrations: number;
  creatorName: string;
  creatorId: number;
  createTime: number;
  isEnabled: boolean; // 是否启用
}

// 数据转换函数：将 API 返回的下划线格式转换为前端的驼峰格式
const transformApiData = (apiData: ApiActivityData): ActivityData => {
  return {
    id: apiData.id,
    activityName: apiData.activity_name,
    activityContent: apiData.activity_content,
    instructor: apiData.instructor,
    activityTime: new Date(apiData.activity_time).getTime() / 1000, // 转换为 unix 时间戳（秒）
    registrationDeadline: new Date(apiData.registration_deadline).getTime() / 1000, // 转换为 unix 时间戳（秒）
    duration: apiData.duration,
    minParticipants: apiData.min_participants,
    maxRegistrations: apiData.max_registrations,
    creatorName: apiData.creator_name,
    creatorId: apiData.creator_id,
    createTime: apiData.create_time,
    isEnabled: apiData.is_enabled,
  };
};

// 数据转换函数：将前端表单数据（驼峰格式）转换为API所需格式（下划线格式）
const transformFormDataToApi = (formData: any): CreateActivityParams => {
  return {
    activity_name: formData.activityName,
    activity_content: formData.activityContent,
    instructor: formData.instructor,
    activity_time: formData.activityTime?.toISOString(), // dayjs 对象转换为 ISO 字符串
    registration_deadline: formData.registrationDeadline?.toISOString(), // dayjs 对象转换为 ISO 字符串
    duration: formData.duration,
    min_participants: formData.minParticipants,
    max_registrations: formData.maxRegistrations,
    is_enabled: formData.isEnabled,
  };
};

// 数据转换函数：将前端表单数据转换为编辑API所需格式（包含ID）
const transformFormDataToUpdateApi = (formData: any, id: number): UpdateActivityParams => {
  return {
    id: id,
    activity_name: formData.activityName,
    activity_content: formData.activityContent,
    instructor: formData.instructor,
    activity_time: formData.activityTime?.toISOString(), // dayjs 对象转换为 ISO 字符串
    registration_deadline: formData.registrationDeadline?.toISOString(), // dayjs 对象转换为 ISO 字符串
    duration: formData.duration,
    min_participants: formData.minParticipants,
    max_registrations: formData.maxRegistrations,
    is_enabled: formData.isEnabled,
  };
};

interface SearchParams {
  page?: number;
  size?: number;
  activity_name?: string;
  creator?: string;
  is_enabled?: boolean | string;
  create_start_time?: number;
  create_end_time?: number;
}

interface ApiResponse {
  list: ActivityData[];
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
      fieldName: 'activityName',
      label: '活动名称',
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
      label: '状态',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '已启用', value: true },
          { label: '未启用', value: false },
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

// 获取活动列表API
const getActivityList = async (params: SearchParams): Promise<ApiResponse> => {
  try {
    // 构建API参数
    const apiParams: ActivityListParams = {
      page: params.page || 1,
      size: params.size || 10,
      activity_name: params.activity_name,
      creator: params.creator,
      is_enabled: params.is_enabled === '' ? undefined : 
        (typeof params.is_enabled === 'string' ? params.is_enabled === 'true' : params.is_enabled),
      create_start_time: params.create_start_time,
      create_end_time: params.create_end_time,
    };

    // 调用真实API
    const response = await getActivityListApi(apiParams);
    
    // 转换数据格式
    const transformedList = response.list.map(transformApiData);
    
    return {
      list: transformedList,
      total: response.total,
    };
  } catch (error) {
    return {
      list: [],
      total: 0,
    };
  }
};

// 操作函数
const handleEnable = async (row: ActivityData) => {
  console.log('启用活动:', row);

  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用统一的状态切换API，设置为启用
    const params: ToggleActivityStatusParams = {
      id: row.id,
      is_enabled: true,
    };
    await toggleActivityStatusApi(params);

    message.success({
      content: '活动启用成功',
    });

    // 刷新列表
    gridApi.query();
  } finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

const handleDisable = async (row: ActivityData) => {
  console.log('禁用活动:', row);

  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用统一的状态切换API，设置为禁用
    const params: ToggleActivityStatusParams = {
      id: row.id,
      is_enabled: false,
    };
    await toggleActivityStatusApi(params);

    message.success({
      content: '活动禁用成功',
    });

    // 刷新列表
    gridApi.query();
  }finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

const handleDelete = async (row: ActivityData) => {
  console.log('删除活动:', row);

  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用真实删除API
    await deleteActivityApi(row.id);

    message.success({
      content: '活动删除成功',
    });

    // 刷新列表
    gridApi.query();
  }finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

// 弹窗相关函数
const resetFormData = () => {
  formData.activityName = '';
  formData.activityContent = '';
  formData.instructor = '';
  formData.activityTime = null;
  formData.registrationDeadline = null;
  formData.duration = 0;
  formData.minParticipants = 0;
  formData.maxRegistrations = 0;
  formData.isEnabled = true;
  editingId.value = null;
};

const openCreateModal = async () => {
  resetFormData();
  // 强制重新渲染编辑器
  editorKey.value++;
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const openEditModal = async (row: ActivityData) => {
  resetFormData();
  editingId.value = row.id;
  
  // 设置基本表单数据
  formData.activityName = row.activityName;
  formData.instructor = row.instructor;
  formData.activityTime = dayjs(row.activityTime * 1000);
  formData.registrationDeadline = dayjs(row.registrationDeadline * 1000);
  formData.duration = row.duration;
  formData.minParticipants = row.minParticipants;
  formData.maxRegistrations = row.maxRegistrations;
  formData.isEnabled = row.isEnabled;
  
  // 先设置编辑器内容，再打开模态框
  const content = row.activityContent || '';
  formData.activityContent = content;
  
  // 强制重新渲染编辑器，避免 DOM 范围错误
  editorKey.value++;
  
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const closeModal = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
  resetFormData();
  // 重置编辑器key，确保下次打开时是全新的编辑器实例
  editorKey.value++;
};

const handleSubmit = async () => {
  try {
    // 使用 Form 组件的内置校验
    await formRef.value?.validate();

    modalLoading.value = true;

    if (editingId.value) {
      // 编辑功能调用真实API
      const apiParams = transformFormDataToUpdateApi(formData, editingId.value);
      await updateActivityApi(apiParams);
      message.success('编辑活动成功');
    } else {
      // 新增功能调用真实API
      const apiParams = transformFormDataToApi(formData);
      await createActivityApi(apiParams);
      message.success('新增活动成功');
    }

    // 刷新列表
    gridApi.query();

    // 关闭弹窗
    closeModal();
  } catch (error: any) {
    // 区分校验错误和API错误
    if (error?.response || error?.message) {
      // API错误
      const errorMsg = error?.response?.data?.message || error?.message || '操作失败，请稍后重试';
      message.error(errorMsg);
      console.error('API错误:', error);
    } else {
      // 表单校验失败时不做处理，表单会自动显示红色校验信息
      console.log('表单校验失败:', error);
    }
  } finally {
    modalLoading.value = false;
  }
};

const handleCreate = () => {
  openCreateModal();
};

const handleEdit = (row: ActivityData) => {
  openEditModal(row);
};

// 查看活动内容
const handleViewContent = (content: string) => {
  currentActivityContent.value = content;
  contentModalVisible.value = true;
};

const closeContentModal = () => {
  contentModalVisible.value = false;
  currentActivityContent.value = '';
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'activityName',
      title: '活动名称',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'activityContent',
      title: '活动内容',
      width: 120,
      slots: { default: 'activityContent' },
    },
    {
      field: 'activityTime',
      title: '活动时间',
      width: 150,
      slots: { default: 'activityTime' },
    },
    {
      field: 'registrationDeadline',
      title: '报名截止时间',
      width: 150,
      slots: { default: 'registrationDeadline' },
    },
    {
      field: 'minParticipants',
      title: '开团人数',
      width: 100,
    },
    {
      field: 'creatorName',
      title: '创建人',
      width: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 150,
      slots: { default: 'createTime' },
    },
    {
      field: 'isEnabled',
      title: '是否启用',
      width: 100,
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
        const result = await getActivityList({
          page: page.currentPage,
          size: page.pageSize,
          // 转换字段名：前端表单的驼峰格式转换为API的下划线格式
          activity_name: formValues.activityName,
          creator: formValues.creator,
          is_enabled: formValues.isEnabled,
          // 处理时间范围搜索
          create_start_time: formValues.createStartTime
            ? (Date.parse(formValues.createStartTime) - 28800000) / 1000
            : undefined,
          create_end_time: formValues.createEndTime
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
    <Page auto-content-height title="团队活动管理">
      <Grid>
        <template #toolbar-actions>
          <Button type="primary" class="mr-4" @click="handleCreate">
            新建
          </Button>
        </template>

        <template #activityContent="{ row }">
          <Button type="link" size="small" @click="handleViewContent(row.activityContent)">
            查看内容
          </Button>
        </template>

        <template #activityTime="{ row }">
          <span>
            {{ dayjs(row.activityTime * 1000).format('YYYY-MM-DD HH:mm') }}
          </span>
        </template>

        <template #registrationDeadline="{ row }">
          <span>
            {{ dayjs(row.registrationDeadline * 1000).format('YYYY-MM-DD HH:mm') }}
          </span>
        </template>

        <template #createTime="{ row }">
          <span>
            {{ dayjs(row.createTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
        </template>

        <template #isEnabled="{ row }">
          <Tag :color="row.isEnabled ? 'green' : 'red'">
            {{ row.isEnabled ? '已启用' : '未启用' }}
          </Tag>
        </template>

        <template #actions="{ row }">
          <Space>
            <Button
              type="link"
              size="small"
              @click="handleEdit(row)"
            >
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
      :title="editingId ? '编辑团队活动' : '新建团队活动'"
      :confirm-loading="modalLoading"
      width="70vw"
      ok-text="提交"
      cancel-text="取消"
      :style="{ top: '20px' }"
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
          label="团队活动名称"
          name="activityName"
          :rules="[{ required: true, message: '请输入团队活动名称' }]"
        >
          <Input
            v-model:value="formData.activityName"
            placeholder="请输入团队活动名称"
            show-count
            :maxlength="100"
          />
        </Form.Item>

        <Form.Item
          label="活动内容"
          name="activityContent"
          :rules="[{ required: true, message: '请输入活动内容' }]"
        >
          <WangEditor
            :key="editorKey"
            v-model:model-value="formData.activityContent"
            placeholder="请输入活动的详细内容，支持富文本格式和图片上传"
            :height="300"
            mode="default"
            url-field="fileUrl"
          />
        </Form.Item>

        <Form.Item
          label="带领老师"
          name="instructor"
          :rules="[{ required: true, message: '请输入带领老师' }]"
        >
          <Input
            v-model:value="formData.instructor"
            placeholder="多人之间逗号隔开"
            show-count
            :maxlength="200"
          />
        </Form.Item>

        <div style="display: flex; gap: 20px;">
          <Form.Item
            label="活动开始时间"
            name="activityTime"
            :rules="[{ required: true, message: '请选择活动开始时间' }]"
            style="flex: 1;"
          >
            <DatePicker
              v-model:value="formData.activityTime"
              show-time
              format="YYYY-MM-DD HH:mm"
              placeholder="开始时间"
              style="width: 100%"
            />
          </Form.Item>

          <Form.Item
            label="报名截止时间"
            name="registrationDeadline"
            :rules="[{ required: true, message: '请选择报名截止时间' }]"
            style="flex: 1;"
          >
            <DatePicker
              v-model:value="formData.registrationDeadline"
              show-time
              format="YYYY-MM-DD HH:mm"
              placeholder="截止时间"
              style="width: 100%"
            />
          </Form.Item>
        </div>

        <div style="display: flex; gap: 20px;">
          <Form.Item
            label="课程时长"
            name="duration"
            :rules="[{ required: true, message: '请输入课程时长' }]"
            style="flex: 1;"
          >
            <div style="display: flex; align-items: center; gap: 10px;">
              <InputNumber
                v-model:value="formData.duration"
                placeholder="请输入课程时长"
                :min="30"
                :max="480"
                style="flex: 1;"
              />
              <span>分钟</span>
            </div>
          </Form.Item>

          <Form.Item
            label="开团人数"
            name="minParticipants"
            :rules="[{ required: true, message: '请输入开团人数' }]"
            style="flex: 1;"
          >
            <InputNumber
              v-model:value="formData.minParticipants"
              placeholder="请输入开团人数"
              :min="1"
              :max="50"
              style="width: 100%"
            />
          </Form.Item>
        </div>

        <Form.Item
          label="最多报名人数"
          name="maxRegistrations"
          :rules="[{ required: true, message: '请输入最多报名人数' }]"
        >
          <InputNumber
            v-model:value="formData.maxRegistrations"
            placeholder="请输入最多报名人数"
            :min="1"
            :max="200"
            style="width: 200px"
          />
          <div style="color: #999; font-size: 12px; margin-top: 5px;">
            建议设置在开团人数以上
          </div>
        </Form.Item>

        <Form.Item label="是否启用">
          <Radio.Group v-model:value="formData.isEnabled">
            <Radio :value="true">启用</Radio>
            <Radio :value="false">不启用</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 查看活动内容弹窗 -->
    <Modal
      v-model:open="contentModalVisible"
      title="活动内容"
      width="800px"
      :footer="null"
      @cancel="closeContentModal"
    >
      <div 
        v-html="currentActivityContent" 
        style="padding: 20px 0; max-height: 70vh; overflow-y: auto;"
      ></div>
    </Modal>
  </Spin>
</template>
