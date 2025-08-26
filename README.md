# 配音工具

基于 AI 的配音工具，支持文案生成、角色分配和 TTS 配音。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vuetify 3
- **桌面端**: Electron
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **样式**: SCSS

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器和Electron（推荐）
npm run electron-dev

# 或者分别启动
npm run dev          # 启动Vite开发服务器
npm run electron     # 启动Electron
```

### 构建应用

```bash
# 构建所有平台
npm run build-electron

# 构建特定平台
npm run dist-win     # Windows
npm run dist-mac     # macOS
npm run dist-linux   # Linux
```

## 项目结构

```
配音工具/
├── electron/                 # Electron主进程和预加载脚本
│   ├── main.ts              # 主进程入口
│   └── preload.ts           # 预加载脚本
├── src/                     # Vue应用源码
│   ├── views/               # 页面组件
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia状态管理
│   ├── components/           # 公共组件
│   ├── App.vue              # 主应用组件
│   └── main.ts              # Vue应用入口
├── dist/                    # 构建输出目录
├── dist-electron/           # Electron构建输出
├── package.json             # 项目配置
├── vite.config.ts           # Vite配置
├── tsconfig.json            # TypeScript配置
└── 开发任务清单.md          # 开发进度跟踪
```

## 热重载功能

项目已配置热重载功能，在开发模式下：

1. 修改 Vue 组件代码会自动刷新页面
2. 修改 Electron 主进程代码会自动重启应用
3. 无需手动重新编译即可看到效果

## 开发说明

请查看 `开发任务清单.md` 了解当前开发进度和待完成任务。

## 功能特性

- ✅ 项目列表管理
- ✅ 文案设计（原文+配音文案）
- ✅ 角色管理
- ✅ AI 文案生成
- 🔄 角色分配（开发中）
- 🔄 配音生成（开发中）
- 🔄 设置管理（开发中）

## 许可证

MIT License
