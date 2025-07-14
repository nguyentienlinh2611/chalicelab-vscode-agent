export class ModalsManager {
    private deleteModal: HTMLElement;
    private renameModal: HTMLElement;
    private newChatModal: HTMLElement;
    private newConversationTitleInput: HTMLInputElement;
    private newChatTitleInput: HTMLInputElement;
    private vscode: any;
    
    public conversationToDelete: string | null = null;
    public conversationToRename: string | null = null;
    public pendingNewChatTitle: string | null = null;

    constructor(vscode: any) {
        this.vscode = vscode;
        this.deleteModal = document.getElementById('delete-modal')!;
        this.renameModal = document.getElementById('rename-modal')!;
        this.newChatModal = document.getElementById('new-chat-modal')!;
        this.newConversationTitleInput = document.getElementById('new-conversation-title') as HTMLInputElement;
        this.newChatTitleInput = document.getElementById('new-chat-title') as HTMLInputElement;
        this.initialize();
    }

    private initialize(): void {
        // Delete modal
        const confirmDeleteBtn = document.getElementById('confirm-delete')!;
        const cancelDeleteBtn = document.getElementById('cancel-delete')!;
        confirmDeleteBtn.addEventListener('click', () => this.confirmDeleteConversation());
        cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());

        // Rename modal
        const confirmRenameBtn = document.getElementById('confirm-rename')!;
        const cancelRenameBtn = document.getElementById('cancel-rename')!;
        confirmRenameBtn.addEventListener('click', () => this.confirmRenameConversation());
        cancelRenameBtn.addEventListener('click', () => this.hideRenameModal());

        // New chat modal
        const confirmNewChatBtn = document.getElementById('confirm-new-chat')!;
        const cancelNewChatBtn = document.getElementById('cancel-new-chat')!;
        confirmNewChatBtn.addEventListener('click', () => this.confirmNewChat());
        cancelNewChatBtn.addEventListener('click', () => this.hideNewChatModal());

        // Handle Enter key in rename input
        this.newConversationTitleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirmRenameConversation();
            } else if (e.key === 'Escape') {
                this.hideRenameModal();
            }
        });

        // Handle Enter key in new chat input
        this.newChatTitleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirmNewChat();
            } else if (e.key === 'Escape') {
                this.hideNewChatModal();
            }
        });

        // Close modal when clicking outside
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.hideDeleteModal();
            }
        });

        this.renameModal.addEventListener('click', (e) => {
            if (e.target === this.renameModal) {
                this.hideRenameModal();
            }
        });

        this.newChatModal.addEventListener('click', (e) => {
            if (e.target === this.newChatModal) {
                this.hideNewChatModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.deleteModal.classList.contains('show')) {
                    this.hideDeleteModal();
                }
                if (this.renameModal.classList.contains('show')) {
                    this.hideRenameModal();
                }
                if (this.newChatModal.classList.contains('show')) {
                    this.hideNewChatModal();
                }
            }
        });
    }

    public showDeleteModal(): void {
        this.deleteModal.classList.add('show');
    }

    public hideDeleteModal(): void {
        this.deleteModal.classList.remove('show');
        this.conversationToDelete = null;
    }

    public showRenameModal(): void {
        this.renameModal.classList.add('show');
        // Focus and select the input text
        setTimeout(() => {
            this.newConversationTitleInput.focus();
            this.newConversationTitleInput.select();
        }, 100);
    }

    public hideRenameModal(): void {
        this.renameModal.classList.remove('show');
        this.conversationToRename = null;
        this.newConversationTitleInput.value = '';
    }

    public showNewChatModal(): void {
        const hasConversations = document.querySelectorAll('.conversation-item').length > 0;
        const modalTitle = this.newChatModal.querySelector('.modal-title')!;
        const modalLabel = this.newChatModal.querySelector('label')!;
        
        if (!hasConversations) {
            // First conversation
            modalTitle.textContent = 'Welcome! Create Your First Chat';
            modalLabel.textContent = 'Give your first conversation a name (optional):';
        } else {
            // Additional conversations
            modalTitle.textContent = 'New Conversation';
            modalLabel.textContent = 'Enter conversation title (optional):';
        }
        
        this.newChatModal.classList.add('show');
        // Focus the input
        setTimeout(() => {
            this.newChatTitleInput.focus();
        }, 100);
    }

    public hideNewChatModal(): void {
        this.newChatModal.classList.remove('show');
        this.newChatTitleInput.value = '';
        this.pendingNewChatTitle = null;
    }

    private confirmDeleteConversation(): void {
        if (this.conversationToDelete) {
            this.vscode.postMessage({ 
                command: 'deleteConversation', 
                conversationId: this.conversationToDelete 
            });
            this.hideDeleteModal();
        }
    }

    private confirmRenameConversation(): void {
        if (this.conversationToRename && this.newConversationTitleInput.value.trim()) {
            this.vscode.postMessage({ 
                command: 'renameConversation', 
                conversationId: this.conversationToRename,
                newTitle: this.newConversationTitleInput.value.trim()
            });
            this.hideRenameModal();
        }
    }

    private confirmNewChat(): void {
        this.pendingNewChatTitle = this.newChatTitleInput.value.trim() || null;
        this.hideNewChatModal();
        this.proceedWithNewConversation();
    }

    private proceedWithNewConversation(): void {
        this.vscode.postMessage({ 
            command: 'newConversation',
            customTitle: this.pendingNewChatTitle
        });
        
        // Clear active conversation
        document.querySelectorAll('.conversation-item').forEach((item: Element) => {
            item.classList.remove('active');
        });
        
        // Clear messages and update title
        if ((window as any).chatManager) {
            (window as any).chatManager.clearMessages();
            (window as any).chatManager.updateChatTitle(''); // Reset to default title
        }
        this.pendingNewChatTitle = null;
    }

    public setRenameValues(conversationId: string, currentTitle: string): void {
        this.conversationToRename = conversationId;
        this.newConversationTitleInput.value = currentTitle;
    }
}
