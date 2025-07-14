// Import CSS and HTML files as strings using esbuild plugin
import sidebarCSS from './components/sidebar/sidebar.css';
import chatCSS from './components/chat/chat.css';
import ingestCSS from './components/ingest/ingest.css';
import modalsCSS from './components/modals/modals.css';

import sidebarHTML from './components/sidebar/sidebar.html';
import chatHTML from './components/chat/chat.html';
import ingestHTML from './components/ingest/ingest.html';
import modalsHTML from './components/modals/modals.html';

import * as fs from 'fs';
import * as path from 'path';

export class WebviewManager {
    private vscode: any;

    constructor(vscode: any) {
        this.vscode = vscode;
    }

    public generateHTML(): string {
        const baseCSS = this.getBaseCSS();
        const mainScript = this.generateMainScript();

        // Generate HTML using imported files
        return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChaliceLab Project Agent</title>
    <style>
        ${baseCSS}
        ${sidebarCSS}
        ${chatCSS}
        ${ingestCSS}
        ${modalsCSS}
    </style>
</head>
<body>
    ${sidebarHTML}

    <!-- Main Content -->
    <div class="main-content">
        <!-- Header with tabs -->
        <div class="tabs">
            <button class="tab active" onclick="switchTab('chat')">Chat</button>
            <button class="tab" onclick="switchTab('ingest')">Ingest</button>
        </div>

        ${chatHTML}
        ${ingestHTML}
    </div>

    ${modalsHTML}
    
    <script>
        ${mainScript}
    </script>
</body>
</html>`;
    }



    private generateMainScript(): string {
        // Read component TypeScript files as text to include in webview script
        const srcPath = path.join(__dirname, '..');
        
        const sidebarManagerCode = fs.readFileSync(path.join(srcPath, 'components/sidebar/sidebar.ts'), 'utf8');
        const chatManagerCode = fs.readFileSync(path.join(srcPath, 'components/chat/chat.ts'), 'utf8');
        const ingestManagerCode = fs.readFileSync(path.join(srcPath, 'components/ingest/ingest.ts'), 'utf8');
        const modalsManagerCode = fs.readFileSync(path.join(srcPath, 'components/modals/modals.ts'), 'utf8');
        const tabManagerCode = fs.readFileSync(path.join(srcPath, 'utils/tab-manager.ts'), 'utf8');
        const healthCheckerCode = fs.readFileSync(path.join(srcPath, 'utils/health-checker.ts'), 'utf8');

        return `
            // Get VS Code API
            const vscode = acquireVsCodeApi();

            // Component class definitions - converted to plain JavaScript
            ${this.convertTSToJS(sidebarManagerCode)}
            ${this.convertTSToJS(chatManagerCode)}
            ${this.convertTSToJS(ingestManagerCode)}
            ${this.convertTSToJS(modalsManagerCode)}
            ${this.convertTSToJS(tabManagerCode)}
            ${this.convertTSToJS(healthCheckerCode)}

            // Global state variables
            let sidebarManager;
            let chatManager;
            let ingestManager;
            let modalsManager;
            let tabManager;
            let healthChecker;

            // Initialize the application
            function init() {
                sidebarManager = new SidebarManager(vscode);
                chatManager = new ChatManager(vscode);
                ingestManager = new IngestManager(vscode);
                modalsManager = new ModalsManager(vscode);
                tabManager = new TabManager();
                healthChecker = new HealthChecker(vscode);

                // Make managers globally available
                window.sidebarManager = sidebarManager;
                window.chatManager = chatManager;
                window.ingestManager = ingestManager;
                window.modalsManager = modalsManager;

                // Set up global functions for onclick handlers
                window.loadConversation = (id) => sidebarManager.loadConversation(id);
                window.deleteConversation = (id) => {
                    modalsManager.conversationToDelete = id;
                    modalsManager.showDeleteModal();
                };
                window.renameConversation = (id, title) => {
                    modalsManager.setRenameValues(id, title);
                    modalsManager.showRenameModal();
                };
                window.showNewChatModal = () => modalsManager.showNewChatModal();
                window.showDeleteModal = () => modalsManager.showDeleteModal();
                window.showRenameModal = () => modalsManager.showRenameModal();
                window.updateChatTitle = (title) => chatManager.updateChatTitle(title);

                // Start health checking
                healthChecker.start();
            }

            // Message handling
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'conversationsLoaded':
                        sidebarManager.displayConversations(message.conversations);
                        break;
                        
                    case 'conversationLoaded':
                        chatManager.displayConversation(message.conversation);
                        chatManager.updateChatTitle(message.conversation.title);
                        break;
                        
                    case 'clearConversation':
                        chatManager.clearMessages();
                        chatManager.updateChatTitle('');
                        if (message.customTitle) {
                            chatManager.setCustomTitleForNewConversation(message.customTitle);
                        }
                        break;
                        
                    case 'addUserMessage':
                        chatManager.addMessage(message.text, 'user');
                        break;
                        
                    case 'updateStreamingResult':
                        if (message.isComplete) {
                            chatManager.updateLastMessage(message.text, true);
                            chatManager.setStreaming(false);
                        } else {
                            if (document.querySelectorAll('.message.assistant').length === 0) {
                                chatManager.addMessage('', 'assistant');
                            }
                            chatManager.updateLastMessage(message.text, false);
                        }
                        break;

                    case 'setConversationId':
                        sidebarManager.setCurrentConversationId(message.conversationId);
                        chatManager.setCurrentConversationId(message.conversationId);
                        if (message.conversationId) {
                            setTimeout(() => {
                                sidebarManager.loadConversations();
                            }, 100);
                        }
                        break;
                        
                    case 'showLoading':
                        chatManager.setStreaming(message.isLoading);
                        ingestManager.setLoading(message.isLoading);
                        break;
                        
                    case 'showError':
                        chatManager.addMessage(message.text, 'error');
                        chatManager.setStreaming(false);
                        break;

                    case 'showSuccess':
                        const successMsg = chatManager.addMessage(message.text, 'assistant');
                        successMsg.style.backgroundColor = 'var(--vscode-terminal-ansiGreen)';
                        successMsg.style.color = 'var(--vscode-editor-background)';
                        setTimeout(() => {
                            if (successMsg.parentNode) {
                                successMsg.parentNode.removeChild(successMsg);
                            }
                        }, 3000);
                        break;
                        
                    case 'showIngestResult':
                        ingestManager.showResult(message.text, true);
                        break;
                        
                    case 'healthStatus':
                        chatManager.updateServerStatus(message.status);
                        break;
                        
                    case 'loadConversations':
                        sidebarManager.loadConversations();
                        break;

                    case 'updateChatTitle':
                        chatManager.updateChatTitle(message.title);
                        break;
                }
            });

            // Initialize the app
            init();
        `;
    }

    private convertTSToJS(tsCode: string): string {
        // Simple TypeScript to JavaScript conversion
        return tsCode
            .replace(/export\s+class/g, 'class')
            .replace(/export\s+\{[^}]*\}/g, '')
            .replace(/import\s+[^;]+;/g, '')
            .replace(/private\s+/g, '')
            .replace(/public\s+/g, '')
            .replace(/protected\s+/g, '')
            .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
            .replace(/:\s*void/g, '')
            .replace(/\?\s*:/g, ':'); // Remove optional parameter markers
    }

    private getBaseCSS(): string {
        return `
        /* Base styles for the entire application */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Main layout */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        /* Tab styles */
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-editor-background);
        }

        .tab {
            padding: 12px 20px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--vscode-editor-foreground);
            border-bottom: 2px solid transparent;
            font-size: 1em;
        }

        .tab.active {
            border-bottom-color: var(--vscode-focusBorder);
            color: var(--vscode-focusBorder);
            font-weight: 500;
        }

        .tab:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .tab-content {
            display: none;
            height: 100%;
        }

        .tab-content.active {
            display: flex;
            flex-direction: column;
        }
        `;
    }
}
