import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, RefreshCw } from "lucide-react";

interface UrlInputProps {
  onStartAnalysis: (url: string, forceRegenerate?: boolean) => void;
  isLoading: boolean;
}

export function UrlInput({ onStartAnalysis, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onStartAnalysis(url.trim(), forceRegenerate);
    }
  };

  const fillExample = () => {
    setUrl("https://www.youtube.com/watch?v=ZmNpeXTj2c4");
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-10 h-10 text-white" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              data-testid="icon-youtube-large"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2" data-testid="heading-analyze">
            开始分析YouTube视频
          </h2>
          <p className="text-slate-600" data-testid="text-description">
            输入YouTube视频链接，AI将自动提取并总结视频内容
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input 
                type="url" 
                placeholder="粘贴YouTube视频链接..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                disabled={isLoading}
                data-testid="input-youtube-url"
              />
            </div>
            <Button 
              type="submit"
              disabled={!url.trim() || isLoading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium"
              data-testid="button-start-analysis"
            >
              {forceRegenerate ? (
                <RefreshCw className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {forceRegenerate ? "重新生成" : "开始分析"}
            </Button>
          </form>
          
          {/* Force regenerate option */}
          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="force-regenerate"
              checked={forceRegenerate}
              onCheckedChange={(checked) => setForceRegenerate(checked as boolean)}
              disabled={isLoading}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <label
              htmlFor="force-regenerate"
              className="text-sm text-slate-600 cursor-pointer select-none"
            >
              忽略缓存，重新生成分析结果
            </label>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-slate-500">示例:</span>
            <button 
              onClick={fillExample}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              data-testid="button-fill-example"
            >
              https://www.youtube.com/watch?v=ZmNpeXTj2c4
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
