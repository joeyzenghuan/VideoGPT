import { type User, type InsertUser, type VideoAnalysis, type InsertVideoAnalysis, type SubtitleSegment, type SummarySegment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getVideoAnalysis(id: string): Promise<VideoAnalysis | undefined>;
  getVideoAnalysisByVideoId(videoId: string): Promise<VideoAnalysis | undefined>;
  createVideoAnalysis(analysis: InsertVideoAnalysis): Promise<VideoAnalysis>;
  updateVideoAnalysisStatus(id: string, status: string): Promise<void>;
  updateVideoAnalysis(id: string, analysis: Partial<VideoAnalysis>): Promise<VideoAnalysis | undefined>;
  getAllVideoAnalyses(): Promise<VideoAnalysis[]>;
  
  // Video cache operations
  updateVideoCacheStatus(videoId: string, status: string, localPath?: string, fileSize?: number): Promise<void>;
  getCachedVideos(): Promise<VideoAnalysis[]>;
  updateLastAccessTime(videoId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private videoAnalyses: Map<string, VideoAnalysis>;

  constructor() {
    this.users = new Map();
    this.videoAnalyses = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getVideoAnalysis(id: string): Promise<VideoAnalysis | undefined> {
    return this.videoAnalyses.get(id);
  }

  async getVideoAnalysisByVideoId(videoId: string): Promise<VideoAnalysis | undefined> {
    return Array.from(this.videoAnalyses.values()).find(
      (analysis) => analysis.videoId === videoId,
    );
  }

  async createVideoAnalysis(insertAnalysis: InsertVideoAnalysis): Promise<VideoAnalysis> {
    const id = randomUUID();
    const analysis: VideoAnalysis = {
      id,
      youtubeUrl: insertAnalysis.youtubeUrl,
      videoId: insertAnalysis.videoId,
      title: insertAnalysis.title,
      channel: insertAnalysis.channel,
      duration: insertAnalysis.duration,
      publishDate: insertAnalysis.publishDate,
      thumbnailUrl: insertAnalysis.thumbnailUrl || null,
      subtitles: (insertAnalysis.subtitles as SubtitleSegment[]) || [],
      summarySegments: (insertAnalysis.summarySegments as SummarySegment[]) || [],
      status: insertAnalysis.status || "processing",
      localVideoPath: null,
      videoFileSize: null,
      videoCacheStatus: "not_cached",
      lastAccessedAt: null,
      createdAt: new Date(),
    };
    this.videoAnalyses.set(id, analysis);
    return analysis;
  }

  async updateVideoAnalysisStatus(id: string, status: string): Promise<void> {
    const analysis = this.videoAnalyses.get(id);
    if (analysis) {
      analysis.status = status;
      this.videoAnalyses.set(id, analysis);
    }
  }

  async updateVideoAnalysis(id: string, updates: Partial<VideoAnalysis>): Promise<VideoAnalysis | undefined> {
    const analysis = this.videoAnalyses.get(id);
    if (analysis) {
      const updated = { ...analysis, ...updates };
      this.videoAnalyses.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getAllVideoAnalyses(): Promise<VideoAnalysis[]> {
    const videos: VideoAnalysis[] = [];
    this.videoAnalyses.forEach(video => videos.push(video));
    return videos;
  }

  async updateVideoCacheStatus(videoId: string, status: string, localPath?: string, fileSize?: number): Promise<void> {
    this.videoAnalyses.forEach((analysis, id) => {
      if (analysis.videoId === videoId) {
        analysis.videoCacheStatus = status;
        if (localPath) analysis.localVideoPath = localPath;
        if (fileSize) analysis.videoFileSize = fileSize;
        this.videoAnalyses.set(id, analysis);
      }
    });
  }

  async getCachedVideos(): Promise<VideoAnalysis[]> {
    const cachedVideos: VideoAnalysis[] = [];
    this.videoAnalyses.forEach(analysis => {
      if (analysis.videoCacheStatus === "cached") {
        cachedVideos.push(analysis);
      }
    });
    return cachedVideos;
  }

  async updateLastAccessTime(videoId: string): Promise<void> {
    this.videoAnalyses.forEach((analysis, id) => {
      if (analysis.videoId === videoId) {
        analysis.lastAccessedAt = new Date();
        this.videoAnalyses.set(id, analysis);
      }
    });
  }
}

export const storage = new MemStorage();
