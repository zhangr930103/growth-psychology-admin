<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { Image } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getFeedbackListApi, type FeedbackListResponse } from '#/api/core';

defineOptions({
  name: 'FeedbackManagement',
});

// 获取意见反馈列表
async function getFeedbackList(params: { page?: number; size?: number }): Promise<FeedbackListResponse> {
  const { page = 1, size = 10 } = params;
  return await getFeedbackListApi({ page, size });
}

const gridOptions: VxeTableGridOptions = {
  columns: [
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
            v-if="row.image"
            :src="row.image"
            style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"
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
