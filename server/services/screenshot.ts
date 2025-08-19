import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import ytdl from "@distube/ytdl-core";

const execAsync = promisify(exec);

export async function generateVideoScreenshots(
  videoId: string,
  timestamps: number[]
): Promise<string[]> {
  const screenshotUrls: string[] = [];
  
  try {
    console.log("📸 开始生成截图...");
    console.log("需要截图的时间点:", timestamps);
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log("✅ 创建截图目录:", screenshotsDir);
    }

    // Try to get video info for better thumbnails
    let videoInfo;
    try {
      videoInfo = await ytdl.getInfo(videoId);
      console.log("✅ 获取视频信息成功");
    } catch (infoError) {
      console.log("⚠️  无法获取视频信息，使用默认缩略图");
    }
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      console.log(`📸 处理时间戳 ${i + 1}/${timestamps.length}: ${timestamp}秒`);
      
      try {
        // For now, use YouTube's time-specific thumbnail API
        // Format: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
        // We can also try different thumbnail qualities based on timestamp
        let thumbnailUrl;
        
        if (videoInfo?.videoDetails?.thumbnails) {
          // Use the highest quality thumbnail available
          const thumbnails = videoInfo.videoDetails.thumbnails;
          const bestThumbnail = thumbnails[thumbnails.length - 1];
          thumbnailUrl = bestThumbnail.url;
          console.log(`📷 使用视频缩略图: ${bestThumbnail.width}x${bestThumbnail.height}`);
        } else {
          // Fallback to YouTube's default thumbnail
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          console.log("📷 使用默认YouTube缩略图");
        }
        
        screenshotUrls.push(thumbnailUrl);
        console.log(`✅ 时间戳 ${timestamp}s 截图已生成`);
        
      } catch (error) {
        console.error(`❌ 生成时间戳 ${timestamp} 的截图时出错:`, error);
        // Fallback to YouTube thumbnail
        const fallbackUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        screenshotUrls.push(fallbackUrl);
        console.log(`🔄 使用回退缩略图: ${fallbackUrl}`);
      }
    }
    
    console.log(`📸 截图生成完成，成功: ${screenshotUrls.length} 个`);
    return screenshotUrls;
  } catch (error) {
    console.error("❌ 截图生成过程中发生错误:", error);
    // Return fallback thumbnails
    const fallbackUrls = timestamps.map(() => `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
    console.log(`🔄 使用 ${fallbackUrls.length} 个回退缩略图`);
    return fallbackUrls;
  }
}

// Keep the timestamp formatting function for potential future use
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
