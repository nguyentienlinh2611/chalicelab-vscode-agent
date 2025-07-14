export class TabManager {
    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // Make switchTab globally available
        (window as any).switchTab = this.switchTab.bind(this);
    }

    public switchTab(tabName: string): void {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(tabName + '-tab')?.classList.add('active');
        // Note: event.target is not available in this context when called globally
        // We need to find the tab by name
        const targetTab = Array.from(document.querySelectorAll('.tab')).find(tab => 
            tab.textContent?.toLowerCase() === tabName.toLowerCase()
        );
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }
}

export class HealthChecker {
    private vscode: any;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(vscode: any) {
        this.vscode = vscode;
    }

    public start(): void {
        this.checkHealth();
        this.intervalId = setInterval(() => this.checkHealth(), 15000);
    }

    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private checkHealth(): void {
        this.vscode.postMessage({ command: 'checkHealth' });
    }
}
