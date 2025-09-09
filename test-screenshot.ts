import { generateVideoScreenshots } from './server/services/screenshot.js';

async function testScreenshotGeneration() {
  console.log('🧪 开始测试截图生成功能...\n');
  
  // 测试用的 YouTube 视频 ID（使用一个公开的测试视频）
  const testVideoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
  
  // 测试用的时间戳（秒）
  const testTimestamps = [10, 30, 60, 120];
  
  console.log(`📹 测试视频ID: ${testVideoId}`);
  console.log(`⏰ 测试时间戳: ${testTimestamps.join(', ')} 秒\n`);
  
  try {
    const startTime = Date.now();
    
    // 调用截图生成函数
    const screenshotUrls = await generateVideoScreenshots(testVideoId, testTimestamps);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n🎉 测试结果:');
    console.log(`⏱️  执行时间: ${duration}ms`);
    console.log(`📸 生成截图数量: ${screenshotUrls.length}`);
    console.log(`✅ 预期截图数量: ${testTimestamps.length}`);
    console.log(`🎯 成功率: ${screenshotUrls.length === testTimestamps.length ? '100%' : '部分成功'}\n`);
    
    // 显示生成的截图URLs
    console.log('📋 生成的截图URLs:');
    screenshotUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. 时间戳 ${testTimestamps[index]}s: ${url}`);
    });
    
    // 验证URL格式
    console.log('\n🔍 URL格式验证:');
    const validUrls = screenshotUrls.filter(url => {
      const isValid = url.startsWith('https://') && url.includes('youtube.com');
      return isValid;
    });
    
    console.log(`✅ 有效URL数量: ${validUrls.length}/${screenshotUrls.length}`);
    
    if (validUrls.length === screenshotUrls.length) {
      console.log('🎊 所有截图URL格式正确！');
    } else {
      console.log('⚠️  部分URL格式可能有问题');
    }
    
    // 可选：测试URL是否可访问
    console.log('\n🌐 测试URL可访问性...');
    await testUrlAccessibility(screenshotUrls[0]); // 只测试第一个URL
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 测试URL是否可访问
async function testUrlAccessibility(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      console.log(`✅ URL可访问: ${response.status} ${response.statusText}`);
      console.log(`📏 Content-Type: ${response.headers.get('content-type')}`);
    } else {
      console.log(`⚠️  URL响应异常: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ URL无法访问:`, error);
  }
}

// 高级测试：测试不同场景
async function runAdvancedTests() {
  console.log('\n🔬 运行高级测试...\n');
  
  // 测试1：无效视频ID
  console.log('📋 测试1：无效视频ID');
  try {
    const invalidResults = await generateVideoScreenshots('invalid_video_id', [30]);
    console.log(`✅ 无效ID处理: 返回${invalidResults.length}个回退URL`);
  } catch (error) {
    console.log('❌ 无效ID测试失败:', error.message);
  }
  
  // 测试2：边界时间戳
  console.log('\n📋 测试2：边界时间戳');
  try {
    const edgeResults = await generateVideoScreenshots('dQw4w9WgXcQ', [0, 1, 9999]);
    console.log(`✅ 边界值处理: 返回${edgeResults.length}个URL`);
  } catch (error) {
    console.log('❌ 边界值测试失败:', error.message);
  }
  
  // 测试3：大量时间戳
  console.log('\n📋 测试3：大量时间戳（性能测试）');
  try {
    const manyTimestamps = Array.from({length: 10}, (_, i) => i * 30);
    const startTime = Date.now();
    const manyResults = await generateVideoScreenshots('dQw4w9WgXcQ', manyTimestamps);
    const duration = Date.now() - startTime;
    console.log(`✅ 大量截图处理: ${manyResults.length}个URL，耗时${duration}ms`);
    console.log(`📊 平均每个截图: ${Math.round(duration / manyResults.length)}ms`);
  } catch (error) {
    console.log('❌ 大量截图测试失败:', error.message);
  }
}

// 运行测试
console.log('🚀 VideoGPT 截图功能测试');
console.log('='.repeat(50));

async function runAllTests() {
  // 基础测试
  await testScreenshotGeneration();
  
  // 高级测试
  await runAdvancedTests();
  
  console.log('\n✨ 所有测试完成！');
}

runAllTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试过程中发生未捕获的错误:', error);
    process.exit(1);
  });
