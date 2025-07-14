export class IngestManager {
    private ingestLocalBtn: HTMLButtonElement;
    private ingestGitBtn: HTMLButtonElement;
    private ingestResult: HTMLElement;
    private vscode: any;

    constructor(vscode: any) {
        this.vscode = vscode;
        this.ingestLocalBtn = document.getElementById('ingest-local-btn') as HTMLButtonElement;
        this.ingestGitBtn = document.getElementById('ingest-git-btn') as HTMLButtonElement;
        this.ingestResult = document.getElementById('ingest-result')!;
        this.initialize();
    }

    private initialize(): void {
        this.ingestLocalBtn.addEventListener('click', () => {
            const repoPath = (document.getElementById('local-repo-path') as HTMLInputElement).value.trim();
            if (repoPath) {
                this.vscode.postMessage({
                    command: 'ingestLocal',
                    repoPath: repoPath
                });
            }
        });

        this.ingestGitBtn.addEventListener('click', () => {
            const repoUrl = (document.getElementById('git-repo-url') as HTMLInputElement).value.trim();
            const localDir = (document.getElementById('git-local-dir') as HTMLInputElement).value.trim();
            const branch = (document.getElementById('git-branch') as HTMLInputElement).value.trim() || 'main';
            
            if (repoUrl && localDir) {
                this.vscode.postMessage({
                    command: 'ingestGit',
                    repoUrl: repoUrl,
                    localDir: localDir,
                    branch: branch
                });
            }
        });
    }

    public setLoading(isLoading: boolean): void {
        this.ingestLocalBtn.disabled = isLoading;
        this.ingestGitBtn.disabled = isLoading;
    }

    public showResult(text: string, isSuccess: boolean = true): void {
        this.ingestResult.textContent = text;
        this.ingestResult.className = `result-container ${isSuccess ? 'success' : 'error'}`;
    }
}
