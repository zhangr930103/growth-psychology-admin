<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { Button, DatePicker } from 'ant-design-vue';
import { ChevronLeft, ChevronRight } from '@vben/icons';
import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/zh-cn';

// FullCalendar imports
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions, EventInput, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// 扩展dayjs插件
dayjs.extend(isoWeek);

defineOptions({
  name: 'FullCalendarWeekPicker',
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
const currentWeekStart = ref<Dayjs>(dayjs(props.currentWeek).startOf('isoWeek'));

// FullCalendar 引用
const calendarRef = ref<InstanceType<typeof FullCalendar>>();

// 日期选择器的值
const selectedWeekDate = ref<Dayjs>(currentWeekStart.value);

// DatePicker显示的日期范围格式
const dateRangeFormat = computed(() => {
  const start = currentWeekStart.value;
  const end = currentWeekStart.value.add(6, 'day');
  return `${start.format('YYYY-MM-DD')} - ${end.format('MM-DD')}`;
});


// 周几的标签（从周一开始）
const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 转换时间段为FullCalendar事件
const convertTimeSlotsToEvents = (timeSlots: TimeSlot[]): EventInput[] => {
  return timeSlots.map((slot, index) => {
    // 转换day (周一=0) 到实际日期
    const eventDate = currentWeekStart.value.add(slot.day, 'day');
    const startTime = eventDate.hour(slot.startHour).minute(slot.startMinute || 0);
    const endTime = eventDate.hour(slot.endHour).minute(slot.endMinute || 0);
    
    return {
      id: `slot-${index}`,
      title: `${String(slot.startHour).padStart(2, '0')}:${String(slot.startMinute || 0).padStart(2, '0')} - ${String(slot.endHour).padStart(2, '0')}:${String(slot.endMinute || 0).padStart(2, '0')}`,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      textColor: 'white',
      extendedProps: {
        timeSlot: slot
      }
    };
  });
};

// FullCalendar 配置
const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  headerToolbar: false, // 隐藏默认头部
  initialView: 'timeGridWeek',
  locale: 'zh-cn',
  firstDay: 1, // 周一为第一天
  weekends: true,
  height: 500, // 减少高度
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '00:30:00', // 30分钟间隔
  slotLabelInterval: '01:00:00', // 时间轴标签仍然显示小时
  allDaySlot: false,
  scrollTime: null, // 禁用初始滚动
  nowIndicator: false, // 禁用当前时间指示器
  selectable: true,
  selectMirror: true,
  editable: true,
  eventResizableFromStart: true,
  eventDurationEditable: true,
  eventStartEditable: true,
  events: convertTimeSlotsToEvents(selectedTimeSlots.value),
  initialDate: currentWeekStart.value.toISOString(),
  validRange: {
    start: currentWeekStart.value.toISOString(),
    end: currentWeekStart.value.add(1, 'week').toISOString()
  },
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  dayHeaderFormat: { 
    weekday: 'short', 
    day: 'numeric',
    omitCommas: true 
  },
  dayHeaderContent: (args) => {
    const date = dayjs(args.date);
    const isToday = date.isSame(dayjs(), 'day');
    const dayName = weekLabels[date.day() === 0 ? 6 : date.day() - 1]; // 转换为周一开始
    
    return {
      html: `
        <div class="fc-day-header-content">
          <div class="fc-day-header-day ${isToday ? 'fc-day-today' : ''}">${dayName}</div>
          <div class="fc-day-header-date ${isToday ? 'fc-day-today' : ''}">${date.date()}</div>
        </div>
      `
    };
  },
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  eventClassNames: 'custom-event',
  viewDidMount: () => {
    // 应用自定义样式 - 只添加CSS类
    applyCustomStyles();
  },
  windowResize: () => {
    // 窗口大小改变时确保CSS类存在
    applyCustomStyles();
  }
}));

// 应用自定义样式（简化版 - 所有样式都在CSS中）
const applyCustomStyles = () => {
  const calendarEl = calendarRef.value?.$el;
  if (!calendarEl) return;
  
  // 只添加自定义CSS类，样式全部由CSS处理
  calendarEl.classList.add('feishu-style-calendar');
};

// 处理日期选择
const handleDateSelect = (selectInfo: DateSelectArg) => {
  const startDate = dayjs(selectInfo.start);
  const endDate = dayjs(selectInfo.end);
  
  // 计算day (周一=0到周日=6)
  const day = startDate.day() === 0 ? 6 : startDate.day() - 1;
  
  const timeSlot: TimeSlot = {
    day,
    startHour: startDate.hour(),
    endHour: endDate.hour(),
    startMinute: startDate.minute(),
    endMinute: endDate.minute(),
  };

  // 添加新时间段到现有选择中（支持多个时间段）
  selectedTimeSlots.value = [...selectedTimeSlots.value, timeSlot];
  emit('update:modelValue', selectedTimeSlots.value);
  
  // 取消选择状态
  selectInfo.view.calendar.unselect();
  
  // 刷新事件
  refreshEvents();
};

// 处理事件点击（删除单个时间段）
const handleEventClick = (clickInfo: any) => {
  // 获取点击事件的索引
  const eventId = clickInfo.event.id;
  const index = parseInt(eventId.replace('slot-', ''));
  
  // 删除指定的时间段
  selectedTimeSlots.value.splice(index, 1);
  emit('update:modelValue', selectedTimeSlots.value);
  refreshEvents();
};

// 处理事件拖拽
const handleEventDrop = (info: any) => {
  // 获取事件的索引
  const eventId = info.event.id;
  const index = parseInt(eventId.replace('slot-', ''));
  
  const newStart = dayjs(info.event.start);
  const newEnd = dayjs(info.event.end);
  
  // 计算新的day
  const day = newStart.day() === 0 ? 6 : newStart.day() - 1;
  
  const timeSlot: TimeSlot = {
    day,
    startHour: newStart.hour(),
    endHour: newEnd.hour(),
    startMinute: newStart.minute(),
    endMinute: newEnd.minute(),
  };

  // 更新指定索引的时间段
  selectedTimeSlots.value[index] = timeSlot;
  emit('update:modelValue', selectedTimeSlots.value);
};

// 处理事件大小调整
const handleEventResize = (info: any) => {
  // 获取事件的索引
  const eventId = info.event.id;
  const index = parseInt(eventId.replace('slot-', ''));
  
  const newStart = dayjs(info.event.start);
  const newEnd = dayjs(info.event.end);
  
  // 计算day
  const day = newStart.day() === 0 ? 6 : newStart.day() - 1;
  
  const timeSlot: TimeSlot = {
    day,
    startHour: newStart.hour(),
    endHour: newEnd.hour(),
    startMinute: newStart.minute(),
    endMinute: newEnd.minute(),
  };

  // 更新指定索引的时间段
  selectedTimeSlots.value[index] = timeSlot;
  emit('update:modelValue', selectedTimeSlots.value);
};

// 刷新事件
const refreshEvents = () => {
  const calendar = calendarRef.value?.getApi();
  if (calendar) {
    calendar.removeAllEvents();
    const events = convertTimeSlotsToEvents(selectedTimeSlots.value);
    calendar.addEventSource(events);
  }
};

// 上一周
const handlePrevWeek = () => {
  currentWeekStart.value = currentWeekStart.value.subtract(1, 'week');
  selectedWeekDate.value = currentWeekStart.value;
  const calendar = calendarRef.value?.getApi();
  if (calendar) {
    calendar.gotoDate(currentWeekStart.value.toDate());
  }
  emitWeekChange();
};

// 下一周
const handleNextWeek = () => {
  currentWeekStart.value = currentWeekStart.value.add(1, 'week');
  selectedWeekDate.value = currentWeekStart.value;
  const calendar = calendarRef.value?.getApi();
  if (calendar) {
    calendar.gotoDate(currentWeekStart.value.toDate());
  }
  emitWeekChange();
};

// 回到本周
const handleToday = () => {
  currentWeekStart.value = dayjs().startOf('isoWeek');
  selectedWeekDate.value = currentWeekStart.value;
  const calendar = calendarRef.value?.getApi();
  if (calendar) {
    calendar.gotoDate(currentWeekStart.value.toDate());
  }
  emitWeekChange();
};

// 发送周变化事件
const emitWeekChange = () => {
  const start = currentWeekStart.value.format('YYYY-MM-DD');
  const end = currentWeekStart.value.add(6, 'day').format('YYYY-MM-DD');
  emit('weekChange', start, end);
};

// 处理日期选择器变化
const handleDatePickerChange = (value: string | Dayjs) => {
  if (value) {
    const date = typeof value === 'string' ? dayjs(value) : value;
    const weekStart = date.startOf('isoWeek');
    currentWeekStart.value = weekStart;
    selectedWeekDate.value = weekStart;
    
    const calendar = calendarRef.value?.getApi();
    if (calendar) {
      calendar.gotoDate(weekStart.toDate());
    }
    emitWeekChange();
  }
};

// 清空所有选择
const clearAllSelections = () => {
  selectedTimeSlots.value = [];
  emit('update:modelValue', selectedTimeSlots.value);
  refreshEvents();
};

// 处理窗口大小变化
const handleResize = () => {
  calendarRef.value?.getApi()?.updateSize();
};


// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedTimeSlots.value = [...newValue];
    nextTick(() => {
      refreshEvents();
    });
  }
}, { deep: true });

watch(() => props.currentWeek, (newValue) => {
  if (newValue) {
    currentWeekStart.value = dayjs(newValue).startOf('isoWeek');
    selectedWeekDate.value = currentWeekStart.value;
    const calendar = calendarRef.value?.getApi();
    if (calendar) {
      calendar.gotoDate(currentWeekStart.value.toDate());
    }
  }
});

// 初始化
onMounted(() => {
  emitWeekChange();
  // 应用自定义CSS类并确保尺寸正确
  nextTick(() => {
    applyCustomStyles();
    // 强制更新日历尺寸，确保线条正确渲染
    setTimeout(() => {
      calendarRef.value?.getApi()?.updateSize();
    }, 100);
  });
});

defineExpose({
  handleResize,
});
</script>

<template>
  <div class="fullcalendar-week-picker">
    <!-- 头部导航 -->
    <div class="flex items-center justify-between mb-3 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg" style="border: 1px solid rgb(191 219 254);">
      <div class="flex items-center space-x-3">
        <!-- 本周按钮 -->
        <Button size="small" @click="handleToday">
          本周
        </Button>
        
        <!-- 左右导航 -->
        <div class="flex items-center space-x-1">
          <Button type="text" size="small" @click="handlePrevWeek">
            <ChevronLeft class="w-4 h-4" />
          </Button>
          <Button type="text" size="small" @click="handleNextWeek">
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
        
        <!-- 日期范围选择器 -->
        <div class="flex items-center">
          <DatePicker 
            v-model:value="selectedWeekDate"
            picker="date"
            size="small"
            :placeholder="'选择开始日期'"
            :format="dateRangeFormat"
            :value-format="'YYYY-MM-DD'"
            :allow-clear="false"
            @change="handleDatePickerChange"
            class="week-date-picker"
            :get-popup-container="(triggerNode: HTMLElement) => triggerNode.parentElement as HTMLElement"
          />
        </div>
      </div>
      
      <!-- 清空选择按钮 -->
      <Button @click="clearAllSelections" size="small" danger>
        清空选择
      </Button>
    </div>
    
    <!-- FullCalendar 组件 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden" style="border: 1px solid rgb(229 231 235);">
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
      />
    </div>

    <!-- 插槽用于自定义内容 -->
    <slot name="extra" :selectedTimeSlots="selectedTimeSlots" :clearAllSelections="clearAllSelections"></slot>
  </div>
</template>

<style scoped>
.fullcalendar-week-picker {
  @apply w-full;
  min-width: 690px;
}

.week-date-picker {
  min-width: 200px;
}

.week-date-picker :deep(.ant-picker) {
  border-color: #cbd5e1;
  border-width: 1px;
  transition: all 0.2s ease;
}

.week-date-picker :deep(.ant-picker:hover) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
}

.week-date-picker :deep(.ant-picker-focused) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* 优化事件样式 */
.fullcalendar-week-picker :deep(.fc-event) {
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fullcalendar-week-picker :deep(.fc-event:hover) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* 优化时间轴标签 */
.fullcalendar-week-picker :deep(.fc-timegrid-slot-label) {
  font-size: 12px;
  color: #64748b;
}

/* 优化日期头部 */
.fullcalendar-week-picker :deep(.fc-col-header-cell) {
  text-align: center;
}

.fullcalendar-week-picker :deep(.fc-day-today) {
  color: #3b82f6 !important;
  font-weight: 600;
}

/* 优化选择效果 */
.fullcalendar-week-picker :deep(.fc-highlight) {
  background: rgba(59, 130, 246, 0.1);
}

/* 避免边框重合 - 只保留右边框和下边框 */
.fullcalendar-week-picker :deep(.fc-theme-standard td),
.fullcalendar-week-picker :deep(.fc-theme-standard th) {
  border-left: none !important;
  border-top: none !important;
}

/* 表格整体边框 */
.fullcalendar-week-picker :deep(.fc-scrollgrid) {
  border: 1px solid #e5e7eb !important;
  border-radius: 6px !important;
  overflow: hidden !important;
}

/* 确保单元格边框一致性 */
.fullcalendar-week-picker :deep(.fc-timegrid-slot),
.fullcalendar-week-picker :deep(.fc-timegrid-col) {
  border-width: 0 1px 1px 0 !important;
  border-style: solid !important;
  border-color: #e5e7eb !important;
}

/* 时间格子样式 */
.fullcalendar-week-picker :deep(.fc-timegrid-slot) {
  height: 40px !important;
  border-bottom: 1px solid #f3f4f6 !important;
  border-right: none !important;
}

/* 时间格子lane的右边框 */
.fullcalendar-week-picker :deep(.fc-timegrid-slot-lane) {
  border-right: 1px solid #e5e7eb !important;
}

/* 移除最右列的右边框 */
.fullcalendar-week-picker :deep(.fc-timegrid-col:last-child),
.fullcalendar-week-picker :deep(.fc-timegrid-slot-lane:last-child) {
  border-right: none !important;
}

/* 时间格子列的右边框 */
.fullcalendar-week-picker :deep(.fc-timegrid-col) {
  border-right: 1px solid #e5e7eb !important;
}

/* 日期头部样式 - 固定样式立即生效，避免闪烁 */
.fullcalendar-week-picker :deep(.fc-col-header-cell) {
  border-left: none !important;
  border-top: none !important;
  border-bottom: 1px solid #e5e7eb !important;
  border-right: 1px solid #e5e7eb !important;
  background-color: #fafafa !important;
  padding: 8px !important;
  font-weight: 500 !important;
  font-size: 13px !important;
}

/* 移除最后一个日期头部单元格的右边框 */
.fullcalendar-week-picker :deep(.fc-col-header-cell:last-child) {
  border-right: none !important;
}

/* 时间轴头部单元格保留左边框 */
.fullcalendar-week-picker :deep(.fc-timegrid-axis-cushion) {
  padding-left: 4px !important;
}

.fullcalendar-week-picker :deep(.fc-col-header-cell.fc-timegrid-axis) {
  border-left: 1px solid #e5e7eb !important;
}

/* 时间轴边框 - 保留左边框确保表格左侧完整 */
.fullcalendar-week-picker :deep(.fc-timegrid-axis) {
  border-left: 1px solid #e5e7eb !important;
  border-top: none !important;
  border-right: 1px solid #e5e7eb !important;
}

/* 确保表格底部边框完整 */
.fullcalendar-week-picker :deep(.fc-scrollgrid-section:last-child .fc-timegrid-slot:last-child) {
  border-bottom: 1px solid #e5e7eb !important;
}

.fullcalendar-week-picker :deep(.fc-timegrid-body) {
  border-bottom: none !important;
}

/* 超细滚动条样式 */
.fullcalendar-week-picker :deep(.fc-scroller),
.fullcalendar-week-picker :deep(.fc-scroller-liquid),
.fullcalendar-week-picker :deep(.fc-scroller-liquid-absolute) {
  scrollbar-width: thin; /* Firefox - 细滚动条 */
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent; /* Firefox - 滑块颜色和轨道颜色 */
}

/* Chrome, Safari, Edge 滚动条样式 */
.fullcalendar-week-picker :deep(.fc-scroller::-webkit-scrollbar),
.fullcalendar-week-picker :deep(.fc-scroller-liquid::-webkit-scrollbar),
.fullcalendar-week-picker :deep(.fc-scroller-liquid-absolute::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.fullcalendar-week-picker :deep(.fc-scroller::-webkit-scrollbar-track),
.fullcalendar-week-picker :deep(.fc-scroller-liquid::-webkit-scrollbar-track),
.fullcalendar-week-picker :deep(.fc-scroller-liquid-absolute::-webkit-scrollbar-track) {
  background: transparent;
}

.fullcalendar-week-picker :deep(.fc-scroller::-webkit-scrollbar-thumb),
.fullcalendar-week-picker :deep(.fc-scroller-liquid::-webkit-scrollbar-thumb),
.fullcalendar-week-picker :deep(.fc-scroller-liquid-absolute::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.fullcalendar-week-picker :deep(.fc-scroller::-webkit-scrollbar-thumb:hover),
.fullcalendar-week-picker :deep(.fc-scroller-liquid::-webkit-scrollbar-thumb:hover),
.fullcalendar-week-picker :deep(.fc-scroller-liquid-absolute::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.25);
}
</style>

