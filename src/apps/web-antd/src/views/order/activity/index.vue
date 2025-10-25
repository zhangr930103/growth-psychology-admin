<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { 
  getActivityOrderListApi,
  activityOrderActionApi,
  type ActivityOrderListParams,
  type ActivityOrderData,
  type ActivityOrderListResponse 
} from '#/api/core/order';

defineOptions({
  name: 'ActivityOrderList',
});

// 使用从API导入的类型别名
type ActivityOrder = ActivityOrderData;
type SearchParams = ActivityOrderListParams;
type ApiResponse = ActivityOrderListResponse;

// 状态选项卡
const statusTabs = [
  { label: '全部', value: '' },
  { label: '待开团', value: 'waiting' },
  { label: '已成团', value: 'formed' },
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
      fieldName: 'activity_name',
      label: '活动名称',
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
          { label: '待开团', value: 'waiting' },
          { label: '已成团', value: 'formed' },
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

// API调用函数
const getActivityList = async (params: SearchParams): Promise<ApiResponse> => {
  // 如果有状态选项卡选择，将其添加到查询参数中
  const queryParams = {
    ...params,
    status: currentStatus.value || params.status
  };
  return await getActivityOrderListApi(queryParams);
};

// 工具函数
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    waiting: '待开团',
    formed: '已成团',
    completed: '已完成',
    reviewed: '已评价',
    cancelled: '已取消',
    WAITING: '待开团',
    FORMED: '已成团',
    COMPLETED: '已完成',
    REVIEWED: '已评价',
    CANCELLED: '已取消',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const statusKey = status.toLowerCase();
  const colorMap: Record<string, string> = {
    waiting: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs',
    formed: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs',
    completed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs',
    reviewed: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-xs',
    cancelled: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs',
  };
  return colorMap[statusKey] || '';
};

const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    online: '视频',
    offline: '语音',
    hybrid: '面对面',
    ONLINE: '视频',
    OFFLINE: '语音',
    HYBRID: '面对面',
  };
  return methodMap[method] || method;
};

const getMethodColor = (method: string): string => {
  const methodKey = method.toLowerCase();
  const colorMap: Record<string, string> = {
    online: 'text-blue-600 dark:text-blue-400',
    offline: 'text-green-600 dark:text-green-400',
    hybrid: 'text-purple-600 dark:text-purple-400',
  };
  return colorMap[methodKey] || '';
};

// 事件处理
const handleStatusChange = (status: string) => {
  currentStatus.value = status;
  gridApi.query();
};

const handleViewDetail = (row: ActivityOrder) => {
  router.push(`/order/activity/detail/${row.id}`);
};

// 检查状态是否匹配（不区分大小写）
const isStatus = (status: string, ...targets: string[]) => {
  const lowerStatus = status.toLowerCase();
  return targets.some(target => target.toLowerCase() === lowerStatus);
};

// 处理活动完成
const handleCompleteActivity = (row: ActivityOrder) => {
  Modal.confirm({
    title: '确认操作',
    content: '确认将此活动标记为已完成吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await activityOrderActionApi(row.id, { action: 'complete' });
        message.success('活动已完成');
        // 刷新列表
        gridApi.query();
      } catch (error) {
        console.error('操作失败:', error);
        message.error('操作失败，请稍后重试');
      }
    },
  });
};

// 处理取消活动
const handleCancelActivity = (row: ActivityOrder) => {
  Modal.confirm({
    title: '确认操作',
    content: '确认取消此活动吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await activityOrderActionApi(row.id, { action: 'cancel' });
        message.success('活动已取消');
        // 刷新列表
        gridApi.query();
      } catch (error) {
        console.error('操作失败:', error);
        message.error('操作失败，请稍后重试');
      }
    },
  });
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
      field: 'activity_name',
      title: '活动名称',
      minWidth: 150,
      slots: { default: 'activityName' },
    },
    {
      field: 'activity_time',
      title: '活动时间',
      minWidth: 140,
      slots: { default: 'activityTime' },
    },
    {
      field: 'activity_method',
      title: '活动方式',
      minWidth: 90,
      slots: { default: 'activityMethod' },
    },
    {
      field: 'activity_address',
      title: '活动地点',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'registration_time',
      title: '报名时间',
      minWidth: 140,
      slots: { default: 'registrationTime' },
    },
    {
      field: 'registrant',
      title: '报名人',
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
      width: 240,
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
          create_start_time: formValues.create_start_time
            ? (Date.parse(formValues.create_start_time) - 28800000) / 1000
            : undefined,
          create_end_time: formValues.create_end_time
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
  <Page auto-content-height title="团队活动列表">
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

      <template #activityName="{ row }">
        <span class="font-medium" :title="row.activity_name">{{ row.activity_name }}</span>
      </template>

      <template #activityTime="{ row }">
        <span>{{ dayjs(row.activity_time).format('YYYY-MM-DD HH:mm') }}</span>
      </template>

      <template #registrationTime="{ row }">
        <span>{{ dayjs(row.registration_time * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>

      <template #activityMethod="{ row }">
        <span :class="getMethodColor(row.activity_method)">
          {{ getMethodText(row.activity_method) }}
        </span>
      </template>

      <template #status="{ row }">
        <span :class="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex flex-nowrap items-center justify-center gap-1">
          <Button
            v-if="isStatus(row.status, 'formed')"
            type="link"
            size="small"
            @click="handleCompleteActivity(row)"
          >
            活动完成
          </Button>
          <Button
            v-if="isStatus(row.status, 'waiting', 'formed')"
            type="link"
            size="small"
            danger
            @click="handleCancelActivity(row)"
          >
            取消活动
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
  </Page>
</template>
