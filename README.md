# 成长心理学管理系统 (Growth Psychology Admin)

一个基于 Vue 3 + TypeScript 的企业级心理健康管理系统，提供完整的心理咨询服务管理解决方案。

## 🚀 项目简介

本项目是一个专业的心理健康管理平台后台管理系统，面向企业和机构提供心理健康服务的全流程管理。系统基于现代化的前端技术栈构建，具备高性能、高可用性和良好的用户体验。

### 主要功能模块

- **📋 内容管理** - 咨询师管理、测评问卷、团队活动、常见问题、评价管理
- **🛒 订单管理** - 咨询订单处理、团队活动订单管理
- **🏢 公司管理** - 企业客户信息管理
- **👥 用户管理** - 平台用户账户管理
- **💬 意见反馈** - 用户反馈收集与处理

## 🛠 技术栈

### 核心框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具

### UI 组件库
- **Ant Design Vue** - 企业级 UI 设计语言
- **TailwindCSS** - 实用优先的 CSS 框架
- **Lucide Icons** - 精美的图标库

### 状态管理与路由
- **Pinia** - Vue 3 状态管理库
- **Vue Router** - Vue.js 官方路由管理器

### 开发工具链
- **Monorepo** - 基于 PNPM + Turbo 的多包管理
- **ESLint + Prettier** - 代码质量与格式化
- **Lefthook** - Git hooks 管理
- **Vitest** - 单元测试框架

## 📦 项目结构

```
growth-psychology-admin/
├── src/
│   ├── apps/
│   │   └── web-antd/              # 主应用
│   │       ├── src/
│   │       │   ├── views/         # 页面组件
│   │       │   ├── router/        # 路由配置
│   │       │   ├── api/          # API 接口
│   │       │   └── components/    # 通用组件
│   │       └── package.json
│   ├── packages/                  # 共享包
│   │   ├── @core/                # 核心包
│   │   │   ├── ui-kit/           # UI 组件库
│   │   │   ├── base/             # 基础工具
│   │   │   └── preferences/      # 配置管理
│   │   ├── effects/              # 业务逻辑包
│   │   ├── stores/               # 状态管理
│   │   ├── utils/                # 工具函数
│   │   └── types/                # 类型定义
│   └── internal/                 # 内部工具
│       ├── vite-config/          # Vite 配置
│       ├── eslint-config/        # ESLint 配置
│       └── tailwind-config/      # Tailwind 配置
└── package.json
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **PNPM**: >= 8.0.0

### 安装依赖

```bash
# 安装 pnpm (如果未安装)
npm install -g pnpm

cd src

# 安装依赖
pnpm install
```

### 启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 或者指定特定应用
pnpm --filter @vben/web-antd dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
# 构建所有包
pnpm build

# 构建特定应用
pnpm --filter @vben/web-antd build
```

## 📝 开发指南

### 代码规范

项目使用严格的代码规范以确保代码质量：

```bash
# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck
```

### 提交规范

项目使用 Conventional Commits 规范：

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 新增页面

1. 在 `src/apps/web-antd/src/views/` 下创建页面组件
2. 在 `src/apps/web-antd/src/router/routes/modules/` 中添加路由配置
3. 更新国际化文件（如需要）

## 🧪 测试

```bash
# 运行单元测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e

# 测试覆盖率
pnpm test:coverage
```

## 📚 更多文档

- [组件文档](./docs/components.md) - UI 组件使用指南
- [API 文档](./docs/api.md) - 接口文档说明
- [部署指南](./docs/deployment.md) - 生产环境部署

## 🤝 参与贡献

我们欢迎所有形式的贡献，包括但不限于：

1. 提交 Issue 报告问题或建议功能
2. 提交 Pull Request 改进代码
3. 完善文档和示例
4. 分享使用经验

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源

## 👥 团队

- **开发团队** - 60空间技术团队
- **项目维护** - [项目维护者](mailto:dev@60kongjian.com)

## 🆘 支持与帮助

- **Issue 跟踪**: [GitLab Issues](https://gitlab.60kongjian.com/llxfd/scrm/frontend/admin/-/issues)
- **技术支持**: dev@60kongjian.com
- **文档站点**: [项目文档](https://docs.60kongjian.com)

---

## 📈 项目状态

项目正在积极开发中，欢迎关注和参与贡献！

[![构建状态](https://gitlab.60kongjian.com/llxfd/scrm/frontend/admin/badges/master/pipeline.svg)](https://gitlab.60kongjian.com/llxfd/scrm/frontend/admin/-/commits/master)
[![代码覆盖率](https://gitlab.60kongjian.com/llxfd/scrm/frontend/admin/badges/master/coverage.svg)](https://gitlab.60kongjian.com/llxfd/scrm/frontend/admin/-/commits/master)
