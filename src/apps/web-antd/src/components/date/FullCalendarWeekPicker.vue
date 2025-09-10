<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { Button } from 'ant-design-vue';
import { ChevronLeft, ChevronRight } from '@vben/icons';
import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/zh-cn';

// FullCalendar imports
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions, EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
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
      title: `${weekLabels[slot.day]} ${String(slot.startHour).padStart(2, '0')}:00-${String(Math.max(0, slot.endHour - 1)).padStart(2, '0')}:00`,
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
  height: 600,
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '01:00:00',
  allDaySlot: false,
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
    // 应用自定义样式
    nextTick(() => {
      applyCustomStyles();
    });
  }
}));

// 应用自定义样式（飞书风格）
const applyCustomStyles = () => {
  const calendarEl = calendarRef.value?.$el;
  if (!calendarEl) return;

  // 添加自定义CSS类
  calendarEl.classList.add('feishu-style-calendar');
  
  // 设置表格样式
  const table = calendarEl.querySelector('.fc-scrollgrid');
  if (table) {
    table.style.border = '1px solid #e5e7eb';
    table.style.borderRadius = '8px';
    table.style.overflow = 'hidden';
  }

  // 设置时间轴样式
  const timeSlots = calendarEl.querySelectorAll('.fc-timegrid-slot');
  timeSlots.forEach((slot: Element) => {
    const element = slot as HTMLElement;
    element.style.borderBottom = '1px solid #f3f4f6';
    element.style.height = '48px';
  });

  // 设置日期头部样式
  const dayHeaders = calendarEl.querySelectorAll('.fc-col-header-cell');
  dayHeaders.forEach((header: Element) => {
    const element = header as HTMLElement;
    element.style.backgroundColor = '#f9fafb';
    element.style.borderBottom = '2px solid #e5e7eb';
    element.style.padding = '12px';
    element.style.fontWeight = '500';
  });
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

  // 清空现有选择，只允许一个时间段
  selectedTimeSlots.value = [timeSlot];
  emit('update:modelValue', selectedTimeSlots.value);
  
  // 取消选择状态
  selectInfo.view.calendar.unselect();
  
  // 刷新事件
  refreshEvents();
};

// 处理事件点击
const handleEventClick = (clickInfo: EventClickArg) => {
  // 删除事件
  selectedTimeSlots.value = [];
  emit('update:modelValue', selectedTimeSlots.value);
  refreshEvents();
};

// 处理事件拖拽
const handleEventDrop = (info: any) => {
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

  selectedTimeSlots.value = [timeSlot];
  emit('update:modelValue', selectedTimeSlots.value);
};

// 处理事件大小调整
const handleEventResize = (info: any) => {
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

  selectedTimeSlots.value = [timeSlot];
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
  const calendar = calendarRef.value?.getApi();
  if (calendar) {
    calendar.gotoDate(currentWeekStart.value.toDate());
  }
  emitWeekChange();
};

// 下一周
const handleNextWeek = () => {
  currentWeekStart.value = currentWeekStart.value.add(1, 'week');
  const calendar = calendarRef.value?.getApi();
  if (calendar) {
    calendar.gotoDate(currentWeekStart.value.toDate());
  }
  emitWeekChange();
};

// 回到本周
const handleToday = () => {
  currentWeekStart.value = dayjs().startOf('isoWeek');
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

// 清空所有选择
const clearAllSelections = () => {
  selectedTimeSlots.value = [];
  emit('update:modelValue', selectedTimeSlots.value);
  refreshEvents();
};

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
    const calendar = calendarRef.value?.getApi();
    if (calendar) {
      calendar.gotoDate(currentWeekStart.value.toDate());
    }
  }
});

// 初始化
onMounted(() => {
  emitWeekChange();
});
</script>

<template>
  <div class="fullcalendar-week-picker min-w-[900px]">
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
    
    <!-- FullCalendar 组件 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
}
</style>

<style>
/* 飞书风格的FullCalendar样式 */
.feishu-style-calendar {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.feishu-style-calendar .fc-theme-standard td,
.feishu-style-calendar .fc-theme-standard th {
  border: 1px solid #e5e7eb;
}

.feishu-style-calendar .fc-theme-standard .fc-scrollgrid {
  border: 1px solid #e5e7eb;
}

.feishu-style-calendar .fc-col-header-cell {
  background-color: #f9fafb;
  font-weight: 500;
  color: #374151;
  border-bottom: 2px solid #e5e7eb !important;
  padding: 12px 8px;
}

.feishu-style-calendar .fc-day-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.feishu-style-calendar .fc-day-header-day {
  font-size: 12px;
  color: #6b7280;
}

.feishu-style-calendar .fc-day-header-date {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.feishu-style-calendar .fc-day-header-date.fc-day-today {
  color: #f97316;
}

.feishu-style-calendar .fc-timegrid-slot {
  height: 48px;
  border-bottom: 1px solid #f3f4f6;
}

.feishu-style-calendar .fc-timegrid-slot:hover {
  background-color: #f8fafc;
}

.feishu-style-calendar .fc-timegrid-slot-minor {
  border-bottom: 1px solid #f9fafb;
}

.feishu-style-calendar .fc-timegrid-slot-label {
  color: #6b7280;
  font-size: 12px;
  padding: 0 8px;
  vertical-align: top;
  padding-top: 4px;
}

.feishu-style-calendar .fc-event.custom-event {
  border-radius: 4px;
  border: none;
  font-size: 12px;
  padding: 2px 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.feishu-style-calendar .fc-event.custom-event:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.feishu-style-calendar .fc-event-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feishu-style-calendar .fc-highlight {
  background-color: #dbeafe;
  border-radius: 4px;
}

.feishu-style-calendar .fc-select-mirror {
  background-color: #bfdbfe;
  border-radius: 4px;
  opacity: 0.7;
}

/* 滚动条样式 */
.feishu-style-calendar .fc-scroller::-webkit-scrollbar {
  width: 6px;
}

.feishu-style-calendar .fc-scroller::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.feishu-style-calendar .fc-scroller::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.feishu-style-calendar .fc-scroller::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .feishu-style-calendar .fc-col-header-cell {
    padding: 8px 4px;
  }
  
  .feishu-style-calendar .fc-day-header-day {
    font-size: 11px;
  }
  
  .feishu-style-calendar .fc-day-header-date {
    font-size: 14px;
  }
  
  .feishu-style-calendar .fc-timegrid-slot-label {
    font-size: 11px;
    padding: 0 4px;
  }
}

/* 暗色主题适配 */
.dark .feishu-style-calendar .fc-theme-standard td,
.dark .feishu-style-calendar .fc-theme-standard th {
  border-color: #374151;
}

.dark .feishu-style-calendar .fc-theme-standard .fc-scrollgrid {
  border-color: #374151;
}

.dark .feishu-style-calendar .fc-col-header-cell {
  background-color: #374151;
  color: #d1d5db;
  border-bottom-color: #4b5563 !important;
}

.dark .feishu-style-calendar .fc-day-header-day {
  color: #9ca3af;
}

.dark .feishu-style-calendar .fc-day-header-date {
  color: #f9fafb;
}

.dark .feishu-style-calendar .fc-timegrid-slot {
  border-bottom-color: #374151;
}

.dark .feishu-style-calendar .fc-timegrid-slot:hover {
  background-color: #374151;
}

.dark .feishu-style-calendar .fc-timegrid-slot-label {
  color: #9ca3af;
}

.dark .feishu-style-calendar .fc-highlight {
  background-color: #1e40af;
}

.dark .feishu-style-calendar .fc-select-mirror {
  background-color: #3730a3;
}
</style>
