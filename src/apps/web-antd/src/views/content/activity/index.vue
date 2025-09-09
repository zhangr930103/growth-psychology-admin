<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, DatePicker, Form, Input, InputNumber, message, Modal, Popconfirm, Radio, Space, Spin, Tag, Textarea } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({
  name: 'ActivityManagement',
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

// 活动数据类型定义
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

interface SearchParams {
  page?: number;
  size?: number;
  activityName?: string;
  creator?: string;
  isEnabled?: boolean | string;
  createStartTime?: number;
  createEndTime?: number;
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

// 模拟活动数据API
const getActivityList = async (params: SearchParams): Promise<ApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: ActivityData[] = [
    {
      id: 1,
      activityName: '团体心理辅导活动',
      activityContent: '通过团体活动形式，帮助参与者建立良好的人际关系，提升心理健康水平。',
      instructor: '张心理，李专家',
      activityTime: dayjs().add(7, 'day').unix(),
      registrationDeadline: dayjs().add(3, 'day').unix(),
      duration: 120,
      minParticipants: 8,
      maxRegistrations: 20,
      creatorName: '张心理',
      creatorId: 1,
      createTime: dayjs().subtract(5, 'day').unix(),
      isEnabled: true,
    },
    {
      id: 2,
      activityName: '压力管理工作坊',
      activityContent: '学习有效的压力管理技巧，掌握放松训练方法，提升应对压力的能力。',
      instructor: '李老师',
      activityTime: dayjs().add(14, 'day').unix(),
      registrationDeadline: dayjs().add(10, 'day').unix(),
      duration: 90,
      minParticipants: 6,
      maxRegistrations: 15,
      creatorName: '李老师',
      creatorId: 2,
      createTime: dayjs().subtract(3, 'day').unix(),
      isEnabled: true,
    },
    {
      id: 3,
      activityName: '职场沟通技能培训',
      activityContent: '提升职场沟通能力，学习有效的沟通技巧和冲突解决方法。',
      instructor: '王顾问，陈导师',
      activityTime: dayjs().add(21, 'day').unix(),
      registrationDeadline: dayjs().add(15, 'day').unix(),
      duration: 180,
      minParticipants: 10,
      maxRegistrations: 25,
      creatorName: '王顾问',
      creatorId: 3,
      createTime: dayjs().subtract(1, 'day').unix(),
      isEnabled: false,
    },
    {
      id: 4,
      activityName: '情绪调节训练营',
      activityContent: '学习情绪识别和调节技巧，提升情绪管理能力。',
      instructor: '刘专家',
      activityTime: dayjs().add(28, 'day').unix(),
      registrationDeadline: dayjs().add(20, 'day').unix(),
      duration: 150,
      minParticipants: 8,
      maxRegistrations: 18,
      creatorName: '刘专家',
      creatorId: 4,
      createTime: dayjs().subtract(2, 'day').unix(),
      isEnabled: true,
    },
    {
      id: 5,
      activityName: '团队建设拓展活动',
      activityContent: '通过户外拓展活动增强团队凝聚力，提升团队协作能力。',
      instructor: '陈教练，赵领队',
      activityTime: dayjs().add(35, 'day').unix(),
      registrationDeadline: dayjs().add(25, 'day').unix(),
      duration: 240,
      minParticipants: 15,
      maxRegistrations: 30,
      creatorName: '陈教练',
      creatorId: 5,
      createTime: dayjs().subtract(4, 'day').unix(),
      isEnabled: false,
    },
  ];

  // 模拟搜索过滤
  let filteredData = mockData;

  if (params.activityName) {
    filteredData = filteredData.filter((item) =>
      item.activityName.includes(params.activityName!),
    );
  }

  if (params.creator) {
    filteredData = filteredData.filter((item) =>
      item.creatorName.includes(params.creator!),
    );
  }

  if (params.isEnabled !== undefined && params.isEnabled !== '') {
    const enabledValue = params.isEnabled === 'true' || params.isEnabled === true;
    filteredData = filteredData.filter((item) =>
      item.isEnabled === enabledValue,
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
const handleEnable = (row: ActivityData) => {
  console.log('启用活动:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: '活动启用成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleDisable = (row: ActivityData) => {
  console.log('禁用活动:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: '活动禁用成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleDelete = (row: ActivityData) => {
  console.log('删除活动:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: '活动删除成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
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
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const openEditModal = async (row: ActivityData) => {
  resetFormData();
  editingId.value = row.id;
  formData.activityName = row.activityName;
  formData.activityContent = row.activityContent;
  formData.instructor = row.instructor;
  formData.activityTime = dayjs(row.activityTime * 1000);
  formData.registrationDeadline = dayjs(row.registrationDeadline * 1000);
  formData.duration = row.duration;
  formData.minParticipants = row.minParticipants;
  formData.maxRegistrations = row.maxRegistrations;
  formData.isEnabled = row.isEnabled;
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
    message.success(`${action}活动成功`);

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

const handleEdit = (row: ActivityData) => {
  openEditModal(row);
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
      minWidth: 250,
      showOverflow: 'tooltip',
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
    <Page auto-content-height title="团队活动管理">
      <Grid>
        <template #toolbar-actions>
          <Button type="primary" class="mr-4" @click="handleCreate">
            新建
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
      width="800px"
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
          <Textarea
            v-model:value="formData.activityContent"
            placeholder="请输入活动的详细内容"
            :rows="8"
            show-count
            :maxlength="1000"
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
  </Spin>
</template>
