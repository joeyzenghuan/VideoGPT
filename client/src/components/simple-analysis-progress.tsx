import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2, ChevronDown, ChevronRight, FileText, Brain, Camera, Check, X } from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
  timestamp?: string;
  details?: ProgressDetails;
}

interface ProgressDetails {
  // 字幕信息
  subtitlesCount?: number;
  subtitlePreview?: string;
  
  // AI提示词信息
  promptLength?: number;
  promptPreview?: string;
  
  // AI模型和响应信息
  model?: string;
  duration?: number;
  responseLength?: number;
  responsePreview?: string;
  
  // 分析结果
  segmentsFound?: number;
  segments?: Array<{
    title: string;
    start: number;
    end: number;
  }>;
  
  // 截图信息
  screenshotsGenerated?: number;
}

interface SimpleAnalysisProgressProps {
  analysisId: string;
  isVisible: boolean;
  onComplete?: () => void;
}

export function SimpleAnalysisProgress({ analysisId, isVisible, onComplete }: SimpleAnalysisProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // 处理WebSocket消息
  const handleProgressUpdate = (update: any) => {
    console.log('📡 收到进度更新:', update);
    
    setSteps(prevSteps => {
      const existingIndex = prevSteps.findIndex(step => step.id === update.step);
      const newStep: ProgressStep = {
        id: update.step,
        title: update.step,
        progress: update.progress,
        status: update.status,
        message: update.message,
        timestamp: update.timestamp,
        details: update.details
      };

      if (existingIndex >= 0) {
        // 更新现有步骤
        const updated = [...prevSteps];
        updated[existingIndex] = newStep;
        return updated;
      } else {
        // 添加新步骤
        return [...prevSteps, newStep];
      }
    });

    // 自动展开当前运行的步骤
    if (update.status === 'running' && update.details) {
      setExpandedStep(update.step);
    }
  };

  useEffect(() => {
    if (!isVisible || !analysisId) return;

    // 建立WebSocket连接
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/progress`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('📡 WebSocket连接已建立');
      // 订阅这个分析的进度更新
      websocket.send(JSON.stringify({
        type: 'subscribe',
        analysisId: analysisId
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'progress') {
          handleProgressUpdate(message.data);
        }
      } catch (error) {
        console.error('WebSocket消息解析错误:', error);
      }
    };

    websocket.onclose = () => {
      console.log('📡 WebSocket连接已关闭');
    };

    websocket.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [analysisId, isVisible]);

  // 检查是否所有步骤都已完成
  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed');
    const hasError = steps.some(step => step.status === 'error');
    
    if (!hasError && completedSteps.length > 0 && steps.every(step => step.status === 'completed' || step.id === '分析完成')) {
      // 延迟3秒后调用完成回调
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [steps, onComplete]);

  const renderStepIcon = (step: ProgressStep) => {
    if (step.status === 'completed') {
      return (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      );
    } else if (step.status === 'running') {
      return (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        </div>
      );
    } else if (step.status === 'error') {
      return (
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <X className="h-4 w-4 text-white" />
        </div>
      );
    } else {
      return <div className="w-8 h-8 bg-gray-300 rounded-full" />;
    }
  };

  const renderDetails = (details: ProgressDetails) => {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
        {details.subtitlesCount && (
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium">字幕信息</div>
              <div className="text-gray-600">提取到 {details.subtitlesCount} 条字幕</div>
              {details.subtitlePreview && (
                <div className="mt-1 text-xs bg-white p-2 rounded border">
                  {details.subtitlePreview}
                </div>
              )}
            </div>
          </div>
        )}
        
        {details.promptLength && (
          <div className="flex items-start space-x-2">
            <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
            <div>
              <div className="font-medium">AI提示词</div>
              <div className="text-gray-600">长度: {details.promptLength} 字符</div>
              {details.promptPreview && (
                <div className="mt-1 text-xs bg-white p-2 rounded border">
                  {details.promptPreview}
                </div>
              )}
            </div>
          </div>
        )}
        
        {details.model && (
          <div className="flex items-start space-x-2">
            <Brain className="h-4 w-4 text-indigo-600 mt-0.5" />
            <div>
              <div className="font-medium">AI模型</div>
              <div className="text-gray-600">{details.model}</div>
              {details.duration && (
                <div className="text-xs text-gray-500">
                  耗时: {details.duration}ms
                </div>
              )}
            </div>
          </div>
        )}
        
        {details.responseLength && (
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium">AI响应</div>
              <div className="text-gray-600">长度: {details.responseLength} 字符</div>
              {details.responsePreview && (
                <div className="mt-1 text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
                  {details.responsePreview}
                </div>
              )}
            </div>
          </div>
        )}
        
        {details.segmentsFound && (
          <div className="flex items-start space-x-2">
            <Camera className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <div className="font-medium">分析结果</div>
              <div className="text-gray-600">发现 {details.segmentsFound} 个关键片段</div>
              {details.segments && (
                <div className="mt-1 space-y-1">
                  {details.segments.slice(0, 3).map((segment: any, index: number) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div className="font-medium">{segment.title}</div>
                      <div className="text-gray-500">{segment.start}s - {segment.end}s</div>
                    </div>
                  ))}
                  {details.segments.length > 3 && (
                    <div className="text-xs text-gray-500">
                      还有 {details.segments.length - 3} 个片段...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {details.screenshotsGenerated && (
          <div className="flex items-start space-x-2">
            <Camera className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium">截图生成</div>
              <div className="text-gray-600">已生成 {details.screenshotsGenerated} 张截图</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">视频分析进度</h3>
          <p className="text-sm text-gray-600">正在详细处理视频内容...</p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="border rounded-lg p-4 bg-white">
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => {
                  if (step.details) {
                    setExpandedStep(expandedStep === step.id ? null : step.id);
                  }
                }}
              >
                {renderStepIcon(step)}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{step.title}</span>
                    <div className="flex items-center space-x-2">
                      {step.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{step.progress}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{step.message}</p>
                  {step.status === 'running' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {step.details && (
                  <div className="text-gray-400">
                    {expandedStep === step.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
              
              {expandedStep === step.id && step.details && renderDetails(step.details)}
            </div>
          ))}
        </div>

        {steps.length === 0 && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">正在初始化分析...</p>
          </div>
        )}
      </div>
    </div>
  );
}