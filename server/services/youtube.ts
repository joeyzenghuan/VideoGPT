import ytdl from "ytdl-core";

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
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error("Invalid YouTube URL");
    }

    const videoId = ytdl.getVideoID(youtubeUrl);
    const info = await ytdl.getInfo(videoId);
    
    const details = info.videoDetails;
    
    return {
      videoId,
      title: details.title,
      channel: details.author.name,
      duration: parseInt(details.lengthSeconds),
      publishDate: details.publishDate,
      thumbnailUrl: details.thumbnails[details.thumbnails.length - 1]?.url || "",
    };
  } catch (error) {
    console.error("Error extracting video metadata:", error);
    throw new Error("Failed to extract video metadata: " + (error as Error).message);
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  return ytdl.validateURL(url);
}
