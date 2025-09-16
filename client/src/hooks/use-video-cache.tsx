import { useState, useEffect } from "react";

export interface VideoCacheInfo {
  cached: boolean;
  status: "not_cached" | "caching" | "cached" | "failed";
  fileSize?: number;
  fileName?: string;
  downloadedAt?: string;
}

export function useVideoCache(videoId: string) {
  const [cacheInfo, setCacheInfo] = useState<VideoCacheInfo>({
    cached: false,
    status: "not_cached"
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchCacheStatus = async () => {
    try {
      const response = await fetch(`/api/videos/cache/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setCacheInfo(data);
      }
    } catch (error) {
      console.error("获取缓存状态失败:", error);
    }
  };

  const downloadVideo = async () => {
    if (isDownloading || !cacheInfo.cached) return;
    
    setIsDownloading(true);
    try {
      // 创建下载链接
      const downloadUrl = `/api/videos/download/${videoId}`;
      
      // 创建临时链接并点击下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = ''; // 让服务器设置文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("视频下载开始");
    } catch (error) {
      console.error("下载视频失败:", error);
      alert("下载失败，请稍后重试");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchCacheStatus();
    // 每30秒检查一次缓存状态
    const interval = setInterval(fetchCacheStatus, 30000);
    return () => clearInterval(interval);
  }, [videoId]);

  return {
    cacheInfo,
    isDownloading,
    downloadVideo,
    refreshCacheStatus: fetchCacheStatus
  };
}