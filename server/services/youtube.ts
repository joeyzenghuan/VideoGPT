import ytdl from "@distube/ytdl-core";

export interface VideoMetadata {
  videoId: string;
  title: string;
  channel: string;
  duration: number;
  publishDate: string;
  thumbnailUrl: string;
}

export async function extractVideoMetadata(youtubeUrl: string): Promise<VideoMetadata> {
  try {
    console.log("Validating YouTube URL:", youtubeUrl);
    
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error("Invalid YouTube URL");
    }

    const videoId = ytdl.getVideoID(youtubeUrl);
    console.log("Extracted video ID:", videoId);
    
    console.log("Fetching video info...");
    const info = await ytdl.getInfo(videoId);
    
    const details = info.videoDetails;
    console.log("Video title:", details.title);
    
    return {
      videoId,
      title: details.title,
      channel: details.author.name,
      duration: parseInt(details.lengthSeconds),
      publishDate: details.publishDate || new Date().toISOString(),
      thumbnailUrl: details.thumbnails[details.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } catch (error) {
    console.error("Error extracting video metadata:", error);
    throw new Error("Failed to extract video metadata: " + (error as Error).message);
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  return ytdl.validateURL(url);
}
