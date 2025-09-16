import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, Loader2, Play, FileText, Bot, Camera, Save, Sparkles } from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
  details?: any;
  timestamp?: string;
}

interface AnalysisProgressProps {
  analysisId: string;
  isVisible: boolean;
  onComplete?: () => void;
}

const STEP_DEFINITIONS: Record<string, { title: string; icon: React.ReactNode }> = {
  '初始化': { title: '初始化分析', icon: <Play className="w-4 h-4" /> },
  '字幕提取': { title: '提取字幕', icon: <FileText className="w-4 h-4" /> },
  '数据保存': { title: '保存数据', icon: <Save className="w-4 h-4" /> },
  'AI分析': { title: 'AI智能分析', icon: <Bot className="w-4 h-4" /> },
  '视频缓存': { title: '缓存视频', icon: <Clock className="w-4 h-4" /> },
  '截图生成': { title: '生成截图', icon: <Camera className="w-4 h-4" /> },
  '完成保存': { title: '保存结果', icon: <Save className="w-4 h-4" /> },
  '分析完成': { title: '分析完成', icon: <Sparkles className="w-4 h-4" /> },
  '处理失败': { title: '处理失败', icon: <AlertCircle className="w-4 h-4" /> },
};

export function AnalysisProgress({ analysisId, isVisible, onComplete }: AnalysisProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);

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

  const handleProgressUpdate = (update: any) => {
    const stepDefinition = STEP_DEFINITIONS[update.step] || { 
      title: update.step, 
      icon: <Clock className="w-4 h-4" /> 
    };

    const newStep: ProgressStep = {
      id: update.step,
      title: stepDefinition.title,
      icon: stepDefinition.icon,
      progress: update.progress,
      status: update.status,
      message: update.message,
      details: update.details,
      timestamp: update.timestamp,
    };

    setSteps(prev => {
      const existingIndex = prev.findIndex(step => step.id === update.step);
      if (existingIndex >= 0) {
        const newSteps = [...prev];
        newSteps[existingIndex] = newStep;
        return newSteps;
      } else {
        return [...prev, newStep];
      }
    });

    setOverallProgress(update.progress);
    setCurrentStep(update.step);

    // 如果分析完成，调用回调
    if (update.step === '分析完成' && update.status === 'completed') {
      setTimeout(() => {
        onComplete?.();
      }, 2000); // 2秒后调用完成回调
    }
  };

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          视频智能分析进度
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>总体进度</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          {currentStep && (
            <p className="text-sm text-blue-600 font-medium">
              当前步骤: {STEP_DEFINITIONS[currentStep]?.title || currentStep}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`p-4 rounded-lg border transition-all duration-300 ${getStatusColor(step.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {step.icon}
                  <span className="font-medium text-gray-800">{step.title}</span>
                </div>
                <Badge 
                  variant={step.status === 'completed' ? 'default' : 
                          step.status === 'running' ? 'secondary' : 
                          step.status === 'error' ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {step.status === 'completed' ? '已完成' : 
                   step.status === 'running' ? '进行中' : 
                   step.status === 'error' ? '失败' : '等待中'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(step.status)}
                <span className="text-sm font-medium text-gray-600">
                  {step.progress}%
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{step.message}</p>
            
            {step.progress > 0 && step.progress < 100 && step.status === 'running' && (
              <Progress value={step.progress} className="h-1" />
            )}
            
            {step.details && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                {step.details.subtitleCount && (
                  <div>字幕数量: {step.details.subtitleCount}</div>
                )}
                {step.details.segmentCount && (
                  <div>分析段落: {step.details.segmentCount}</div>
                )}
                {step.details.screenshotCount && (
                  <div>截图数量: {step.details.screenshotCount}</div>
                )}
                {step.details.totalSegments && (
                  <div className="mt-1 text-green-600 font-medium">
                    🎉 完成！共生成 {step.details.totalSegments} 个段落，{step.details.totalScreenshots} 张截图
                  </div>
                )}
              </div>
            )}
            
            {step.timestamp && (
              <div className="text-xs text-gray-400 mt-1">
                {new Date(step.timestamp).toLocaleTimeString('zh-CN')}
              </div>
            )}
          </div>
        ))}
      </div>

      {steps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p>正在初始化分析过程...</p>
        </div>
      )}
    </div>
  );
}