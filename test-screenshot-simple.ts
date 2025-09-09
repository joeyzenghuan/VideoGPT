import { generateVideoScreenshots } from './server/services/screenshot.js';

// 简单快速测试
async function quickTest() {
  console.log('🚀 快速截图功能测试\n');
  
  const videoId = 'dQw4w9WgXcQ'; // 著名的Rick Roll视频
  const timestamps = [10, 20]; // 只测试两个时间点
  
  console.log(`📹 视频ID: ${videoId}`);
  console.log(`⏰ 时间戳: ${timestamps.join(', ')}秒\n`);
  
  try {
    const results = await generateVideoScreenshots(videoId, timestamps);
    
    console.log('✅ 测试成功！');
    console.log(`📸 生成了 ${results.length} 个截图URL\n`);
    
    results.forEach((url, i) => {
      console.log(`${i + 1}. ${url}`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

quickTest();
