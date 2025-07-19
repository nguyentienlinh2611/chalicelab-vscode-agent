import { SidebarManager } from '../components/sidebar/sidebar';
import { ChatManager } from '../components/chat/chat';
import { IngestManager } from '../components/ingest/ingest';
import { ModalsManager } from '../components/modals/modals';
import { SettingsManager } from '../components/settings/SettingsManager';
import { TabManager } from '../utils/tab-manager';
import { HealthChecker } from '../utils/health-checker';

// @ts-ignore
const vscode = acquireVsCodeApi();

// Khởi tạo và quản lý ứng dụng webview
class App {
    private sidebarManager: SidebarManager;
    private chatManager: ChatManager;
    private ingestManager: IngestManager;
    private modalsManager: ModalsManager;
    private settingsManager: SettingsManager;
    private tabManager: TabManager;
    private healthChecker: HealthChecker;

    constructor() {
        this.sidebarManager = new SidebarManager(vscode);
        this.chatManager = new ChatManager(vscode);
        this.ingestManager = new IngestManager(vscode);
        this.modalsManager = new ModalsManager(vscode);
        this.settingsManager = new SettingsManager(vscode);
        this.tabManager = new TabManager();
        this.healthChecker = new HealthChecker(vscode);

        this.setupEventListeners();
        
        // Message handling
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'settingsLoaded':
                    this.settingsManager.setSettings(message.settings);
                    break;
                case 'connectionStatus':
                    this.settingsManager.setConnectionStatus(message.status, message.message);
                    break;
                case 'conversationsLoaded':
                    console.log('Received conversationsLoaded message:', message);
                    console.log('Conversations data:', message.conversations);
                    this.sidebarManager.displayConversations(message.conversations);
                    break;
                    
                case 'conversationLoaded':
                    this.chatManager.displayConversation(message.conversation);
                    this.chatManager.updateChatTitle(message.conversation.title);
                    this.chatManager.setCurrentConversationId(message.conversation.id);
                    break;
                    
                case 'clearConversation':
                    this.chatManager.clearMessages();
                    this.chatManager.updateChatTitle('');
                    if (message.customTitle) {
                        this.chatManager.setCustomTitleForNewConversation(message.customTitle);
                    }
                    break;
                    
                case 'addUserMessage':
                    this.chatManager.addMessage(message.text, 'user');
                    break;
                    
                case 'updateStreamingResult':
                    console.log('Received streaming result:', message.text);
                    // Nếu đây là chunk đầu tiên của một luồng mới, hãy tạo một tin nhắn mới.
                    if (!this.chatManager.getIsStreaming()) {
                        this.chatManager.addMessage('', 'assistant');
                        this.chatManager.setStreaming(true);
                    }
                    
                    // Cập nhật nội dung của tin nhắn cuối cùng.
                    this.chatManager.updateLastMessage(message.text, false);

                    // Nếu đây là chunk cuối cùng, đánh dấu là đã hoàn thành.
                    if (message.isComplete) {
                        this.chatManager.updateLastMessage(message.text, true);
                        this.chatManager.setStreaming(false);
                    }
                    break;

                case 'setConversationId':
                    this.sidebarManager.setCurrentConversationId(message.conversationId);
                    this.chatManager.setCurrentConversationId(message.conversationId);
                    if (message.conversationId) {
                        setTimeout(() => {
                            this.sidebarManager.loadConversations();
                        }, 100);
                    }
                    break;
                    
                case 'showLoading':
                    this.chatManager.setStreaming(message.isLoading);
                    this.ingestManager.setLoading(message.isLoading);
                    break;
                    
                case 'showError':
                    this.chatManager.addMessage(message.text, 'error');
                    this.chatManager.setStreaming(false);
                    break;

                case 'showSuccess':
                    const successMsg = this.chatManager.addMessage(message.text, 'assistant');
                    successMsg.style.backgroundColor = 'var(--vscode-terminal-ansiGreen)';
                    successMsg.style.color = 'var(--vscode-editor-background)';
                    setTimeout(() => {
                        if (successMsg.parentNode) {
                            successMsg.parentNode.removeChild(successMsg);
                        }
                    }, 3000);
                    break;
                    
                case 'showIngestResult':
                    this.ingestManager.showResult(message.text, true);
                    break;
                    
                case 'healthStatus':
                    this.chatManager.updateServerStatus(message.status);
                    break;
                    
                case 'loadConversations':
                    this.sidebarManager.loadConversations();
                    break;

                case 'updateChatTitle':
                    this.chatManager.updateChatTitle(message.title);
                    break;
                    
                case 'showRenameModal':
                    this.modalsManager.setRenameValues(message.conversationId, message.currentTitle);
                    this.modalsManager.showRenameModal();
                    break;
                    
                case 'showNewChatModal':
                    this.modalsManager.showNewChatModal();
                    break;
            }
        });

        // Start health checking
        this.healthChecker.start();
    }

    private setupEventListeners(): void {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
            });
        } else {
            this.initializeEventListeners();
        }
    }

    private initializeEventListeners(): void {
        // Set up event listener for welcome new chat button
        const welcomeNewChatBtn = document.getElementById('welcome-new-chat');
        if (welcomeNewChatBtn) {
            welcomeNewChatBtn.addEventListener('click', () => {
                this.modalsManager.showNewChatModal();
            });
        }
        
        // Set up communication between sidebar and modals
        this.setupSidebarModalCommunication();
    }

    private setupSidebarModalCommunication(): void {
        // Override the sidebar methods to work with modals manager
        const originalDeleteConversation = this.sidebarManager.deleteConversation.bind(this.sidebarManager);
        const originalRenameConversation = this.sidebarManager.renameConversation.bind(this.sidebarManager);
        const originalShowNewChatModal = this.sidebarManager['showNewChatModal'].bind(this.sidebarManager);

        this.sidebarManager.deleteConversation = (id: string) => {
            this.modalsManager.conversationToDelete = id;
            this.modalsManager.showDeleteModal();
        };

        this.sidebarManager.renameConversation = (id: string, title: string) => {
            this.modalsManager.setRenameValues(id, title);
            this.modalsManager.showRenameModal();
        };

        this.sidebarManager['showNewChatModal'] = () => {
            this.modalsManager.showNewChatModal();
        };
    }
}

new App();