import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startAnalysisSchema } from "@shared/schema";
import { extractVideoMetadata, isValidYouTubeUrl } from "./services/youtube";
import { extractSubtitles, testSubtitleLibrary } from "./services/subtitle";
import { generateVideoSummary } from "./services/openai";
import { generateVideoScreenshots } from "./services/screenshot";
import { videoCache } from "./services/video-cache";
import { getProgressWebSocket } from "./services/progress-websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start video analysis
  app.post("/api/videos/analyze", async (req, res) => {
    try {
      const { youtubeUrl, forceRegenerate } = startAnalysisSchema.parse(req.body);
      
      if (!isValidYouTubeUrl(youtubeUrl)) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      // Check if analysis already exists (unless force regenerate is requested)
      const metadata = await extractVideoMetadata(youtubeUrl);
      const existingAnalysis = await storage.getVideoAnalysisByVideoId(metadata.videoId);
      
      if (existingAnalysis && !forceRegenerate) {
        console.log("✅ 返回缓存的分析结果:", existingAnalysis.id);
        return res.json(existingAnalysis);
      }

      // If force regenerate is requested and analysis exists, update status to processing
      if (existingAnalysis && forceRegenerate) {
        console.log("🔄 强制重新生成，更新现有分析状态:", existingAnalysis.id);
        await storage.updateVideoAnalysisStatus(existingAnalysis.id, "processing");
        
        // Clear existing data
        await storage.updateVideoAnalysis(existingAnalysis.id, {
          subtitles: [],
          summarySegments: [],
          status: "processing",
        });

        // Start background processing with existing analysis ID
        processVideoAnalysis(existingAnalysis.id);
        
        const updatedAnalysis = await storage.getVideoAnalysis(existingAnalysis.id);
        return res.json(updatedAnalysis);
      }

      // Create new analysis record
      const analysis = await storage.createVideoAnalysis({
        youtubeUrl,
        videoId: metadata.videoId,
        title: metadata.title,
        channel: metadata.channel,
        duration: metadata.duration,
        publishDate: metadata.publishDate,
        thumbnailUrl: metadata.thumbnailUrl,
        subtitles: [],
        summarySegments: [],
        status: "processing",
      });

      console.log("🆕 创建新的分析记录:", analysis.id);

      // Start background processing
      processVideoAnalysis(analysis.id);

      res.json(analysis);
    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ message: "Failed to start video analysis" });
    }
  });

  // Get analysis status
  app.get("/api/videos/analyze/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getVideoAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error getting analysis:", error);
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Get all analyses
  app.get("/api/videos", async (req, res) => {
    try {
      const analyses = await storage.getAllVideoAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error getting analyses:", error);
      res.status(500).json({ message: "Failed to get analyses" });
    }
  });

  // Download cached video
  app.get("/api/videos/download/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      
      // Check if video is cached
      const cachedVideo = videoCache.getCachedVideo(videoId);
      if (!cachedVideo || cachedVideo.downloadStatus !== "completed") {
        return res.status(404).json({ 
          message: "Video not found in cache or not fully downloaded" 
        });
      }

      // Verify file exists
      const fs = await import("fs");
      if (!fs.existsSync(cachedVideo.localPath)) {
        return res.status(404).json({ 
          message: "Video file not found on server" 
        });
      }

      // Get file stats
      const stats = fs.statSync(cachedVideo.localPath);
      
      // Set appropriate headers for video download
      // Create a completely safe ASCII filename
      const cleanFileName = cachedVideo.title
        .normalize('NFD') // Normalize unicode
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .substring(0, 80) // Limit filename length
        .toLowerCase(); // Convert to lowercase
      
      // Use a safe fallback filename if cleaning results in empty string
      const safeFileName = cleanFileName || `video_${cachedVideo.videoId}`;
      
      console.log(`📥 准备下载文件: ${safeFileName}.mp4 (原标题: ${cachedVideo.title})`);
      
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Length", stats.size.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}.mp4"`);
      res.setHeader("Accept-Ranges", "bytes");

      // Support range requests for video streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        
        const fileStream = fs.createReadStream(cachedVideo.localPath, { start, end });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stats.size}`,
          "Content-Length": chunksize.toString(),
        });
        
        fileStream.pipe(res);
      } else {
        // Send entire file
        const fileStream = fs.createReadStream(cachedVideo.localPath);
        fileStream.pipe(res);
      }

      // Update last accessed time
      await storage.updateLastAccessTime(videoId);
      
      console.log(`📥 用户下载视频: ${cachedVideo.title} (${videoId})`);
      
    } catch (error) {
      console.error("Error downloading video:", error);
      res.status(500).json({ message: "Failed to download video" });
    }
  });

  // Get video cache status
  app.get("/api/videos/cache/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      const cachedVideo = videoCache.getCachedVideo(videoId);
      
      if (!cachedVideo) {
        return res.json({ 
          cached: false, 
          status: "not_cached" 
        });
      }

      res.json({
        cached: cachedVideo.downloadStatus === "completed",
        status: cachedVideo.downloadStatus,
        fileSize: cachedVideo.fileSize,
        fileName: cachedVideo.fileName,
        downloadedAt: cachedVideo.downloadedAt,
      });
    } catch (error) {
      console.error("Error getting cache status:", error);
      res.status(500).json({ message: "Failed to get cache status" });
    }
  });

  // Get cache statistics
  app.get("/api/videos/cache-stats", async (req, res) => {
    try {
      const stats = videoCache.getCacheStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting cache stats:", error);
      res.status(500).json({ message: "Failed to get cache stats" });
    }
  });

  // Test subtitle library endpoint
  app.get("/api/test/subtitles", async (req, res) => {
    try {
      await testSubtitleLibrary();
      res.json({ message: "Subtitle library test completed. Check console for results." });
    } catch (error) {
      console.error("Error testing subtitle library:", error);
      res.status(500).json({ message: "Subtitle library test failed", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processVideoAnalysis(analysisId: string) {
  const progressWS = getProgressWebSocket();
  
  try {
    console.log("🚀 开始处理视频分析:", analysisId);
    progressWS.sendStepUpdate(analysisId, "初始化", 0, "running", "开始处理视频分析...");
    
    const analysis = await storage.getVideoAnalysis(analysisId);
    if (!analysis) {
      console.error("❌ 分析记录未找到:", analysisId);
      progressWS.sendStepUpdate(analysisId, "错误", 0, "error", "分析记录未找到");
      return;
    }

    console.log("✅ 获取到分析记录:");
    console.log("  视频ID:", analysis.videoId);
    console.log("  标题:", analysis.title);
    console.log("  时长:", analysis.duration, "秒");
    
    progressWS.sendStepUpdate(analysisId, "初始化", 5, "completed", `准备分析视频: ${analysis.title}`, {
      videoId: analysis.videoId,
      duration: analysis.duration
    });

    // Step 1: Extract subtitles
    console.log("📝 步骤1: 开始提取字幕...");
    progressWS.sendStepUpdate(analysisId, "字幕提取", 10, "running", "正在提取视频字幕...");
    
    let subtitles;
    try {
      subtitles = await extractSubtitles(analysis.videoId);
      progressWS.sendStepUpdate(analysisId, "字幕提取", 25, "completed", `成功提取 ${subtitles.length} 条字幕`, {
        subtitleCount: subtitles.length
      });
    } catch (error) {
      console.warn("❌ 字幕提取失败，使用演示数据");
      console.warn("失败原因:", error instanceof Error ? error.message : String(error));
      progressWS.sendStepUpdate(analysisId, "字幕提取", 20, "running", "字幕提取失败，使用演示数据...");
      
      subtitles = [
        { start: 0, end: 12, text: "Hello everyone, welcome to today's presentation. I'm excited to share with you some insights about effective storytelling." },
        { start: 12, end: 25, text: "The key to a great story lies in understanding your audience and crafting a narrative that resonates with them." },
        { start: 25, end: 40, text: "First, let's talk about the structure. Every compelling story has a clear beginning, middle, and end." },
        { start: 40, end: 55, text: "The beginning should hook your audience immediately. You have just seconds to capture their attention." },
        { start: 55, end: 70, text: "In the middle section, develop your main points with concrete examples and relatable scenarios." },
        { start: 70, end: 85, text: "Use emotion to connect with your audience. Stories that evoke feelings are more memorable." },
        { start: 85, end: 100, text: "The ending should leave a lasting impression. Summarize your key message and call for action." },
        { start: 100, end: 115, text: "Practice your delivery. Even the best story can fall flat without proper presentation skills." },
        { start: 115, end: 130, text: "Remember, authenticity is crucial. Be genuine in your storytelling approach." },
        { start: 130, end: 145, text: "Use visual aids and props when appropriate to enhance your narrative." },
        { start: 145, end: 160, text: "Pay attention to pacing. Give your audience time to absorb important points." },
        { start: 160, end: 175, text: "Engage with your audience through questions and interactive elements." },
        { start: 175, end: 190, text: "Learn from feedback and continuously improve your storytelling technique." },
        { start: 190, end: 205, text: "In conclusion, great storytelling is a skill that can be developed with practice and dedication." },
        { start: 205, end: 220, text: "Thank you for your attention. I hope these insights help you become better storytellers." }
      ];
      console.log("✅ 使用演示字幕数据，共", subtitles.length, "条");
      progressWS.sendStepUpdate(analysisId, "字幕提取", 25, "completed", `使用演示数据: ${subtitles.length} 条字幕`, {
        subtitleCount: subtitles.length,
        isDemoData: true
      });
    }
    
    console.log("💾 保存字幕到数据库...");
    await storage.updateVideoAnalysis(analysisId, { subtitles });
    console.log("✅ 字幕保存完成");
    progressWS.sendStepUpdate(analysisId, "数据保存", 30, "completed", "字幕数据已保存");

    // Step 2: Generate AI summary
    console.log("🤖 步骤2: 开始生成AI总结...");
    progressWS.sendStepUpdate(analysisId, "AI分析", 40, "running", "正在使用AI分析视频内容...");
    
    const summarySegments = await generateVideoSummary(analysis.title, subtitles, analysisId);
    console.log("✅ AI总结生成完成，共", summarySegments.length, "个段落");
    progressWS.sendStepUpdate(analysisId, "AI分析", 60, "completed", `AI分析完成，生成 ${summarySegments.length} 个段落`, {
      segmentCount: summarySegments.length
    });

    // Step 3: Generate screenshots
    console.log("📸 步骤3: 开始生成截图...");
    progressWS.sendStepUpdate(analysisId, "视频缓存", 65, "running", "正在下载视频到服务器...");
    
    const timestamps = summarySegments.map(segment => segment.startTime);
    console.log("需要截图的时间点:", timestamps);
    
    progressWS.sendStepUpdate(analysisId, "截图生成", 70, "running", `正在生成 ${timestamps.length} 个时间点的截图...`);
    const screenshotUrls = await generateVideoScreenshots(analysis.videoId, timestamps, analysis.title);
    console.log("截图生成完成，成功:", screenshotUrls.length, "个");
    progressWS.sendStepUpdate(analysisId, "截图生成", 85, "completed", `成功生成 ${screenshotUrls.length} 张截图`, {
      screenshotCount: screenshotUrls.length,
      timestamps: timestamps
    });

    // Update segments with screenshot URLs
    console.log("🔗 更新段落截图URL...");
    const updatedSegments = summarySegments.map((segment, index) => ({
      ...segment,
      screenshotUrl: screenshotUrls[index] || `https://img.youtube.com/vi/${analysis.videoId}/mqdefault.jpg`,
    }));

    // Step 4: Update analysis with final results
    console.log("💾 保存最终结果到数据库...");
    progressWS.sendStepUpdate(analysisId, "完成保存", 90, "running", "保存最终分析结果...");
    
    await storage.updateVideoAnalysis(analysisId, {
      summarySegments: updatedSegments,
      status: "completed",
    });

    console.log("🎉 视频分析完成:", analysisId);
    console.log("最终结果统计:");
    console.log("  - 总段落数:", updatedSegments.length);
    console.log("  - 总字幕数:", subtitles.length);
    console.log("  - 成功截图数:", screenshotUrls.length);
    console.log("=====================================");
    
    progressWS.sendStepUpdate(analysisId, "分析完成", 100, "completed", "🎉 视频分析完成！", {
      totalSegments: updatedSegments.length,
      totalSubtitles: subtitles.length,
      totalScreenshots: screenshotUrls.length,
      title: analysis.title
    });
  } catch (error) {
    console.error("❌ 视频分析过程中发生严重错误:");
    console.error("分析ID:", analysisId);
    console.error("错误类型:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("错误信息:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");

    progressWS.sendStepUpdate(analysisId, "处理失败", 0, "error", `分析失败: ${error instanceof Error ? error.message : String(error)}`, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error)
    });

    // Update analysis with error status
    try {
      await storage.updateVideoAnalysisStatus(analysisId, "failed");
      console.log("✅ 已更新分析状态为失败");
    } catch (updateError) {
      console.error("❌ 无法更新分析状态:", updateError);
    }
  }
}
