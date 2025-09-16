import path from "path";
import fs from "fs";
import { promisify } from "util";
import { pipeline } from "stream";
import ytdl from "@distube/ytdl-core";
import { nanoid } from "nanoid";

const pipelineAsync = promisify(pipeline);

export interface CachedVideo {
  videoId: string;
  title: string;
  localPath: string;
  fileName: string;
  fileSize: number;
  downloadedAt: Date;
  lastAccessedAt: Date;
  downloadStatus: "pending" | "downloading" | "completed" | "failed";
}

export class VideoCache {
  private cacheDir: string;
  private cachedVideos = new Map<string, CachedVideo>();

  constructor() {
    this.cacheDir = path.join(process.cwd(), "cached-videos");
    this.ensureCacheDir();
    this.loadCacheIndex();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log("✅ 创建视频缓存目录:", this.cacheDir);
    }
  }

  private getCacheIndexPath(): string {
    return path.join(this.cacheDir, "cache-index.json");
  }

  private loadCacheIndex(): void {
    try {
      const indexPath = this.getCacheIndexPath();
      if (fs.existsSync(indexPath)) {
        const data = fs.readFileSync(indexPath, 'utf-8');
        const index = JSON.parse(data);
        
        for (const [videoId, cachedVideo] of Object.entries(index)) {
          const video = cachedVideo as any;
          // 验证缓存文件是否仍然存在
          if (fs.existsSync(video.localPath)) {
            this.cachedVideos.set(videoId, {
              ...video,
              downloadedAt: new Date(video.downloadedAt),
              lastAccessedAt: new Date(video.lastAccessedAt),
            });
          }
        }
        console.log(`📁 加载了 ${this.cachedVideos.size} 个缓存视频`);
      }
    } catch (error) {
      console.warn("⚠️ 无法加载缓存索引:", error);
    }
  }

  private saveCacheIndex(): void {
    try {
      const indexPath = this.getCacheIndexPath();
      const index: Record<string, any> = {};
      
      this.cachedVideos.forEach((cachedVideo, videoId) => {
        index[videoId] = cachedVideo;
      });
      
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error("❌ 保存缓存索引失败:", error);
    }
  }

  public isVideoCached(videoId: string): boolean {
    const cached = this.cachedVideos.get(videoId);
    if (!cached) return false;
    
    // 验证文件是否仍然存在
    if (!fs.existsSync(cached.localPath)) {
      this.cachedVideos.delete(videoId);
      this.saveCacheIndex();
      return false;
    }
    
    return cached.downloadStatus === "completed";
  }

  public getCachedVideo(videoId: string): CachedVideo | undefined {
    const cached = this.cachedVideos.get(videoId);
    if (cached) {
      // 更新最后访问时间
      cached.lastAccessedAt = new Date();
      this.saveCacheIndex();
    }
    return cached;
  }

  public async downloadVideo(videoId: string, title: string): Promise<CachedVideo> {
    console.log(`🎥 开始下载视频: ${videoId} - ${title}`);
    
    // 检查是否已在下载中
    const existing = this.cachedVideos.get(videoId);
    if (existing && existing.downloadStatus === "downloading") {
      throw new Error("视频正在下载中");
    }

    // 生成唯一的文件名
    const fileName = `${videoId}_${nanoid(8)}.mp4`;
    const localPath = path.join(this.cacheDir, fileName);

    // 创建缓存记录
    const cachedVideo: CachedVideo = {
      videoId,
      title,
      localPath,
      fileName,
      fileSize: 0,
      downloadedAt: new Date(),
      lastAccessedAt: new Date(),
      downloadStatus: "downloading",
    };

    this.cachedVideos.set(videoId, cachedVideo);
    this.saveCacheIndex();

    try {
      // 获取视频信息选择最佳质量
      const info = await ytdl.getInfo(videoId);
      const format = ytdl.chooseFormat(info.formats, { 
        quality: 'highestvideo',
        filter: format => format.hasVideo && format.hasAudio,
      });

      console.log(`📥 开始下载，格式: ${format.qualityLabel}, 大小: ${format.contentLength ? (parseInt(format.contentLength) / 1024 / 1024).toFixed(1) + 'MB' : '未知'}`);

      // 下载视频流
      const videoStream = ytdl(videoId, { format });
      const writeStream = fs.createWriteStream(localPath);

      // 监听下载进度
      let downloadedBytes = 0;
      const totalBytes = format.contentLength ? parseInt(format.contentLength) : 0;

      videoStream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\r📥 下载进度: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(1)}MB/${(totalBytes / 1024 / 1024).toFixed(1)}MB)`);
        }
      });

      // 执行下载
      await pipelineAsync(videoStream, writeStream);
      
      console.log(`\n✅ 视频下载完成: ${fileName}`);

      // 获取文件大小
      const stats = fs.statSync(localPath);
      cachedVideo.fileSize = stats.size;
      cachedVideo.downloadStatus = "completed";
      
      this.cachedVideos.set(videoId, cachedVideo);
      this.saveCacheIndex();

      return cachedVideo;

    } catch (error) {
      console.error(`❌ 视频下载失败: ${videoId}`, error);
      
      // 清理失败的下载文件
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      
      cachedVideo.downloadStatus = "failed";
      this.cachedVideos.set(videoId, cachedVideo);
      this.saveCacheIndex();
      
      throw new Error(`视频下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async ensureVideoDownloaded(videoId: string, title: string): Promise<CachedVideo> {
    // 检查是否已缓存
    if (this.isVideoCached(videoId)) {
      console.log(`📁 使用缓存视频: ${videoId}`);
      return this.getCachedVideo(videoId)!;
    }

    // 下载视频
    return await this.downloadVideo(videoId, title);
  }

  public getAllCachedVideos(): CachedVideo[] {
    const videos: CachedVideo[] = [];
    this.cachedVideos.forEach(video => videos.push(video));
    return videos;
  }

  public getTotalCacheSize(): number {
    let total = 0;
    this.cachedVideos.forEach(video => {
      total += video.fileSize;
    });
    return total;
  }

  public cleanupOldVideos(maxAgeHours: number = 24, maxSizeGB: number = 10): void {
    console.log("🧹 开始清理缓存视频...");
    
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;
    
    // 按最后访问时间排序
    const sortedVideos: CachedVideo[] = [];
    this.cachedVideos.forEach(video => sortedVideos.push(video));
    sortedVideos.sort((a, b) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime());

    let totalSize = this.getTotalCacheSize();
    let deletedCount = 0;

    for (const video of sortedVideos) {
      const shouldDelete = 
        video.lastAccessedAt.getTime() < cutoffTime || // 超过时间限制
        totalSize > maxSizeBytes; // 超过大小限制

      if (shouldDelete) {
        try {
          if (fs.existsSync(video.localPath)) {
            fs.unlinkSync(video.localPath);
          }
          this.cachedVideos.delete(video.videoId);
          totalSize -= video.fileSize;
          deletedCount++;
          console.log(`🗑️ 删除缓存视频: ${video.fileName}`);
        } catch (error) {
          console.error(`❌ 删除缓存视频失败: ${video.fileName}`, error);
        }
      }
    }

    if (deletedCount > 0) {
      this.saveCacheIndex();
      console.log(`🧹 清理完成，删除了 ${deletedCount} 个视频，释放 ${(totalSize / 1024 / 1024).toFixed(1)}MB 空间`);
    } else {
      console.log("🧹 无需清理缓存");
    }
  }

  public deleteVideo(videoId: string): boolean {
    const video = this.cachedVideos.get(videoId);
    if (!video) return false;

    try {
      if (fs.existsSync(video.localPath)) {
        fs.unlinkSync(video.localPath);
      }
      this.cachedVideos.delete(videoId);
      this.saveCacheIndex();
      console.log(`🗑️ 删除缓存视频: ${video.fileName}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除缓存视频失败: ${video.fileName}`, error);
      return false;
    }
  }

  public getCacheStats() {
    const videos = this.getAllCachedVideos();
    const totalSize = this.getTotalCacheSize();
    
    return {
      count: videos.length,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(1),
      completedCount: videos.filter(v => v.downloadStatus === "completed").length,
      failedCount: videos.filter(v => v.downloadStatus === "failed").length,
      downloadingCount: videos.filter(v => v.downloadStatus === "downloading").length,
    };
  }
}

// 创建全局实例
export const videoCache = new VideoCache();

// 定期清理缓存（每小时检查一次）
setInterval(() => {
  videoCache.cleanupOldVideos(24, 10); // 24小时，10GB
}, 60 * 60 * 1000);