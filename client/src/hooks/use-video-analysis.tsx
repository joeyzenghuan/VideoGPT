import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type VideoAnalysis, type AnalysisState } from "@/lib/types";

export function useVideoAnalysis() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("input");

  const startAnalysisMutation = useMutation({
    mutationFn: async ({ youtubeUrl, forceRegenerate }: { youtubeUrl: string; forceRegenerate?: boolean }) => {
      const response = await apiRequest("POST", "/api/videos/analyze", { 
        youtubeUrl,
        forceRegenerate: forceRegenerate || false
      });
      return response.json() as Promise<VideoAnalysis>;
    },
    onSuccess: (data) => {
      setCurrentAnalysisId(data.id);
      setAnalysisState("loading");
    },
    onError: () => {
      setAnalysisState("error");
    },
  });

  const { data: analysisData, isLoading } = useQuery<VideoAnalysis>({
    queryKey: ["/api/videos/analyze", currentAnalysisId],
    enabled: !!currentAnalysisId,
    refetchInterval: (query) => {
      const data = query.state.data as VideoAnalysis | undefined;
      // Stop polling when analysis is completed or failed
      if (data?.status === "completed" || data?.status === "failed") {
        if (data.status === "completed") {
          setAnalysisState("ready");
        } else {
          setAnalysisState("error");
        }
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  const startNewAnalysis = () => {
    setCurrentAnalysisId(null);
    setAnalysisState("input");
  };

  const startAnalysis = (youtubeUrl: string, forceRegenerate?: boolean) => {
    startAnalysisMutation.mutate({ youtubeUrl, forceRegenerate });
  };

  return {
    analysisState,
    analysisData,
    isLoading: startAnalysisMutation.isPending || isLoading,
    startAnalysis,
    startNewAnalysis,
    error: startAnalysisMutation.error,
  };
}
