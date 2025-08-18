import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startAnalysisSchema } from "@shared/schema";
import { extractVideoMetadata, isValidYouTubeUrl } from "./services/youtube";
import { extractSubtitles } from "./services/subtitle";
import { generateVideoSummary } from "./services/openai";
import { generateVideoScreenshots } from "./services/screenshot";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start video analysis
  app.post("/api/videos/analyze", async (req, res) => {
    try {
      const { youtubeUrl } = startAnalysisSchema.parse(req.body);
      
      if (!isValidYouTubeUrl(youtubeUrl)) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      // Check if analysis already exists
      const metadata = await extractVideoMetadata(youtubeUrl);
      const existingAnalysis = await storage.getVideoAnalysisByVideoId(metadata.videoId);
      
      if (existingAnalysis) {
        return res.json(existingAnalysis);
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

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processVideoAnalysis(analysisId: string) {
  try {
    const analysis = await storage.getVideoAnalysis(analysisId);
    if (!analysis) {
      console.error("Analysis not found:", analysisId);
      return;
    }

    // Step 1: Extract subtitles
    console.log("Extracting subtitles for video:", analysis.videoId);
    const subtitles = await extractSubtitles(analysis.videoId);
    
    await storage.updateVideoAnalysis(analysisId, { subtitles });

    // Step 2: Generate AI summary
    console.log("Generating AI summary for video:", analysis.videoId);
    const summarySegments = await generateVideoSummary(analysis.title, subtitles);

    // Step 3: Generate screenshots
    console.log("Generating screenshots for video:", analysis.videoId);
    const timestamps = summarySegments.map(segment => segment.startTime);
    const screenshotUrls = await generateVideoScreenshots(analysis.videoId, timestamps);

    // Update segments with screenshot URLs
    const updatedSegments = summarySegments.map((segment, index) => ({
      ...segment,
      screenshotUrl: screenshotUrls[index] || `https://img.youtube.com/vi/${analysis.videoId}/mqdefault.jpg`,
    }));

    // Step 4: Update analysis with final results
    await storage.updateVideoAnalysis(analysisId, {
      summarySegments: updatedSegments,
      status: "completed",
    });

    console.log("Video analysis completed:", analysisId);
  } catch (error) {
    console.error("Error processing video analysis:", error);
    await storage.updateVideoAnalysisStatus(analysisId, "failed");
  }
}
