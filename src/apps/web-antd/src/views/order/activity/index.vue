<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({
  name: 'ActivityOrderList',
});

// 类型定义
interface ActivityOrder {
  id: number;
  orderCode: string;
  activityName: string;
  activityTime: number;
  activityMethod: 'online' | 'offline' | 'hybrid';
  activityAddress?: string;
  registrationTime: number;
  registrant: string;
  status: 'waiting' | 'formed' | 'completed' | 'cancelled';
  createTime: number;
}

interface SearchParams {
  page?: number;
  size?: number;
  orderCode?: string;
  activityName?: string;
  status?: string;
  createStartTime?: number;
  createEndTime?: number;
}

interface ApiResponse {
  list: ActivityOrder[];
  total: number;
}

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
  fieldMappingTime: [['rangePicker', ['createStartTime', 'createEndTime']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'orderCode',
      label: '订单编码',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      fieldName: 'activityName',
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

// 模拟API
const getActivityList = async (params: SearchParams): Promise<ApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: ActivityOrder[] = [
    {
      id: 1,
      orderCode: 'TA20241201001',
      activityName: '企业团建户外拓展训练',
      activityTime: dayjs().add(3, 'day').unix(),
      activityMethod: 'offline',
      activityAddress: '北京市怀柔区红螺寺拓展基地',
      registrationTime: dayjs().subtract(1, 'hour').unix(),
      registrant: '张总',
      status: 'waiting',
      createTime: dayjs().subtract(2, 'hour').unix(),
    },
    {
      id: 2,
      orderCode: 'TA20241201002',
      activityName: '线上团队协作工作坊',
      activityTime: dayjs().add(1, 'day').unix(),
      activityMethod: 'online',
      activityAddress: '',
      registrationTime: dayjs().subtract(3, 'hour').unix(),
      registrant: '李经理',
      status: 'formed',
      createTime: dayjs().subtract(4, 'hour').unix(),
    },
    {
      id: 3,
      orderCode: 'TA20241201003',
      activityName: '企业年会策划与执行',
      activityTime: dayjs().subtract(1, 'week').unix(),
      activityMethod: 'offline',
      activityAddress: '上海市浦东新区国际会议中心',
      registrationTime: dayjs().subtract(2, 'week').unix(),
      registrant: '王主管',
      status: 'completed',
      createTime: dayjs().subtract(3, 'week').unix(),
    },
    {
      id: 4,
      orderCode: 'TA20241201004',
      activityName: '团队沟通技巧培训',
      activityTime: dayjs().add(5, 'day').unix(),
      activityMethod: 'hybrid',
      activityAddress: '深圳市南山区科技园培训中心',
      registrationTime: dayjs().subtract(30, 'minute').unix(),
      registrant: '陈部长',
      status: 'waiting',
      createTime: dayjs().subtract(1, 'hour').unix(),
    },
    {
      id: 5,
      orderCode: 'TA20241201005',
      activityName: '公司团建聚餐活动',
      activityTime: dayjs().subtract(3, 'day').unix(),
      activityMethod: 'offline',
      activityAddress: '广州市天河区某酒店',
      registrationTime: dayjs().subtract(1, 'week').unix(),
      registrant: '赵秘书',
      status: 'cancelled',
      createTime: dayjs().subtract(1, 'week').unix(),
    },
    {
      id: 6,
      orderCode: 'TA20241201006',
      activityName: '领导力提升训练营',
      activityTime: dayjs().subtract(2, 'week').unix(),
      activityMethod: 'offline',
      activityAddress: '杭州市西湖区企业培训基地',
      registrationTime: dayjs().subtract(3, 'week').unix(),
      registrant: '孙总监',
      status: 'completed',
      createTime: dayjs().subtract(4, 'week').unix(),
    },
  ];

  // 过滤数据
  let filteredData = mockData;

  if (params.orderCode) {
    filteredData = filteredData.filter(item => 
      item.orderCode.includes(params.orderCode!)
    );
  }

  if (params.activityName) {
    filteredData = filteredData.filter(item => 
      item.activityName.includes(params.activityName!)
    );
  }

  if (params.status) {
    filteredData = filteredData.filter(item => item.status === params.status);
  }

  if (currentStatus.value) {
    filteredData = filteredData.filter(item => item.status === currentStatus.value);
  }

  if (params.createStartTime && params.createEndTime) {
    filteredData = filteredData.filter(item =>
      item.createTime >= params.createStartTime! &&
      item.createTime <= params.createEndTime!
    );
  }

  // 分页
  const { page = 1, size = 10 } = params;
  const total = filteredData.length;
  const start = (page - 1) * size;
  const end = start + size;
  const list = filteredData.slice(start, end);

  return { list, total };
};

// 工具函数
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    waiting: '待开团',
    formed: '已成团',
    completed: '已完成',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    waiting: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs',
    formed: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs',
    completed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs',
    cancelled: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs',
  };
  return colorMap[status] || '';
};

const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    online: '线上活动',
    offline: '线下活动',
    hybrid: '混合模式',
  };
  return methodMap[method] || method;
};

const getMethodColor = (method: string): string => {
  const colorMap: Record<string, string> = {
    online: 'text-blue-600 dark:text-blue-400',
    offline: 'text-green-600 dark:text-green-400',
    hybrid: 'text-purple-600 dark:text-purple-400',
  };
  return colorMap[method] || '';
};

// 事件处理
const handleStatusChange = (status: string) => {
  currentStatus.value = status;
  gridApi.query();
};

const handleViewDetail = (row: ActivityOrder) => {
  router.push(`/order/activity/detail/${row.id}`);
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'orderCode',
      title: '订单编码',
      minWidth: 120,
      slots: { default: 'orderCode' },
    },
    {
      field: 'activityName',
      title: '活动名称',
      minWidth: 150,
      slots: { default: 'activityName' },
    },
    {
      field: 'activityTime',
      title: '活动时间',
      minWidth: 140,
      slots: { default: 'activityTime' },
    },
    {
      field: 'activityMethod',
      title: '活动方式',
      minWidth: 90,
      slots: { default: 'activityMethod' },
    },
    {
      field: 'activityAddress',
      title: '活动地点',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'registrationTime',
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
        const result = await getActivityList({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
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
        <span class="font-medium text-blue-600 dark:text-blue-400">{{ row.orderCode }}</span>
      </template>

      <template #activityName="{ row }">
        <span class="font-medium" :title="row.activityName">{{ row.activityName }}</span>
      </template>

      <template #activityTime="{ row }">
        <span>{{ dayjs(row.activityTime * 1000).format('YYYY-MM-DD HH:mm') }}</span>
      </template>

      <template #registrationTime="{ row }">
        <span>{{ dayjs(row.registrationTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>

      <template #activityMethod="{ row }">
        <span :class="getMethodColor(row.activityMethod)">
          {{ getMethodText(row.activityMethod) }}
        </span>
      </template>

      <template #status="{ row }">
        <span :class="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
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
