<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Page } from '@vben/common-ui';
import { Card, Rate, Button } from 'ant-design-vue';
import dayjs from 'dayjs';

defineOptions({
  name: 'ActivityOrderDetail',
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

interface EvaluationItem {
  title: string;
  question: string;
  rating: number;
}

const route = useRoute();
const router = useRouter();
const orderDetail = ref<ActivityOrder | null>(null);
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
    title: '赋能与效果问题',
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

// 获取活动方式文本
const getMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    online: '线上活动',
    offline: '线下活动',
    hybrid: '混合模式',
  };
  return methodMap[method] || method;
};

// 模拟获取订单详情数据
const getOrderDetail = async (id: string) => {
  // 模拟API调用
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // 模拟数据 - 基于 activity/index.vue 中的数据结构
  const mockDetail: ActivityOrder = {
    id: Number(id),
    orderCode: 'TA20241201001',
    activityName: '企业团建户外拓展训练',
    activityTime: dayjs().add(3, 'day').unix(),
    activityMethod: 'offline',
    activityAddress: '北京市怀柔区红螺寺拓展基地',
    registrationTime: dayjs().subtract(1, 'hour').unix(),
    registrant: '张总',
    status: 'waiting',
    createTime: dayjs().subtract(2, 'hour').unix(),
  };
  
  return mockDetail;
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
      <Card title="详情">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">订单编号：</span>
            <span class="font-medium">{{ orderDetail.orderCode }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">下单时间：</span>
            <span>{{ dayjs(orderDetail.createTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">课程名字：</span>
            <span>{{ orderDetail.activityName }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">课程时间：</span>
            <span>{{ dayjs(orderDetail.activityTime * 1000).format('YYYY-MM-DD HH:mm') }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">活动方式：</span>
            <span>{{ getMethodText(orderDetail.activityMethod) }}</span>
          </div>
          
          <div class="flex items-center">
            <span class="w-32 text-gray-600 dark:text-gray-300">课程地址：</span>
            <span>{{ orderDetail.activityAddress || '-' }}</span>
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
