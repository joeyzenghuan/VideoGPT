import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export async function generateVideoScreenshots(
  videoId: string,
  timestamps: number[]
): Promise<string[]> {
  const screenshotUrls: string[] = [];
  
  try {
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const filename = `${videoId}_${timestamp}_${Date.now()}.jpg`;
      const outputPath = path.join(screenshotsDir, filename);
      
      try {
        // Use youtube-dl or yt-dlp to download and extract frame
        const timeFormat = formatTimestamp(timestamp);
        
        // Note: This requires youtube-dl/yt-dlp and ffmpeg to be installed
        const command = `yt-dlp -f "best[height<=720]" --get-url "https://www.youtube.com/watch?v=${videoId}" | head -1 | xargs -I {} ffmpeg -ss ${timeFormat} -i "{}" -vframes 1 -q:v 2 "${outputPath}" -y`;
        
        await execAsync(command);
        
        // Check if file was created successfully
        if (fs.existsSync(outputPath)) {
          screenshotUrls.push(`/screenshots/${filename}`);
        } else {
          // Fallback to YouTube thumbnail with timestamp
          screenshotUrls.push(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
      } catch (error) {
        console.error(`Error generating screenshot for timestamp ${timestamp}:`, error);
        // Fallback to YouTube thumbnail
        screenshotUrls.push(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      }
    }
    
    return screenshotUrls;
  } catch (error) {
    console.error("Error in generateVideoScreenshots:", error);
    // Return fallback thumbnails
    return timestamps.map(() => `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
  }
}

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
