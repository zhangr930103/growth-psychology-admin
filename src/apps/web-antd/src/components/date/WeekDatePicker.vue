<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from 'ant-design-vue';
import { ChevronLeft, ChevronRight } from '@vben/icons';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';

defineOptions({
  name: 'WeekDatePicker',
});

interface Props {
  /** 当前选中的日期 */
  modelValue?: string | Date | Dayjs;
  /** 是否显示时间轴 */
  showTimeAxis?: boolean;
  /** 时间轴开始时间 */
  startHour?: number;
  /** 时间轴结束时间 */
  endHour?: number;
  /** 可预约时间段数据 */
  appointmentSlots?: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    title?: string;
    type?: 'available' | 'booked' | 'unavailable';
  }>;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'dateChange', date: string): void;
  (e: 'weekChange', startDate: string, endDate: string): void;
  (e: 'appointmentClick', appointment: any): void;
  (e: 'todayClick'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showTimeAxis: true,
  startHour: 1,
  endHour: 23,
  appointmentSlots: () => [],
});

const emit = defineEmits<Emits>();

// 设置中文
dayjs.locale('zh-cn');

// 当前选中日期
const selectedDate = ref<Dayjs>(dayjs(props.modelValue || new Date()));

// 当前周的开始日期（周日）
const currentWeekStart = computed(() => {
  return selectedDate.value.startOf('week'); // dayjs的周从周日开始
});

// 当前周的日期数组
const weekDates = computed(() => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(currentWeekStart.value.add(i, 'day'));
  }
  return dates;
});

// 当前周的日期范围文本
const weekRangeText = computed(() => {
  const start = currentWeekStart.value;
  const end = currentWeekStart.value.add(6, 'day');
  
  if (start.year() === end.year() && start.month() === end.month()) {
    return `${start.year()}年${start.month() + 1}月${start.date()}日 - ${end.date()}日`;
  } else if (start.year() === end.year()) {
    return `${start.year()}年${start.month() + 1}月${start.date()}日 - ${end.month() + 1}月${end.date()}日`;
  } else {
    return `${start.format('YYYY年M月D日')} - ${end.format('YYYY年M月D日')}`;
  }
});

// 时间轴数组
const timeSlots = computed(() => {
  const slots = [];
  for (let hour = props.startHour; hour <= props.endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
});

// 周几的标签
const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 上一周
const handlePrevWeek = () => {
  selectedDate.value = selectedDate.value.subtract(1, 'week');
  emitWeekChange();
};

// 下一周
const handleNextWeek = () => {
  selectedDate.value = selectedDate.value.add(1, 'week');
  emitWeekChange();
};

// 回到今天
const handleToday = () => {
  selectedDate.value = dayjs();
  const dateStr = selectedDate.value.format('YYYY-MM-DD');
  emit('update:modelValue', dateStr);
  emit('dateChange', dateStr);
  emit('todayClick');
  emitWeekChange();
};

// 选择日期
const handleDateSelect = (date: Dayjs) => {
  selectedDate.value = date;
  const dateStr = date.format('YYYY-MM-DD');
  emit('update:modelValue', dateStr);
  emit('dateChange', dateStr);
};

// 发送周变化事件
const emitWeekChange = () => {
  const start = currentWeekStart.value.format('YYYY-MM-DD');
  const end = currentWeekStart.value.add(6, 'day').format('YYYY-MM-DD');
  emit('weekChange', start, end);
};

// 获取日期对应的预约时间段
const getDateAppointments = (date: Dayjs) => {
  const dateStr = date.format('YYYY-MM-DD');
  return props.appointmentSlots.filter(slot => slot.date === dateStr);
};

// 处理预约时间段点击
const handleAppointmentClick = (appointment: any) => {
  emit('appointmentClick', appointment);
};

// 计算时间段的位置和高度
const getAppointmentStyle = (appointment: any) => {
  const startHour = parseInt(appointment.startTime.split(':')[0]);
  const startMinute = parseInt(appointment.startTime.split(':')[1]);
  const endHour = parseInt(appointment.endTime.split(':')[0]);
  const endMinute = parseInt(appointment.endTime.split(':')[1]);
  
  const startPosition = ((startHour - props.startHour) * 64) + (startMinute / 60) * 64;
  const endPosition = ((endHour - props.startHour) * 64) + (endMinute / 60) * 64;
  const height = endPosition - startPosition;
  
  return {
    top: `${startPosition}px`,
    height: `${height}px`,
  };
};

// 检查是否为今天
const isToday = (date: Dayjs) => {
  return date.isSame(dayjs(), 'day');
};

// 检查是否为选中日期
const isSelected = (date: Dayjs) => {
  return date.isSame(selectedDate.value, 'day');
};

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDate.value = dayjs(newValue);
  }
});

// 初始化时发送周变化事件
emitWeekChange();
</script>

<template>
  <div class="week-date-picker">
    <!-- 头部导航 -->
    <div class="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="flex items-center space-x-4">
        <!-- 今天按钮 -->
        <Button @click="handleToday">
          今天
        </Button>
        
        <!-- 左右导航 -->
        <div class="flex items-center space-x-2">
          <Button type="text" size="small" @click="handlePrevWeek">
            <ChevronLeft />
          </Button>
          <Button type="text" size="small" @click="handleNextWeek">
            <ChevronRight />
          </Button>
        </div>
        
        <!-- 日期范围 -->
        <div class="text-lg font-medium text-gray-900 dark:text-gray-100">
          {{ weekRangeText }}
        </div>
      </div>
    </div>
    
    <!-- 周视图日历 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <!-- 日期头部 -->
      <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <!-- 时间轴列头 -->
        <div class="h-16 border-r border-gray-200 dark:border-gray-700"></div>
        
        <!-- 日期列头 -->
        <div 
          v-for="(date, index) in weekDates" 
          :key="date.format('YYYY-MM-DD')"
          class="h-16 border-r border-gray-200 dark:border-gray-700 last:border-r-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="{
            'bg-blue-50 dark:bg-blue-900/20': isSelected(date),
            'bg-orange-50 dark:bg-orange-900/20': isToday(date) && !isSelected(date)
          }"
          @click="handleDateSelect(date)"
        >
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ weekLabels[index] }}
          </div>
          <div 
            class="text-lg font-medium"
            :class="{
              'text-blue-600 dark:text-blue-400': isSelected(date),
              'text-orange-600 dark:text-orange-400': isToday(date) && !isSelected(date),
              'text-gray-900 dark:text-gray-100': !isSelected(date) && !isToday(date)
            }"
          >
            {{ date.date() }}
          </div>
        </div>
      </div>
      
      <!-- 时间轴和日历内容 -->
      <div v-if="showTimeAxis" class="grid grid-cols-8">
        <!-- 时间轴 -->
        <div class="border-r border-gray-200 dark:border-gray-700">
          <div 
            v-for="time in timeSlots" 
            :key="time"
            class="h-16 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ time }}
          </div>
        </div>
        
        <!-- 日期列 -->
        <div 
          v-for="date in weekDates" 
          :key="date.format('YYYY-MM-DD')"
          class="border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative"
        >
          <!-- 时间网格 -->
          <div 
            v-for="time in timeSlots" 
            :key="`${date.format('YYYY-MM-DD')}-${time}`"
            class="h-16 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
          </div>
          
          <!-- 预约时间段 -->
          <div 
            v-for="appointment in getDateAppointments(date)" 
            :key="appointment.id"
            class="absolute left-1 right-1 rounded cursor-pointer transition-all hover:shadow-md"
            :class="{
              'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200': appointment.type === 'available',
              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border border-green-200': appointment.type === 'booked',
              'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200': appointment.type === 'unavailable'
            }"
            :style="getAppointmentStyle(appointment)"
            @click="handleAppointmentClick(appointment)"
          >
            <div class="p-2 text-xs">
              <div class="font-medium">{{ appointment.title || '可预约时间' }}</div>
              <div class="text-xs opacity-75">{{ appointment.startTime }} - {{ appointment.endTime }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week-date-picker {
  @apply w-full;
}

/* 确保网格布局正确 */
.grid-cols-8 {
  grid-template-columns: 80px repeat(7, 1fr);
}
</style>
