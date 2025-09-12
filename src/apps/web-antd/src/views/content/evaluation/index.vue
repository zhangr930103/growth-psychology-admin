<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, message, Popconfirm, Space, Spin, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getEvaluationListApi, type EvaluationRecord } from '#/api/core';

defineOptions({
  name: 'EvaluationManagement',
});

// 全屏loading状态
const spinning = ref(false);


// 类型定义
type EvaluationData = EvaluationRecord;


// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 130,
  },
  fieldMappingTime: [['rangePicker', ['start_time', 'end_time']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'question',
      label: '评价名称',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      fieldName: 'evaluator_name',
      label: '创建人',
      componentProps: {
        placeholder: '请输入创建人姓名',
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
          { label: '已发布', value: 'approved' },
          { label: '未发布', value: 'pending' },
          { label: '草稿', value: 'rejected' },
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

// 获取评价列表
const getEvaluationList = getEvaluationListApi;


// 操作函数
const handleViewData = (row: EvaluationData) => {
  console.log('查看评价数据:', row);
  message.info('查看数据功能待实现');
};

const handlePublish = (row: EvaluationData) => {
  console.log('发布/撤回:', row);
  const action = row.status === 'approved' ? '撤回' : '发布';

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: `评价${action}成功`,
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleEdit = (row: EvaluationData) => {
  console.log('编辑评价:', row);
  message.info('编辑功能待实现');
};

const handleDelete = (row: EvaluationData) => {
  console.log('删除评价:', row);

  // 开启全屏loading
  spinning.value = true;

  // 模拟API延迟
  setTimeout(() => {
    // 关闭全屏loading
    spinning.value = false;

    message.success({
      content: '评价删除成功',
    });
    // 刷新列表
    gridApi.query();
  }, 1000);
};

const handleCreate = () => {
  console.log('新建评价');
  message.info('新建功能待实现');
};

// 获取状态标签
const getStatusTag = (status: string) => {
  const statusMap = {
    published: { color: 'green', text: '已发布' },
    unpublished: { color: 'orange', text: '未发布' },
    draft: { color: 'gray', text: '草稿' },
    pending: { color: 'orange', text: '未发布' },
    approved: { color: 'green', text: '已发布' },
    rejected: { color: 'gray', text: '草稿' },
  };
  return statusMap[status as keyof typeof statusMap] || { color: 'gray', text: '未知' };
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'title',
      title: '评价名称',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'content',
      title: '评价题目',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
      slots: { default: 'createTime' },
    },
    {
      field: 'evaluator_name',
      title: '创建人',
      width: 100,
    },
    {
      field: 'review_time',
      title: '发布的时间',
      width: 180,
      slots: { default: 'publishTime' },
    },
    {
      field: 'status',
      title: '发布状态',
      width: 120,
      slots: { default: 'publishStatus' },
    },
    {
      field: 'helpful_count',
      title: '评价数',
      width: 100,
      slots: { default: 'evaluationCount' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 250,
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
        const result = await getEvaluationList({
          page: page.currentPage,
          size: page.pageSize,
          question: formValues.question,
          status: formValues.status,
          evaluator_name: formValues.evaluator_name,
          // 处理时间范围搜索
          start_time: formValues.start_time
            ? Math.floor(Date.parse(formValues.start_time) / 1000)
            : undefined,
          end_time: formValues.end_time
            ? Math.floor(Date.parse(formValues.end_time) / 1000)
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
    <Page auto-content-height title="评价管理">
    <Grid>
      <template #toolbar-actions>
        <Button type="primary" class="mr-4" @click="handleCreate">
          新建
        </Button>
      </template>

      <template #createTime="{ row }">
        <span>
          {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>

      <template #publishTime="{ row }">
        <span v-if="row.review_time">
          {{ dayjs(row.review_time).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-300">-</span>
      </template>

      <template #publishStatus="{ row }">
        <Tag :color="getStatusTag(row.status).color">
          {{ getStatusTag(row.status).text }}
        </Tag>
      </template>

      <template #evaluationCount="{ row }">
        <span class="font-semibold text-blue-600 dark:text-blue-400">
          {{ row.helpful_count }}
        </span>
      </template>

      <template #actions="{ row }">
        <Space>
          <Button
            type="link"
            size="small"
            @click="handleViewData(row)"
          >
            数据
          </Button>
          <Popconfirm
            v-if="row.status === 'approved'"
            title="确定要撤回这个评价吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handlePublish(row)"
          >
            <Button type="link" size="small"> 撤回 </Button>
          </Popconfirm>
          <Button
            v-else
            type="link"
            size="small"
            @click="handlePublish(row)"
          >
            发布
          </Button>
          <Button
            type="link"
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个评价吗？"
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

  </Spin>

</template>

