import { SidebarManager } from '../components/sidebar/sidebar';
import { ChatManager } from '../components/chat/chat';
import { IngestManager } from '../components/ingest/ingest';
import { ModalsManager } from '../components/modals/modals';
import { TabManager } from '../utils/tab-manager';
import { HealthChecker } from '../utils/health-checker';

// @ts-ignore
const vscode = acquireVsCodeApi();

// Khởi tạo và quản lý ứng dụng webview
class App {
    constructor() {
        const sidebarManager = new SidebarManager(vscode);
        const chatManager = new ChatManager(vscode);
        const ingestManager = new IngestManager(vscode);
        const modalsManager = new ModalsManager(vscode);
        const tabManager = new TabManager();
        const healthChecker = new HealthChecker(vscode);

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

        // Start health checking
        healthChecker.start();
    }
}

new App();