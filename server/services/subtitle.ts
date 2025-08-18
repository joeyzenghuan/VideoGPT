import ytdl from "ytdl-core";
import { type SubtitleSegment } from "@shared/schema";

export async function extractSubtitles(videoId: string): Promise<SubtitleSegment[]> {
  try {
    const info = await ytdl.getInfo(videoId);
    
    // Look for automatic captions or manual captions
    const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error("No captions available for this video");
    }
    
    // Prefer Chinese captions, then English, then any available
    let selectedTrack = captionTracks.find(track => 
      track.languageCode === 'zh' || track.languageCode === 'zh-CN'
    ) || captionTracks.find(track => 
      track.languageCode === 'en' || track.languageCode === 'en-US'
    ) || captionTracks[0];

    if (!selectedTrack?.baseUrl) {
      throw new Error("No valid caption track found");
    }

    // Fetch caption content
    const response = await fetch(selectedTrack.baseUrl);
    const captionXml = await response.text();
    
    // Parse XML captions
    const subtitles = parseCaptionXml(captionXml);
    
    if (subtitles.length === 0) {
      throw new Error("Failed to parse captions");
    }
    
    return subtitles;
  } catch (error) {
    console.error("Error extracting subtitles:", error);
    throw new Error("Failed to extract subtitles: " + (error as Error).message);
  }
}

function parseCaptionXml(xml: string): SubtitleSegment[] {
  const subtitles: SubtitleSegment[] = [];
  
  // Simple XML parsing for captions
  const textMatches = xml.match(/<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([^<]*)<\/text>/g);
  
  if (!textMatches) {
    return subtitles;
  }
  
  textMatches.forEach(match => {
    const startMatch = match.match(/start="([^"]*)"/);
    const durMatch = match.match(/dur="([^"]*)"/);
    const textMatch = match.match(/>([^<]*)</);
    
    if (startMatch && durMatch && textMatch) {
      const start = parseFloat(startMatch[1]);
      const duration = parseFloat(durMatch[1]);
      const text = decodeHtmlEntities(textMatch[1].trim());
      
      if (text && !isNaN(start) && !isNaN(duration)) {
        subtitles.push({
          start,
          end: start + duration,
          text
        });
      }
    }
  });
  
  return subtitles;
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}
