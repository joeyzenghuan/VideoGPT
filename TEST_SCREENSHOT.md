# 截图功能测试说明

本项目提供了两个测试脚本来验证 YouTube 视频截图功能是否正常工作。

## 测试文件

### 1. `test-screenshot.ts` - 完整测试
包含全面的测试功能：
- 基础功能测试
- 性能测试
- URL格式验证
- 可访问性测试
- 错误处理测试
- 边界值测试

### 2. `test-screenshot-simple.ts` - 快速测试
简化的测试脚本，用于快速验证基础功能。

## 运行测试

### 方法一：使用 npm scripts
```cmd
# 运行完整测试
npm run test:screenshot

# 运行快速测试
npm run test:screenshot:quick
```

### 方法二：直接运行
```cmd
# 运行完整测试
npx tsx test-screenshot.ts

# 运行快速测试
npx tsx test-screenshot-simple.ts
```

## 测试内容

### 基础测试
- ✅ 验证函数能否正常调用
- ✅ 检查返回结果数量是否正确
- ✅ 测量执行时间
- ✅ 验证URL格式

### 高级测试（仅在完整测试中）
- 🧪 无效视频ID处理
- 🧪 边界时间戳处理 
- 🧪 大量时间戳性能测试
- 🧪 URL可访问性验证

## 预期结果

正常情况下，测试应该显示：
```
🎉 测试结果:
⏱️  执行时间: XXXms
📸 生成截图数量: X
✅ 预期截图数量: X
🎯 成功率: 100%

📋 生成的截图URLs:
  1. 时间戳 30s: https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg
  ...

🔍 URL格式验证:
✅ 有效URL数量: X/X
🎊 所有截图URL格式正确！
```

## 故障排除

如果测试失败，可能的原因：
1. **网络连接问题** - 检查网络连接
2. **YouTube API限制** - 尝试使用不同的视频ID
3. **依赖项缺失** - 运行 `npm install` 确保所有依赖已安装
4. **模块路径问题** - 确保项目结构正确

## 自定义测试

你可以修改测试参数：

```typescript
// 使用不同的视频ID
const testVideoId = 'your_video_id_here';

// 测试不同的时间戳
const testTimestamps = [0, 15, 30, 45, 60, 90];
```

## 注意事项

- 测试使用的是 YouTube 的缩略图API，不是真实的视频截图
- 网络状况可能影响测试结果
- 某些视频可能没有高质量缩略图，会使用回退方案
