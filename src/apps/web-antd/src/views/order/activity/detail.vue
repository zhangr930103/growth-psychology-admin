<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { Card, Rate, Button } from 'ant-design-vue';
import {
  getActivityOrderDetailApi,
  type ActivityOrderData,
} from '#/api/core/order';
import dayjs from 'dayjs';

defineOptions({
  name: 'ActivityOrderDetail',
});

const route = useRoute();
const router = useRouter();
const orderDetail = ref<ActivityOrderData | null>(null);

// 获取活动方式文本
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

// 获取订单详情数据
const getOrderDetail = async (id: string) => {
  try {
    const data = await getActivityOrderDetailApi(id);
    return data;
  } catch (error) {
    return null;
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
      <Card title="详情">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="flex items-start">
            <span
              class="mr-4 mt-1 w-24 text-right text-gray-600 dark:text-gray-300"
              >订单编号：</span
            >
            <span class="flex-1 font-medium">{{ orderDetail.order_code }}</span>
          </div>

          <div class="flex items-start">
            <span
              class="mr-4 mt-1 w-24 text-right text-gray-600 dark:text-gray-300"
              >下单时间：</span
            >
            <span class="flex-1">{{
              dayjs(orderDetail.created_at).format('YYYY-MM-DD HH:mm:ss')
            }}</span>
          </div>

          <div class="flex items-start">
            <span
              class="mr-4 mt-1 w-24 text-right text-gray-600 dark:text-gray-300"
              >课程名字：</span
            >
            <span class="flex-1">{{ orderDetail.activity_name }}</span>
          </div>

          <div class="flex items-start">
            <span
              class="mr-4 mt-1 w-24 text-right text-gray-600 dark:text-gray-300"
              >课程时间：</span
            >
            <span class="flex-1">{{
              dayjs(orderDetail.activity_time).format('YYYY-MM-DD HH:mm')
            }}</span>
          </div>

          <div class="flex items-start">
            <span
              class="mr-4 mt-1 w-24 text-right text-gray-600 dark:text-gray-300"
              >活动方式：</span
            >
            <span class="flex-1">{{
              getMethodText(orderDetail.activity_method)
            }}</span>
          </div>

          <div class="flex items-start">
            <span
              class="mr-4 mt-1 w-24 text-right text-gray-600 dark:text-gray-300"
              >课程地址：</span
            >
            <span class="flex-1">{{
              orderDetail.activity_address || '-'
            }}</span>
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
