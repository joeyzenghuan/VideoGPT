import OpenAI from "openai";
import { type SubtitleSegment, type SummarySegment } from "@shared/schema";

// Azure OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY || "default_key",
  baseURL: "https://jz-fdpo-swn.openai.azure.com/openai/deployments/gpt-4o-mini-0718-deployment-glb",
  defaultQuery: { 'api-version': '2024-06-01' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY || "default_key",
  },
});

export async function generateVideoSummary(
  title: string,
  subtitles: SubtitleSegment[]
): Promise<SummarySegment[]> {
  try {
    const subtitleText = subtitles.map(sub => 
      `[${formatTime(sub.start)}] ${sub.text}`
    ).join('\n');

    const prompt = `
请分析以下YouTube视频的字幕内容，将其按主题分成4-6个逻辑段落。视频标题：${title}

字幕内容：
${subtitleText}

请返回JSON格式的分析结果，包含以下结构：
{
  "segments": [
    {
      "id": "段落唯一标识",
      "startTime": 开始时间（秒）,
      "endTime": 结束时间（秒）,
      "title": "段落标题",
      "aiSummary": "该段落的中文总结，150-200字"
    }
  ]
}

要求：
1. 每个段落应该有明确的主题焦点
2. 时间范围要合理，避免重叠
3. 总结要准确反映该时间段的内容
4. 使用简洁明了的中文
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini-0718-deployment-glb", // Azure deployment name
      messages: [
        {
          role: "system",
          content: "你是一个专业的视频内容分析师，擅长将视频内容按主题进行智能分段和总结。请严格按照JSON格式返回结果。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.segments || !Array.isArray(result.segments)) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Map the segments and include relevant subtitles for each
    const summarySegments: SummarySegment[] = result.segments.map((segment: any) => {
      const segmentSubtitles = subtitles.filter(sub => 
        sub.start >= segment.startTime && sub.end <= segment.endTime
      );

      return {
        id: segment.id || `segment-${Date.now()}-${Math.random()}`,
        startTime: segment.startTime,
        endTime: segment.endTime,
        title: segment.title,
        aiSummary: segment.aiSummary,
        screenshotUrl: "", // Will be filled by screenshot service
        subtitles: segmentSubtitles,
      };
    });

    return summarySegments;
  } catch (error) {
    console.error("Error generating video summary:", error);
    throw new Error("Failed to generate video summary: " + (error as Error).message);
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
