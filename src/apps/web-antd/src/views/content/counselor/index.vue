<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref, computed } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, message, Popconfirm, Space, Spin, Upload, Modal, Image } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

// 咨询师数据类型定义
interface CounselorData {
  id: number;
  name: string;
  avatar: string;
  school: string;
  major: string;
  personal_info: string;
  consultation_hours: number;
  expertise_area: string;
  expertise_domain: string;
  consultation_method: string;
  location: string;
  result_authority: string;
  is_online: boolean;
  status: 'active' | 'inactive';
  creator: string;
  created_at: string;
  updated_at: string;
}

defineOptions({
  name: 'CounselorManagement',
});

// 全屏loading状态
const spinning = ref(false);

// Excel导入相关
const importModalVisible = ref(false);
const fileList = ref([]);

// 搜索条件
const searchForm = ref({
  name: '',
  creator: '',
  status: '',
});

// 模拟咨询师数据
const allCounselors = ref<CounselorData[]>([
  {
    id: 1,
    name: '张心理',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
    school: '北京师范大学',
    major: '心理学',
    personal_info: '多年从事心理咨询工作，擅长焦虑症和抑郁症的治疗，具有丰富的临床经验',
    consultation_hours: 1200,
    expertise_area: '焦虑症治疗',
    expertise_domain: '认知行为疗法',
    consultation_method: '面对面咨询',
    location: '北京市海淀区',
    result_authority: '高级咨询师',
    is_online: true,
    status: 'active',
    creator: '管理员',
    created_at: '2023-01-15T08:30:00Z',
    updated_at: '2024-09-10T10:15:00Z',
  },
  {
    id: 2,
    name: '李咨询',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
    school: '华东师范大学',
    major: '应用心理学',
    personal_info: '专业从事青少年心理咨询，具有丰富的临床经验，擅长家庭治疗和认知行为疗法',
    consultation_hours: 850,
    expertise_area: '青少年心理',
    expertise_domain: '家庭治疗',
    consultation_method: '在线咨询',
    location: '上海市徐汇区',
    result_authority: '中级咨询师',
    is_online: false,
    status: 'active',
    creator: '系统',
    created_at: '2023-03-20T09:45:00Z',
    updated_at: '2024-09-09T14:20:00Z',
  },
  {
    id: 3,
    name: '王治疗',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    school: '中南大学',
    major: '临床心理学',
    personal_info: '专注于抑郁症和焦虑症的治疗，有10年以上的临床经验',
    consultation_hours: 1580,
    expertise_area: '抑郁症治疗',
    expertise_domain: '精神分析',
    consultation_method: '面对面咨询',
    location: '长沙市岳麓区',
    result_authority: '资深咨询师',
    is_online: true,
    status: 'inactive',
    creator: '管理员',
    created_at: '2022-11-10T11:00:00Z',
    updated_at: '2024-09-08T16:30:00Z',
  },
  {
    id: 4,
    name: '刘专家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liu',
    school: '西南大学',
    major: '发展与教育心理学',
    personal_info: '儿童心理发展专家，专业从事学习障碍和注意力缺陷的咨询与治疗',
    consultation_hours: 920,
    expertise_area: '儿童心理',
    expertise_domain: '行为矫正',
    consultation_method: '面对面咨询',
    location: '重庆市北碚区',
    result_authority: '高级咨询师',
    is_online: true,
    status: 'active',
    creator: '系统',
    created_at: '2023-05-18T13:15:00Z',
    updated_at: '2024-09-10T09:45:00Z',
  },
  {
    id: 5,
    name: '陈导师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chen',
    school: '华南师范大学',
    major: '咨询心理学',
    personal_info: '婚姻家庭咨询师，专业处理夫妻关系、亲子关系等家庭问题',
    consultation_hours: 670,
    expertise_area: '婚姻家庭',
    expertise_domain: '系统家庭治疗',
    consultation_method: '在线咨询',
    location: '广州市天河区',
    result_authority: '中级咨询师',
    is_online: false,
    status: 'active',
    creator: '管理员',
    created_at: '2023-07-25T15:30:00Z',
    updated_at: '2024-09-07T12:10:00Z',
  },
  {
    id: 6,
    name: '赵顾问',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhao',
    school: '南京师范大学',
    major: '社会心理学',
    personal_info: '职场心理专家，擅长处理工作压力、职业规划、人际关系等问题',
    consultation_hours: 1100,
    expertise_area: '职场心理',
    expertise_domain: '职业咨询',
    consultation_method: '面对面咨询',
    location: '南京市鼓楼区',
    result_authority: '高级咨询师',
    is_online: true,
    status: 'inactive',
    creator: '系统',
    created_at: '2022-12-08T10:20:00Z',
    updated_at: '2024-09-05T17:45:00Z',
  },
]);

// 过滤后的数据
const filteredCounselors = computed(() => {
  let result = [...allCounselors.value];

  // 按姓名搜索
  if (searchForm.value.name) {
    result = result.filter(item =>
      item.name.includes(searchForm.value.name)
    );
  }

  // 按创建人筛选
  if (searchForm.value.creator) {
    result = result.filter(item =>
      item.creator === searchForm.value.creator
    );
  }

  // 按状态筛选
  if (searchForm.value.status) {
    result = result.filter(item =>
      item.status === searchForm.value.status
    );
  }

  return result;
});

// 总数
const total = computed(() => filteredCounselors.value.length);

// 搜索表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '咨询师名称',
      componentProps: {
        placeholder: '请输入咨询师姓名',
      },
    },
    {
      component: 'Select',
      fieldName: 'creator',
      label: '创建人',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '管理员', value: '管理员' },
          { label: '系统', value: '系统' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        placeholder: '全部',
        options: [
          { label: '全部', value: '' },
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'inactive' },
        ],
      },
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  // 是否在字段值改变时提交表单
  submitOnChange: true,
  // 按下回车时是否提交表单
  submitOnEnter: true,
  // 表单提交处理函数
  handleSubmit: (values: Record<string, any>) => {
    searchForm.value = {
      name: values.name || '',
      creator: values.creator || '',
      status: values.status || '',
    };
    gridApi.query(); // 刷新表格数据
  },
  // 表单重置处理函数
  handleReset: () => {
    searchForm.value = {
      name: '',
      creator: '',
      status: '',
    };
    gridApi.query(); // 刷新表格数据
  },
};

// 咨询师操作函数
const handleEnable = (row: CounselorData) => {
  console.log('启用咨询师:', row);

  // 直接更新本地数据
  const counselor = allCounselors.value.find(c => c.id === row.id);
  if (counselor) {
    counselor.status = 'active';
    counselor.updated_at = new Date().toISOString();
    message.success('咨询师启用成功');
  }
};

const handleDisable = (row: CounselorData) => {
  console.log('禁用咨询师:', row);

  // 直接更新本地数据
  const counselor = allCounselors.value.find(c => c.id === row.id);
  if (counselor) {
    counselor.status = 'inactive';
    counselor.updated_at = new Date().toISOString();
    message.success('咨询师禁用成功');
  }
};

const handleEdit = (row: CounselorData) => {
  console.log('编辑咨询师:', row);
  // TODO: 打开编辑模态框
  message.info('编辑功能开发中...');
};

const handleDelete = (row: CounselorData) => {
  console.log('删除咨询师:', row);

  // 直接从本地数据中删除
  const index = allCounselors.value.findIndex(c => c.id === row.id);
  if (index > -1) {
    allCounselors.value.splice(index, 1);
    message.success('咨询师删除成功');
  }
};

const handleConsultationTime = (row: CounselorData) => {
  console.log('咨询时长:', row);
  message.info(`${row.name}的咨询时长：${row.consultation_hours}小时`);
};

// 工具栏操作函数
const handleCreate = () => {
  console.log('新建咨询师');

  // 创建新的咨询师数据
  const newCounselor: CounselorData = {
    id: Math.max(...allCounselors.value.map(c => c.id)) + 1,
    name: `新咨询师${allCounselors.value.length + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=New${allCounselors.value.length + 1}`,
    school: '示例大学',
    major: '心理学',
    personal_info: '新创建的咨询师，请编辑详细信息',
    consultation_hours: 0,
    expertise_area: '通用咨询',
    expertise_domain: '认知治疗',
    consultation_method: '面对面咨询',
    location: '北京市',
    result_authority: '初级咨询师',
    is_online: true,
    status: 'active',
    creator: '管理员',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 添加到数据列表
  allCounselors.value.push(newCounselor);
  message.success('新建咨询师成功');
};

const handleImportExcel = () => {
  importModalVisible.value = true;
};

// Excel上传处理
const handleUpload = async (options: any) => {
  const { file, onSuccess, onError } = options;

  try {
    spinning.value = true;

    // 模拟处理Excel文件
    console.log('处理Excel文件:', file.name);

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟Excel导入，添加一些虚拟数据
    const newCounselors: CounselorData[] = [
      {
        id: Math.max(...allCounselors.value.map(c => c.id)) + 1,
        name: '导入咨询师1',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Import1',
        school: '导入大学',
        major: '心理学',
        personal_info: '通过Excel导入的咨询师',
        consultation_hours: 500,
        expertise_area: '通用咨询',
        expertise_domain: '认知治疗',
        consultation_method: '在线咨询',
        location: '北京市',
        result_authority: '中级咨询师',
        is_online: true,
        status: 'active',
        creator: '系统',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Math.max(...allCounselors.value.map(c => c.id)) + 2,
        name: '导入咨询师2',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Import2',
        school: '导入师范大学',
        major: '应用心理学',
        personal_info: '通过Excel导入的咨询师2',
        consultation_hours: 300,
        expertise_area: '儿童心理',
        expertise_domain: '游戏治疗',
        consultation_method: '面对面咨询',
        location: '上海市',
        result_authority: '初级咨询师',
        is_online: false,
        status: 'active',
        creator: '系统',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 添加到模拟数据
    allCounselors.value.push(...newCounselors);

    message.success(`Excel导入成功，共导入 ${newCounselors.length} 条咨询师数据`);
    importModalVisible.value = false;
    fileList.value = [];

    // 通知上传组件成功
    onSuccess && onSuccess({ message: 'Excel导入成功' });
  } catch (error) {
    console.error('Excel导入失败:', error);
    message.error('Excel导入失败');

    // 通知上传组件失败
    onError && onError(error);
  } finally {
    spinning.value = false;
  }
};

// Excel上传前的验证
const beforeUpload = (file: File) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel' ||
                  file.name.endsWith('.xlsx') ||
                  file.name.endsWith('.xls');

  if (!isExcel) {
    message.error('只能上传Excel文件！');
    return false;
  }

  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过10MB！');
    return false;
  }

  return true;
};

const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq' },
    {
      field: 'name',
      title: '咨询师名称',
      slots: { default: 'counselorInfo' },
    },
    {
      field: 'school',
      title: '学校',
      showOverflow: 'tooltip',
    },
    {
      field: 'major',
      title: '专业',
      showOverflow: 'tooltip',
    },
    {
      field: 'personal_info',
      title: '个人简介',
      showOverflow: 'tooltip',
    },
    {
      field: 'consultation_hours',
      title: '咨询时长',
      slots: { default: 'consultationHours' },
    },
    {
      field: 'expertise_area',
      title: '擅长流派',
      showOverflow: 'tooltip',
    },
    {
      field: 'expertise_domain',
      title: '擅长领域',
      showOverflow: 'tooltip',
    },
    {
      field: 'consultation_method',
      title: '咨询方式',
      showOverflow: 'tooltip',
    },
    {
      field: 'location',
      title: '所在位置',
      showOverflow: 'tooltip',
    },
    {
      field: 'result_authority',
      title: '结算权限',
      showOverflow: 'tooltip',
    },
    {
      field: 'is_online',
      title: '是否在线',
      slots: { default: 'onlineStatus' },
    },
    {
      field: 'actions',
      width: 250,
      title: '操作',
      slots: { default: 'actions' },
    },
  ],
  height: 'auto',
  keepSource: true,
  autoResize: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        // 计算分页
        const start = (page.currentPage - 1) * page.pageSize;
        const end = start + page.pageSize;
        const list = filteredCounselors.value.slice(start, end);

        return {
          list,
          total: total.value,
        };
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
    zoom: true,
  },
  showOverflow: false,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});
</script>

<template>
  <Spin :spinning="spinning" tip="正在处理，请稍候...">
    <Page auto-content-height title="咨询师管理">
      <Grid>
        <template #toolbar-actions>
          <Button type="primary" class="mr-4" @click="handleCreate">
            新建
          </Button>
          <Button @click="handleImportExcel">
            excel导入
          </Button>
        </template>

        <template #counselorInfo="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              <Image
                v-if="row.avatar"
                :src="row.avatar"
                :width="40"
                :height="40"
                :preview="true"
                class="rounded-full object-cover"
                :fallback="'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='"
              />
              <span v-else class="text-gray-500 text-sm font-medium">
                {{ row.name?.charAt(0) }}
              </span>
            </div>
            <span class="font-medium">{{ row.name }}</span>
          </div>
        </template>

        <template #consultationHours="{ row }">
          <span>{{ row.consultation_hours }}小时</span>
        </template>

        <template #onlineStatus="{ row }">
          <span :class="row.is_online ? 'text-green-500' : 'text-gray-500'">
            {{ row.is_online ? '在线' : '离线' }}
          </span>
        </template>

        <template #actions="{ row }">
          <Space wrap>
            <Button
              v-if="row.status === 'inactive'"
              type="link"
              size="small"
              class="text-blue-500 p-0"
              @click="handleEnable(row)"
            >
              启用
            </Button>
            <Button
              v-else
              type="link"
              size="small"
              class="text-gray-500 p-0"
              @click="handleDisable(row)"
            >
              禁用
            </Button>
            <Button
              type="link"
              size="small"
              class="text-blue-500 p-0"
              @click="handleEdit(row)"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个咨询师吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(row)"
            >
              <Button
                type="link"
                size="small"
                class="text-red-500 p-0"
              >
                删除
              </Button>
            </Popconfirm>
            <Button
              type="link"
              size="small"
              class="text-green-500 p-0"
              @click="handleConsultationTime(row)"
            >
              咨询时长
            </Button>
          </Space>
        </template>
      </Grid>
    </Page>

    <!-- Excel导入模态框 -->
    <Modal
      v-model:open="importModalVisible"
      title="Excel导入"
      @ok="importModalVisible = false"
      @cancel="importModalVisible = false"
    >
      <div class="p-4">
        <Upload
          v-model:file-list="fileList"
          :custom-request="handleUpload"
          :before-upload="beforeUpload"
          accept=".xlsx,.xls"
          :show-upload-list="true"
        >
          <Button>选择Excel文件</Button>
        </Upload>
        <div class="mt-4 text-gray-500 text-sm">
          <p>支持格式：.xlsx, .xls</p>
          <p>请确保Excel文件包含所需的咨询师信息字段</p>
        </div>
      </div>
    </Modal>
  </Spin>
</template>
