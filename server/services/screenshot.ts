import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { videoCache } from "./video-cache";

export async function generateVideoScreenshots(
  videoId: string,
  timestamps: number[],
  videoTitle: string
): Promise<string[]> {
  const screenshotUrls: string[] = [];
  
  try {
    console.log("📸 使用FFmpeg开始生成视频截图...");
    console.log("需要截图的时间点:", timestamps);
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log("✅ 创建截图目录:", screenshotsDir);
    }

    // Ensure video is downloaded and cached
    console.log("� 确保视频已下载到本地...");
    const cachedVideo = await videoCache.ensureVideoDownloaded(videoId, videoTitle);
    
    if (!cachedVideo || !fs.existsSync(cachedVideo.localPath)) {
      throw new Error("无法获取本地视频文件");
    }

    console.log("🎥 使用本地视频文件:", cachedVideo.fileName);

    // Process each timestamp
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      console.log(`📸 处理时间戳 ${i + 1}/${timestamps.length}: ${timestamp}秒`);
      
      try {
        const screenshotFilename = `screenshot_${videoId}_${timestamp}s_${nanoid(8)}.jpg`;
        const screenshotPath = path.join(screenshotsDir, screenshotFilename);
        
        // Generate screenshot using FFmpeg
        await generateScreenshotWithFFmpeg(cachedVideo.localPath, timestamp, screenshotPath);
        
        // Check if file was created successfully
        if (fs.existsSync(screenshotPath)) {
          const screenshotUrl = `/screenshots/${screenshotFilename}`;
          screenshotUrls.push(screenshotUrl);
          console.log(`✅ 时间戳 ${timestamp}s 截图已生成: ${screenshotFilename}`);
        } else {
          throw new Error("截图文件未生成");
        }
        
      } catch (error) {
        console.error(`❌ 生成时间戳 ${timestamp}s 的截图时出错:`, error instanceof Error ? error.message : String(error));
        
        // Fallback to YouTube thumbnail for this timestamp
        const fallbackUrl = await getFallbackThumbnail(videoId);
        screenshotUrls.push(fallbackUrl);
        console.log(`🔄 时间戳 ${timestamp}s 使用回退缩略图`);
      }
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

// 使用FFmpeg生成截图
async function generateScreenshotWithFFmpeg(
  videoPath: string, 
  timestamp: number, 
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timestamp) // 跳转到指定时间
      .frames(1) // 只提取一帧
      .size('1280x720') // 设置输出尺寸
      .output(outputPath)
      .outputOptions([
        '-q:v 2', // 设置JPEG质量 (1-31, 数值越小质量越好)
        '-f image2' // 指定输出格式为图片
      ])
      .on('end', () => {
        console.log(`📷 FFmpeg截图完成: ${timestamp}秒`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`❌ FFmpeg截图失败 ${timestamp}秒:`, err.message);
        reject(new Error(`FFmpeg截图失败: ${err.message}`));
      })
      .run();
  });
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

// 检查FFmpeg是否可用
export async function checkFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe('', (err) => {
      // 如果能调用ffprobe，说明FFmpeg可用
      resolve(!err || err.message.includes('Input #0'));
    });
  });
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
