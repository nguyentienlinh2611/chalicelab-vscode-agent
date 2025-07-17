// src/providers/ChaliceLabAgentProvider.ts
import * as vscode from 'vscode';
import { ApiService, StreamEventEmitter } from '../services/ApiService';
import { getWebviewContent } from '../webview/webviewContentProvider';

export class ChaliceLabAgentProvider {
    public static currentPanel: ChaliceLabAgentProvider | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _context: vscode.ExtensionContext;
    private readonly _apiService: ApiService;
    private _disposables: vscode.Disposable[] = [];

    // State management
    private _isStreaming = false;
    private _currentStreamingRequest: StreamEventEmitter | null = null;
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
            case 'ingestLocal':
                await this.handleIngestLocal(message);
                break;
            case 'ingestGit':
                await this.handleIngestGit(message);
                break;
            case 'loadConversations':
                await this.handleLoadConversations();
                break;
            case 'loadConversation':
                await this.handleLoadConversation(message);
                break;
            case 'deleteConversation':
                await this.handleDeleteConversation(message);
                break;
            case 'renameConversation':
                await this.handleRenameConversation(message);
                break;
            case 'newConversation':
                this.handleNewConversation(message);
                break;
            case 'stopStreaming':
                this.handleStopStreaming();
                break;
            case 'loadSettings':
                this.handleLoadSettings();
                break;
            case 'saveSettings':
                this.handleSaveSettings(message.settings);
                break;
            case 'testConnection':
                this.handleTestConnection(message.host);
                break;
        }
    }

    private handleLoadSettings() {
        // Giả sử bạn có một phương thức để lấy cài đặt
        const settings = {
            ragHost: this._context.workspaceState.get('ragHost', 'http://localhost:8000'),
            selectedModel: this._context.workspaceState.get('selectedModel', 'default-model'),
            availableModels: ['default-model', 'model-x', 'model-y'], // Lấy danh sách này từ API hoặc config
        };
        this.postMessage({ command: 'settingsLoaded', settings });
    }

    private async handleSaveSettings(settings: any) {
        await this._context.workspaceState.update('ragHost', settings.ragHost);
        await this._context.workspaceState.update('selectedModel', settings.selectedModel);
        // Cập nhật lại ApiService nếu cần
        this._apiService.setHost(settings.ragHost);
        this.postMessage({ command: 'showSuccess', text: 'Settings saved successfully!' });
    }

    private async handleTestConnection(host: string) {
        const status = await this._apiService.getHealthStatus(host);
        if (status === 'online') {
            this.postMessage({ command: 'connectionStatus', status: 'success', message: 'Connection successful!' });
            // Tải lại danh sách cuộc trò chuyện sau khi kết nối thành công
            this.handleLoadConversations();
        } else {
            this.postMessage({ command: 'connectionStatus', status: 'error', message: 'Connection failed.' });
        }
    }

    private async handleSubmitPrompt(message: any) {
        if (this._isStreaming) {
            return;
        }

        this._isStreaming = true;
        this.postMessage({ command: 'showLoading', isLoading: true });
        this.postMessage({ command: 'addUserMessage', text: message.text });

        try {
            this._currentStreamingRequest = await this._apiService.streamQuery({
                query: message.text,
                conversationId: this._currentConversationId,
                customTitle: message.customTitle
            });
            
            let fullResponseText = '';
            this._currentStreamingRequest.on('data', (chunk: any) => {
                // Chỉ gửi conversation ID nếu nó chưa được thiết lập
                if (chunk.conversation_id && !this._currentConversationId) {
                    this._currentConversationId = chunk.conversation_id;
                    this.postMessage({ command: 'setConversationId', conversationId: this._currentConversationId });
                }
                
                let responseChunk = '';
                if (typeof chunk.response === 'string') {
                    responseChunk = chunk.response;
                } else if (typeof chunk.response === 'object' && chunk.response !== null) {
                    responseChunk = JSON.stringify(chunk.response, null, 2);
                }

                if (responseChunk) {
                    fullResponseText += responseChunk; // Nối chunk mới vào nội dung đã có
                    this.postMessage({ command: 'updateStreamingResult', text: fullResponseText, isComplete: false });
                }
            });

            this._currentStreamingRequest.on('end', () => {
                this.postMessage({ command: 'updateStreamingResult', text: fullResponseText, isComplete: true });
                this.resetStreamingState();
                if (this._currentConversationId) {
                    setTimeout(() => this.handleLoadConversations(), 500);
                }
            });

            this._currentStreamingRequest.on('error', (error: Error) => {
                this.postMessage({ command: 'showError', text: `Streaming error: ${error.message}` });
                this.resetStreamingState();
            });

        } catch (error) {
            this.handleError(error, "Error submitting prompt");
            this.resetStreamingState();
        }
    }

    private async handleIngestLocal(message: any) {
        this.postMessage({ command: 'showLoading', isLoading: true });
        try {
            const result = await this._apiService.ingestLocal(message.repoPath);
            this.postMessage({ command: 'showIngestResult', text: `Local repository ingested successfully: ${JSON.stringify(result, null, 2)}` });
        } catch (error) {
            this.handleError(error, "Error ingesting local repository");
        } finally {
            this.postMessage({ command: 'showLoading', isLoading: false });
        }
    }

    private async handleIngestGit(message: any) {
        this.postMessage({ command: 'showLoading', isLoading: true });
        try {
            const result = await this._apiService.ingestGit({
                repo_url: message.repoUrl,
                local_dir: message.localDir,
                branch: message.branch
            });
            this.postMessage({ command: 'showIngestResult', text: `Git repository ingested successfully: ${JSON.stringify(result, null, 2)}` });
        } catch (error) {
            this.handleError(error, "Error ingesting Git repository");
        } finally {
            this.postMessage({ command: 'showLoading', isLoading: false });
        }
    }

    private async handleLoadConversations() {
        try {
            let conversations: any = await this._apiService.loadConversations();
            // Đảm bảo rằng chúng ta luôn gửi đi một mảng
            if (conversations && !Array.isArray(conversations) && Array.isArray(conversations.conversations)) {
                conversations = conversations.conversations;
            }
            this.postMessage({ command: 'conversationsLoaded', conversations: conversations || [] });
        } catch (error) {
            this.handleError(error, "Error loading conversations");
            // Gửi một mảng rỗng trong trường hợp có lỗi
            this.postMessage({ command: 'conversationsLoaded', conversations: [] });
        }
    }

    private async handleLoadConversation(message: any) {
        try {
            const conversation = await this._apiService.loadConversation(message.conversationId);
            this._currentConversationId = message.conversationId;
            this.postMessage({ command: 'conversationLoaded', conversation: conversation });
        } catch (error) {
            this.handleError(error, "Error loading conversation");
        }
    }

    private async handleDeleteConversation(message: any) {
        try {
            await this._apiService.deleteConversation(message.conversationId);
            if (this._currentConversationId === message.conversationId) {
                this.handleNewConversation(); // Clear the view
            }
            await this.handleLoadConversations(); // Refresh list
        } catch (error) {
            this.handleError(error, "Error deleting conversation");
        }
    }

    private async handleRenameConversation(message: any) {
        try {
            await this._apiService.renameConversation(message.conversationId, message.newTitle);
            if (this._currentConversationId === message.conversationId) {
                this.postMessage({ command: 'updateChatTitle', title: message.newTitle });
            }
            await this.handleLoadConversations(); // Refresh list
            this.postMessage({ command: 'showSuccess', text: 'Conversation renamed!' });
        } catch (error) {
            this.handleError(error, "Error renaming conversation");
        }
    }

    private handleNewConversation(message?: any) {
        this._currentConversationId = null;
        this.postMessage({ command: 'clearConversation', customTitle: message?.customTitle });
        // Tải lại danh sách cuộc trò chuyện để hiển thị cuộc trò chuyện mới (nếu có)
        // hoặc để đảm bảo sidebar trống nếu không có cuộc trò chuyện nào.
        this.handleLoadConversations();
    }

    private handleStopStreaming() {
        if (this._isStreaming && this._currentStreamingRequest) {
            this._currentStreamingRequest.destroy();
        }
        this.resetStreamingState();
        this.postMessage({ command: 'updateStreamingResult', text: '\n(Streaming stopped by user)', isComplete: true });
    }

    // --- Các hàm tiện ích và quản lý vòng đời ---

    private startHealthCheck() {
        this.stopHealthCheck(); // Ensure no multiple intervals running
        let lastStatus: 'online' | 'offline' | 'checking' = 'checking';

        const check = async () => {
            if (this._isStreaming) {
                return;
            }
            const status = await this._apiService.getHealthStatus();
            if (status === 'online' && lastStatus === 'offline') {
                // Nếu server vừa online trở lại, hãy tải lại các cuộc trò chuyện
                this.handleLoadConversations();
            }
            lastStatus = status;
            this.postMessage({ command: 'healthStatus', status });
        };

        this._healthCheckInterval = setInterval(check, 15000);
        check(); // Thực hiện kiểm tra ngay lập tức
    }

    private stopHealthCheck() {
        if (this._healthCheckInterval) {
            clearInterval(this._healthCheckInterval);
            this._healthCheckInterval = null;
        }
    }
    
    private resetStreamingState() {
        this._isStreaming = false;
        this._currentStreamingRequest = null;
        this.postMessage({ command: 'showLoading', isLoading: false });
    }

    private postMessage(message: any) {
        this._panel.webview.postMessage(message);
    }

    private handleError(error: unknown, contextMessage: string) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(contextMessage, error);
        this.postMessage({ command: 'showError', text: `${contextMessage}: ${errorMessage}` });
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