import { MarkdownRenderer } from '../../utils/markdown-renderer';

export interface Message {
    role: 'user' | 'assistant' | 'error';
    content: string;
}

export class ChatManager {
    private chatMessages: HTMLElement;
    private messageInput: HTMLTextAreaElement;
    private sendBtn: HTMLButtonElement;
    private stopBtn: HTMLButtonElement;
    private chatTitle: HTMLElement;
    private serverStatus: HTMLElement;
    private vscode: any;
    private isStreaming: boolean = false;
    private customTitleForNewConversation: string | null = null;
    private currentConversationId: string | null = null;
    private markdownRenderer: MarkdownRenderer;

    constructor(vscode: any) {
        this.vscode = vscode;
        this.markdownRenderer = MarkdownRenderer.getInstance();
        this.chatMessages = document.getElementById('chat-messages')!;
        this.messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
        this.sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
        this.stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
        this.chatTitle = document.getElementById('chat-title')!;
        this.serverStatus = document.getElementById('server-status')!;
        this.initialize();
    }

    private initialize(): void {
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
        });

        // Send message on Enter (but not Shift+Enter)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.stopBtn.addEventListener('click', () => {
            this.vscode.postMessage({ command: 'stopStreaming' });
        });

        // Event delegation for copy buttons
        this.chatMessages.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const copyBtn = target.closest('.copy-btn');

            if (copyBtn) {
                const codeContainer = copyBtn.closest('.code-container');
                const codeElement = codeContainer?.querySelector('code');
                
                if (codeElement) {
                    const textToCopy = codeElement.innerText;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const copySpan = copyBtn.querySelector('span');
                        if (copySpan) {
                            copySpan.textContent = 'Copied!';
                        }
                        copyBtn.classList.add('copied');
                        setTimeout(() => {
                            if (copySpan) {
                                copySpan.textContent = 'Copy';
                            }
                            copyBtn.classList.remove('copied');
                        }, 2000);
                    });
                }
            }
        });

        // Chat title click to rename
        this.chatTitle.addEventListener('click', () => {
            if (this.currentConversationId && this.chatTitle.classList.contains('editable')) {
                const currentTitle = this.chatTitle.getAttribute('data-original-title') || this.chatTitle.textContent?.trim() || '';
                if (currentTitle !== 'ChaliceLab Assistant') {
                    this.renameConversation(this.currentConversationId, currentTitle);
                }
            }
        });
    }

    public clearMessages(): void {
        const hasConversations = document.querySelectorAll('.conversation-item').length > 0;
        const emptyStateHtml = hasConversations 
            ? '<div class="empty-state" id="empty-state"><h2>Start a New Conversation</h2><p>Ask questions about the microservices architecture or start typing below.</p></div>'
            : '<div class="empty-state" id="empty-state"><h2>Welcome to ChaliceLab Assistant</h2><p>This is your first conversation! Ask questions about microservices architecture, code analysis, or any development topics.</p><button class="welcome-action" id="welcome-new-chat">Create Your First Chat</button></div>';
        this.chatMessages.innerHTML = emptyStateHtml;
        
        // Set up event listener for the welcome button if it was just created
        if (!hasConversations) {
            setTimeout(() => {
                const welcomeBtn = document.getElementById('welcome-new-chat');
                if (welcomeBtn) {
                    welcomeBtn.addEventListener('click', () => {
                        this.vscode.postMessage({ command: 'showNewChatModal' });
                    });
                }
            }, 0);
        }
    }

    public updateChatTitle(title: string): void {
        if (title && title.trim()) {
            this.chatTitle.textContent = title;
            this.chatTitle.classList.add('editable');
            this.chatTitle.title = 'Click to rename conversation';
            this.chatTitle.setAttribute('data-original-title', title);
        } else {
            this.chatTitle.textContent = 'ChaliceLab Assistant';
            this.chatTitle.classList.remove('editable');
            this.chatTitle.title = '';
            this.chatTitle.removeAttribute('data-original-title');
        }
    }

    public addMessage(content: string, type: 'user' | 'assistant' | 'error'): HTMLElement {

        console.log('Adding assistant message:', content);
        // Remove empty state if it exists
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (type === 'user') {
            messageDiv.textContent = content;
        } else if (type === 'assistant' && content.trim()) {
            const markdownContent = this.markdownRenderer.renderMarkdown(content);
            messageDiv.innerHTML = `<div class="markdown-content">${markdownContent}</div>`;
        } else {
            messageDiv.textContent = content;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    public updateLastMessage(content: string, isComplete: boolean = false): void {
        const messages = this.chatMessages.querySelectorAll('.message.assistant');
        let lastMessage = messages[messages.length - 1] as HTMLElement;

        // Nếu không tìm thấy tin nhắn cuối cùng hoặc tin nhắn cuối cùng không phải là tin nhắn đang streaming,
        // hãy tạo một tin nhắn mới.
        if (!lastMessage || !lastMessage.classList.contains('streaming')) {
            lastMessage = this.addMessage('', 'assistant');
        }
        
        if (isComplete) {
            // Final render with full markdown
            const markdownContent = this.markdownRenderer.renderMarkdown(content);
            lastMessage.innerHTML = `<div class="markdown-content">${markdownContent}</div>`;
            lastMessage.classList.remove('streaming');
        } else {
            // Streaming render - use partial markdown or plain text
            const streamingContent = this.markdownRenderer.renderPartialMarkdown(content);
            lastMessage.innerHTML = `<div class="markdown-content">${streamingContent}</div>`;
            lastMessage.classList.add('streaming');
        }
        this.scrollToBottom();
    }

    public sendMessage(): void {
        const text = this.messageInput.value.trim();
        if (text && !this.isStreaming) {
            this.vscode.postMessage({
                command: 'submitPrompt',
                text: text,
                customTitle: this.customTitleForNewConversation
            });
            // Clear the custom title after sending
            this.customTitleForNewConversation = null;
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        }
    }

    private scrollToBottom(): void {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTop = mainContent.scrollHeight;
        }
    }

    public getIsStreaming(): boolean {
        return this.isStreaming;
    }

    public setStreaming(isStreaming: boolean): void {
        this.isStreaming = isStreaming;
        if (isStreaming) {
            this.sendBtn.style.display = 'none';
            this.stopBtn.style.display = 'block';
            this.sendBtn.disabled = true;
        } else {
            this.sendBtn.style.display = 'block';
            this.stopBtn.style.display = 'none';
            this.sendBtn.disabled = false;
        }
    }

    public displayConversation(conversation: any): void {
        this.chatMessages.innerHTML = '';
        
        conversation.messages.forEach((msg: any) => {
            this.addMessage(msg.content, msg.role === 'user' ? 'user' : 'assistant');
        });
    }

    public updateServerStatus(status: 'online' | 'offline' | 'checking'): void {
        const statusText = this.serverStatus.querySelector('span')!;
        
        this.serverStatus.className = 'status-indicator';
        if (status === 'online') {
            this.serverStatus.classList.add('status-online');
            statusText.textContent = 'Online';
        } else if (status === 'offline') {
            this.serverStatus.classList.add('status-offline');
            statusText.textContent = 'Offline';
        } else {
            this.serverStatus.classList.add('status-checking');
            statusText.textContent = 'Checking...';
        }
    }

    public setCustomTitleForNewConversation(title: string | null): void {
        this.customTitleForNewConversation = title;
    }

    public setCurrentConversationId(id: string | null): void {
        this.currentConversationId = id;
    }

    private renameConversation(conversationId: string, currentTitle: string): void {
        // Send message to vscode extension to trigger rename modal
        this.vscode.postMessage({
            command: 'showRenameModal',
            conversationId: conversationId,
            currentTitle: currentTitle
        });
    }
}
