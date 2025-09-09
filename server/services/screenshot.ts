import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import ytdl from "@distube/ytdl-core";
import { nanoid } from "nanoid";

const execAsync = promisify(exec);

export async function generateVideoScreenshots(
  videoId: string,
  timestamps: number[]
): Promise<string[]> {
  const screenshotUrls: string[] = [];
  
  try {
    console.log("📸 开始生成真实视频截图...");
    console.log("需要截图的时间点:", timestamps);
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log("✅ 创建截图目录:", screenshotsDir);
    }

    // Get video stream URL
    let videoInfo;
    let videoUrl;
    
    try {
      videoInfo = await ytdl.getInfo(videoId);
      console.log("✅ 获取视频信息成功");
      
      // Get the best quality video format
      const formats = ytdl.filterFormats(videoInfo.formats, 'video');
      if (formats.length === 0) {
        throw new Error("没有找到可用的视频格式");
      }
      
      // Choose the best quality format
      const bestFormat = formats.reduce((best, current) => {
        const bestHeight = parseInt(String(best.height || '0'));
        const currentHeight = parseInt(String(current.height || '0'));
        return currentHeight > bestHeight ? current : best;
      });
      
      videoUrl = bestFormat.url;
      console.log(`📹 使用视频格式: ${bestFormat.qualityLabel || bestFormat.quality}`);
      
    } catch (infoError) {
      console.error("❌ 无法获取视频信息:", infoError);
      throw new Error("无法获取视频流，请检查视频ID是否有效");
    }
    
    // Generate screenshots for each timestamp
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      console.log(`📸 处理时间戳 ${i + 1}/${timestamps.length}: ${timestamp}秒`);
      
      let success = false;
      let retryCount = 0;
      const maxRetries = 0;
      
      while (!success && retryCount <= maxRetries) {
        try {
          const screenshotFilename = `screenshot_${videoId}_${timestamp}s_${nanoid(8)}.jpg`;
          const screenshotPath = path.join(screenshotsDir, screenshotFilename);
          
          // Use FFmpeg to extract screenshot at specific timestamp
          // 优化：添加更多参数以提高成功率和速度
          const ffmpegCommand = `ffmpeg -i "${videoUrl}" -ss ${timestamp} -frames:v 1 -q:v 2 -vf scale=640:360 "${screenshotPath}" -y`;
          
          if (retryCount > 0) {
            console.log(`🔄 第 ${retryCount + 1} 次尝试截取第 ${timestamp} 秒的画面...`);
          } else {
            console.log(`🎬 执行FFmpeg命令截取第 ${timestamp} 秒的画面...`);
          }
          
          await execAsync(ffmpegCommand, { timeout: 45000 }); // 45秒超时，平衡速度和成功率
          
          // Check if file was created successfully
          if (fs.existsSync(screenshotPath)) {
            const screenshotUrl = `/screenshots/${screenshotFilename}`;
            screenshotUrls.push(screenshotUrl);
            console.log(`✅ 时间戳 ${timestamp}s 真实截图已生成: ${screenshotFilename}`);
            success = true;
          } else {
            throw new Error("截图文件未生成");
          }
          
        } catch (error) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.log(`⚠️  时间戳 ${timestamp}s 第 ${retryCount} 次尝试失败，准备重试...`);
            // 短暂等待后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.error(`❌ 时间戳 ${timestamp}s 经过 ${maxRetries + 1} 次尝试仍然失败:`, error instanceof Error ? error.message : String(error));
            
            // Fallback to YouTube thumbnail for this timestamp
            const fallbackUrl = await getFallbackThumbnail(videoId, videoInfo);
            screenshotUrls.push(fallbackUrl);
            console.log(`🔄 时间戳 ${timestamp}s 使用回退缩略图`);
          }
        }
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

// 获取回退缩略图
async function getFallbackThumbnail(videoId: string, videoInfo?: any): Promise<string> {
  try {
    if (videoInfo?.videoDetails?.thumbnails) {
      const thumbnails = videoInfo.videoDetails.thumbnails;
      const bestThumbnail = thumbnails[thumbnails.length - 1];
      return bestThumbnail.url;
    }
  } catch (error) {
    console.log("⚠️  无法使用视频缩略图，使用默认缩略图");
  }
  
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// 检查FFmpeg是否可用
export async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
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
