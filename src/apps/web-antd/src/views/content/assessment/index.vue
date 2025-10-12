<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Form, Input, message, Modal, Popconfirm, Space, Spin, Switch, Tag, Textarea } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getQuestionnaireListApi, createQuestionnaireApi, editQuestionnaireApi, deleteQuestionnaireApi, toggleQuestionnaireStatusApi, getQuestionnaireResponsesApi, type QuestionnaireData, type QuestionnaireListParams, type QuestionnaireResponse } from '#/api/core/assessment';

defineOptions({
  name: 'AssessmentManagement',
});

// 全屏loading状态
const spinning = ref(false);

// 弹窗相关状态
const modalVisible = ref(false);
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

// 数据查看弹窗相关状态
const dataModalVisible = ref(false);
const currentAssessmentId = ref<number | null>(null);
const currentAssessmentName = ref('');

// 表单 ref
const formRef = ref();

// 弹窗表单数据
const formData = reactive({
  questionnaireName: '',
  questionnaireIntro: '',
  questionnaireNotice: '',
  questionnaireUrl: '',
  isPublished: false,
});

// 类型定义（用于向后兼容，映射到新的API数据结构）
interface AssessmentData {
  id: number;
  questionnaireName: string; // 映射到 title
  questionnaireIntro: string; // 映射到 description
  questionnaireNotice: string; // 自定义字段，暂时保留
  questionnaireUrl: string; // 自定义字段，暂时保留
  creatorName: string; // 映射到 creator_name
  createTime: number; // 转换自 created_at
  publishTime?: number; // 转换自 start_time 或其他字段
  publishStatus: 'published' | 'unpublished'; // 映射到 status
}

interface SearchParams {
  page?: number;
  size?: number;
  title?: string; // 原 questionnaireName
  creator?: string;
  status?: string; // 原 publishStatus
  createStartTime?: number;
  createEndTime?: number;
}

// 问卷数据相关类型定义
interface AssessmentDataRecord {
  id: number;
  submitterName: string;
  submitTime: number;
  score?: number;
  assessmentId: number;
  surveyUrl: string; // 问卷星URL，用于跳转
}

interface AssessmentDataSearchParams {
  page?: number;
  size?: number;
  respondent_name?: string; // 修改为与API匹配
  start_time?: number;      // 修改为与API匹配
  end_time?: number;        // 修改为与API匹配
  assessmentId: number;
}

interface AssessmentDataApiResponse {
  list: AssessmentDataRecord[];
  total: number;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 130,
  },
  fieldMappingTime: [['rangePicker', ['createStartTime', 'createEndTime']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'title',
      label: '问卷名称',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      fieldName: 'creator',
      label: '创建人',
      componentProps: {
        placeholder: '请输入创建人',
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
          { label: '已启用', value: 'published' },
          { label: '未启用', value: 'unpublished' },
        ],
      },
    },
    {
      component: 'RangePicker',
      defaultValue: undefined,
      fieldName: 'rangePicker',
      label: '创建时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ],
  showCollapseButton: true,
  submitOnChange: false,
  submitOnEnter: true,
};

// 问卷管理数据API调用
const getAssessmentList = async (params: SearchParams): Promise<{ list: AssessmentData[]; total: number }> => {
  const apiParams: QuestionnaireListParams = {
    page: params.page || 1,
    size: params.size || 10,
    title: params.title,
    creator: params.creator,
    status: params.status as 'published' | 'unpublished',
    create_start_time: params.createStartTime,
    create_end_time: params.createEndTime,
  };

  const response = await getQuestionnaireListApi(apiParams);

  // 将API返回的数据转换为组件需要的格式
  const mappedList: AssessmentData[] = response.list.map((item: QuestionnaireData) => ({
    id: item.id,
    questionnaireName: item.title,
    questionnaireIntro: item.description,
    questionnaireNotice: item.notice, // 映射到 notice 字段
    questionnaireUrl: item.survey_url, // 映射到 survey_url 字段
    creatorName: item.creator_name,
    createTime: new Date(item.created_at).getTime() / 1000, // 转换为时间戳
    publishTime: item.start_time ? new Date(item.start_time).getTime() / 1000 : undefined,
    publishStatus: item.status,
  }));

  return {
    list: mappedList,
    total: response.total,
  };
};

// 问卷数据API调用
const getAssessmentDataList = async (params: AssessmentDataSearchParams): Promise<AssessmentDataApiResponse> => {
  const response = await getQuestionnaireResponsesApi(params.assessmentId, {
    page: params.page || 1,
    size: params.size || 10,
    respondent_name: params.respondent_name,
    start_time: params.start_time,
    end_time: params.end_time,
  });

  // 将API返回的数据转换为组件需要的格式
  const mappedList: AssessmentDataRecord[] = response.list.map((item: QuestionnaireResponse) => {
    return {
      id: item.id,
      submitterName: item.respondent_name,
      submitTime: new Date(item.created_at).getTime() / 1000, // 转换为时间戳
      score: item.average_score, // 直接使用平均评分
      assessmentId: item.questionnaire_id,
      surveyUrl: item.survey_url, // 保存问卷星URL
    };
  });

  return {
    list: mappedList,
    total: response.total,
  };
};

// 操作函数
const handleViewData = (row: AssessmentData) => {
  currentAssessmentId.value = row.id;
  currentAssessmentName.value = row.questionnaireName;
  dataModalVisible.value = true;

  // 延迟执行查询，确保弹窗打开后再加载数据
  setTimeout(() => {
    dataGridApi.query();
  }, 100);
};

// 关闭数据查看弹窗
const closeDataModal = () => {
  dataModalVisible.value = false;
  currentAssessmentId.value = null;
  currentAssessmentName.value = '';
};

// 查看提交详情
const handleViewDetail = (row: AssessmentDataRecord) => {
  if (row.surveyUrl) {
    // 直接在新页签中打开问卷星URL
    window.open(row.surveyUrl, '_blank');
  } else {
    message.warning('该记录没有可用的问卷链接');
  }
};

const handlePublish = async (row: AssessmentData) => {
  try {
    const action = row.publishStatus === 'published' ? '停用' : '启用';

    // 开启全屏loading
    spinning.value = true;

    // 调用切换状态接口
    await toggleQuestionnaireStatusApi({ id: row.id });

    message.success({
      content: `问卷${action}成功`,
    });

    // 刷新列表
    gridApi.query();
  }  finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

const handleEdit = (row: AssessmentData) => {
  openEditModal(row);
};

const handleDelete = async (row: AssessmentData) => {
  try {
    // 开启全屏loading
    spinning.value = true;

    // 调用删除接口
    await deleteQuestionnaireApi({ id: row.id });

    message.success({
      content: '问卷删除成功',
    });

    // 刷新列表
    gridApi.query();
  }  finally {
    // 关闭全屏loading
    spinning.value = false;
  }
};

// 弹窗相关函数
const resetFormData = () => {
  formData.questionnaireName = '';
  formData.questionnaireIntro = '';
  formData.questionnaireNotice = '';
  formData.questionnaireUrl = '';
  formData.isPublished = false;
  editingId.value = null;
};

const openCreateModal = async () => {
  resetFormData();
  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const openEditModal = async (row: AssessmentData) => {
  resetFormData();
  editingId.value = row.id;
  formData.questionnaireName = row.questionnaireName;
  formData.questionnaireIntro = row.questionnaireIntro;
  formData.questionnaireNotice = row.questionnaireNotice;
  formData.questionnaireUrl = row.questionnaireUrl;
  formData.isPublished = row.publishStatus === 'published';

  modalVisible.value = true;

  // 等待 DOM 更新后重置表单校验状态
  await nextTick();
  formRef.value?.clearValidate();
};

const closeModal = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
  resetFormData();
};

const handleSubmit = async () => {
  try {
    // 使用 Form 组件的内置校验
    await formRef.value?.validate();

    modalLoading.value = true;

    const action = editingId.value ? '编辑' : '新增';

    if (!editingId.value) {
      // 新增操作，调用创建接口
      await createQuestionnaireApi({
        title: formData.questionnaireName,
        description: formData.questionnaireIntro,
        status: formData.isPublished ? 'published' : 'unpublished',
        survey_url: formData.questionnaireUrl, // 问卷星地址
        notice: formData.questionnaireNotice, // 测评须知
      });
    } else {
      // 编辑操作，调用编辑接口
      await editQuestionnaireApi({
        id: editingId.value,
        title: formData.questionnaireName,
        description: formData.questionnaireIntro,
        status: formData.isPublished ? 'published' : 'unpublished',
        survey_url: formData.questionnaireUrl, // 问卷星地址
        notice: formData.questionnaireNotice, // 测评须知
      });
    }

    message.success(`${action}问卷成功`);

    // 刷新列表
    gridApi.query();

    // 关闭弹窗
    closeModal();
  } finally {
    modalLoading.value = false;
  }
};

const handleCreate = () => {
  openCreateModal();
};

// 获取状态标签
const getStatusTag = (status: string) => {
  const statusMap = {
    published: { color: 'green', text: '已启用' },
    unpublished: { color: 'orange', text: '未启用' },
  };
  return statusMap[status as keyof typeof statusMap] || { color: 'gray', text: '未知' };
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  columns: [
    { title: '序号', type: 'seq' },
    {
      field: 'questionnaireName',
      title: '问卷名称',
      showOverflow: 'tooltip',
    },
    {
      field: 'questionnaireIntro',
      title: '问卷简介',
      showOverflow: 'tooltip',
    },
    {
      field: 'questionnaireNotice',
      title: '问卷须知',
      showOverflow: 'tooltip',
    },
    {
      field: 'questionnaireUrl',
      title: '问卷星地址',
      showOverflow: 'tooltip',
      slots: { default: 'questionnaireUrl' },
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
    {
      field: 'createTime',
      title: '创建时间',
      slots: { default: 'createTime' },
    },
    {
      field: 'publishStatus',
      title: '是否启用',
      slots: { default: 'publishStatus' },
    },
    {
      field: 'actions',
      title: '操作',
      minWidth: 150,
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
      query: async ({ page }, formValues) => {
        const result = await getAssessmentList({
          page: page.currentPage,
          size: page.pageSize,
          title: formValues.title,
          creator: formValues.creator,
          status: formValues.status,
          // 处理时间范围搜索
          createStartTime: formValues.createStartTime
            ? (Date.parse(formValues.createStartTime) - 28800000) / 1000
            : undefined,
          createEndTime: formValues.createEndTime
            ? (Date.parse(formValues.createEndTime) - 28800000) / 1000 + 86399
            : undefined,
        });
        return result;
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 数据查看弹窗搜索表单配置
const dataFormOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    labelWidth: 100,
  },
  fieldMappingTime: [['submitRangePicker', ['start_time', 'end_time']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'respondent_name',
      label: '提交人',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'RangePicker',
      defaultValue: undefined,
      fieldName: 'submitRangePicker',
      label: '提交时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

// 数据查看弹窗表格配置
const dataGridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'submitterName',
      title: '提交人',
      showOverflow: 'tooltip',
    },
    {
      field: 'submitTime',
      title: '提交时间',
      slots: { default: 'dataSubmitTime' },
    },
    {
      field: 'score',
      title: '评分',
      slots: { default: 'dataScore' },
    },
    {
      field: 'actions',
      title: '操作',
      slots: { default: 'dataActions' },
    },
  ],
  height: 600,
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
      query: async ({ page }, formValues) => {
        if (!currentAssessmentId.value) return { list: [], total: 0 };

        const result = await getAssessmentDataList({
          page: page.currentPage,
          size: page.pageSize,
          assessmentId: currentAssessmentId.value,
          respondent_name: formValues.respondent_name,
          // 处理时间范围搜索
          start_time: formValues.start_time
            ? (Date.parse(formValues.start_time) - 28800000) / 1000
            : undefined,
          end_time: formValues.end_time
            ? (Date.parse(formValues.end_time) - 28800000) / 1000 + 86399
            : undefined,
        });
        return result;
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
    zoom: true,
  },
};

const [DataGrid, dataGridApi] = useVbenVxeGrid({
  formOptions: dataFormOptions,
  gridOptions: dataGridOptions,
});
</script>

<template>
  <Spin :spinning="spinning" tip="正在处理，请稍候...">
    <Page auto-content-height title="测评问卷">
    <Grid>
      <template #toolbar-actions>
        <Button type="primary" class="mr-4" @click="handleCreate">
          新建
        </Button>
      </template>

      <template #createTime="{ row }">
        <span>
          {{ dayjs(row.createTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>

      <template #publishStatus="{ row }">
        <Tag :color="getStatusTag(row.publishStatus).color">
          {{ getStatusTag(row.publishStatus).text }}
        </Tag>
      </template>

      <template #questionnaireUrl="{ row }">
        <a
          :href="row.questionnaireUrl"
          target="_blank"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate block max-w-[200px]"
          :title="row.questionnaireUrl"
        >
          {{ row.questionnaireUrl }}
        </a>
      </template>

      <template #actions="{ row }">
        <Space>
          <Button
            type="link"
            size="small"
            @click="handleViewData(row)"
          >
            数据
          </Button>
          <Popconfirm
            v-if="row.publishStatus === 'published'"
            title="确定要停用这个问卷吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handlePublish(row)"
          >
            <Button type="link" size="small"> 停用 </Button>
          </Popconfirm>
          <Popconfirm
            v-else
            title="确定要启用这个问卷吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handlePublish(row)"
          >
            <Button type="link" size="small"> 启用 </Button>
          </Popconfirm>
          <Button
            type="link"
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个问卷吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(row)"
          >
            <Button type="link" danger size="small"> 删除 </Button>
          </Popconfirm>
        </Space>
      </template>
    </Grid>
  </Page>

  <!-- 新增/编辑弹窗 -->
  <Modal
    v-model:open="modalVisible"
    :title="editingId ? '编辑问卷' : '新增问卷'"
    :confirm-loading="modalLoading"
    width="800px"
    @ok="handleSubmit"
    @cancel="closeModal"
  >
    <Form
      ref="formRef"
      :model="formData"
      layout="vertical"
      style="padding: 20px 0"
    >
      <Form.Item
        label="测评问卷"
        name="questionnaireName"
        :rules="[{ required: true, message: '请输入测评问卷名称' }]"
      >
        <Input
          v-model:value="formData.questionnaireName"
          placeholder="请输入测评问卷名称"
        />
      </Form.Item>

      <Form.Item
        label="问卷简介"
        name="questionnaireIntro"
        :rules="[{ required: true, message: '请输入问卷简介' }]"
      >
        <Textarea
          v-model:value="formData.questionnaireIntro"
          placeholder="请输入考试的简介（不超过500个字）"
          :rows="3"
        />
      </Form.Item>

      <Form.Item
        label="测评须知"
        name="questionnaireNotice"
        :rules="[{ required: true, message: '请输入测评须知' }]"
      >
        <Textarea
          v-model:value="formData.questionnaireNotice"
          placeholder="请输入考试的测评须知（不超过500个字）"
          :rows="4"
        />
      </Form.Item>

      <Form.Item
        label="问卷星地址"
        name="questionnaireUrl"
        :rules="[
          { required: true, message: '请输入问卷星地址' },
          { type: 'url', message: '请输入有效的URL地址' }
        ]"
      >
        <Input
          v-model:value="formData.questionnaireUrl"
          placeholder="请输入问卷星地址"
        />
      </Form.Item>

      <Form.Item label="是否启用">
        <Switch v-model:checked="formData.isPublished" />
      </Form.Item>
    </Form>
  </Modal>

  <!-- 数据查看弹窗 -->
  <Modal
    v-model:open="dataModalVisible"
    :title="`${currentAssessmentName} - 问卷数据`"
    :footer="null"
    width="80vw"
    @cancel="closeDataModal"
  >
      <div style="padding: 20px 0; min-height: 65vh;">
        <DataGrid>
        <template #dataSubmitTime="{ row }">
          <span>
            {{ dayjs(row.submitTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
        </template>

        <template #dataScore="{ row }">
          <span
            v-if="row.score"
            :class="[
              'font-semibold',
              row.score >= 85 ? 'text-green-600' :
              row.score >= 70 ? 'text-blue-600' :
              row.score >= 60 ? 'text-orange-600' : 'text-red-600'
            ]"
          >
            {{ row.score }}分
          </span>
          <span v-else class="text-gray-400 dark:text-gray-300">-</span>
        </template>

        <template #dataActions="{ row }">
          <Button
            type="link"
            size="small"
            @click="handleViewDetail(row)"
          >
            查看
          </Button>
        </template>
        </DataGrid>
      </div>
  </Modal>
  </Spin>

</template>
