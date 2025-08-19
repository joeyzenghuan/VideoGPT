import OpenAI from "openai";
import { type SubtitleSegment, type SummarySegment } from "@shared/schema";

// OpenAI实例，延迟初始化
let openai: OpenAI | null = null;

// 初始化OpenAI实例
function getOpenAIInstance(): OpenAI {
  if (!openai) {
    // 构建OpenAI配置
    const openaiConfig: any = {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    };

    // 如果是Azure OpenAI，添加额外的配置
    if (process.env.OPENAI_API_VERSION) {
      openaiConfig.defaultQuery = { 'api-version': process.env.OPENAI_API_VERSION };
      openaiConfig.defaultHeaders = {
        'api-key': process.env.OPENAI_API_KEY,
      };
      console.log("✅ 初始化Azure OpenAI配置");
    } else {
      console.log("✅ 初始化标准OpenAI配置");
    }

    console.log("🔧 OpenAI服务配置:");
    console.log("  Base URL:", process.env.OPENAI_BASE_URL);
    console.log("  Model:", process.env.OPENAI_MODEL_NAME);
    console.log("  API Version:", process.env.OPENAI_API_VERSION || "N/A (标准OpenAI)");
    console.log("  API Key:", process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : "未设置");

    openai = new OpenAI(openaiConfig);
  }
  
  return openai;
}

export async function generateVideoSummary(
  title: string,
  subtitles: SubtitleSegment[]
): Promise<SummarySegment[]> {
  try {
    console.log("=== 开始生成AI总结 ===");
    console.log("视频标题:", title);
    console.log("字幕数量:", subtitles.length);
    
    const subtitleText = subtitles.map(sub => 
      `[${formatTime(sub.start)}] ${sub.text}`
    ).join('\n');

    console.log("字幕文本长度:", subtitleText.length, "字符");
    console.log("字幕文本前500字符:", subtitleText.substring(0, 500));
    console.log("字幕文本后200字符:", subtitleText.substring(Math.max(0, subtitleText.length - 200)));

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

    console.log("📤 发送给LLM的完整prompt:");
    console.log("---prompt开始---");
    console.log(prompt);
    console.log("---prompt结束---");
    console.log("Prompt长度:", prompt.length, "字符");

    console.log("🔄 正在调用OpenAI API...");
    const startTime = Date.now();

    const openaiInstance = getOpenAIInstance();
    const response = await openaiInstance.chat.completions.create({
      model: process.env.OPENAI_MODEL_NAME!, // 从环境变量读取模型名称
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

    const endTime = Date.now();
    console.log("✅ OpenAI API调用完成，耗时:", endTime - startTime, "ms");
    
    const rawResponse = response.choices[0].message.content || "{}";
    console.log("📥 LLM原始响应内容:");
    console.log("---响应开始---");
    console.log(rawResponse);
    console.log("---响应结束---");
    console.log("响应长度:", rawResponse.length, "字符");

    console.log("🔄 开始解析JSON响应...");
    const result = JSON.parse(rawResponse);
    console.log("✅ JSON解析成功");
    console.log("解析后的结果:", JSON.stringify(result, null, 2));
    
    if (!result.segments || !Array.isArray(result.segments)) {
      console.error("❌ 无效的响应格式，缺少segments数组");
      console.error("实际收到的结果:", result);
      throw new Error("Invalid response format from OpenAI");
    }

    console.log("✅ 找到", result.segments.length, "个段落");

    // Map the segments and include relevant subtitles for each
    console.log("🔄 开始处理段落并分配字幕...");
    const summarySegments: SummarySegment[] = result.segments.map((segment: any, index: number) => {
      console.log(`处理段落 ${index + 1}:`);
      console.log(`  时间范围: ${segment.startTime}s - ${segment.endTime}s`);
      console.log(`  标题: ${segment.title}`);
      console.log(`  总结长度: ${segment.aiSummary?.length || 0} 字符`);
      
      // 修复字幕分配逻辑：包含与该时间段有重叠的所有字幕
      const segmentSubtitles = subtitles.filter(sub => {
        // 字幕与段落有重叠的条件：
        // 1. 字幕开始时间在段落范围内：sub.start >= segment.startTime && sub.start < segment.endTime
        // 2. 字幕结束时间在段落范围内：sub.end > segment.startTime && sub.end <= segment.endTime  
        // 3. 字幕完全包含段落：sub.start <= segment.startTime && sub.end >= segment.endTime
        return (sub.start < segment.endTime && sub.end > segment.startTime);
      });
      
      console.log(`  匹配到 ${segmentSubtitles.length} 条字幕`);
      if (segmentSubtitles.length > 0) {
        console.log(`  字幕样本: "${segmentSubtitles[0].text.substring(0, 50)}..."`);
        console.log(`  字幕范围: ${segmentSubtitles[0].start}s - ${segmentSubtitles[segmentSubtitles.length - 1].end}s`);
        
        // 显示前几条和后几条字幕用于调试
        const debugCount = Math.min(3, segmentSubtitles.length);
        console.log(`  前${debugCount}条字幕:`);
        segmentSubtitles.slice(0, debugCount).forEach(sub => {
          console.log(`    [${sub.start}s] ${sub.text.substring(0, 60)}...`);
        });
        
        if (segmentSubtitles.length > debugCount) {
          console.log(`  后${debugCount}条字幕:`);
          segmentSubtitles.slice(-debugCount).forEach(sub => {
            console.log(`    [${sub.start}s] ${sub.text.substring(0, 60)}...`);
          });
        }
      } else {
        console.log("  ⚠️ 警告: 该段落没有匹配到任何字幕");
        
        // 调试信息：显示附近的字幕
        const nearbySubtitles = subtitles.filter(sub => 
          Math.abs(sub.start - segment.startTime) <= 10 || 
          Math.abs(sub.start - segment.endTime) <= 10
        );
        if (nearbySubtitles.length > 0) {
          console.log("  🔍 附近的字幕:");
          nearbySubtitles.slice(0, 3).forEach(sub => {
            console.log(`    [${sub.start}s] ${sub.text.substring(0, 50)}...`);
          });
        }
      }

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

    console.log("✅ AI总结生成完成");
    console.log("总段落数:", summarySegments.length);
    console.log("总字幕分配数:", summarySegments.reduce((total, seg) => total + seg.subtitles.length, 0));
    console.log("=== AI总结生成结束 ===");

    return summarySegments;
  } catch (error) {
    console.error("❌ AI总结生成过程中发生错误:");
    console.error("错误类型:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("错误信息:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
    
    if (error instanceof Error && error.message.includes('API')) {
      console.error("🔍 这可能是API调用相关的错误，请检查:");
      console.error("  - Azure OpenAI API密钥是否正确");
      console.error("  - 部署名称是否正确");  
      console.error("  - 网络连接是否正常");
    }
    
    throw new Error("Failed to generate video summary: " + (error as Error).message);
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
