import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Maximize } from "lucide-react";
import { type VideoAnalysis } from "@/lib/types";

interface VideoPlayerProps {
  analysis: VideoAnalysis;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer = React.forwardRef<{ jumpToTime: (time: number) => void }, VideoPlayerProps>(
  ({ analysis, currentTime, onTimeUpdate }, ref) => {

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control the actual video player
  };

  const jumpToTime = (time: number) => {
    // Update progress bar
    setProgress((time / analysis.duration) * 100);
    onTimeUpdate?.(time);
    
    // Try to communicate with YouTube iframe to jump to time
    const iframe = document.querySelector('iframe[data-testid="youtube-iframe"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.src = `https://www.youtube.com/embed/${analysis.videoId}?enablejsapi=1&autoplay=1&start=${Math.floor(time)}&rel=0&modestbranding=1`;
      } catch (error) {
        console.log('Could not control iframe, opening in new tab');
        window.open(`${analysis.youtubeUrl}&t=${Math.floor(time)}s`, '_blank');
      }
    }
  };

  // Expose jumpToTime function to parent
  React.useImperativeHandle(ref, () => ({
    jumpToTime
  }));

  return (
    <div className="lg:col-span-3">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="aspect-video bg-black relative" data-testid="video-player-container">
          {/* YouTube Player Embed */}
          <iframe
            src={`https://www.youtube.com/embed/${analysis.videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            data-testid="youtube-iframe"
            title={analysis.title}
          />
          
          {/* Video overlay with direct YouTube link */}
          <div className="absolute top-4 right-4 z-10">
            <a 
              href={analysis.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1"
              data-testid="link-open-youtube"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              在YouTube观看
            </a>
          </div>
          
          {/* Help overlay - only shows when iframe might be blocked */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm" data-testid="video-overlay">
            <div className="text-center text-white max-w-lg p-8">
              <img 
                src={analysis.thumbnailUrl}
                alt={analysis.title}
                className="w-40 h-30 mx-auto mb-6 rounded-xl object-cover shadow-xl border border-slate-600"
                data-testid="img-video-thumbnail"
              />
              <h3 className="text-xl font-semibold mb-3 text-slate-100" data-testid="text-video-title-overlay">
                {analysis.title}
              </h3>
              <p className="text-sm text-slate-300 mb-2">
                频道: {analysis.channel} • 时长: {Math.floor(analysis.duration / 60)}:{(analysis.duration % 60).toString().padStart(2, '0')}
              </p>
              
              <div className="bg-slate-800/80 rounded-lg p-4 mb-6 text-left">
                <h4 className="text-sm font-medium text-slate-200 mb-2">💡 如何使用:</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• 点击右侧时间段可跳转到相应内容</li>
                  <li>• 点击字幕文本也可快速定位</li>
                  <li>• 如果视频无法播放，点击下方按钮在YouTube观看</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href={analysis.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  data-testid="button-watch-on-youtube"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  在YouTube观看
                </a>
                <button 
                  onClick={() => {
                    const overlay = document.querySelector('[data-testid="video-overlay"]') as HTMLElement;
                    if (overlay) overlay.style.display = 'none';
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  data-testid="button-hide-overlay"
                >
                  隐藏覆盖层
                </button>
              </div>
            </div>
          </div>
          
          {/* Custom controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-4 text-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:text-blue-400 transition-colors p-0"
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <div className="flex-1 flex items-center space-x-2">
                <span className="text-sm" data-testid="text-current-time">
                  {formatTime(currentTime || 0)}
                </span>
                <div className="flex-1 h-1 bg-white/30 rounded-full">
                  <div 
                    className="h-full bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    data-testid="progress-bar"
                  />
                </div>
                <span className="text-sm" data-testid="text-total-duration">
                  {formatTime(analysis.duration)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-blue-400 transition-colors p-0"
                data-testid="button-volume"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-blue-400 transition-colors p-0"
                data-testid="button-fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Video info */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2" data-testid="text-video-title">
            {analysis.title}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <span data-testid="text-video-channel">{analysis.channel}</span>
            <span>•</span>
            <span data-testid="text-video-duration">{formatTime(analysis.duration)}</span>
            <span>•</span>
            <span data-testid="text-video-publish-date">{formatDate(analysis.publishDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
