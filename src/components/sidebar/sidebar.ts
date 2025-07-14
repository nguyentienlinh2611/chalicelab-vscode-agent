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
    }

    public loadConversations(): void {
        this.vscode.postMessage({ command: 'loadConversations' });
    }

    public displayConversations(conversations: Conversation[]): void {
        this.conversationsList.innerHTML = '';
        
        // If no conversations exist, show new chat modal for first-time experience
        if (conversations.length === 0) {
            setTimeout(() => {
                this.showNewChatModal();
            }, 500); // Small delay to let the UI settle
        }
        
        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.setAttribute('data-conversation-id', conv.id);
            
            const date = new Date(conv.updated_at).toLocaleDateString();
            
            item.innerHTML = `
                <div style="flex: 1;" onclick="loadConversation('${conv.id}')">
                    <div class="conversation-date">${date}</div>
                    <div class="conversation-title">${conv.title}</div>
                </div>
                <div class="conversation-actions">
                    <button class="rename-btn" onclick="renameConversation('${conv.id}', '${conv.title.replace(/'/g, "\\'")}'); event.stopPropagation();" title="Rename">📝</button>
                    <button class="delete-btn" onclick="deleteConversation('${conv.id}'); event.stopPropagation();" title="Delete">×</button>
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
            // Update chat title with conversation title
            const titleElement = activeItem.querySelector('.conversation-title');
            if (titleElement && titleElement.textContent) {
                window.updateChatTitle(titleElement.textContent);
            }
        }
    }

    public deleteConversation(conversationId: string): void {
        window.conversationToDelete = conversationId;
        window.showDeleteModal();
    }

    public renameConversation(conversationId: string, currentTitle: string): void {
        window.conversationToRename = conversationId;
        const input = document.getElementById('new-conversation-title') as HTMLInputElement;
        if (input) {
            input.value = currentTitle;
        }
        window.showRenameModal();
    }

    private newConversation(): void {
        window.showNewChatModal();
    }

    private showNewChatModal(): void {
        window.showNewChatModal();
    }

    public setCurrentConversationId(id: string | null): void {
        this.currentConversationId = id;
    }

    public getCurrentConversationId(): string | null {
        return this.currentConversationId;
    }
}

// Make functions global for onclick handlers
declare global {
    interface Window {
        loadConversation: (id: string) => void;
        deleteConversation: (id: string) => void;
        renameConversation: (id: string, title: string) => void;
        conversationToDelete: string | null;
        conversationToRename: string | null;
        showDeleteModal: () => void;
        showRenameModal: () => void;
        showNewChatModal: () => void;
        updateChatTitle: (title: string) => void;
    }
}
