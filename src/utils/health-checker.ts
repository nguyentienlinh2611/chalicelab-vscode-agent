export class HealthChecker {
    private vscode: any;
    private intervalId: number | null = null;

    constructor(vscode: any) {
        this.vscode = vscode;
    }

    public start(): void {
        // Initial health check
        this.checkHealth();

        // Set up periodic health checking every 30 seconds
        this.intervalId = window.setInterval(() => {
            this.checkHealth();
        }, 30000);
    }

    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private checkHealth(): void {
        this.vscode.postMessage({
            command: 'checkHealth'
        });
    }
}
