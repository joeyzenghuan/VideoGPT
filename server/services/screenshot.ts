import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import puppeteer from "puppeteer";

export async function generateVideoScreenshots(
  videoId: string,
  timestamps: number[]
): Promise<string[]> {
  const screenshotUrls: string[] = [];
  
  try {
    console.log("📸 使用Puppeteer开始生成视频截图...");
    console.log("需要截图的时间点:", timestamps);
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log("✅ 创建截图目录:", screenshotsDir);
    }

    // Launch browser once for all screenshots
    console.log("🚀 启动浏览器...");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    try {
      // Process each timestamp
      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        console.log(`📸 处理时间戳 ${i + 1}/${timestamps.length}: ${timestamp}秒`);
        
        try {
          const screenshotFilename = `screenshot_${videoId}_${timestamp}s_${nanoid(8)}.jpg`;
          const screenshotPath = path.join(screenshotsDir, screenshotFilename);
          
          // Create new page for this screenshot
          const page = await browser.newPage();
          
          try {
            // Set viewport for consistent screenshots
            await page.setViewport({ 
              width: 1280, 
              height: 720,
              deviceScaleFactor: 1
            });
            
            // Navigate to YouTube video at specific timestamp
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`;
            console.log(`🌐 访问YouTube: ${youtubeUrl}`);
            
            await page.goto(youtubeUrl, { 
              waitUntil: 'networkidle0', 
              timeout: 30000 
            });
            
            // Wait for video player to load
            await page.waitForSelector('video', { timeout: 15000 });
            console.log(`⏳ 等待视频加载到 ${timestamp} 秒...`);
            
            // Wait a bit for video to seek to the right position
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try to dismiss any overlays or ads
            try {
              // Skip ads if present
              const skipButton = await page.$('.ytp-ad-skip-button, .ytp-skip-ad-button');
              if (skipButton) {
                await skipButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Close any popups
              const closeButtons = await page.$$('[aria-label="Close"], .ytp-ce-covering-overlay .ytp-ce-element-click-area');
              for (const button of closeButtons) {
                try {
                  await button.click();
                } catch (e) {
                  // Ignore click errors
                }
              }
            } catch (e) {
              // Ignore overlay handling errors
            }
            
            // Take screenshot of the video element
            const videoElement = await page.$('video');
            if (videoElement) {
              await videoElement.screenshot({ 
                path: screenshotPath,
                type: 'jpeg',
                quality: 85
              });
              
              // Check if file was created successfully
              if (fs.existsSync(screenshotPath)) {
                const screenshotUrl = `/screenshots/${screenshotFilename}`;
                screenshotUrls.push(screenshotUrl);
                console.log(`✅ 时间戳 ${timestamp}s 截图已生成: ${screenshotFilename}`);
              } else {
                throw new Error("截图文件未生成");
              }
            } else {
              throw new Error("未找到视频元素");
            }
            
          } finally {
            await page.close();
          }
          
        } catch (error) {
          console.error(`❌ 生成时间戳 ${timestamp}s 的截图时出错:`, error instanceof Error ? error.message : String(error));
          
          // Fallback to YouTube thumbnail for this timestamp
          const fallbackUrl = await getFallbackThumbnail(videoId);
          screenshotUrls.push(fallbackUrl);
          console.log(`🔄 时间戳 ${timestamp}s 使用回退缩略图`);
        }
      }
      
    } finally {
      await browser.close();
      console.log("🔄 浏览器已关闭");
    }
    
    console.log(`📸 截图生成完成，成功: ${screenshotUrls.length} 个`);
    return screenshotUrls;
    
  } catch (error) {
    console.error("❌ 截图生成过程中发生错误:", error);
    
    // Return fallback thumbnails for all timestamps
    console.log("🔄 全部使用回退缩略图");
    return await Promise.all(
      timestamps.map(() => getFallbackThumbnail(videoId))
    );
  }
}

// 获取回退缩略图
async function getFallbackThumbnail(videoId: string): Promise<string> {
  try {
    // 尝试不同质量的YouTube缩略图
    const thumbnailUrls = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/sddefault.jpg`
    ];
    
    // 返回第一个可用的缩略图
    return thumbnailUrls[0];
  } catch (error) {
    console.log("⚠️  无法使用视频缩略图，使用默认缩略图");
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
}

// 检查Puppeteer是否可用
export async function checkPuppeteerAvailable(): Promise<boolean> {
  try {
    const browser = await puppeteer.launch({ headless: true });
    await browser.close();
    return true;
  } catch (error) {
    return false;
  }
}

// 清理旧的截图文件（可选）
export async function cleanupOldScreenshots(maxAgeMinutes: number = 60): Promise<void> {
  const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
  
  if (!fs.existsSync(screenshotsDir)) {
    return;
  }
  
  const files = fs.readdirSync(screenshotsDir);
  const cutoff = Date.now() - (maxAgeMinutes * 60 * 1000);
  
  let deletedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(screenshotsDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime.getTime() < cutoff) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (error) {
        console.error(`删除旧截图文件失败: ${file}`, error);
      }
    }
  }
  
  if (deletedCount > 0) {
    console.log(`🧹 清理了 ${deletedCount} 个旧截图文件`);
  }
}

// Keep the timestamp formatting function
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
