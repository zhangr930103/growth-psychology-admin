<!--
WangEditor 富文本编辑器组件

功能特性：
- 支持富文本编辑、图片上传
- 自动适配多种上传接口返回格式
- 支持深色模式
- 完整的错误处理

使用示例：
<WangEditor
  v-model:value="content"
  placeholder="请输入内容"
  :height="400"
  url-field="fileUrl"
  @upload-success="handleUploadSuccess"
  @upload-error="handleUploadError"
/>

Props：
- modelValue: 编辑器内容（HTML字符串）
- placeholder: 占位符文本
- disabled: 是否禁用
- height: 编辑器高度（px或字符串）
- mode: 编辑器模式（'default' | 'simple'）
- urlField: 自定义上传返回数据的URL字段名

Events：
- update:modelValue: 内容变化事件
- change: 内容变化事件（同上）
- uploadSuccess: 图片上传成功事件
- uploadError: 图片上传失败事件

支持的返回数据格式：
- { url: "xxx" }
- { src: "xxx" }
- { path: "xxx" }
- { fileUrl: "xxx" }
- { data: { url: "xxx" } }
- 直接返回URL字符串
- 其他常见格式...
-->

<script lang="ts" setup>
import { createEditor, createToolbar, type IEditorConfig, type IToolbarConfig } from '@wangeditor/editor';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { upload_file } from '#/api/examples/upload';
import { message } from 'ant-design-vue';

import '@wangeditor/editor/dist/css/style.css';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  height?: string | number;
  mode?: 'default' | 'simple';
  /** 自定义上传返回数据的URL字段名，如果不设置则自动尝试常见字段 */
  urlField?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'uploadSuccess', data: any, url: string, file: File): void;
  (e: 'uploadError', error: Error, file: File): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  disabled: false,
  height: 400,
  mode: 'default',
});

const emits = defineEmits<Emits>();

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();
const toolbarRef = shallowRef();

// DOM 节点
const editorContainer = ref<HTMLElement>();
const toolbarContainer = ref<HTMLElement>();

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  MENU_CONF: {
    // 配置上传图片
    uploadImage: {
      async customUpload(file: File, insertFn: Function) {
        try {
          // 文件大小限制：5MB
          const maxSize = 5 * 1024 * 1024;
          if (file.size > maxSize) {
            message.error('图片大小不能超过5MB');
            return;
          }

          // 文件类型限制
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            message.error('只支持 JPG、PNG、GIF、WebP 格式的图片');
            return;
          }

          const hideLoading = message.loading('上传中...', 0);

          await upload_file({
            file,
            onSuccess: (data) => {
              hideLoading();

              // 适配多种可能的返回数据格式
              let imageUrl = '';

              if (data) {
                // 如果指定了自定义字段名，优先使用
                if (props.urlField && data[props.urlField]) {
                  imageUrl = data[props.urlField];
                } else {
                  // 尝试从多种可能的字段中获取图片URL
                  imageUrl = data.url ||
                            data.src ||
                            data.path ||
                            data.file_url ||
                            data.fileUrl ||
                            data.image_url ||
                            data.imageUrl ||
                            data.link ||
                            data.href ||
                            (data.data && data.data.url) ||
                            (data.data && data.data.src) ||
                            (data.data && data.data.path) ||
                            (data.data && data.data.file_url) ||
                            (data.file && data.file.url) ||
                            (data.result && data.result.url) ||
                            '';

                  // 如果是完整的数据对象，也可能直接就是URL字符串
                  if (!imageUrl && typeof data === 'string') {
                    imageUrl = data;
                  }
                }
              }

              console.log('上传返回数据:', data);
              console.log('解析得到的图片URL:', imageUrl);

              if (imageUrl) {
                // 插入图片到编辑器
                insertFn(imageUrl, file.name, imageUrl);
                message.success('图片上传成功');
                // 触发上传成功事件
                emits('uploadSuccess', data, imageUrl, file);
              } else {
                console.error('无法解析图片URL，返回数据:', data);
                const error = new Error('上传返回数据格式错误，无法解析图片URL');
                message.error('上传返回数据格式错误，请检查上传接口返回格式');
                emits('uploadError', error, file);
              }
            },
            onError: (error) => {
              hideLoading();
              console.error('上传失败:', error);
              message.error(`上传失败: ${error.message || '未知错误'}`);
              emits('uploadError', error, file);
            },
          });
        } catch (error) {
          console.error('上传异常:', error);
          message.error('上传异常，请重试');
          const uploadError = error instanceof Error ? error : new Error(String(error));
          emits('uploadError', uploadError, file);
        }
      },
    },
  },
};

// 工具栏配置
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    'group-video', // 排除视频相关菜单
    'insertVideo',
    'uploadVideo',
  ],
};

// 监听内容变化
const handleChange = (editor: any) => {
  const html = editor.getHtml();
  emits('update:modelValue', html);
  emits('change', html);
};

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (editorRef.value && newVal !== editorRef.value.getHtml()) {
      editorRef.value.setHtml(newVal || '');
    }
  },
);

// 监听disabled状态
watch(
  () => props.disabled,
  (newVal) => {
    if (editorRef.value) {
      newVal ? editorRef.value.disable() : editorRef.value.enable();
    }
  },
);

onMounted(() => {
  if (!editorContainer.value || !toolbarContainer.value) return;

  // 创建编辑器
  editorRef.value = createEditor({
    selector: editorContainer.value,
    html: props.modelValue,
    config: editorConfig,
    mode: props.mode,
  });

  // 创建工具栏
  toolbarRef.value = createToolbar({
    editor: editorRef.value,
    selector: toolbarContainer.value,
    config: toolbarConfig,
    mode: props.mode,
  });

  // 监听内容变化
  editorRef.value.on('change', () => handleChange(editorRef.value));

  // 设置初始禁用状态
  if (props.disabled) {
    editorRef.value.disable();
  }
});

onBeforeUnmount(() => {
  if (editorRef.value == null) return;
  editorRef.value.destroy();
  editorRef.value = null;
});

// 暴露编辑器实例方法
defineExpose({
  getEditor: () => editorRef.value,
  getHtml: () => editorRef.value?.getHtml() || '',
  getText: () => editorRef.value?.getText() || '',
  setHtml: (html: string) => editorRef.value?.setHtml(html),
  clear: () => editorRef.value?.clear(),
  focus: () => editorRef.value?.focus(),
  blur: () => editorRef.value?.blur(),
  enable: () => editorRef.value?.enable(),
  disable: () => editorRef.value?.disable(),
});
</script>

<template>
  <div class="wang-editor">
    <!-- 工具栏容器 -->
    <div
      ref="toolbarContainer"
      class="wang-editor-toolbar"
      :class="{ 'wang-editor-toolbar-disabled': disabled }"
    />
    <!-- 编辑器容器 -->
    <div
      ref="editorContainer"
      class="wang-editor-container"
      :style="{ height: typeof height === 'number' ? `${height}px` : height }"
      :class="{ 'wang-editor-disabled': disabled }"
    />
  </div>
</template>

<style scoped>
.wang-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.3s;
}

.wang-editor:hover {
  border-color: #4096ff;
}

.wang-editor:focus-within {
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.2);
}

.wang-editor-toolbar {
  border-bottom: 1px solid #d9d9d9;
  background-color: #fafafa;
}

.wang-editor-toolbar-disabled {
  background-color: #f5f5f5;
  opacity: 0.6;
}

.wang-editor-container {
  background-color: #fff;
  overflow-y: auto;
}

.wang-editor-disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 深色模式适配 */
.dark .wang-editor {
  border-color: #424242;
}

.dark .wang-editor:hover {
  border-color: #4096ff;
}

.dark .wang-editor-toolbar {
  border-bottom-color: #424242;
  background-color: #1f1f1f;
}

.dark .wang-editor-toolbar-disabled {
  background-color: #2a2a2a;
}

.dark .wang-editor-container {
  background-color: #141414;
}

.dark .wang-editor-disabled {
  background-color: #2a2a2a;
}
</style>
