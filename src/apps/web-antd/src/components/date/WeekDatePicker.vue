<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from 'ant-design-vue';
import { ChevronLeft, ChevronRight } from '@vben/icons';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';

defineOptions({
  name: 'WeekDatePicker',
});

// 时间段数据结构
interface TimeSlot {
  day: number; // 0-6 (周日到周六)
  startHour: number; // 0-23
  endHour: number; // 0-23
  startMinute?: number; // 0-59
  endMinute?: number; // 0-59
}

interface Props {
  /** 选中的时间段数组 */
  modelValue?: TimeSlot[];
  /** 当前查看的周起始日期 */
  currentWeek?: string | Date | Dayjs;
}

interface Emits {
  (e: 'update:modelValue', value: TimeSlot[]): void;
  (e: 'weekChange', startDate: string, endDate: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  currentWeek: () => new Date(),
});

const emit = defineEmits<Emits>();

// 设置中文
dayjs.locale('zh-cn');

// 选中的时间段
const selectedTimeSlots = ref<TimeSlot[]>(props.modelValue || []);

// 当前查看的周起始日期（周日）
const currentWeekStart = ref<Dayjs>(dayjs(props.currentWeek).startOf('week'));

// 拖拽选择状态
const isDragging = ref(false);
const dragStart = ref<{ day: number; hour: number } | null>(null);
const dragEnd = ref<{ day: number; hour: number } | null>(null);

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

// 固定时间轴数组（00:00 - 23:00）
const timeSlots = computed(() => {
  const slots = [];
  for (let hour = 0; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
});

// 周几的标签
const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 上一周
const handlePrevWeek = () => {
  currentWeekStart.value = currentWeekStart.value.subtract(1, 'week');
  emitWeekChange();
};

// 下一周
const handleNextWeek = () => {
  currentWeekStart.value = currentWeekStart.value.add(1, 'week');
  emitWeekChange();
};

// 回到本周
const handleToday = () => {
  currentWeekStart.value = dayjs().startOf('week');
  emitWeekChange();
};

// 发送周变化事件
const emitWeekChange = () => {
  const start = currentWeekStart.value.format('YYYY-MM-DD');
  const end = currentWeekStart.value.add(6, 'day').format('YYYY-MM-DD');
  emit('weekChange', start, end);
};

// 检查时间格子是否被选中
const isTimeSlotSelected = (day: number, hour: number) => {
  return selectedTimeSlots.value.some(slot => 
    slot.day === day && hour >= slot.startHour && hour < slot.endHour
  );
};

// 检查时间格子是否在拖拽选择范围内
const isTimeSlotInDragRange = (day: number, hour: number) => {
  if (!isDragging.value || !dragStart.value || !dragEnd.value) return false;
  
  const minDay = Math.min(dragStart.value.day, dragEnd.value.day);
  const maxDay = Math.max(dragStart.value.day, dragEnd.value.day);
  const minHour = Math.min(dragStart.value.hour, dragEnd.value.hour);
  const maxHour = Math.max(dragStart.value.hour, dragEnd.value.hour);
  
  return day >= minDay && day <= maxDay && hour >= minHour && hour <= maxHour;
};

// 开始拖拽选择
const handleMouseDown = (day: number, hour: number) => {
  isDragging.value = true;
  dragStart.value = { day, hour };
  dragEnd.value = { day, hour };
};

// 拖拽过程中
const handleMouseEnter = (day: number, hour: number) => {
  if (isDragging.value && dragStart.value) {
    dragEnd.value = { day, hour };
  }
};

// 结束拖拽选择
const handleMouseUp = () => {
  if (isDragging.value && dragStart.value && dragEnd.value) {
    const minDay = Math.min(dragStart.value.day, dragEnd.value.day);
    const maxDay = Math.max(dragStart.value.day, dragEnd.value.day);
    const minHour = Math.min(dragStart.value.hour, dragEnd.value.hour);
    const maxHour = Math.max(dragStart.value.hour, dragEnd.value.hour);
    
    // 检查是否是取消选择（点击已选中的区域）
    const isSelectedArea = isTimeSlotSelected(dragStart.value.day, dragStart.value.hour);
    
    if (isSelectedArea && dragStart.value.day === dragEnd.value.day && dragStart.value.hour === dragEnd.value.hour) {
      // 单击已选中区域，取消选择
      removeTimeSlot(dragStart.value.day, dragStart.value.hour);
    } else {
      // 添加新的时间段选择
      for (let day = minDay; day <= maxDay; day++) {
        addTimeSlot(day, minHour, maxHour + 1);
      }
    }
  }
  
  isDragging.value = false;
  dragStart.value = null;
  dragEnd.value = null;
};

// 添加时间段
const addTimeSlot = (day: number, startHour: number, endHour: number) => {
  // 移除该天该时间段的现有选择
  selectedTimeSlots.value = selectedTimeSlots.value.filter(slot => 
    !(slot.day === day && ((slot.startHour <= startHour && slot.endHour > startHour) || 
      (slot.startHour < endHour && slot.endHour >= endHour) ||
      (slot.startHour >= startHour && slot.endHour <= endHour)))
  );
  
  // 添加新的时间段
  selectedTimeSlots.value.push({
    day,
    startHour,
    endHour,
    startMinute: 0,
    endMinute: 0,
  });
  
  // 合并相邻的时间段
  mergeAdjacentTimeSlots(day);
  
  emit('update:modelValue', selectedTimeSlots.value);
};

// 移除时间段
const removeTimeSlot = (day: number, hour: number) => {
  const slotIndex = selectedTimeSlots.value.findIndex(slot => 
    slot.day === day && hour >= slot.startHour && hour < slot.endHour
  );
  
  if (slotIndex >= 0) {
    const slot = selectedTimeSlots.value[slotIndex];
    if (!slot) return;
    
    selectedTimeSlots.value.splice(slotIndex, 1);
    
    // 如果点击的不是时间段的边界，需要拆分时间段
    if (hour > slot.startHour) {
      selectedTimeSlots.value.push({
        day,
        startHour: slot.startHour,
        endHour: hour,
        startMinute: 0,
        endMinute: 0,
      });
    }
    
    if (hour + 1 < slot.endHour) {
      selectedTimeSlots.value.push({
        day,
        startHour: hour + 1,
        endHour: slot.endHour,
        startMinute: 0,
        endMinute: 0,
      });
    }
    
    emit('update:modelValue', selectedTimeSlots.value);
  }
};

// 合并相邻的时间段
const mergeAdjacentTimeSlots = (day: number) => {
  const daySlots = selectedTimeSlots.value
    .filter(slot => slot.day === day)
    .sort((a, b) => a.startHour - b.startHour);
  
  const merged: TimeSlot[] = [];
  
  for (const slot of daySlots) {
    if (merged.length === 0) {
      merged.push(slot);
    } else {
      const last = merged[merged.length - 1];
      if (last && last.endHour === slot.startHour) {
        last.endHour = slot.endHour;
      } else {
        merged.push(slot);
      }
    }
  }
  
  // 移除该天的所有时间段，然后添加合并后的时间段
  selectedTimeSlots.value = selectedTimeSlots.value.filter(slot => slot.day !== day);
  selectedTimeSlots.value.push(...merged);
};

// 检查是否为今天
const isToday = (date: Dayjs) => {
  return date.isSame(dayjs(), 'day');
};

// 清空所有选择
const clearAllSelections = () => {
  selectedTimeSlots.value = [];
  emit('update:modelValue', selectedTimeSlots.value);
};

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedTimeSlots.value = [...newValue];
  }
}, { deep: true });

watch(() => props.currentWeek, (newValue) => {
  if (newValue) {
    currentWeekStart.value = dayjs(newValue).startOf('week');
  }
});

// 初始化时发送周变化事件
emitWeekChange();
</script>

<template>
  <div class="week-date-picker" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
    <!-- 头部导航 -->
    <div class="flex items-center justify-between mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm">
      <div class="flex items-center space-x-4">
        <!-- 本周按钮 -->
        <Button @click="handleToday">
          本周
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
        <div class="text-lg font-medium text-blue-900 dark:text-blue-100">
          {{ weekRangeText }}
        </div>
      </div>
      
      <!-- 清空选择按钮 -->
      <Button @click="clearAllSelections" size="small">
        清空选择
      </Button>
    </div>
    
    <!-- 周视图时间选择器 -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700">
      <!-- 日期头部 -->
      <div class="grid grid-cols-8 border-b border-blue-200 dark:border-blue-700">
        <!-- 时间轴列头 -->
        <div class="h-16 border-r border-blue-200 dark:border-blue-700 flex items-center justify-center bg-blue-100 dark:bg-blue-800/30">
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">时间</span>
        </div>
        
        <!-- 日期列头 -->
        <div 
          v-for="(date, index) in weekDates" 
          :key="date.format('YYYY-MM-DD')"
          class="h-16 border-r border-blue-200 dark:border-blue-700 last:border-r-0 flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-800/30"
        >
          <div class="text-xs text-blue-600 dark:text-blue-400">
            {{ weekLabels[index] }}
          </div>
          <div 
            class="text-lg font-medium"
            :class="{
              'text-orange-600 dark:text-orange-400': isToday(date),
              'text-blue-700 dark:text-blue-300': !isToday(date)
            }"
          >
            {{ date.date() }}
          </div>
        </div>
      </div>
      
      <!-- 时间轴和选择内容 -->
      <div class="grid grid-cols-8 select-none">
        <!-- 时间轴 -->
        <div class="border-r border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/30">
          <div 
            v-for="time in timeSlots" 
            :key="time"
            class="h-8 border-b border-blue-200 dark:border-blue-700 last:border-b-0 flex items-center justify-center text-xs text-blue-700 dark:text-blue-300"
          >
            {{ time }}
          </div>
        </div>
        
        <!-- 日期列 -->
        <div 
          v-for="(date, dayIndex) in weekDates" 
          :key="date.format('YYYY-MM-DD')"
          class="border-r border-blue-200 dark:border-blue-700 last:border-r-0"
        >
          <!-- 时间格子 -->
          <div 
            v-for="(time, hour) in timeSlots" 
            :key="`${date.format('YYYY-MM-DD')}-${time}`"
            class="h-8 border-b border-blue-200 dark:border-blue-700 last:border-b-0 cursor-pointer transition-all duration-150"
            :class="{
              'bg-blue-300 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500': isTimeSlotSelected(dayIndex, hour),
              'bg-blue-200 dark:bg-blue-700/50': isTimeSlotInDragRange(dayIndex, hour) && !isTimeSlotSelected(dayIndex, hour),
              'hover:bg-blue-100 dark:hover:bg-blue-800/50': !isTimeSlotSelected(dayIndex, hour) && !isTimeSlotInDragRange(dayIndex, hour)
            }"
            @mousedown.prevent="handleMouseDown(dayIndex, hour)"
            @mouseenter="handleMouseEnter(dayIndex, hour)"
          >
          </div>
        </div>
      </div>
    </div>

    <!-- 插槽用于自定义内容 -->
    <slot name="extra" :selectedTimeSlots="selectedTimeSlots" :clearAllSelections="clearAllSelections"></slot>
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

/* 禁用文本选择，防止拖拽时选中文本 */
.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 时间格子的最小高度 */
.h-8 {
  min-height: 2rem;
}
</style>
