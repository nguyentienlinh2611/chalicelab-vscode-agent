// src/providers/ChaliceLabAgentProvider.ts
import * as vscode from 'vscode';
import { ApiService } from '../services/ApiService';
import { getWebviewContent } from '../webview/webviewContentProvider';

export class ChaliceLabAgentProvider {
    public static currentPanel: ChaliceLabAgentProvider | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _context: vscode.ExtensionContext;
    private readonly _apiService: ApiService;
    private _disposables: vscode.Disposable[] = [];

    // State management
    private _isStreaming = false;
    private _healthCheckInterval: NodeJS.Timeout | null = null;
    private _currentConversationId: string | null = null;

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._context = context;
        this._apiService = new ApiService();

        // Setup
        this.setupWebview();
        this.startHealthCheck();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        // Nếu panel đã tồn tại, chỉ cần hiển thị nó
        if (ChaliceLabAgentProvider.currentPanel) {
            ChaliceLabAgentProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Nếu chưa, tạo một panel mới
        const panel = vscode.window.createWebviewPanel(
            'chalicelabAgent',
            'ChaliceLab Project Agent',
            column,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')]
            }
        );

        // Gọi 'new' từ bên trong class, thông qua phương thức static
        ChaliceLabAgentProvider.currentPanel = new ChaliceLabAgentProvider(panel, context);
    }

    private setupWebview() {
        this._panel.webview.html = getWebviewContent(this._panel.webview, this._context.extensionUri);
        this._panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this._disposables);
    }

    private async handleMessage(message: any) {
        switch (message.command) {
            case 'submitPrompt':
                await this.handleSubmitPrompt(message);
                break;
            // ... các case khác sẽ gọi các hàm xử lý riêng ...
            // ví dụ:
            // case 'loadConversations':
            //     await this.handleLoadConversations();
            //     break;
        }
    }

    private async handleSubmitPrompt(message: any) {
        if (this._isStreaming) return;

        this._isStreaming = true;
        this.postMessage({ command: 'showLoading', isLoading: true });
        this.postMessage({ command: 'addUserMessage', text: message.text });

        try {
            const stream = await this._apiService.streamQuery({
                query: message.text,
                conversationId: this._currentConversationId,
                customTitle: message.customTitle
            });
            
            let fullResponseText = '';
            stream.on('data', (chunkText: string) => {
                try {
                    const parsed = JSON.parse(chunkText);
                    if (parsed.conversation_id && !this._currentConversationId) {
                        this._currentConversationId = parsed.conversation_id;
                        this.postMessage({ command: 'setConversationId', conversationId: this._currentConversationId });
                    }
                    if (parsed.response) {
                        fullResponseText = parsed.response; // Cập nhật toàn bộ thay vì nối chuỗi
                        this.postMessage({ command: 'updateStreamingResult', text: fullResponseText, isComplete: false });
                    }
                } catch (e) {
                    // Xử lý chunk không phải JSON nếu cần
                }
            });

            stream.on('end', () => {
                this.postMessage({ command: 'updateStreamingResult', text: fullResponseText, isComplete: true });
                this.resetStreamingState();
                if (this._currentConversationId) {
                    setTimeout(() => this.postMessage({ command: 'loadConversations' }), 500);
                }
            });

            stream.on('error', (error: Error) => {
                this.postMessage({ command: 'showError', text: `Streaming error: ${error.message}` });
                this.resetStreamingState();
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.postMessage({ command: 'showError', text: `Error: ${errorMessage}` });
            this.resetStreamingState();
        }
    }

    private startHealthCheck() {
        this._healthCheckInterval = setInterval(async () => {
            if (this._isStreaming) return;
            const status = await this._apiService.getHealthStatus();
            this.postMessage({ command: 'healthStatus', status });
        }, 15000);
        this._apiService.getHealthStatus().then(status => this.postMessage({ command: 'healthStatus', status }));
    }

    private stopHealthCheck() {
        if (this._healthCheckInterval) {
            clearInterval(this._healthCheckInterval);
            this._healthCheckInterval = null;
        }
    }
    
    private resetStreamingState() {
        this._isStreaming = false;
        this.postMessage({ command: 'showLoading', isLoading: false });
    }

    private postMessage(message: any) {
        this._panel.webview.postMessage(message);
    }
    
    public dispose() {
        ChaliceLabAgentProvider.currentPanel = undefined;
        this.stopHealthCheck();
        this._panel.dispose();
        while (this._disposables.length) {
            this._disposables.pop()?.dispose();
        }
    }
}