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

// 当前查看的周起始日期（周一）
const currentWeekStart = ref<Dayjs>(dayjs(props.currentWeek).startOf('week').add(1, 'day'));

// 拖拽选择状态
const isDragging = ref(false);
const dragStart = ref<{ day: number; hour: number } | null>(null);
const dragEnd = ref<{ day: number; hour: number } | null>(null);

// 移动模式状态
const isMoveMode = ref(false);
const moveSourceSlot = ref<TimeSlot | null>(null);
const moveTargetDay = ref<number | null>(null);
const moveTargetHour = ref<number | null>(null);

// 当前周的日期数组
const weekDates = computed(() => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(currentWeekStart.value.add(i, 'day'));
  }
  return dates;
});

// 格式化时间显示
const formatTimeRange = (slot: TimeSlot) => {
  const startTime = String(slot.startHour).padStart(2, '0') + ':00';
  // 用户选择的实际结束时间应该是endHour-1，因为endHour表示不包含的下一小时
  const actualEndHour = Math.max(0, slot.endHour - 1);
  const endTime = String(actualEndHour).padStart(2, '0') + ':00';
  return `${startTime} - ${endTime}`;
};

// 获取周几显示文本
const getWeekDayText = (day: number) => {
  return weekLabels[day];
};

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

// 周几的标签（从周一开始）
const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

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
  currentWeekStart.value = dayjs().startOf('week').add(1, 'day');
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
  if (!isMoveMode.value || !moveSourceSlot.value || moveTargetDay.value === null || moveTargetHour.value === null) return false;
  
  if (day !== moveTargetDay.value) return false;
  
  // 计算移动后的时间段范围
  const duration = moveSourceSlot.value.endHour - moveSourceSlot.value.startHour;
  const newStartHour = moveTargetHour.value;
  const newEndHour = newStartHour + duration;
  
  return hour >= newStartHour && hour < newEndHour;
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
      moveTargetHour.value = hour;
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
    // 移动模式：可以跨天移动并且可以改变时间位置
    moveTargetDay.value = day;
    moveTargetHour.value = hour;
  }
};

// 结束拖拽选择或移动
const handleMouseUp = () => {
  if (isDragging.value && dragStart.value && dragEnd.value) {
    // 选择模式
    const day = dragStart.value.day;
    const minHour = Math.min(dragStart.value.hour, dragEnd.value.hour);
    const maxHour = Math.max(dragStart.value.hour, dragEnd.value.hour);
    
    // 修复：结束时间应该是maxHour + 1，表示到下一个小时的开始
    addTimeSlot(day, minHour, maxHour + 1);
  } else if (isMoveMode.value && moveSourceSlot.value && moveTargetDay.value !== null && moveTargetHour.value !== null) {
    // 移动模式
    if (moveTargetDay.value !== moveSourceSlot.value.day || moveTargetHour.value !== moveSourceSlot.value.startHour) {
      // 当移动到不同的天或不同的时间时才执行移动
      moveTimeSlot(moveSourceSlot.value, moveTargetDay.value, moveTargetHour.value);
    }
  }
  
  // 重置所有状态
  isDragging.value = false;
  dragStart.value = null;
  dragEnd.value = null;
  isMoveMode.value = false;
  moveSourceSlot.value = null;
  moveTargetDay.value = null;
  moveTargetHour.value = null;
};

// 添加时间段
const addTimeSlot = (day: number, startHour: number, endHour: number) => {
  // 清空所有现有选择，只允许一个时间段
  selectedTimeSlots.value = [];
  
  // 添加新的时间段
  selectedTimeSlots.value.push({
    day,
    startHour,
    endHour,
    startMinute: 0,
    endMinute: 0,
  });
  
  emit('update:modelValue', selectedTimeSlots.value);
};



// 检查是否为今天
const isToday = (date: Dayjs) => {
  return date.isSame(dayjs(), 'day');
};

// 移动时间段
const moveTimeSlot = (sourceSlot: TimeSlot, targetDay: number, targetHour: number) => {
  // 计算时间段的持续时长
  const duration = sourceSlot.endHour - sourceSlot.startHour;
  
  // 确保目标时间不会超出24小时范围
  const maxStartHour = 24 - duration;
  const finalStartHour = Math.min(targetHour, maxStartHour);
  const finalEndHour = finalStartHour + duration;
  
  // 清空所有现有选择并添加新位置的时间段
  selectedTimeSlots.value = [{
    day: targetDay,
    startHour: finalStartHour,
    endHour: finalEndHour,
    startMinute: sourceSlot.startMinute || 0,
    endMinute: sourceSlot.endMinute || 0,
  }];
  
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
    currentWeekStart.value = dayjs(newValue).startOf('week').add(1, 'day');
  }
});

// 初始化时发送周变化事件
emitWeekChange();
</script>

<template>
  <div class="week-date-picker min-w-[900px]" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
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
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- 日期头部 -->
      <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <!-- 时间轴列头 -->
        <div class="h-20 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
          <span class="text-lg font-medium text-gray-700 dark:text-gray-300">时间</span>
        </div>
        
        <!-- 日期列头 -->
        <div 
          v-for="(date, index) in weekDates" 
          :key="date.format('YYYY-MM-DD')"
          class="h-20 min-w-[100px] border-r border-gray-200 dark:border-gray-700 last:border-r-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700"
        >
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ weekLabels[index] }}
          </div>
          <div 
            class="text-xl font-medium"
            :class="{
              'text-orange-600 dark:text-orange-400': isToday(date),
              'text-gray-700 dark:text-gray-300': !isToday(date)
            }"
          >
            {{ date.date() }}
          </div>
        </div>
      </div>
      
      <!-- 时间轴和选择内容 -->
      <div class="grid grid-cols-8 select-none max-h-[528px] overflow-y-auto relative">
        <!-- 时间轴 -->
        <div class="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div 
            v-for="time in timeSlots" 
            :key="time"
            class="h-12 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ time }}
          </div>
        </div>
        
        <!-- 日期列 -->
        <div 
          v-for="(date, dayIndex) in weekDates" 
          :key="date.format('YYYY-MM-DD')"
          class="border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-w-[100px]"
        >
          <!-- 时间格子 -->
          <div 
            v-for="(time, hour) in timeSlots" 
            :key="`${date.format('YYYY-MM-DD')}-${time}`"
            class="h-12 min-w-[100px] border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer transition-all duration-150 relative"
            :class="{
              'bg-blue-300 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500': isTimeSlotSelected(dayIndex, hour),
              'bg-blue-200 dark:bg-blue-700/50': isTimeSlotInDragRange(dayIndex, hour) && !isTimeSlotSelected(dayIndex, hour),
              'bg-green-200 dark:bg-green-700/50 border-2 border-green-400 dark:border-green-500': isTimeSlotInMovePreview(dayIndex, hour),
              'hover:bg-blue-100 dark:hover:bg-blue-800/50': !isTimeSlotSelected(dayIndex, hour) && !isTimeSlotInDragRange(dayIndex, hour) && !isTimeSlotInMovePreview(dayIndex, hour),
              'cursor-move': isTimeSlotSelected(dayIndex, hour) && !isMoveMode,
              'cursor-grabbing': isMoveMode && moveSourceSlot && moveSourceSlot.day === dayIndex,
              'cursor-crosshair': isMoveMode && !isTimeSlotInMovePreview(dayIndex, hour)
            }"
            @mousedown.prevent="handleMouseDown(dayIndex, hour)"
            @mouseenter="handleMouseEnter(dayIndex, hour)"
          >
            <!-- 时间段标签显示 -->
            <div 
              v-for="slot in selectedTimeSlots" 
              :key="`label-${slot.day}-${slot.startHour}-${slot.endHour}`"
              v-show="slot.day === dayIndex && hour === slot.startHour"
              class="absolute top-1 left-1 right-1 z-20 bg-blue-600/90 text-white text-xs px-2 py-1 rounded shadow-lg text-center backdrop-blur-sm"
            >
              <div class="font-medium">{{ getWeekDayText(slot.day) }}</div>
              <div>{{ formatTimeRange(slot) }}</div>
            </div>
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
  grid-template-columns: 120px repeat(7, 1fr);
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
