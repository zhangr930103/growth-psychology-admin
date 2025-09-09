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
  name: 'ConsultationOrderList',
});

// 类型定义
interface ConsultationOrder {
  id: number;
  orderCode: string;
  consultant: string;
  appointmentTime: number;
  consultationMethod: 'online' | 'offline' | 'phone';
  consultationAddress?: string;
  situation: string;
  createTime: number;
  customer: string;
  status: 'pending' | 'completed' | 'cancelled';
}

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

// 模拟API
const getConsultationList = async (params: SearchParams): Promise<ApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: ConsultationOrder[] = [
    {
      id: 1,
      orderCode: 'CO20241201001',
      consultant: '张医生',
      appointmentTime: dayjs().add(1, 'day').unix(),
      consultationMethod: 'online',
      consultationAddress: '',
      situation: '患者有高血压病史，需要咨询用药方案和日常注意事项',
      createTime: dayjs().subtract(1, 'hour').unix(),
      customer: '王小明',
      status: 'pending',
    },
    {
      id: 2,
      orderCode: 'CO20241201002',
      consultant: '李主任',
      appointmentTime: dayjs().subtract(1, 'day').unix(),
      consultationMethod: 'offline',
      consultationAddress: '北京市朝阳区医院门诊部3楼',
      situation: '儿童发热咨询，已持续2天，体温38.5度',
      createTime: dayjs().subtract(2, 'hour').unix(),
      customer: '刘女士',
      status: 'completed',
    },
    {
      id: 3,
      orderCode: 'CO20241201003',
      consultant: '陈教授',
      appointmentTime: dayjs().subtract(3, 'day').unix(),
      consultationMethod: 'phone',
      consultationAddress: '',
      situation: '糖尿病患者血糖控制不佳，需要调整治疗方案',
      createTime: dayjs().subtract(5, 'hour').unix(),
      customer: '赵大爷',
      status: 'cancelled',
    },
    {
      id: 4,
      orderCode: 'CO20241201004',
      consultant: '吴医生',
      appointmentTime: dayjs().add(2, 'day').unix(),
      consultationMethod: 'online',
      consultationAddress: '',
      situation: '产后抑郁症状咨询，情绪低落，睡眠质量差',
      createTime: dayjs().subtract(30, 'minute').unix(),
      customer: '孙女士',
      status: 'pending',
    },
    {
      id: 5,
      orderCode: 'CO20241201005',
      consultant: '马主任',
      appointmentTime: dayjs().subtract(2, 'day').unix(),
      consultationMethod: 'offline',
      consultationAddress: '上海市浦东新区人民医院骨科',
      situation: '腰椎间盘突出术后康复指导和功能锻炼方案制定',
      createTime: dayjs().subtract(1, 'day').unix(),
      customer: '周师傅',
      status: 'completed',
    },
  ];

  // 过滤数据
  let filteredData = mockData;

  if (params.orderCode) {
    filteredData = filteredData.filter(item => 
      item.orderCode.includes(params.orderCode!)
    );
  }

  if (params.consultant) {
    filteredData = filteredData.filter(item => 
      item.consultant.includes(params.consultant!)
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
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'orderCode',
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
      field: 'appointmentTime',
      title: '预约时间',
      minWidth: 140,
      slots: { default: 'appointmentTime' },
    },
    {
      field: 'consultationMethod',
      title: '咨询方式',
      minWidth: 90,
      slots: { default: 'consultationMethod' },
    },
    {
      field: 'consultationAddress',
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
      field: 'createTime',
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
        <span class="font-medium text-blue-600 dark:text-blue-400">{{ row.orderCode }}</span>
      </template>

      <template #appointmentTime="{ row }">
        <span>{{ dayjs(row.appointmentTime * 1000).format('YYYY-MM-DD HH:mm') }}</span>
      </template>

      <template #createTime="{ row }">
        <span>{{ dayjs(row.createTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
      </template>

      <template #consultationMethod="{ row }">
        <span :class="getMethodColor(row.consultationMethod)">
          {{ getMethodText(row.consultationMethod) }}
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
