<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import type { ConsultationOrderData } from '#/api/core/order';
import { getConsultationOrderListApi } from '#/api/core/order';

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

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 100,
  },
  fieldMappingTime: [['rangePicker', ['create_start_time', 'create_end_time']]],
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
    create_start_time: params.createStartTime,
    create_end_time: params.createEndTime,
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
  if (apiParams.create_start_time) filteredParams.create_start_time = apiParams.create_start_time;
  if (apiParams.create_end_time) filteredParams.create_end_time = apiParams.create_end_time;

  return await getConsultationOrderListApi(filteredParams);
};

// 工具函数
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待咨询',
    completed: '已完成',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs',
    completed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs',
    cancelled: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs',
  };
  return colorMap[status] || '';
};

const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    online: '在线咨询',
    offline: '线下面诊',
    phone: '电话咨询',
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
      title: '咨询地址',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'situation',
      title: '咨询适用情况',
      minWidth: 200,
      slots: { default: 'situation' },
    },
    {
      field: 'create_time',
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
      width: 80,
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
          createStartTime: formValues.create_start_time
            ? (Date.parse(formValues.create_start_time) - 28800000) / 1000
            : undefined,
          createEndTime: formValues.create_end_time
            ? (Date.parse(formValues.create_end_time) - 28800000) / 1000 + 86399
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
        <span>{{ dayjs(row.create_time * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>

      <template #consultationMethod="{ row }">
        <span :class="getMethodColor(row.consultation_method)">
          {{ getMethodText(row.consultation_method) }}
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
        <Button
          type="link"
          size="small"
          @click="handleViewDetail(row)"
        >
          详情
        </Button>
      </template>

    </Grid>
  </Page>
</template>
