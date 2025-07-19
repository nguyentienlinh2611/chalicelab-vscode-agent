export interface Conversation {
    id: string;
    title: string;
    updated_at: string;
    messages: Array<{
        role: string;
        content: string;
    }>;
}

export class SidebarManager {
    private conversationsList: HTMLElement;
    private newChatBtn: HTMLElement;
    private currentConversationId: string | null = null;
    private vscode: any;

    constructor(vscode: any) {
        this.vscode = vscode;
        this.conversationsList = document.getElementById('conversations-list')!;
        this.newChatBtn = document.getElementById('new-chat-btn')!;
        this.initialize();
    }

    private initialize(): void {
        this.loadConversations();
        this.newChatBtn.addEventListener('click', () => this.newConversation());
        
        // Set up event delegation for conversation actions
        this.conversationsList.addEventListener('click', (event: Event) => {
            const target = event.target as HTMLElement;
            const conversationItem = target.closest('.conversation-item') as HTMLElement;
            
            if (!conversationItem) {
                return;
            }
            
            const conversationId = conversationItem.getAttribute('data-conversation-id');
            if (!conversationId) {
                return;
            }
            
            if (target.classList.contains('delete-btn')) {
                event.stopPropagation();
                this.deleteConversation(conversationId);
            } else if (target.classList.contains('rename-btn')) {
                event.stopPropagation();
                const titleElement = conversationItem.querySelector('.conversation-title');
                const currentTitle = titleElement?.textContent || '';
                this.renameConversation(conversationId, currentTitle);
            } else if (target.closest('.conversation-item') && !target.closest('.conversation-actions')) {
                // Click on conversation item itself (not on action buttons)
                this.loadConversation(conversationId);
            }
        });
    }

    public loadConversations(): void {
        this.vscode.postMessage({ command: 'loadConversations' });
    }

    public displayConversations(conversations: Conversation[] | null | undefined): void {
        console.log('displayConversations called with:', conversations);
        console.log('Type of conversations:', typeof conversations);
        console.log('Is Array:', Array.isArray(conversations));
        
        this.conversationsList.innerHTML = '';
        
        // Đảm bảo conversations là một mảng trước khi lặp
        const conversationArray = Array.isArray(conversations) ? conversations : [];
        console.log('conversationArray length:', conversationArray.length);

        // If no conversations exist, show new chat modal for first-time experience
        if (conversationArray.length === 0) {
            console.log('No conversations found, showing new chat modal');
            setTimeout(() => {
                this.showNewChatModal();
            }, 500); // Small delay to let the UI settle
        }
        
        conversationArray.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.setAttribute('data-conversation-id', conv.id);
            
            const date = new Date(conv.updated_at).toLocaleDateString();
            
            item.innerHTML = `
                <div class="conversation-content">
                    <div class="conversation-date">${date}</div>
                    <div class="conversation-title">${conv.title}</div>
                </div>
                <div class="conversation-actions">
                    <button class="rename-btn" title="Rename">📝</button>
                    <button class="delete-btn" title="Delete">×</button>
                </div>
            `;
            
            // If this is the current conversation, mark it as active
            if (this.currentConversationId === conv.id) {
                item.classList.add('active');
            }
            
            this.conversationsList.appendChild(item);
        });
    }

    public loadConversation(conversationId: string): void {
        this.currentConversationId = conversationId;
        this.vscode.postMessage({ command: 'loadConversation', conversationId: conversationId });
        
        // Update active conversation in sidebar
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            // The chat title will be updated via message handling in the main app
        }
    }

    public deleteConversation(conversationId: string): void {
        // This method will be overridden by App class to connect with modals
        console.log('Delete conversation:', conversationId);
    }

    public renameConversation(conversationId: string, currentTitle: string): void {
        // This method will be overridden by App class to connect with modals
        console.log('Rename conversation:', conversationId, currentTitle);
    }

    private newConversation(): void {
        this.showNewChatModal();
    }

    private showNewChatModal(): void {
        // This method will be overridden by App class to connect with modals
        console.log('Show new chat modal');
    }

    public setCurrentConversationId(id: string | null): void {
        this.currentConversationId = id;
    }

    public getCurrentConversationId(): string | null {
        return this.currentConversationId;
    }
}
