<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { Image } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({
  name: 'FeedbackManagement',
});

// 模拟意见反馈数据API
async function getFeedbackList(params: any) {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockData = [
    {
      id: 1,
      title: '系统登录问题',
      content: '登录时页面卡顿，希望能够优化登录流程和响应速度',
      image:
        'https://bkimg.cdn.bcebos.com/pic/94cad1c8a786c9177f3e0b45ff6867cf3bc79f3df908',
      feedback_user: '张三',
      feedback_time: dayjs().subtract(1, 'day').unix(),
    },
    {
      id: 2,
      title: '功能建议',
      content: '希望能够增加数据导出功能，方便用户进行数据分析和备份',
      image:
      'https://bkimg.cdn.bcebos.com/pic/94cad1c8a786c9177f3e0b45ff6867cf3bc79f3df908',
      feedback_user: '李四',
      feedback_time: dayjs().subtract(2, 'day').unix(),
    },
    {
      id: 3,
      title: '界面优化建议',
      content: '当前界面色彩搭配不够美观，建议采用更加现代化的设计风格',
      image:
      'https://bkimg.cdn.bcebos.com/pic/94cad1c8a786c9177f3e0b45ff6867cf3bc79f3df908',
      feedback_user: '王五',
      feedback_time: dayjs().subtract(3, 'day').unix(),
    },
    {
      id: 4,
      title: '性能问题反馈',
      image:
      'https://bkimg.cdn.bcebos.com/pic/94cad1c8a786c9177f3e0b45ff6867cf3bc79f3df908',
      feedback_user: '赵六',
      feedback_time: dayjs().subtract(5, 'day').unix(),
    },
    {
      id: 5,
      title: '移动端适配',
      content:
        '手机端使用体验不佳，部分功能无法正常使用，希望能够优化移动端界面',
      image:
      'https://bkimg.cdn.bcebos.com/pic/94cad1c8a786c9177f3e0b45ff6867cf3bc79f3df908',
      feedback_user: '孙七',
      feedback_time: dayjs().subtract(7, 'day').unix(),
    },
  ];

  // 模拟分页
  const { page = 1, size = 10 } = params;
  const total = mockData.length;
  const start = (page - 1) * size;
  const end = start + size;
  const list = mockData.slice(start, end);

  return {
    list,
    total,
  };
}

const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'title',
      title: '标题',
      showOverflow: 'tooltip',
    },
    {
      field: 'content',
      title: '内容',
      showOverflow: 'tooltip',
      width: 400,
    },
    {
      field: 'image',
      title: '图片',
      slots: { default: 'image' },
    },
    {
      field: 'feedback_user',
      title: '反馈人',
    },
    {
      field: 'feedback_time',
      title: '反馈时间',
      width: 180,
      slots: { default: 'feedback_time' },
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        const result = await getFeedbackList({
          page: page.currentPage,
          size: page.pageSize,
        });
        return result;
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [Grid] = useVbenVxeGrid({
  gridOptions,
});
</script>

<template>
  <Page auto-content-height title="意见反馈">
    <Grid>
      <template #image="{ row }">
        <div class="flex justify-center">
          <Image
            :src="row.image"
            style="width: 40px; height: 40px; border-radius: 50%"
          />
        </div>
      </template>

      <template #feedback_time="{ row }">
        <span>
          {{ dayjs(row.feedback_time * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>
    </Grid>
  </Page>
</template>
