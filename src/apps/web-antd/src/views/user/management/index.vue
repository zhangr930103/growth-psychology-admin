<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserData, UserListParams } from '#/api/core/user';

import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Avatar, Button, message, Popconfirm, Space, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { disableUserApi, enableUserApi, getUserListApi, exportUserListApi, type ExportUserParams } from '#/api/core/user';

defineOptions({
  name: 'UserManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 保存当前的搜索条件
const currentSearchParams = ref<any>({});


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
      fieldName: 'company_name',
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


// 用户操作函数
const handleEnable = async (row: UserData) => {
  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用启用API
    await enableUserApi({ user_id: row.id });
    
    message.success({
      content: '用户启用成功',
    });
    
    // 刷新列表
    gridApi.query();
  } catch (error) {
    console.error('启用用户失败:', error);
  } finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

const handleDisable = async (row: UserData) => {
  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用禁用API
    await disableUserApi({ user_id: row.id });
    
    message.success({
      content: '用户禁用成功',
    });
    
    // 刷新列表
    gridApi.query();
  } catch (error) {
    console.error('禁用用户失败:', error);
  } finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

// 工具栏操作函数  
const handleExport = async () => {
  try {
    // 开启全屏loading
    spinning.value = true;
    
    // 使用当前保存的搜索条件
    const formValues = currentSearchParams.value;
    
    // 构建导出参数
    const exportParams: ExportUserParams = {
      username: formValues.username,
      company_name: formValues.company_name,
      // 处理时间范围搜索参数
      register_start_time: formValues.registerStartTime
        ? Math.floor((Date.parse(formValues.registerStartTime) - 28800000) / 1000)
        : undefined,
      register_end_time: formValues.registerEndTime
        ? Math.floor((Date.parse(formValues.registerEndTime) - 28800000) / 1000) + 86399
        : undefined,
    };
    
    // 调用导出API
    const response = await exportUserListApi(exportParams);
    
    // 处理文件下载
    if (response && response.url) {
      // 创建下载链接
      const link = document.createElement('a');
      link.href = response.url;
      link.download = response.filename;
      link.style.display = 'none';
      
      // 添加到页面并触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({
        content: `导出成功，文件大小：${(response.file_size / 1024).toFixed(2)} KB`,
      });
    } else {
      message.error('导出失败，未获取到下载链接');
    }
  } catch (error) {
    console.error('导出失败:', error);
  } finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

const gridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'username',
      title: '用户手机',
      minWidth: 150,
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
      field: 'job_number',
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
      field: 'invite_code',
      title: '邀请码',
    },
    {
      field: 'company_name',
      title: '公司名称',
      showOverflow: 'tooltip',
    },
    {
      field: 'register_time',
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
        // 保存当前搜索条件用于导出
        currentSearchParams.value = formValues;
        
        const params: UserListParams = {
          page: page.currentPage,
          size: page.pageSize,
          username: formValues.username,
          company_name: formValues.company_name,
          // 处理时间范围搜索
          register_start_time: formValues.registerStartTime
            ? Math.floor((Date.parse(formValues.registerStartTime) - 28800000) / 1000)
            : undefined,
          register_end_time: formValues.registerEndTime
            ? Math.floor((Date.parse(formValues.registerEndTime) - 28800000) / 1000) + 86399
            : undefined,
        };
        const result = await getUserListApi(params);
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
  showOverflow: false,
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
          {{ dayjs(row.register_time * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>

      <template #actions="{ row }">
        <Space>
          <Popconfirm
            v-if="row.status === 'inactive'"
            title="确定要启用这个用户吗？"
            ok-text="确定"
            cancel-text="取消"
            :confirm-loading="false"
            @confirm="handleEnable(row)"
          >
            <Button type="link" size="small"> 启用 </Button>
          </Popconfirm>
          <Popconfirm
            v-else
            title="确定要禁用这个用户吗？"
            ok-text="确定"
            cancel-text="取消"
            :confirm-loading="false"
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
