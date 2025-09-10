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

// 移动模式状态
const isMoveMode = ref(false);
const moveSourceSlot = ref<TimeSlot | null>(null);
const moveTargetDay = ref<number | null>(null);

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

// 检查时间格子是否在拖拽选择范围内（只允许纵向选择）
const isTimeSlotInDragRange = (day: number, hour: number) => {
  if (!isDragging.value || !dragStart.value || !dragEnd.value) return false;
  
  // 只允许在同一天内拖拽选择
  if (day !== dragStart.value.day) return false;
  
  const minHour = Math.min(dragStart.value.hour, dragEnd.value.hour);
  const maxHour = Math.max(dragStart.value.hour, dragEnd.value.hour);
  
  return hour >= minHour && hour <= maxHour;
};

// 检查是否在移动模式的预览范围内
const isTimeSlotInMovePreview = (day: number, hour: number) => {
  if (!isMoveMode.value || !moveSourceSlot.value || moveTargetDay.value === null) return false;
  
  if (day !== moveTargetDay.value) return false;
  
  return hour >= moveSourceSlot.value.startHour && hour < moveSourceSlot.value.endHour;
};

// 开始拖拽选择或移动
const handleMouseDown = (day: number, hour: number) => {
  const isSelected = isTimeSlotSelected(day, hour);
  
  if (isSelected) {
    // 如果点击的是已选中区域，进入移动模式
    const sourceSlot = selectedTimeSlots.value.find(slot => 
      slot.day === day && hour >= slot.startHour && hour < slot.endHour
    );
    if (sourceSlot) {
      isMoveMode.value = true;
      moveSourceSlot.value = sourceSlot;
      moveTargetDay.value = day;
    }
  } else {
    // 如果点击的是空白区域，进入选择模式
    isDragging.value = true;
    dragStart.value = { day, hour };
    dragEnd.value = { day, hour };
  }
};

// 拖拽过程中
const handleMouseEnter = (day: number, hour: number) => {
  if (isDragging.value && dragStart.value) {
    // 选择模式：只允许在同一天内拖拽
    if (day === dragStart.value.day) {
      dragEnd.value = { day, hour };
    }
  } else if (isMoveMode.value && moveSourceSlot.value) {
    // 移动模式：可以跨天移动
    moveTargetDay.value = day;
  }
};

// 结束拖拽选择或移动
const handleMouseUp = () => {
  if (isDragging.value && dragStart.value && dragEnd.value) {
    // 选择模式
    const day = dragStart.value.day;
    const minHour = Math.min(dragStart.value.hour, dragEnd.value.hour);
    const maxHour = Math.max(dragStart.value.hour, dragEnd.value.hour);
    
    // 添加新的时间段选择
    addTimeSlot(day, minHour, maxHour + 1);
  } else if (isMoveMode.value && moveSourceSlot.value && moveTargetDay.value !== null) {
    // 移动模式
    if (moveTargetDay.value !== moveSourceSlot.value.day) {
      // 只有当移动到不同的天时才执行移动
      moveTimeSlot(moveSourceSlot.value, moveTargetDay.value);
    }
  }
  
  // 重置所有状态
  isDragging.value = false;
  dragStart.value = null;
  dragEnd.value = null;
  isMoveMode.value = false;
  moveSourceSlot.value = null;
  moveTargetDay.value = null;
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

// 移动时间段
const moveTimeSlot = (sourceSlot: TimeSlot, targetDay: number) => {
  // 移除原位置的时间段
  selectedTimeSlots.value = selectedTimeSlots.value.filter(slot => slot !== sourceSlot);
  
  // 在目标位置添加时间段
  const newSlot: TimeSlot = {
    day: targetDay,
    startHour: sourceSlot.startHour,
    endHour: sourceSlot.endHour,
    startMinute: sourceSlot.startMinute || 0,
    endMinute: sourceSlot.endMinute || 0,
  };
  
  // 移除目标天该时间段的现有选择
  selectedTimeSlots.value = selectedTimeSlots.value.filter(slot => 
    !(slot.day === targetDay && ((slot.startHour <= newSlot.startHour && slot.endHour > newSlot.startHour) || 
      (slot.startHour < newSlot.endHour && slot.endHour >= newSlot.endHour) ||
      (slot.startHour >= newSlot.startHour && slot.endHour <= newSlot.endHour)))
  );
  
  selectedTimeSlots.value.push(newSlot);
  
  // 合并目标天的相邻时间段
  mergeAdjacentTimeSlots(targetDay);
  
  emit('update:modelValue', selectedTimeSlots.value);
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
        <div class="h-20 border-r border-blue-200 dark:border-blue-700 flex items-center justify-center bg-blue-100 dark:bg-blue-800/30">
          <span class="text-lg font-medium text-blue-700 dark:text-blue-300">时间</span>
        </div>
        
        <!-- 日期列头 -->
        <div 
          v-for="(date, index) in weekDates" 
          :key="date.format('YYYY-MM-DD')"
          class="h-20 border-r border-blue-200 dark:border-blue-700 last:border-r-0 flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-800/30"
        >
          <div class="text-sm text-blue-600 dark:text-blue-400">
            {{ weekLabels[index] }}
          </div>
          <div 
            class="text-xl font-medium"
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
            class="h-12 border-b border-blue-200 dark:border-blue-700 last:border-b-0 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300"
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
            class="h-12 border-b border-blue-200 dark:border-blue-700 last:border-b-0 cursor-pointer transition-all duration-150 relative"
            :class="{
              'bg-blue-300 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500': isTimeSlotSelected(dayIndex, hour),
              'bg-blue-200 dark:bg-blue-700/50': isTimeSlotInDragRange(dayIndex, hour) && !isTimeSlotSelected(dayIndex, hour),
              'bg-green-200 dark:bg-green-700/50 border-2 border-green-400 dark:border-green-500': isTimeSlotInMovePreview(dayIndex, hour),
              'hover:bg-blue-100 dark:hover:bg-blue-800/50': !isTimeSlotSelected(dayIndex, hour) && !isTimeSlotInDragRange(dayIndex, hour) && !isTimeSlotInMovePreview(dayIndex, hour),
              'cursor-move': isTimeSlotSelected(dayIndex, hour),
              'cursor-grabbing': isMoveMode && moveSourceSlot && moveSourceSlot.day === dayIndex
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
  grid-template-columns: 100px repeat(7, 1fr);
}

/* 禁用文本选择，防止拖拽时选中文本 */
.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 时间格子的最小高度 */
.h-12 {
  min-height: 3rem;
}

/* 头部行高度 */
.h-20 {
  height: 5rem;
}
</style>
