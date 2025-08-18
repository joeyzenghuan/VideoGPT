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
    // In a real implementation, this would seek the video to the specified time
    setProgress((time / analysis.duration) * 100);
    onTimeUpdate?.(time);
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
            src={`https://www.youtube.com/embed/${analysis.videoId}?enablejsapi=1&origin=${window.location.origin}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="youtube-iframe"
          />
          
          {/* Fallback player UI if iframe fails */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-center text-white">
              <svg 
                className="w-16 h-16 mx-auto mb-4 opacity-50" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <p className="text-lg opacity-75" data-testid="text-video-player">视频播放器</p>
              <p className="text-sm opacity-50" data-testid="text-click-timestamp">点击右侧总结中的时间戳跳转</p>
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
