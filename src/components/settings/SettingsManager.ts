export class SettingsManager {
    private ragHostInput: HTMLInputElement;
    private testConnectionBtn: HTMLButtonElement;
    private connectionStatus: HTMLElement;
    private genAiModelSelect: HTMLSelectElement;
    private saveSettingsBtn: HTMLButtonElement;
    private vscode: any;

    constructor(vscode: any) {
        this.vscode = vscode;
        this.ragHostInput = document.getElementById('rag-host-input') as HTMLInputElement;
        this.testConnectionBtn = document.getElementById('test-connection-btn') as HTMLButtonElement;
        this.connectionStatus = document.getElementById('connection-status') as HTMLElement;
        this.genAiModelSelect = document.getElementById('gen-ai-model-select') as HTMLSelectElement;
        this.saveSettingsBtn = document.getElementById('save-settings-btn') as HTMLButtonElement;
        this.initialize();
    }

    private initialize(): void {
        this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.loadSettings();
    }

    private loadSettings(): void {
        this.vscode.postMessage({ command: 'loadSettings' });
    }

    public setSettings(settings: any): void {
        this.ragHostInput.value = settings.ragHost || '';
        
        // Populate model dropdown
        this.genAiModelSelect.innerHTML = '';
        if (settings.availableModels && settings.availableModels.length > 0) {
            settings.availableModels.forEach((model: string) => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                if (model === settings.selectedModel) {
                    option.selected = true;
                }
                this.genAiModelSelect.appendChild(option);
            });
        }
    }

    private testConnection(): void {
        const host = this.ragHostInput.value;
        this.vscode.postMessage({ command: 'testConnection', host });
    }

    public setConnectionStatus(status: 'success' | 'error', message: string): void {
        this.connectionStatus.className = `connection-status ${status}`;
        this.connectionStatus.textContent = message;
    }

    private saveSettings(): void {
        const settings = {
            ragHost: this.ragHostInput.value,
            selectedModel: this.genAiModelSelect.value,
        };
        this.vscode.postMessage({ command: 'saveSettings', settings });
    }
}
