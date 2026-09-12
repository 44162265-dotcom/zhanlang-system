# 🐺 战狼系统 - 市场爆款作战系统

> 选品 → 内容 → 拆解 → 投流 全链路自动化作战系统

## 📋 系统概述

战狼系统是一套面向电商运营的全链路自动化作战系统，以**飞书多维表格**为数据源基座，集成**抖音开源内容**，实现从选品到投流的全流程自动化。

### 核心能力

- 🎯 **智能选品** - 基于抖音爆款数据+2-3倍定价模型筛选
- 🎬 **内容生成** - 自动生成DS出片提示词、剪映剪辑要点、爆款话术
- 🔍 **爆款拆解** - 视频内容自动分析+差异化混剪执行卡
- 💰 **投流测算** - ROI测算+投放决策建议
- 📊 **实时监控** - 作战指挥室全局数据看板

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端系统 (Frontend)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 作战指挥室│ │ 选品中心 │ │ 内容素材 │ │ 爆款拆解 │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 投流测算 │ │ 搜索热度 │ │ 竞品监控 │ │ 客服售后 │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP API
┌──────────────────────────▼──────────────────────────────┐
│                    后端服务 (Backend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  飞书API代理  │  │  抖音API代理  │  │ 选品系统代理 │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐
│  飞书多维表格   │  │  抖音开放平台  │  │ 内网选品系统  │
│  (数据源基座)   │  │  (内容源)     │  │ (选品数据源)  │
└───────────────┘  └──────────────┘  └──────────────┘
```

## 📁 目录结构

```
战狼系统/
├── frontend/                 # 前端系统
│   ├── index.html           # 主页面
│   ├── css/
│   │   └── style.css        # 全局样式
│   ├── js/
│   │   ├── config.js        # 全局配置
│   │   ├── feishu-api.js    # 飞书API封装
│   │   ├── douyin-api.js    # 抖音API封装
│   │   └── app.js           # 主应用逻辑
│   ├── data/                # 本地数据缓存
│   └── assets/              # 静态资源
├── backend/                  # 后端服务
│   ├── server.js            # Express服务器
│   └── api/                 # API路由
├── docs/                     # 项目文档
├── package.json             # 项目配置
└── README.md                # 项目说明
```

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
cd 战狼系统
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
# 飞书应用配置（可选，用于API代理）
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret

# 抖音开放平台配置（可选）
DOUYIN_API_KEY=your_api_key

# 服务端口
PORT=3000
```

### 启动服务

```bash
# 启动完整系统（前端+后端）
npm start

# 开发模式（自动重启）
npm run dev

# 仅启动前端（静态文件）
npm run frontend
```

访问 http://localhost:3000 即可使用系统。

## 📊 数据源配置

### 飞书多维表格（数据源基座）

系统默认使用以下飞书Base作为数据源：

- **Base Token**: `R0x4bXhTua1GZhsjLngcUuDJnIe`
- **访问地址**: https://my.feishu.cn/base/R0x4bXhTua1GZhsjLngcUuDJnIe

包含以下数据表：

| 表名 | Table ID | 用途 |
|------|----------|------|
| 建议售卖表 | tbl26JVQjAYlDwyc | 选品管理 |
| 内容素材方向表 | tbliVncdqx3QJVbo | 内容方向 |
| 爆款视频拆解混剪库 | tbl84QEKHiPNsrjd | 视频拆解 |
| 投流决策测算表 | tblKsfKvJdaCyWxP | 投流测算 |
| 战狼作战指挥室 | tblnzbx1zcQyafzE | 全局监控 |
| 搜索热度关键词 | tblmf75Is9pLrKpd | 热搜数据 |
| 全平台爆款库 | tbli1B9FTsiZ17Vl | 爆款库 |
| 竞品监控表 | tbltVgY3EIXOLZ1N | 竞品监控 |
| 客服售后知识库 | tblrxjyfAlF5Onej | 客服话术 |

### 抖音开源内容（内容源）

系统集成抖音开源内容API，用于：
- 搜索爆款带货视频
- 获取热门视频榜单
- 分析视频爆款要素
- 提取真实视频链接

### 内网选品系统

系统支持接入内网选品系统：
- 默认地址: http://192.168.8.118:1369
- 商品总数: 79万+
- 支持2-3倍定价筛选

## 🔄 数据同步机制

系统采用**双向同步**机制，确保前端与飞书多维表格数据完全一致：

1. **自动同步**: 每5分钟自动从飞书拉取最新数据
2. **手动同步**: 点击"同步数据"按钮立即同步
3. **本地缓存**: 数据缓存到localStorage，离线可用
4. **实时更新**: 操作后立即清除缓存并重新拉取

## 🎯 5大主营品类

- 日用百货
- 家清类
- 五金件
- 滋补类
- 茶叶类

## 📝 开发说明

### 前端技术栈

- 原生 HTML5 + CSS3 + JavaScript (ES6+)
- ECharts 5.4.3 数据可视化
- 深色主题，科技感设计

### 后端技术栈

- Node.js + Express
- Axios HTTP客户端
- CORS跨域支持

### API接口

#### 飞书API

- `GET /api/feishu/base/:baseToken/tables/:tableId/records` - 获取记录
- `POST /api/feishu/base/:baseToken/tables/:tableId/records/batch_create` - 批量创建
- `POST /api/feishu/base/:baseToken/tables/:tableId/records/batch_update` - 批量更新
- `DELETE /api/feishu/base/:baseToken/tables/:tableId/records/:recordId` - 删除记录

#### 抖音API

- `GET /api/douyin/search?keyword=xxx` - 搜索视频
- `GET /api/douyin/hot/videos?category=xxx` - 热门榜单
- `GET /api/douyin/video/detail?video_id=xxx` - 视频详情

#### 选品系统API

- `GET /api/xuanpin/stats` - 统计概览
- `GET /api/xuanpin/products?page=1&size=50` - 商品列表

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 📞 联系方式

- 项目地址: https://github.com/44162265-dotcom/zhanlang-system
- 问题反馈: Issues

---

**🐺 战狼系统 - 让爆款可复制，让投流有依据**