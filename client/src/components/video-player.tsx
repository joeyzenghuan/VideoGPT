import React from "react";
import { type VideoAnalysis } from "@/lib/types";

interface VideoPlayerProps {
  analysis: VideoAnalysis;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer = React.forwardRef<{ jumpToTime: (time: number) => void }, VideoPlayerProps>(
  ({ analysis, currentTime, onTimeUpdate }, ref) => {

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

  const jumpToTime = (time: number) => {
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
          
          {/* Video overlay controls - only show YouTube button */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
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
              YouTube
            </a>
          </div>
        </div>
        
        {/* Video info */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Left side - Video thumbnail and basic info */}
            <div className="flex items-start gap-4">
              <img 
                src={analysis.thumbnailUrl}
                alt={analysis.title}
                className="w-32 h-24 rounded-lg object-cover shadow-sm border border-slate-200 flex-shrink-0"
                data-testid="img-video-thumbnail"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-slate-800 mb-2" data-testid="text-video-title">
                  {analysis.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-4">
                  <span data-testid="text-video-channel">{analysis.channel}</span>
                  <span>•</span>
                  <span data-testid="text-video-duration">{formatTime(analysis.duration)}</span>
                  <span>•</span>
                  <span data-testid="text-video-publish-date">{formatDate(analysis.publishDate)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Usage instructions - now below video */}
          <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
              💡 如何使用这个智能总结
            </h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                <span>点击右侧时间段可跳转到相应内容</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                <span>点击字幕文本也可快速定位</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                <span>如果视频无法播放，点击右上角按钮在YouTube观看</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
