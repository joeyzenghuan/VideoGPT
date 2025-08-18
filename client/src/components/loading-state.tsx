import { CheckCircle, Clock, Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2" data-testid="heading-processing">
            正在处理视频...
          </h3>
          <div className="max-w-md mx-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600" data-testid="text-extract-info">提取视频信息</span>
                <CheckCircle className="w-4 h-4 text-green-500" data-testid="icon-check-info" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600" data-testid="text-download-subtitles">下载字幕文件</span>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" data-testid="icon-loading-subtitles" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span data-testid="text-ai-summary">AI智能总结</span>
                <Clock className="w-4 h-4" data-testid="icon-clock-summary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
