<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

import { useVbenForm, z } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { ConsultationOrderData } from '#/api/core/order';
import { getConsultationOrderListApi, updateMeetingNumberApi } from '#/api/core/order';

defineOptions({
  name: 'ConsultationOrderList',
});

// 类型定义 - 使用API返回的数据结构
type ConsultationOrder = ConsultationOrderData;

interface SearchParams {
  page?: number;
  size?: number;
  orderCode?: string;
  consultant?: string;
  status?: string;
  createStartTime?: number;
  createEndTime?: number;
}

interface ApiResponse {
  list: ConsultationOrder[];
  total: number;
}

// 状态选项卡
const statusTabs = [
  { label: '全部', value: '' },
  { label: '待咨询', value: 'pending' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

const currentStatus = ref('');
const router = useRouter();
const currentOrder = ref<ConsultationOrder | null>(null);

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 100,
  },
  fieldMappingTime: [['rangePicker', ['created_at_start', 'created_at_end']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'order_code',
      label: '订单编码',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      fieldName: 'consultant',
      label: '咨询师',
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
          { label: '待咨询', value: 'pending' },
          { label: '已完成', value: 'completed' },
          { label: '已取消', value: 'cancelled' },
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

// 真实API调用
const getConsultationList = async (params: SearchParams): Promise<ApiResponse> => {
  // 构造API参数，映射字段名
  const apiParams = {
    page: params.page || 1,
    size: params.size || 10,
    order_code: params.orderCode,
    consultant: params.consultant,
    status: currentStatus.value || params.status,
    created_at_start: params.createStartTime,
    created_at_end: params.createEndTime,
  };

  // 过滤掉未定义的参数，保留必需的page和size
  const filteredParams = {
    page: apiParams.page,
    size: apiParams.size,
  } as any;
  
  // 只添加有值的可选参数
  if (apiParams.order_code) filteredParams.order_code = apiParams.order_code;
  if (apiParams.consultant) filteredParams.consultant = apiParams.consultant;
  if (apiParams.status) filteredParams.status = apiParams.status;
  if (apiParams.created_at_start) filteredParams.created_at_start = apiParams.created_at_start;
  if (apiParams.created_at_end) filteredParams.created_at_end = apiParams.created_at_end;

  return await getConsultationOrderListApi(filteredParams);
};

// 工具函数
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待咨询',
    completed: '已完成',
    cancelled: '已取消',
    review_pending: '待评价',
    reviewed: '已评价',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs',
    completed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs',
    cancelled: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs',
    review_pending: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs',
    reviewed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs',
  };
  return colorMap[status] || '';
};

const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    online: '视频',      // 线上视频咨询
    phone: '语音',       // 电话/语音咨询
    offline: '面对面',    // 线下面对面咨询
  };
  return methodMap[method] || method;
};

const getMethodColor = (method: string): string => {
  const colorMap: Record<string, string> = {
    online: 'text-blue-600 dark:text-blue-400',
    offline: 'text-green-600 dark:text-green-400',
    phone: 'text-purple-600 dark:text-purple-400',
  };
  return colorMap[method] || '';
};

// 事件处理
const handleStatusChange = (status: string) => {
  currentStatus.value = status;
  gridApi.query();
};

const handleViewDetail = (row: ConsultationOrder) => {
  router.push(`/order/consultation/detail/${row.id}`);
};

// 填写会议号表单配置
const meetingFormSchema = [
  {
    component: 'RadioGroup',
    fieldName: 'consultationMethod',
    label: '咨询方式',
    defaultValue: 'online',
    componentProps: {
      options: [
        { label: '视频', value: 'online' },
        { label: '语音', value: 'phone' },
      ],
      buttonStyle: 'solid',
      optionType: 'button',
      style: { width: '100%' },
    },
  },
  {
    component: 'Textarea',
    fieldName: 'contactInfo',
    label: '腾讯会议地址',
    rules: z.string().min(1, '请输入腾讯会议地址'),
    componentProps: {
      placeholder: '请输入',
      rows: 4,
      showCount: false,
    },
  },
];

// 创建填写会议号表单
const [MeetingForm, meetingFormApi] = useVbenForm({
  schema: meetingFormSchema,
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 100,
  },
});

// 创建填写会议号弹窗
const [MeetingModal, meetingModalApi] = useVbenModal({
  title: '会议号',
  onConfirm: async () => {
    try {
      const validationResult = await meetingFormApi.validate();
      if (validationResult.valid) {
        const formValues = await meetingFormApi.getValues();

        if (!currentOrder.value) {
          message.error('订单信息丢失，请重新打开');
          return;
        }

        message.loading({
          content: '正在保存，请稍等...',
          duration: 0,
          key: 'meeting_msg',
        });

        try {
          await updateMeetingNumberApi({
            order_id: currentOrder.value.id,
            meeting_id: formValues.contactInfo,
            consultation_method: formValues.consultationMethod,
          });

          message.success({
            content: '保存成功',
            key: 'meeting_msg',
          });
          meetingModalApi.close();
          // 刷新列表
          gridApi.query();
        } catch (error) {
          message.destroy('meeting_msg');
          console.error('保存失败:', error);
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  },
  onCancel: () => {
    meetingFormApi.resetForm();
    currentOrder.value = null;
    meetingModalApi.close();
  },
});

// 处理填写会议号
const handleFillMeetingNumber = (row: ConsultationOrder) => {
  console.log('填写会议号:', row);
  
  // 设置当前订单
  currentOrder.value = row;
  
  // 清空表单
  meetingFormApi.resetForm();
  
  // 打开弹窗
  meetingModalApi.open();
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'order_code',
      title: '订单编码',
      minWidth: 120,
      slots: { default: 'orderCode' },
    },
    {
      field: 'consultant',
      title: '咨询师',
      minWidth: 80,
    },
    {
      field: 'appointment_time',
      title: '预约时间',
      minWidth: 140,
      slots: { default: 'appointmentTime' },
    },
    {
      field: 'consultation_method',
      title: '咨询方式',
      minWidth: 90,
      slots: { default: 'consultationMethod' },
    },
    {
      field: 'consultation_address',
      title: '咨询地址/会议号',
      minWidth: 150,
      slots: { default: 'consultationAddress' },
    },
    {
      field: 'situation',
      title: '咨询适用情况',
      minWidth: 200,
      slots: { default: 'situation' },
    },
    {
      field: 'created_at',
      title: '下单时间',
      minWidth: 150,
      slots: { default: 'createTime' },
    },
    {
      field: 'customer',
      title: '下单人',
      minWidth: 80,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 80,
      slots: { default: 'status' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 180,
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
        const result = await getConsultationList({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
          createStartTime: formValues.created_at_start
            ? (Date.parse(formValues.created_at_start) - 28800000) / 1000
            : undefined,
          createEndTime: formValues.created_at_end
            ? (Date.parse(formValues.created_at_end) - 28800000) / 1000 + 86399
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
  <Page auto-content-height title="咨询订单列表">
    <Grid>
      <template #toolbar-actions>
        <!-- 状态选项卡 -->
        <div class="flex items-center mb-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 inline-flex">
            <button
              v-for="status in statusTabs"
              :key="status.value"
              :class="[
                'px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                currentStatus === status.value
                  ? 'bg-blue-500 dark:bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
              @click="handleStatusChange(status.value)"
            >
              {{ status.label }}
            </button>
          </div>
        </div>
      </template>

      <template #orderCode="{ row }">
        <span class="font-medium text-blue-600 dark:text-blue-400">{{ row.order_code }}</span>
      </template>

      <template #appointmentTime="{ row }">
        <span>{{ dayjs(row.appointment_time).format('YYYY-MM-DD HH:mm') }}</span>
      </template>

      <template #createTime="{ row }">
        <span> {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
       
      </template>

      <template #consultationMethod="{ row }">
        <span :class="getMethodColor(row.consultation_method)">
          {{ getMethodText(row.consultation_method) }}
        </span>
      </template>

      <template #consultationAddress="{ row }">
        <span v-if="row.consultation_method === 'offline'">
          {{ row.consultation_address || '-' }}
        </span>
        <span v-else>
          {{ row.meeting_id || '-' }}
        </span>
      </template>

      <template #status="{ row }">
        <span :class="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </span>
      </template>

      <template #situation="{ row }">
        <span class="max-w-32 truncate inline-block" :title="row.situation">
          {{ row.situation }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-2">
          <Button
            v-if="['online', 'phone'].includes(row.consultation_method)"
            type="link"
            size="small"
            @click="handleFillMeetingNumber(row)"
          >
            填写会议号
          </Button>
          <Button
            type="link"
            size="small"
            @click="handleViewDetail(row)"
          >
            详情
          </Button>
        </div>
      </template>

    </Grid>

    <!-- 填写会议号弹窗 -->
    <MeetingModal class="w-[500px]" :overlay-blur="2">
      <MeetingForm />
    </MeetingModal>
  </Page>
</template>
