<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { Card, Rate, Button } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  getConsultationOrderDetailApi,
  type ConsultationOrderDetailData,
} from '#/api/core/order';

defineOptions({
  name: 'ConsultationOrderDetail',
});

const route = useRoute();
const router = useRouter();
const orderDetail = ref<ConsultationOrderDetailData | null>(null);

// 获取咨询方式文本
const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    online: '视频',      // 线上视频咨询
    phone: '语音',       // 电话/语音咨询
    offline: '面对面',    // 线下面对面咨询
  };
  return methodMap[method] || method;
};

// 获取订单状态文本
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

// 获取订单状态颜色
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'text-orange-600',
    completed: 'text-green-600',
    cancelled: 'text-red-600',
    review_pending: 'text-orange-600',
    reviewed: 'text-green-600',
  };
  return colorMap[status] || '';
};

// 获取订单详情数据
const getOrderDetail = async (id: string) => {
  try {
    const data = await getConsultationOrderDetailApi(id);
    return data;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    throw error;
  }
};

// 返回上一页
const handleGoBack = () => {
  router.go(-1);
};

onMounted(async () => {
  const orderId = route.params.id as string;
  if (orderId) {
    orderDetail.value = await getOrderDetail(orderId);
  }
});
</script>

<template>
  <Page auto-content-height title="详情">
    <template #extra>
      <Button type="default" @click="handleGoBack"> 返回 </Button>
    </template>

    <div v-if="orderDetail" class="space-y-6">
      <!-- 订单信息 -->
      <Card title="订单信息">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >订单编码：</span
            >
            <span class="ml-2 font-medium">{{ orderDetail.order_code }}</span>
          </div>

          <div class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >下单时间：</span
            >
            <span class="ml-2">{{
              dayjs(orderDetail.created_at).format('YYYY-MM-DD HH:mm:ss')
            }}</span>
          </div>

          <div class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >咨询师：</span
            >
            <span class="ml-2">{{ orderDetail.consultant }}</span>
          </div>

          <div class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >客户：</span
            >
            <span class="ml-2">{{ orderDetail.customer }}</span>
          </div>

          <div class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >订单状态：</span
            >
            <span class="ml-2" :class="getStatusColor(orderDetail.status)">
              {{ getStatusText(orderDetail.status) }}
            </span>
          </div>

          <div class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >咨询时间：</span
            >
            <span class="ml-2">{{
              dayjs(orderDetail.appointment_time).format('YYYY-MM-DD HH:mm')
            }}</span>
          </div>

          <div class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >咨询方式：</span
            >
            <span class="ml-2">{{
              getMethodText(orderDetail.consultation_method)
            }}</span>
          </div>

          <div v-if="orderDetail.consultation_method === 'offline'" class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >咨询地址：</span
            >
            <span class="ml-2">{{
              orderDetail.consultation_address || '-'
            }}</span>
          </div>

          <div v-else class="flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >会议号：</span
            >
            <span class="ml-2">{{
              orderDetail.meeting_id || '-'
            }}</span>
          </div>

          <div class="col-span-full flex items-center">
            <span class="w-32 text-right text-gray-600 dark:text-gray-300"
              >咨询适用情况说明：</span
            >
            <span class="ml-2 flex-1">{{ orderDetail.situation }}</span>
          </div>
        </div>
      </Card>

      <!-- 评价 -->
      <Card title="评价">
        <div
          v-if="orderDetail.evaluations && orderDetail.evaluations.length > 0"
          class="space-y-8"
        >
          <div
            v-for="(item, index) in orderDetail.evaluations"
            :key="index"
            class="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0 dark:border-gray-700"
          >
            <div class="mb-3">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ index + 1 }}、{{ item.title }}
              </h3>
            </div>

            <!-- <div class="mb-4">
              <p class="leading-relaxed text-gray-700 dark:text-gray-300">
                问题：{{ item.content }}
              </p>
            </div> -->

            <div class="flex items-center">
              <Rate :value="item.rating" disabled />
            </div>
          </div>
        </div>

        <!-- 无评价数据时的提示 -->
        <div v-else class="py-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">暂无评价数据</div>
        </div>
      </Card>
    </div>

    <!-- 加载状态 -->
    <div v-else>
      <div class="flex h-64 items-center justify-center">
        <div class="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    </div>
  </Page>
</template>
