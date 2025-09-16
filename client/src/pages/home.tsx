import { useRef, useState } from "react";
import { type VideoAnalysis } from "@/lib/types";
import { Header } from "@/components/header";
import { UrlInput } from "@/components/url-input";
import { VideoPlayer } from "@/components/video-player";
import { SummaryPanel } from "@/components/summary-panel";
import { FloatingActions } from "@/components/floating-actions";
import { useVideoAnalysis } from "@/hooks/use-video-analysis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SimpleAnalysisProgress } from "@/components/simple-analysis-progress";

export default function Home() {
  const { 
    analysisState, 
    analysisData, 
    isLoading, 
    startAnalysis, 
    startNewAnalysis, 
    error,
    showProgress, 
    currentAnalysisId, 
    handleProgressComplete 
  } = useVideoAnalysis();
  const [currentTime, setCurrentTime] = useState(0);
  const videoPlayerRef = useRef<{ jumpToTime: (time: number) => void }>(null);

  const handleStartAnalysis = (url: string, forceRegenerate?: boolean) => {
    startAnalysis(url, forceRegenerate);
  };

  const handleJumpToTime = (time: number) => {
    setCurrentTime(time);
    // In a real implementation, this would control the YouTube player
    if (videoPlayerRef.current?.jumpToTime) {
      videoPlayerRef.current.jumpToTime(time);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error state */}
        {analysisState === "error" && (
          <div className="mb-8">
            <Alert variant="destructive" data-testid="alert-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || "分析视频时出现错误，请检查URL是否正确或稍后重试。"}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* URL Input Section */}
        {analysisState === "input" && (
          <UrlInput onStartAnalysis={handleStartAnalysis} isLoading={isLoading} />
        )}

        {/* Progress Display */}
        {analysisState === "loading" && (
          <SimpleAnalysisProgress 
            analysisId={currentAnalysisId || 'default'} 
            isVisible={true}
            onComplete={handleProgressComplete}
          />
        )}

        {/* Main Interface */}
        {analysisState === "ready" && analysisData && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" data-testid="main-interface">
            <VideoPlayer
              ref={videoPlayerRef}
              analysis={analysisData as VideoAnalysis}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
            />
            <SummaryPanel
              analysis={analysisData as VideoAnalysis}
              onJumpToTime={handleJumpToTime}
            />
          </div>
        )}

        {/* Floating Actions */}
        {analysisState === "ready" && <FloatingActions />}

        {/* Back to Input Button for completed/error states */}
        {(analysisState === "ready" || analysisState === "error") && (
          <div className="fixed top-20 right-6 z-40">
            <button
              onClick={startNewAnalysis}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              data-testid="button-new-analysis"
            >
              分析新视频
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
