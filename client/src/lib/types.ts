export interface VideoMetadata {
  videoId: string;
  title: string;
  channel: string;
  duration: number;
  publishDate: string;
  thumbnailUrl: string;
}

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export interface SummarySegment {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  aiSummary: string;
  screenshotUrl: string;
  subtitles: SubtitleSegment[];
}

export interface VideoAnalysis {
  id: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  channel: string;
  duration: number;
  publishDate: string;
  thumbnailUrl: string;
  subtitles: SubtitleSegment[];
  summarySegments: SummarySegment[];
  status: "processing" | "completed" | "failed";
  createdAt: Date;
}

export type AnalysisState = "input" | "loading" | "ready" | "error";
