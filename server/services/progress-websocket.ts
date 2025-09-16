import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

export interface ProgressUpdate {
  analysisId: string;
  step: string;
  progress: number; // 0-100
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
  timestamp: string;
  details?: any;
}

export class ProgressWebSocketServer {
  private wss: WebSocketServer;
  private connections = new Map<string, Set<WebSocket>>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/progress'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('📡 WebSocket客户端已连接');
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'subscribe' && data.analysisId) {
            this.subscribeToAnalysis(ws, data.analysisId);
          }
        } catch (error) {
          console.error('WebSocket消息解析错误:', error);
        }
      });

      ws.on('close', () => {
        console.log('📡 WebSocket客户端已断开连接');
        this.removeConnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
      });
    });
  }

  private subscribeToAnalysis(ws: WebSocket, analysisId: string) {
    if (!this.connections.has(analysisId)) {
      this.connections.set(analysisId, new Set());
    }
    this.connections.get(analysisId)!.add(ws);
    
    console.log(`📡 客户端订阅分析进度: ${analysisId}`);
  }

  private removeConnection(ws: WebSocket) {
    this.connections.forEach((wsSet, analysisId) => {
      wsSet.delete(ws);
      if (wsSet.size === 0) {
        this.connections.delete(analysisId);
      }
    });
  }

  public sendProgress(update: ProgressUpdate) {
    const connections = this.connections.get(update.analysisId);
    if (!connections || connections.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'progress',
      data: update
    });

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('发送WebSocket消息失败:', error);
        }
      }
    });

    console.log(`📡 已推送进度: ${update.step} - ${update.progress}% (${update.analysisId})`);
  }

  public sendStepUpdate(
    analysisId: string, 
    step: string, 
    progress: number, 
    status: ProgressUpdate['status'], 
    message: string, 
    details?: any
  ) {
    this.sendProgress({
      analysisId,
      step,
      progress,
      status,
      message,
      timestamp: new Date().toISOString(),
      details
    });
  }
}

// 全局实例
let progressWS: ProgressWebSocketServer;

export function initializeProgressWebSocket(server: Server): ProgressWebSocketServer {
  progressWS = new ProgressWebSocketServer(server);
  return progressWS;
}

export function getProgressWebSocket(): ProgressWebSocketServer {
  if (!progressWS) {
    throw new Error('ProgressWebSocket尚未初始化');
  }
  return progressWS;
}