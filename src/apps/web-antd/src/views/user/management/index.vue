<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Avatar, Button, message, Popconfirm, Space, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({
  name: 'UserManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 类型定义
interface UserData {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  gender: string;
  jobNumber: string;
  department: string;
  email: string;
  inviteCode: string;
  companyName: string;
  registerTime: number;
  status: 'active' | 'inactive';
}

interface SearchParams {
  page?: number;
  size?: number;
  username?: string;
  companyName?: string;
  registerStartTime?: number;
  registerEndTime?: number;
}

interface ApiResponse {
  list: UserData[];
  total: number;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  fieldMappingTime: [['rangePicker', ['registerStartTime', 'registerEndTime']]],
  schema: [
    {
      component: 'RangePicker',
      defaultValue: undefined,
      fieldName: 'rangePicker',
      label: '注册时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户信息',
      componentProps: {
        placeholder: '请输入邮箱、手机号',
      },
    },
    {
      component: 'Input',
      fieldName: 'companyName',
      label: '公司名称',
      componentProps: {
        placeholder: '请输入公司名称',
      },
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: true,
};

// 模拟用户数据API
const getUserList = async (params: SearchParams): Promise<ApiResponse> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData: UserData[] = [
    {
      id: 1,
      username: '13800138001',
      nickname: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
      gender: '男',
      jobNumber: 'EMP001',
      department: '技术部',
      email: 'zhangsan@alibaba.com',
      inviteCode: 'INV001',
      companyName: '阿里巴巴',
      registerTime: dayjs().subtract(30, 'day').unix(),
      status: 'active',
    },
    {
      id: 2,
      username: '13800138002',
      nickname: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
      gender: '女',
      jobNumber: 'EMP002',
      department: '产品部',
      email: 'lisi@tencent.com',
      inviteCode: 'INV002',
      companyName: '腾讯科技',
      registerTime: dayjs().subtract(25, 'day').unix(),
      status: 'inactive',
    },
    {
      id: 3,
      username: '13800138003',
      nickname: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      gender: '男',
      jobNumber: 'EMP003',
      department: '运营部',
      email: 'wangwu@baidu.com',
      inviteCode: 'INV003',
      companyName: '百度',
      registerTime: dayjs().subtract(20, 'day').unix(),
      status: 'active',
    },
    {
      id: 4,
      username: '13800138004',
      nickname: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
      gender: '女',
      jobNumber: 'EMP004',
      department: '设计部',
      email: 'zhaoliu@bytedance.com',
      inviteCode: 'INV004',
      companyName: '字节跳动',
      registerTime: dayjs().subtract(15, 'day').unix(),
      status: 'active',
    },
    {
      id: 5,
      username: '13800138005',
      nickname: '孙七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',
      gender: '男',
      jobNumber: 'EMP005',
      department: '市场部',
      email: 'sunqi@huawei.com',
      inviteCode: 'INV005',
      companyName: '华为技术',
      registerTime: dayjs().subtract(10, 'day').unix(),
      status: 'inactive',
    },
  ];

  // 模拟搜索过滤
  let filteredData = mockData;

  if (params.username) {
    filteredData = filteredData.filter(
      (item) =>
        item.username.includes(params.username!) ||
        item.email.includes(params.username!) ||
        item.nickname.includes(params.username!),
    );
  }

  if (params.companyName) {
    filteredData = filteredData.filter((item) =>
      item.companyName.includes(params.companyName!),
    );
  }

  if (params.registerStartTime && params.registerEndTime) {
    filteredData = filteredData.filter(
      (item) =>
        item.registerTime >= params.registerStartTime! &&
        item.registerTime <= params.registerEndTime!,
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

// 用户操作函数
const handleEnable = (row: UserData) => {
  console.log('启用用户:', row);
  
  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;
    
    message.success({
      content: '用户启用成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleDisable = (row: UserData) => {
  console.log('禁用用户:', row);
  
  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;
    
    message.success({
      content: '用户禁用成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

// 工具栏操作函数
const handleExport = () => {
  console.log('导出数据');
  // 这里可以调用导出数据的逻辑
};

const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'username',
      title: '用户手机',
      showOverflow: 'tooltip',
    },
    {
      field: 'nickname',
      title: '昵称',
      showOverflow: 'tooltip',
    },
    {
      field: 'avatar',
      title: '头像',
      width: 80,
      slots: { default: 'avatar' },
    },
    {
      field: 'gender',
      title: '性别',
      width: 70,
    },
    {
      field: 'jobNumber',
      title: '工号',
    },
    {
      field: 'department',
      title: '部门',
    },
    {
      field: 'email',
      title: '邮箱',
      showOverflow: 'tooltip',
    },
    {
      field: 'inviteCode',
      title: '邀请码',
    },
    {
      field: 'companyName',
      title: '公司名称',
      showOverflow: 'tooltip',
    },
    {
      field: 'registerTime',
      title: '注册时间',
      width: 180,
      slots: { default: 'registerTime' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 120,
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
        const result = await getUserList({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
          // 处理时间范围搜索
          registerStartTime: formValues.registerStartTime
            ? (Date.parse(formValues.registerStartTime) - 28800000) / 1000
            : undefined,
          registerEndTime: formValues.registerEndTime
            ? (Date.parse(formValues.registerEndTime) - 28800000) / 1000 + 86399
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
    <Page auto-content-height title="用户管理">
    <Grid>
      <template #toolbar-actions>
        <Button type="primary" class="mr-4" @click="handleExport">
          批量导出
        </Button>
      </template>

      <template #avatar="{ row }">
        <div class="flex justify-center">
          <Avatar :src="row.avatar" :size="40" />
        </div>
      </template>

      <template #registerTime="{ row }">
        <span>
          {{ dayjs(row.registerTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>

      <template #actions="{ row }">
        <Space>
          <Popconfirm
            v-if="row.status === 'inactive'"
            title="确定要启用这个用户吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleEnable(row)"
          >
            <Button type="link" size="small"> 启用 </Button>
          </Popconfirm>
          <Popconfirm
            v-else
            title="确定要禁用这个用户吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDisable(row)"
          >
            <Button type="link" danger size="small"> 禁用 </Button>
          </Popconfirm>
        </Space>
      </template>
    </Grid>
  </Page>
  </Spin>
</template>
