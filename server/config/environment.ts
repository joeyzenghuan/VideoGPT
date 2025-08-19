import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// 加载环境变量配置
// .env文件的值会覆盖系统环境变量
export function loadEnvironment() {
  const envPath = path.resolve(process.cwd(), '.env');
  
  // 检查.env文件是否存在
  if (fs.existsSync(envPath)) {
    console.log("✅ 找到.env文件，正在加载配置...");
    
    // 加载.env文件，override: true 确保.env文件的值覆盖系统环境变量
    const result = config({ 
      path: envPath,
      override: true  // 这是关键：让.env文件的值覆盖系统环境变量
    });
    
    if (result.error) {
      console.error("❌ 加载.env文件时出错:", result.error);
      throw result.error;
    }
    
    console.log("✅ .env文件加载成功");
    
    // 显示加载的配置（仅显示前几个字符用于调试）
    const configSummary = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '3000',
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL ? '已配置' : '未配置',
      OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME || '未配置',
      OPENAI_API_VERSION: process.env.OPENAI_API_VERSION || '未配置 (可能使用标准OpenAI)',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 8)}...` : '未配置',
      DATABASE_URL: process.env.DATABASE_URL ? '已配置' : '未配置 (使用内存存储)',
      SESSION_SECRET: process.env.SESSION_SECRET ? '已配置' : '未配置'
    };
    
    console.log("📋 环境变量配置摘要:", configSummary);
    
  } else {
    console.log("⚠️  未找到.env文件");
    console.log("💡 请复制.env.sample为.env并填入正确的配置值");
    console.log("📁 .env文件路径:", envPath);
    
    // 在开发环境中，如果没有.env文件，给出更详细的提示
    if (process.env.NODE_ENV !== 'production') {
      console.log("\n🚀 快速设置步骤:");
      console.log("1. 复制.env.sample文件: cp .env.sample .env");
      console.log("2. 编辑.env文件，填入你的API密钥和配置");
      console.log("3. 重新启动应用");
    }
  }
  
  return process.env;
}

// 验证关键配置是否存在
export function validateEnvironment() {
  const requiredVars = [
    'OPENAI_API_KEY',
    'OPENAI_BASE_URL', 
    'OPENAI_MODEL_NAME'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ 缺少必需的环境变量:");
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error("\n请检查.env文件并确保包含所有必需的配置");
    console.error("参考.env.sample文件了解所需的配置项");
    
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log("✅ 所有必需的环境变量已配置");
}

// 显示当前环境信息（用于调试）
export function showEnvironmentInfo() {
  console.log("\n=== 环境信息 ===");
  console.log(`Node.js版本: ${process.version}`);
  console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`当前工作目录: ${process.cwd()}`);
  console.log(`进程ID: ${process.pid}`);
  console.log("================\n");
}
