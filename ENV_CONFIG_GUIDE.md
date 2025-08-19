# 🔧 环境变量配置说明

## ✅ 配置完成状态

VideoGPT项目的环境变量配置已成功实现！现在支持：

- ✅ 从.env文件读取所有配置
- ✅ .env文件的值覆盖系统环境变量  
- ✅ 支持Azure OpenAI和标准OpenAI配置
- ✅ 完整的配置验证和错误提示
- ✅ 开发环境友好的调试信息

## 📁 创建的文件

### 1. `.env.sample` - 环境变量模板
包含所有可配置项的详细说明和示例值。

### 2. `.env` - 实际配置文件 
包含你当前的Azure OpenAI配置：
```env
OPENAI_API_KEY=7ec2138ed30c4882bf847c215b6224f2
OPENAI_BASE_URL=https://jz-fdpo-swn.openai.azure.com/openai/deployments/gpt-4o-mini-0718-deployment-glb
OPENAI_API_VERSION=2024-06-01
OPENAI_MODEL_NAME=gpt-4o-mini-0718-deployment-glb
```

### 3. `server/config/environment.ts` - 环境配置管理器
- 自动加载.env文件
- 验证必需的配置项
- 显示配置摘要（敏感信息已脱敏）
- 提供友好的错误提示

### 4. 更新的文件
- `server/index.ts` - 在启动时加载环境配置
- `server/services/openai.ts` - 从环境变量读取配置
- `.gitignore` - 确保.env文件不被提交

## 🚀 使用方法

### 初次设置
```bash
# 1. 复制模板文件
cp .env.sample .env

# 2. 编辑.env文件，填入你的配置
# 3. 启动应用
npm run dev
```

### 配置验证
启动时会自动验证配置并显示摘要：
```
✅ 找到.env文件，正在加载配置...
✅ .env文件加载成功
📋 环境变量配置摘要: {
  OPENAI_BASE_URL: '已配置',
  OPENAI_MODEL_NAME: 'gpt-4o-mini-0718-deployment-glb',
  OPENAI_API_VERSION: '2024-06-01',
  OPENAI_API_KEY: '7ec2138e...',
  ...
}
✅ 所有必需的环境变量已配置
```

## ⚙️ 支持的配置项

### OpenAI配置 (必需)
- `OPENAI_API_KEY` - API密钥
- `OPENAI_BASE_URL` - API端点URL
- `OPENAI_MODEL_NAME` - 模型名称
- `OPENAI_API_VERSION` - API版本 (Azure OpenAI必需)

### 应用配置 (可选)
- `NODE_ENV` - 运行环境 (development/production)
- `PORT` - 服务端口 (默认3000)
- `SESSION_SECRET` - 会话密钥
- `DATABASE_URL` - 数据库连接字符串

## 🔄 配置切换

### Azure OpenAI 配置示例
```env
OPENAI_API_KEY=your_azure_api_key
OPENAI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment
OPENAI_API_VERSION=2024-06-01
OPENAI_MODEL_NAME=your-deployment-name
```

### 标准OpenAI 配置示例
```env
OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL_NAME=gpt-4o-mini
# OPENAI_API_VERSION 不需要设置
```

## 🛡️ 安全特性

1. **环境变量安全**:
   - .env文件已加入.gitignore，不会被提交
   - 敏感信息在日志中被脱敏显示

2. **配置验证**:
   - 启动时自动检查必需配置
   - 缺少配置时提供详细错误信息

3. **覆盖机制**:
   - .env文件的值优先级高于系统环境变量
   - 确保本地配置不受系统环境影响

## 🐛 故障排除

### 问题1: 缺少环境变量
```
❌ 缺少必需的环境变量: OPENAI_API_KEY, OPENAI_BASE_URL
```
**解决**: 检查.env文件是否存在且包含所有必需配置

### 问题2: .env文件未找到
```
⚠️ 未找到.env文件
💡 请复制.env.sample为.env并填入正确的配置值
```
**解决**: 复制.env.sample为.env并填入配置

### 问题3: API调用失败
检查以下项目：
- API密钥是否正确
- Base URL是否可访问
- 模型名称是否存在
- 网络连接是否正常

## 📝 开发建议

1. **团队协作**: 
   - 不要分享.env文件
   - 更新.env.sample并告知团队成员

2. **生产部署**:
   - 使用环境变量或容器密钥管理
   - 不要在生产环境中使用.env文件

3. **版本控制**:
   - .env文件已被.gitignore忽略
   - 只有.env.sample会被提交到版本控制

---

## 🎉 配置完成！

现在你的VideoGPT应用已经完全支持灵活的环境变量配置，可以轻松在不同的OpenAI提供商之间切换，并且保证了配置的安全性和可维护性！
