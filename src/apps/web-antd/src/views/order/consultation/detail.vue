<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { Card, Rate, Button } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getConsultationOrderDetailApi, type ConsultationOrderDetailData } from '#/api/core/order';

defineOptions({
  name: 'ConsultationOrderDetail',
});

interface EvaluationItem {
  title: string;
  question: string;
  rating: number;
}

const route = useRoute();
const router = useRouter();
const orderDetail = ref<ConsultationOrderDetailData | null>(null);
const evaluations = ref<EvaluationItem[]>([
  {
    title: '信任与连接',
    question: '我认为我的咨询师是值得信赖的，我能在一个安全、不受评判的氛围中坦诚地表达自己的想法和感受；',
    rating: 5
  },
  {
    title: '专业与目标',
    question: '咨询师能清晰地理解我的核心问题，并和我一起制定了明确、可行的咨询目标和计划；',
    rating: 5
  },
  {
    title: '赋能与效果问题：',
    question: '通过咨询，我获得了新的视角、知识或技巧，这帮助我更好地应对当前面临的挑战；',
    rating: 5
  },
  {
    title: '倾听与沟通',
    question: '我的咨询师能够积极、专注地倾听，并能用易于理解的方式与我沟通。',
    rating: 5
  },
  {
    title: '整体满意度',
    question: '总体而言，我对这位咨询师提供的服务感到满意，并会愿意向有需要的朋友推荐他/她。',
    rating: 5
  }
]);

// 获取咨询方式文本
const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    online: '在线咨询',
    offline: '线下面诊',
    phone: '电话咨询',
  };
  return methodMap[method] || method;
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
      <Button 
        type="default" 
        @click="handleGoBack"

      >

        返回
      </Button>
    </template>
    
    <div v-if="orderDetail" class="space-y-6">
      <!-- 订单信息 -->
      <Card title="订单信息">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">订单编码：</span>
            <span class="font-medium">{{ orderDetail.order_code }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">下单时间：</span>
            <span>{{ dayjs(orderDetail.created_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">咨询师：</span>
            <span>{{ orderDetail.consultant }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">咨询时间：</span>
            <span>{{ dayjs(orderDetail.appointment_time).format('YYYY-MM-DD HH:mm') }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">咨询方式：</span>
            <span>{{ getMethodText(orderDetail.consultation_method) }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">咨询地址：</span>
            <span>{{ orderDetail.consultation_address || '-' }}</span>
          </div>
          
          <div class="flex items-start col-span-full">
            <span class="w-32 text-gray-600 dark:text-gray-300 mt-1">咨询适用情况说明：</span>
            <span class="flex-1">{{ orderDetail.situation }}</span>
          </div>
        </div>
      </Card>

      <!-- 评价 -->
      <Card title="评价">
        <div class="space-y-8">
          <div 
            v-for="(item, index) in evaluations" 
            :key="index"
            class="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0"
          >
            <div class="mb-3">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ index + 1 }}、{{ item.title }}
              </h3>
            </div>
            
            <div class="mb-4">
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                问题：{{ item.question }}
              </p>
            </div>
            
            <div class="flex items-center">
              <Rate 
                :value="item.rating"
                disabled
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
    
    <!-- 加载状态 -->
    <div v-else>
      <div class="flex justify-center items-center h-64">
        <div class="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    </div>
  </Page>
</template>

