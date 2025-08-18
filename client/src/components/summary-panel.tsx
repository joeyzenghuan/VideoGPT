import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle } from "lucide-react";
import { type VideoAnalysis, type SummarySegment } from "@/lib/types";

interface SummaryPanelProps {
  analysis: VideoAnalysis;
  onJumpToTime: (time: number) => void;
}

export function SummaryPanel({ analysis, onJumpToTime }: SummaryPanelProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (startTime: number, endTime: number): string => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleTimeClick = (time: number) => {
    onJumpToTime(time);
  };

  const handleSubtitleClick = (subtitle: { start: number }) => {
    onJumpToTime(subtitle.start);
  };

  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Summary header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800" data-testid="heading-summary">
              智能总结
            </h3>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 hover:bg-green-100"
                data-testid="badge-status"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                已完成
              </Badge>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-1" data-testid="text-summary-info">
            AI自动生成 • 共{analysis.summarySegments.length}个主题片段
          </p>
        </div>

        {/* Summary sections */}
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto" data-testid="summary-sections">
          {analysis.summarySegments.map((segment, index) => (
            <div 
              key={segment.id} 
              className={`p-6 ${index < analysis.summarySegments.length - 1 ? 'border-b border-slate-100' : ''}`}
              data-testid={`summary-segment-${index}`}
            >
              <div className="flex items-start space-x-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img 
                    src={segment.screenshotUrl || `https://img.youtube.com/vi/${analysis.videoId}/mqdefault.jpg`}
                    alt={`Video thumbnail at ${formatTime(segment.startTime)}`}
                    className="w-20 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleTimeClick(segment.startTime)}
                    data-testid={`img-thumbnail-${index}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Timestamp */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTimeClick(segment.startTime)}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full hover:bg-blue-100 transition-colors mb-3"
                    data-testid={`button-timestamp-${index}`}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {formatTimeRange(segment.startTime, segment.endTime)}
                  </Button>
                  
                  {/* AI Summary */}
                  <div className="mb-4">
                    <h4 className="font-medium text-slate-800 mb-2" data-testid={`text-segment-title-${index}`}>
                      {segment.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed" data-testid={`text-ai-summary-${index}`}>
                      {segment.aiSummary}
                    </p>
                  </div>
                  
                  {/* Original transcript */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2" data-testid={`heading-original-subtitles-${index}`}>
                      原始字幕
                    </h5>
                    <div className="space-y-1">
                      {segment.subtitles.map((subtitle, subIndex) => (
                        <p 
                          key={subIndex}
                          className="text-sm text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleSubtitleClick(subtitle)}
                          data-testid={`text-subtitle-${index}-${subIndex}`}
                        >
                          [{formatTime(subtitle.start)}] {subtitle.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
