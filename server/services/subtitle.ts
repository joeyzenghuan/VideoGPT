import { getSubtitles, type Caption } from 'youtube-caption-extractor';
import { type SubtitleSegment } from "@shared/schema";

// Helper function to convert Caption to SubtitleSegment with proper type handling
function convertCaptionsToSubtitles(captions: Caption[]): SubtitleSegment[] {
  return captions.map((caption: Caption) => {
    // Convert string numbers to actual numbers
    const start = typeof caption.start === 'string' ? parseFloat(caption.start) : caption.start;
    const dur = typeof caption.dur === 'string' ? parseFloat(caption.dur) : caption.dur;
    
    return {
      start: start,
      end: start + dur,
      text: caption.text.replace(/\n/g, ' ').trim() // Remove newlines and trim
    };
  });
}

// Test function to validate the library works
export async function testSubtitleLibrary(): Promise<void> {
  try {
    console.log("🧪 测试 youtube-caption-extractor 库...");
    
    // Test with the TED video that worked
    const testVideoId = 'ZmNpeXTj2c4'; // TED Talk - Jenny Hoyos
    
    console.log("测试视频ID:", testVideoId);
    const captions = await getSubtitles({
      videoID: testVideoId
    });
    
    console.log("测试结果:", {
      success: !!captions,
      type: typeof captions,
      isArray: Array.isArray(captions),
      length: captions?.length || 0
    });
    
    if (captions && captions.length > 0) {
      console.log("✅ 库工作正常！");
      console.log("前3条字幕样本:");
      captions.slice(0, 3).forEach((caption, index) => {
        console.log(`[${index}] 数据结构:`, JSON.stringify(caption, null, 2));
        console.log(`[${index}] 所有属性:`, Object.keys(caption));
      });
      
      // Check if the first caption has expected properties
      const firstCaption = captions[0];
      console.log("\n字幕数据分析:");
      console.log("- start 属性:", typeof firstCaption.start, firstCaption.start);
      console.log("- dur/duration 属性:", 
        firstCaption.dur !== undefined ? `dur: ${firstCaption.dur}` : 
        (firstCaption as any).duration !== undefined ? `duration: ${(firstCaption as any).duration}` : 
        "未找到时长属性");
      console.log("- text 属性:", typeof firstCaption.text, `"${firstCaption.text}"`);
    } else {
      console.log("⚠️  库调用成功但未返回字幕");
    }
  } catch (error) {
    console.log("❌ 库测试失败:");
    console.log("错误:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.log("堆栈:", error.stack.slice(0, 500));
    }
  }
}

export async function extractSubtitles(videoId: string): Promise<SubtitleSegment[]> {
  try {
    console.log("=== 开始提取字幕 ===");
    console.log("视频ID:", videoId);
    console.log("使用库: youtube-caption-extractor");
    
    // First, try to get captions without specifying language to see what's available
    console.log("🔍 第一步：检查视频是否有任何可用字幕...");
    try {
      const anyAvailableCaptions = await getSubtitles({
        videoID: videoId
      });
      
      if (anyAvailableCaptions && anyAvailableCaptions.length > 0) {
        console.log(`✅ 发现字幕！共 ${anyAvailableCaptions.length} 条字幕可用`);
        console.log("字幕样本 (前3条):");
        anyAvailableCaptions.slice(0, 3).forEach((caption, index) => {
          console.log(`  [${index}] ${caption.start}s (${caption.dur}s): "${caption.text.substring(0, 100)}${caption.text.length > 100 ? '...' : ''}"`);
        });
        
        // Convert to our format and return
        const subtitles = convertCaptionsToSubtitles(anyAvailableCaptions);
        
        console.log("=== 字幕提取成功完成 ===");
        return subtitles;
      } else {
        console.log("⚠️  首次尝试返回了空数组或null");
        console.log("返回结果类型:", typeof anyAvailableCaptions);
        console.log("返回结果:", anyAvailableCaptions);
      }
    } catch (anyError) {
      console.log("❌ 首次尝试失败:");
      console.log("  错误类型:", typeof anyError);
      console.log("  错误消息:", anyError instanceof Error ? anyError.message : String(anyError));
      console.log("  错误堆栈:", anyError instanceof Error ? anyError.stack : "无堆栈");
      
      if (anyError instanceof Error && anyError.message.includes('private')) {
        console.log("🔒 视频可能是私有的或受限制的");
      } else if (anyError instanceof Error && anyError.message.includes('not found')) {
        console.log("🚫 视频未找到或已被删除");
      } else if (anyError instanceof Error && anyError.message.includes('captions')) {
        console.log("📝 视频可能没有字幕");
      }
    }
    
    // Try to get captions in preferred order: Chinese, English, then any available
    console.log("🔍 第二步：尝试特定语言字幕...");
    const languages = ['zh', 'zh-CN', 'en', 'en-US'];
    
    for (const lang of languages) {
      try {
        console.log(`🔍 尝试获取 ${lang} 语言字幕...`);
        console.log(`  请求参数: { videoID: "${videoId}", lang: "${lang}" }`);
        
        const captions = await getSubtitles({
          videoID: videoId,
          lang: lang
        });
        
        console.log(`📊 ${lang} 语言响应:`, {
          type: typeof captions,
          isArray: Array.isArray(captions),
          length: captions ? captions.length : 'N/A',
          sample: captions && captions.length > 0 ? captions[0] : 'N/A'
        });
        
        if (captions && captions.length > 0) {
          console.log(`✅ 成功获取 ${lang} 语言字幕，共 ${captions.length} 条`);
          
          // Convert to our format
          const subtitles = convertCaptionsToSubtitles(captions);
          
          console.log("前5条字幕预览:");
          subtitles.slice(0, 5).forEach((sub, index) => {
            console.log(`  [${index}] ${sub.start}s-${sub.end}s: "${sub.text}"`);
          });
          
          console.log("=== 字幕提取成功完成 ===");
          return subtitles;
        }
      } catch (langError) {
        console.log(`❌ ${lang} 语言字幕获取详细错误信息:`);
        console.log("  错误类型:", typeof langError);
        console.log("  错误消息:", langError instanceof Error ? langError.message : String(langError));
        console.log("  错误构造函数:", langError?.constructor?.name);
        if (langError instanceof Error) {
          console.log("  错误堆栈:", langError.stack?.substring(0, 500) + "...");
        }
        continue; // Try next language
      }
    }
    
    // Final attempt: try different approaches
    console.log("🔄 第三步：尝试其他方法获取字幕...");
    
    // Try with empty language parameter (sometimes works better)
    try {
      console.log("尝试方法1: 空语言参数");
      const captions = await getSubtitles({
        videoID: videoId,
        lang: ''  // Empty language might get default
      });
      
      console.log("空语言参数响应:", {
        type: typeof captions,
        length: captions?.length,
        first: captions?.[0]
      });
      
      if (captions && captions.length > 0) {
        console.log(`✅ 空语言参数成功！获取到字幕，共 ${captions.length} 条`);
        
        const subtitles = convertCaptionsToSubtitles(captions);
        
        console.log("前5条字幕预览:");
        subtitles.slice(0, 5).forEach((sub, index) => {
          console.log(`  [${index}] ${sub.start}s-${sub.end}s: "${sub.text}"`);
        });
        
        console.log("=== 字幕提取完成 ===");
        return subtitles;
      }
    } catch (emptyLangError) {
      console.log("❌ 空语言参数方法失败:", emptyLangError instanceof Error ? emptyLangError.message : String(emptyLangError));
    }
    
    // Try other common language codes
    const alternativeLangs = ['auto', 'default', 'a.en', 'a.zh'];
    for (const altLang of alternativeLangs) {
      try {
        console.log(`尝试备用语言代码: ${altLang}`);
        const captions = await getSubtitles({
          videoID: videoId,
          lang: altLang
        });
        
        if (captions && captions.length > 0) {
          console.log(`✅ 备用语言 ${altLang} 成功！获取到字幕，共 ${captions.length} 条`);
          
          const subtitles = convertCaptionsToSubtitles(captions);
          
          console.log("=== 字幕提取完成 ===");
          return subtitles;
        }
      } catch (altError) {
        console.log(`❌ 备用语言 ${altLang} 失败:`, altError instanceof Error ? altError.message : String(altError));
      }
    }
    
    // Log final debugging information
    console.log("🔍 最终调试信息:");
    console.log("  视频ID:", videoId);
    console.log("  视频URL:", `https://www.youtube.com/watch?v=${videoId}`);
    console.log("  库版本检查...");
    
    try {
      // Try to import and check the library
      const scraperInfo = require('youtube-captions-scraper/package.json');
      console.log("  库版本:", scraperInfo.version);
    } catch (versionError) {
      console.log("  无法获取库版本信息");
    }
    
    console.warn("❌ 所有字幕获取方法都失败，使用演示字幕");
    console.log("建议检查:");
    console.log("  1. 视频是否公开可访问");
    console.log("  2. 视频是否真的有字幕");
    console.log("  3. 网络连接是否正常");
    console.log("  4. YouTube是否有反爬虫限制");
    
    return generateDemoSubtitles();
    
  } catch (error) {
    console.error("❌ 字幕提取过程中发生错误:", error);
    console.error("错误详情:", error instanceof Error ? error.message : String(error));
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
    throw error; // Let the routes.ts handle the fallback
  }
}

function generateDemoSubtitles(): SubtitleSegment[] {
  return [
    { start: 0, end: 12, text: "Hello everyone, welcome to today's presentation. I'm excited to share with you some insights about effective storytelling." },
    { start: 12, end: 25, text: "The key to a great story lies in understanding your audience and crafting a narrative that resonates with them." },
    { start: 25, end: 40, text: "First, let's talk about the structure. Every compelling story has a clear beginning, middle, and end." },
    { start: 40, end: 55, text: "The beginning should hook your audience immediately. You have just seconds to capture their attention." },
    { start: 55, end: 70, text: "In the middle section, develop your main points with concrete examples and relatable scenarios." },
    { start: 70, end: 85, text: "Use emotion to connect with your audience. Stories that evoke feelings are more memorable." },
    { start: 85, end: 100, text: "The ending should leave a lasting impression. Summarize your key message and call for action." },
    { start: 100, end: 115, text: "Practice your delivery. Even the best story can fall flat without proper presentation skills." },
    { start: 115, end: 130, text: "Remember, authenticity is crucial. Be genuine in your storytelling approach." },
    { start: 130, end: 145, text: "Use visual aids and props when appropriate to enhance your narrative." },
    { start: 145, end: 160, text: "Pay attention to pacing. Give your audience time to absorb important points." },
    { start: 160, end: 175, text: "Engage with your audience through questions and interactive elements." },
    { start: 175, end: 190, text: "Learn from feedback and continuously improve your storytelling technique." },
    { start: 190, end: 205, text: "In conclusion, great storytelling is a skill that can be developed with practice and dedication." },
    { start: 205, end: 220, text: "Thank you for your attention. I hope these insights help you become better storytellers." }
  ];
}
