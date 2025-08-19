# 📺 VideoGPT - YouTube视频AI智能分析器

<div align="center">

![VideoGPT Logo](https://img.shields.io/badge/VideoGPT-YouTube%20AI%20分析器-blue?style=for-the-badge&l```
VideoGPT/
├── client/                 # React前端应用=youtube)

一个基于人工智能的YouTube视频内容分析工具，能够自动提取字幕、生成智能摘要，并提供时间轴同步的视频分析体验。

[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-green?logo=express)](https://expressjs.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-orange?logo=openai)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-blue?logo=tailwindcss)](https://tailwindcss.com/)

</div>

## ✨ 功能特性

### 🎯 核心功能
- **智能视频分析**: 输入YouTube链接，AI自动分析视频内容
- **字幕提取**: 自动获取视频字幕，支持多语言
- **AI摘要生成**: 使用OpenAI GPT-4o生成高质量内容摘要
- **时间轴同步**: 摘要内容与视频时间点精确对应
- **截图生成**: 为每个摘要段落生成对应的视频截图

### 🚀 用户体验
- **智能缓存**: 已分析视频自动缓存，提高响应速度
- **用户选择权**: 可选择忽略缓存，重新生成最新分析
- **实时状态**: 分析过程实时显示，进度透明
- **响应式设计**: 完美适配桌面端和移动端
- **现代界面**: 基于ShadCN/UI的精美组件设计

## 🏗️ 技术架构

### 前端技术栈
```
React 18.3.1          # 现代化React框架
TypeScript 5.6.3      # 类型安全的JavaScript
Vite 5.4.19           # 极速构建工具
Tailwind CSS 3.4.17   # 实用优先的CSS框架
ShadCN/UI             # 基于Radix UI的组件库
TanStack Query 5.60.5 # 数据获取和状态管理
Wouter 3.3.5          # 轻量级路由解决方案
```

### 后端技术栈
```
Express.js 4.21.2     # Node.js Web框架
TypeScript            # 后端类型安全
Drizzle ORM           # 类型安全的数据库ORM
OpenAI API 5.12.2     # AI内容生成
YouTube APIs          # 视频元数据提取
```

### 第三方服务
```
OpenAI GPT-4o         # AI摘要生成
YouTube Data API      # 视频信息获取
@distube/ytdl-core    # 视频元数据提取
youtube-caption-extractor  # 字幕提取
```

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn
- OpenAI API密钥

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/videogpt.git
   cd videogpt
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑 .env 文件，添加必要的API密钥
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   ```
   http://localhost:3000
   ```

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 数据库配置（可选，开发环境使用内存存储）
DATABASE_URL=your_postgresql_connection_string

# 会话配置
SESSION_SECRET=your_session_secret_here

# 开发环境
NODE_ENV=development
```

## 📖 使用指南

### 基本使用流程

1. **输入视频链接**
   - 在首页输入YouTube视频URL
   - 支持各种YouTube链接格式

2. **选择分析模式**
   - ☐ 默认模式：使用缓存（快速）
   - ☑️ 重新生成：忽略缓存，重新分析

3. **等待分析完成**
   - 实时显示分析进度
   - 包括字幕提取、AI摘要生成、截图生成等步骤

4. **查看分析结果**
   - 浏览AI生成的智能摘要
   - 点击时间戳跳转到对应视频位置
   - 查看相关截图

### 功能详解

#### 🎬 视频分析
- **自动元数据提取**: 获取视频标题、频道、时长等信息
- **字幕自动识别**: 支持多语言字幕提取和处理
- **内容智能分段**: AI自动将视频内容分为4-6个逻辑段落

#### 🤖 AI摘要生成
- **高质量摘要**: 每个段落生成150-200字的详细摘要
- **关键信息提取**: 突出视频的核心观点和重要信息
- **中英文支持**: 根据视频语言自动适配摘要语言

#### 📸 截图功能
- **时间点截图**: 为每个摘要段落生成对应的视频截图
- **智能回退**: 使用YouTube官方缩略图确保可用性
- **快速加载**: 优化的图片加载和缓存策略

## 🛠️ 开发指南

### 项目结构

```
TubeDigest/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── lib/            # 工具函数和配置
│   │   └── pages/          # 页面组件
├── server/                 # 后端应用
│   ├── routes.ts           # API路由
│   ├── storage.ts          # 数据存储层
│   └── services/           # 业务逻辑服务
│       ├── openai.ts       # AI摘要生成
│       ├── subtitle.ts     # 字幕处理
│       ├── youtube.ts      # YouTube API
│       └── screenshot.ts   # 截图生成
├── shared/                 # 共享类型和模式
└── public/                 # 静态资源
```

### 开发命令

```bash
# 开发环境启动
npm run dev

# 类型检查
npm run check

# 构建生产版本
npm run build

# 生产环境启动
npm start

# 数据库推送（如使用PostgreSQL）
npm run db:push
```

### 添加新功能

1. **添加新的API端点**
   ```typescript
   // server/routes.ts
   app.get("/api/new-feature", async (req, res) => {
     // 实现逻辑
   });
   ```

2. **创建新的React组件**
   ```typescript
   // client/src/components/new-component.tsx
   export function NewComponent() {
     return <div>新组件</div>;
   }
   ```

3. **更新共享类型**
   ```typescript
   // shared/schema.ts
   export const newSchema = z.object({
     // 定义数据结构
   });
   ```

## 🔧 配置说明

### AI模型配置

项目使用OpenAI GPT-4o模型进行内容分析。可在 `server/services/openai.ts` 中调整：

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o",  // 可更换其他模型
  temperature: 0.7, // 调整创造性
  max_tokens: 2000  // 限制输出长度
});
```

### 缓存策略

- **前端缓存**: 使用TanStack Query进行API响应缓存
- **后端缓存**: 基于视频ID的分析结果缓存
- **用户控制**: 支持用户选择忽略缓存重新生成

### 数据存储

- **开发环境**: 内存存储（MemStorage）
- **生产环境**: PostgreSQL数据库
- **支持迁移**: 使用Drizzle ORM管理数据库结构

## 🐛 故障排除

### 常见问题

**Q: 字幕提取失败**
```bash
# 检查视频是否有可用字幕
# 确认网络连接正常
# 查看控制台错误日志
```

**Q: AI摘要生成失败**
```bash
# 检查OpenAI API密钥是否正确配置
# 确认API额度是否充足
# 检查网络连接到OpenAI服务
```

**Q: 截图生成问题**
```bash
# 系统会自动回退到YouTube缩略图
# 检查视频是否公开可访问
# 查看服务器日志获取详细信息
```

### 调试技巧

1. **启用详细日志**
   ```env
   NODE_ENV=development
      ```bash
   DEBUG=videogpt:*
   ```
   ```

2. **检查API响应**
   ```bash
   # 直接测试API端点
   curl http://localhost:3000/api/videos/analyze \
     -H "Content-Type: application/json" \
     -d '{"youtubeUrl":"https://www.youtube.com/watch?v=ZmNpeXTj2c4"}'
   ```

3. **前端调试**
   - 使用浏览器开发工具查看网络请求
   - 检查React Query缓存状态
   - 查看控制台错误信息

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **提交Issue**: 报告Bug或建议新功能
2. **提交PR**: 修复问题或添加新功能
3. **完善文档**: 改进README或添加代码注释
4. **测试反馈**: 测试应用并提供使用反馈

### 开发规范

- 使用TypeScript编写类型安全的代码
- 遵循ESLint和Prettier代码格式
- 编写清晰的提交信息
- 为新功能添加适当的测试

### 提交流程

```bash
# 1. Fork项目并创建分支
git checkout -b feature/your-feature-name

# 2. 提交更改
git commit -m "feat: add your feature description"

# 3. 推送分支
git push origin feature/your-feature-name

# 4. 创建Pull Request
```

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)。

## 🙏 致谢

- [OpenAI](https://openai.com/) - 提供强大的AI模型
- [ShadCN/UI](https://ui.shadcn.com/) - 优秀的组件库
- [YouTube Data API](https://developers.google.com/youtube/) - 视频数据访问
- [React](https://reactjs.org/) - 现代前端框架

## 📧 联系方式

- **项目主页**: [GitHub Repository](https://github.com/yourusername/videogpt)
- **问题反馈**: [Issues](https://github.com/yourusername/videogpt/issues)
- **功能建议**: [Discussions](https://github.com/yourusername/videogpt/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️ Star！**

Made with ❤️ by the VideoGPT team

</div>
