# WangEditor 上传功能调试指南

## 快速测试上传功能

1. 打开FAQ管理页面
2. 点击"新增"按钮
3. 在问题答案编辑器中点击图片上传按钮
4. 选择一张图片进行上传
5. 查看浏览器控制台的日志输出

## 调试上传接口返回格式

### 控制台日志
当上传图片时，会在控制台输出以下信息：
```
上传返回数据: { ... }  // 完整的API返回数据
解析得到的图片URL: xxx  // 最终解析到的图片URL
```

### 常见的API返回格式适配

组件会自动尝试从以下字段中获取图片URL：

```javascript
// 一级字段
data.url
data.src  
data.path
data.file_url
data.fileUrl
data.image_url
data.imageUrl
data.link
data.href

// 嵌套字段
data.data.url
data.data.src
data.data.path
data.data.file_url
data.file.url
data.result.url

// 直接字符串
"https://example.com/image.jpg"
```

### 自定义字段名

如果你的API返回格式不在上述列表中，可以通过 `url-field` 属性指定：

```vue
<WangEditor 
  v-model:model-value="content"
  url-field="myCustomUrlField"
/>
```

### 监听上传事件

```vue
<WangEditor 
  v-model:model-value="content"
  @upload-success="handleUploadSuccess"
  @upload-error="handleUploadError"
/>

<script>
const handleUploadSuccess = (data, url, file) => {
  console.log('上传成功', { data, url, file });
  // 可以在这里处理特殊的业务逻辑
};

const handleUploadError = (error, file) => {
  console.error('上传失败', { error, file });
  // 可以在这里处理错误情况
};
</script>
```

## 常见问题解决

### 1. "上传返回数据格式错误"
- 检查控制台输出的返回数据格式
- 确认URL字段名是否正确
- 使用 `url-field` 属性指定正确的字段名

### 2. 图片无法显示
- 确认返回的URL是完整的可访问地址
- 检查图片URL是否需要域名前缀
- 确认服务器CORS配置正确

### 3. 上传接口返回500错误
- 检查上传接口的文件大小限制
- 确认文件类型是否被服务器支持
- 查看服务器日志获取详细错误信息

## 技术支持

如果遇到问题，请提供以下信息：
1. 控制台输出的完整返回数据
2. 具体的错误信息
3. 上传的文件类型和大小
4. 使用的组件配置
