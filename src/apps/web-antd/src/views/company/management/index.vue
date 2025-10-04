<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message, Space,Upload } from 'ant-design-vue';
import dayjs from 'dayjs';

import { upload_file } from '#/api/examples/upload';
import { 
  getCompanyListApi,
  getRechargeListApi,
  createCompanyApi,
  updateCompanyApi,
  createRechargeApi,
  type CompanyData as ApiCompanyData,
  type CompanyListParams,
  type RechargeRecord as ApiRechargeRecord,
  type RechargeListParams,
  type CreateCompanyParams,
  type UpdateCompanyParams,
  type CreateRechargeParams
} from '#/api/core/company';

import { useVbenForm, z } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

defineOptions({
  name: 'CompanyManagement',
});

// 页面使用的类型定义（从API类型转换而来）
interface CompanyData {
  id: number;
  companyName: string;
  rechargeAmount: number;
  balance: number;
  creator: string;
  creatorId: number;
  createTime: number;
  status: 'active' | 'inactive';
  notificationMethod?: string;
  banner?: string;
}

// 将API数据转换为页面数据的函数
const transformCompanyData = (apiData: ApiCompanyData): CompanyData => {
  return {
    id: apiData.id,
    companyName: apiData.company_name,
    rechargeAmount: parseFloat(apiData.recharge_amount) || 0,
    balance: parseFloat(apiData.balance) || 0,
    creator: apiData.creator,
    creatorId: apiData.creator_id,
    createTime: apiData.create_time,
    status: apiData.status,
    notificationMethod: apiData.notification_method,
    banner: apiData.banner,
  };
};

// 搜索参数接口保持兼容性
interface SearchParams {
  page?: number;
  size?: number;
  companyName?: string;
  creator?: string;
  createStartTime?: number;
  createEndTime?: number;
}

interface ApiResponse {
  list: CompanyData[];
  total: number;
}

// 充值记录相关类型定义
interface RechargeRecord {
  id: number;
  companyId: number;
  companyName: string;
  rechargeAmount: number;
  rechargeTime: number;
  operator: string;
  operatorId: number;
  status: 'success' | 'pending' | 'failed';
  remark?: string;
  certificate?: string;
}

// 将API充值数据转换为页面数据的函数
const transformRechargeData = (apiData: ApiRechargeRecord): RechargeRecord => {
  return {
    id: apiData.id,
    companyId: apiData.company_id,
    companyName: apiData.company_name,
    rechargeAmount: parseFloat(apiData.recharge_amount) || 0,
    rechargeTime: apiData.recharge_time,
    operator: apiData.operator,
    operatorId: apiData.operator_id,
    status: apiData.status,
    remark: apiData.remark || '',
    certificate: apiData.certificate || '',
  };
};

interface RechargeSearchParams {
  page?: number;
  size?: number;
  companyId?: number;
}

interface RechargeApiResponse {
  list: RechargeRecord[];
  total: number;
}

// 搜索表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  // 设置通用配置，包括 label 宽度
  commonConfig: {
    labelWidth: 130,
  },
  fieldMappingTime: [['rangePicker', ['createStartTime', 'createEndTime']]],
  schema: [
    {
      component: 'Input',
      fieldName: 'companyName',
      label: '公司名称',
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
      component: 'RangePicker',
      defaultValue: undefined,
      fieldName: 'rangePicker',
      label: '创建时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: true,
};

// 获取公司列表API调用
const getCompanyList = async (params: SearchParams): Promise<ApiResponse> => {
  try {
    const apiParams: CompanyListParams = {
      page: params.page || 1,
      size: params.size || 10,
      company_name: params.companyName,
      creator: params.creator,
      create_start_time: params.createStartTime,
      create_end_time: params.createEndTime,
    };

    const response = await getCompanyListApi(apiParams);
    
    return {
      list: response.list.map(transformCompanyData),
      total: response.total,
    };
  } catch (error) {
    console.error('获取公司列表失败:', error);
    message.error('获取公司列表失败，请重试');
    return {
      list: [],
      total: 0,
    };
  }
};

// 获取充值记录列表API调用
const getRechargeList = async (params: RechargeSearchParams): Promise<RechargeApiResponse> => {
  try {
    if (!params.companyId) {
      throw new Error('公司ID不能为空');
    }

    const apiParams: RechargeListParams = {
      page: params.page || 1,
      size: params.size || 10,
      company_id: params.companyId,
    };

    const response = await getRechargeListApi(apiParams);
    
    return {
      list: response.list.map(transformRechargeData),
      total: response.total,
    };
  } catch (error) {
    console.error('获取充值记录失败:', error);
    message.error('获取充值记录失败，请重试');
    return {
      list: [],
      total: 0,
    };
  }
};

// 编辑表单配置
const editFormSchema = [
  {
    component: 'Input',
    fieldName: 'companyName',
    label: '公司名称',
    rules: z.string().min(2, '公司名称最少需要2个字符'),
    componentProps: {
      placeholder: '请输入公司名称',
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'rechargeAmount',
    label: '充值金额',
    componentProps: {
      placeholder: '请输入充值金额',
      min: 0,
      style: { width: '100%' },
      formatter: (value: number) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      parser: (value: string) => value.replace(/¥\s?|(,*)/g, ''),
    },
  },
  {
    component: 'Upload',
    fieldName: 'banner',
    label: '上传凭证',
    componentProps: {
      // 自动携带认证信息
      customRequest: upload_file,
      disabled: false,
      maxCount: 5,
      multiple: true,
      showUploadList: true,
      // 上传列表的内建样式，支持四种基本样式 text, picture, picture-card 和 picture-circle
      listType: 'picture-card',
      beforeUpload: (file: File) => {
        // 检查文件大小是否超过10MB
        const isValidSize = file.size / 1024 / 1024 < 10;
        // 允许的文件扩展名
        const validExtensions = ['jpg', 'png'];
        // 获取文件扩展名
        const fileExtension = file.name?.split('.').pop()?.toLowerCase();
        // 检查文件扩展名是否在允许的范围内
        const isValidType = validExtensions.includes(fileExtension || '');
        if (!isValidSize) {
          message.error('文件大小不能超过 10MB');
          return Upload.LIST_IGNORE;
        }
        if (!isValidType) {
          message.error('仅支持 .jpg, .png 格式的图片');
          return Upload.LIST_IGNORE;
        }
        return true;
      },
      onPreview: (file: any) => {
        // 获取图片URL进行预览
        const imageUrl = file.url || file.response?.file_url || file.thumbUrl;
        if (imageUrl) {
          window.open(imageUrl, '_blank');
        } else {
          message.warning('无法预览该图片');
        }
      },
    },
    renderComponentContent: () => {
      return {
        default: () => '上传图片',
      };
    },
  },
  {
    component: 'Input',
    fieldName: 'notificationMethod',
    label: '余额不足时通知方式',
    componentProps: {
      placeholder: '请输入邮箱或者手机号码',
    },
  },

];

// 新增充值记录表单配置
const rechargeFormSchema = [
  {
    component: 'InputNumber',
    fieldName: 'rechargeAmount',
    label: '充值金额',
    rules: z.number().min(1, '请输入充值金额'),
    componentProps: {
      placeholder: '请输入充值金额',
      min: 0,
      style: { width: '100%' },
      formatter: (value: number) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      parser: (value: string) => value.replace(/¥\s?|(,*)/g, ''),
    },
  },
  {
    component: 'Upload',
    fieldName: 'certificate',
    label: '充值凭证',
    rules: z.array(z.any()).min(1, '请上传充值凭证'),
    componentProps: {
      customRequest: upload_file,
      disabled: false,
      maxCount: 1,
      multiple: false,
      showUploadList: true,
      listType: 'picture-card',
      beforeUpload: (file: File) => {
        const isValidSize = file.size / 1024 / 1024 < 10;
        const validExtensions = ['jpg', 'png', 'jpeg'];
        const fileExtension = file.name?.split('.').pop()?.toLowerCase();
        const isValidType = validExtensions.includes(fileExtension || '');
        if (!isValidSize) {
          message.error('文件大小不能超过 10MB');
          return Upload.LIST_IGNORE;
        }
        if (!isValidType) {
          message.error('仅支持 .jpg, .png, .jpeg 格式的图片');
          return Upload.LIST_IGNORE;
        }
        return true;
      },
    },
    renderComponentContent: () => {
      return {
        default: () => '上传凭证',
      };
    },
  },
];

// 编辑模式状态
const isEditMode = ref(false);
const currentEditId = ref<number | null>(null);

// 充值弹窗相关状态
const currentCompany = ref<CompanyData | null>(null);

// 创建编辑表单
const [EditForm, editFormApi] = useVbenForm({
  schema: editFormSchema,
  showDefaultActions: false,
  // 设置通用配置，包括 label 宽度
  commonConfig: {
    labelWidth: 130,
  },
});

// 创建新增充值表单
const [RechargeForm, rechargeFormApi] = useVbenForm({
  schema: rechargeFormSchema,
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 130,
  },
});

// 创建新增充值弹窗
const [RechargeAddModal, rechargeAddModalApi] = useVbenModal({
  title: '新增充值',
  onConfirm: async () => {
    try {
      const validationResult = await rechargeFormApi.validate();
      if (validationResult.valid) {
        const formValues = await rechargeFormApi.getValues();

        if (!currentCompany.value) {
          message.error('公司信息丢失，请重新打开充值窗口');
          return;
        }

        message.loading({
          content: '正在添加充值记录，请稍等...',
          duration: 0,
          key: 'add_recharge_msg',
        });

        try {
          // 获取上传文件URL
          const certificateUrl = formValues.certificate?.[0]?.response?.file_url || '';

          if (!certificateUrl) {
            message.error('请上传充值凭证');
            return;
          }

          const rechargeParams: CreateRechargeParams = {
            recharge_amount: formValues.rechargeAmount,
            certificate: certificateUrl,
            company_id: currentCompany.value.id,
          };

          await createRechargeApi(rechargeParams);

          message.success({
            content: '充值记录添加成功',
            key: 'add_recharge_msg',
          });
          rechargeAddModalApi.close();
          // 刷新充值记录列表
          rechargeGridApi.query();
        } catch (error) {
          console.error('添加充值记录失败:', error);
          message.error({
            content: '添加充值记录失败，请重试',
            key: 'add_recharge_msg',
          });
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  },
  onCancel: () => {
    rechargeFormApi.resetForm();
    rechargeAddModalApi.close();
  },
});

// 创建编辑弹窗
const [EditModal, editModalApi] = useVbenModal({
  title: '公司管理',
  onConfirm: async () => {
    try {
      const validationResult = await editFormApi.validate();
      if (validationResult.valid) {
        const formValues = await editFormApi.getValues();

        message.loading({
          content: isEditMode.value ? '正在保存，请稍等...' : '正在新增，请稍等...',
          duration: 0,
          key: 'save_msg',
        });

        try {
          // 获取上传文件URL
          const bannerUrl = formValues.banner?.[0]?.response?.file_url || '';

          if (isEditMode.value && currentEditId.value) {
            // 编辑模式
            const updateParams: UpdateCompanyParams = {
              id: currentEditId.value,
              company_name: formValues.companyName,
              recharge_amount: formValues.rechargeAmount,
              notification_method: formValues.notificationMethod || '',
              banner: bannerUrl,
            };
            await updateCompanyApi(updateParams);
          } else {
            // 新增模式
            const createParams: CreateCompanyParams = {
              company_name: formValues.companyName,
            };
            
            // 只有在有值时才添加可选字段
            if (formValues.rechargeAmount && formValues.rechargeAmount > 0) {
              createParams.recharge_amount = formValues.rechargeAmount;
            }
            
            if (formValues.notificationMethod && formValues.notificationMethod.trim()) {
              createParams.notification_method = formValues.notificationMethod.trim();
            }
            
            if (bannerUrl) {
              createParams.banner = bannerUrl;
            }
            
            await createCompanyApi(createParams);
          }

          message.success({
            content: isEditMode.value ? '保存成功' : '新增成功',
            key: 'save_msg',
          });
          editModalApi.close();
          // 刷新列表
          gridApi.query();
        } catch (error) {
          console.error('保存失败:', error);
          message.error({
            content: isEditMode.value ? '保存失败，请重试' : '新增失败，请重试',
            key: 'save_msg',
          });
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  },
  onCancel: () => {
    editFormApi.resetForm();
    isEditMode.value = false;
    currentEditId.value = null;
    editModalApi.close();
  },
});

// 公司操作函数
const handleRecharge = (row: CompanyData) => {
  console.log('查看充值记录:', row);

  // 设置当前公司信息
  currentCompany.value = row;

  // 设置弹窗标题
  rechargeModalApi.setState({
    title: `${row.companyName} - 充值记录`
  });

  // 打开充值记录弹窗
  rechargeModalApi.open();

  // 刷新充值记录列表
  setTimeout(() => {
    rechargeGridApi.query();
  }, 100);
};

const handleEdit = (row: CompanyData) => {
  console.log('编辑公司:', row);

  // 设置编辑模式
  isEditMode.value = true;
  currentEditId.value = row.id;

  // 设置弹窗标题
  editModalApi.setState({ title: '编辑公司' });

  // 设置表单数据
  editFormApi.setValues({
    companyName: row.companyName,
    rechargeAmount: row.rechargeAmount,
    status: row.status,
    notificationMethod: row.notificationMethod || '',
    banner: row.banner ? [
      {
        uid: Date.now().toString(),
        status: 'done',
        url: row.banner,
        response: {
          file_url: row.banner,
        },
      }
    ] : [],
  });

  // 打开弹窗
  editModalApi.open();
};

// 工具栏操作函数
const handleCreate = () => {
  console.log('新建公司');

  // 设置新增模式
  isEditMode.value = false;
  currentEditId.value = null;

  // 设置弹窗标题
  editModalApi.setState({ title: '新增公司' });

  // 清空表单
  editFormApi.resetForm();

  // 打开弹窗
  editModalApi.open();
};


// 格式化金额显示
const formatAmount = (amount: number): string => {
  return `¥${amount.toLocaleString()}`;
};

// 充值记录表格配置
const rechargeGridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'rechargeTime',
      title: '充值时间',
      slots: { default: 'rechargeRecordTime' },
    },
    {
      field: 'rechargeAmount',
      title: '充值金额',
      slots: { default: 'rechargeRecordAmount' },
    },
    {
      field: 'certificate',
      title: '充值凭证',
      slots: { default: 'rechargeRecordCertificate' },
    },
    {
      field: 'operator',
      title: '操作人',
    },
  ],
  height: 400,
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
        const result = await getRechargeList({
          page: page.currentPage,
          size: page.pageSize,
          companyId: currentCompany.value?.id,
        });
        return result;
      },
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
  },
};

// 创建充值记录表格
const [RechargeGrid, rechargeGridApi] = useVbenVxeGrid({
  gridOptions: rechargeGridOptions,
});

// 创建充值记录弹窗
const [RechargeModal, rechargeModalApi] = useVbenModal({
  title: '充值记录',
  onConfirm: () => {
    rechargeModalApi.close();
    currentCompany.value = null;
  },
  onCancel: () => {
    rechargeModalApi.close();
    currentCompany.value = null;
  },
});

// 处理新增充值记录
const handleAddRecharge = () => {
  rechargeFormApi.resetForm();
  rechargeAddModalApi.open();
};

// 查看充值凭证
const viewCertificate = (certificateUrl: string) => {
  window.open(certificateUrl, '_blank');
};

const gridOptions: VxeTableGridOptions = {
  columns: [
    {
      field: 'companyName',
      title: '公司名称',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'rechargeAmount',
      title: '充值金额',
      width: 120,
      slots: { default: 'rechargeAmount' },
    },
    {
      field: 'balance',
      title: '余额',
      width: 120,
      slots: { default: 'balance' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      slots: { default: 'createTime' },
    },
    {
      field: 'creator',
      title: '创建人',
      width: 100,
    },
    {
      field: 'actions',
      title: '操作',
      width: 120,
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
        const result = await getCompanyList({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
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
</script>

<template>
  <Page auto-content-height title="公司管理">
    <Grid>
      <template #toolbar-actions>
        <Button type="primary" class="mr-4" @click="handleCreate">
          新建
        </Button>
      </template>

      <template #rechargeAmount="{ row }">
        <span class="font-semibold text-red-600">
          {{ formatAmount(row.rechargeAmount) }}
        </span>
      </template>

      <template #balance="{ row }">
        <span class="font-semibold text-blue-600">
          {{ formatAmount(row.balance) }}
        </span>
      </template>

      <template #createTime="{ row }">
        <span>
          {{ dayjs(row.createTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </span>
      </template>


      <template #actions="{ row }">
        <Space>
          <Button
            type="link"
            size="small"
            @click="handleRecharge(row)"
          >
            充值
          </Button>
          <Button
            type="link"
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </Button>
        </Space>
      </template>
    </Grid>

    <!-- 编辑弹窗 -->
    <EditModal class="w-[600px]" :overlay-blur="2">
      <EditForm />
    </EditModal>

    <!-- 充值记录弹窗 -->
    <RechargeModal class="w-[900px]" :overlay-blur="2">
      <div class="p-4">
        <RechargeGrid>
          <template #toolbar-actions>
            <Button type="primary" @click="handleAddRecharge">
              新增
            </Button>
          </template>

          <template #rechargeRecordTime="{ row }">
            <span>
              {{ dayjs(row.rechargeTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}
            </span>
          </template>

          <template #rechargeRecordAmount="{ row }">
            <span class="font-semibold text-green-600">
              {{ formatAmount(row.rechargeAmount) }}
            </span>
          </template>

          <template #rechargeRecordCertificate="{ row }">
            <span v-if="row.certificate" class="text-blue-600 cursor-pointer hover:underline" @click="viewCertificate(row.certificate)">
              查看凭证
            </span>
            <span v-else class="text-gray-400">
              无凭证
            </span>
          </template>
        </RechargeGrid>
      </div>
    </RechargeModal>

    <!-- 新增充值记录弹窗 -->
    <RechargeAddModal class="w-[500px]" :overlay-blur="2">
      <RechargeForm />
    </RechargeAddModal>
  </Page>
</template>
