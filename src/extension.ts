import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// Helper function to make HTTP requests
function makeRequest(url: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: options.timeout || 30000
        };

        const req = protocol.request(requestOptions, (res) => {
            if (options.stream) {
                // For streaming responses, return the response object directly
                resolve(res);
            } else {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        // Try to parse as JSON first
                        const result = JSON.parse(data);
                        resolve({ 
                            ok: res.statusCode! >= 200 && res.statusCode! < 300, 
                            status: res.statusCode, 
                            json: () => result,
                            text: () => data
                        });
                    } catch (error) {
                        // If JSON parsing fails, return as text
                        resolve({ 
                            ok: res.statusCode! >= 200 && res.statusCode! < 300, 
                            status: res.statusCode, 
                            text: () => data,
                            json: () => { throw new Error('Response is not valid JSON'); }
                        });
                    }
                });
            }
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

export function activate(context: vscode.ExtensionContext) {
    // Đăng ký lệnh 'chalicelab-vscode-agent.start'
    let disposable = vscode.commands.registerCommand('chalicelab-vscode-agent.start', () => {
        // Tạo và hiển thị một Webview Panel mới
        const panel = vscode.window.createWebviewPanel(
            'chalicelabAgent', // Định danh nội bộ của webview
            'ChaliceLab Project Agent', // Tiêu đề hiển thị trên panel cho người dùng
            vscode.ViewColumn.One, // Hiển thị panel ở cột soạn thảo chính
            {
                // Cho phép chạy scripts trong webview
                enableScripts: true
            }
        );

        // Thiết lập nội dung HTML cho webview
        panel.webview.html = getWebviewContent();

        // Xử lý các tin nhắn được gửi từ webview (frontend)
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'submitPrompt':
                        try {
                            panel.webview.postMessage({ command: 'showLoading', isLoading: true });
                            panel.webview.postMessage({ command: 'clearResult' });
                            
                            // Use streaming for query
                            const response = await makeRequest('http://localhost:8000/query', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                    query: message.text,
                                    stream: true 
                                }),
                                stream: true
                            });

                            if (response.statusCode >= 200 && response.statusCode < 300) {
                                let fullResponse = '';
                                
                                response.on('data', (chunk: Buffer) => {
                                    const chunkText = chunk.toString();
                                    fullResponse += chunkText;
                                    
                                    // Send incremental updates to the webview
                                    panel.webview.postMessage({ 
                                        command: 'updateStreamingResult', 
                                        text: fullResponse,
                                        isComplete: false
                                    });
                                });
                                
                                response.on('end', () => {
                                    panel.webview.postMessage({ 
                                        command: 'updateStreamingResult', 
                                        text: fullResponse,
                                        isComplete: true
                                    });
                                    panel.webview.postMessage({ command: 'showLoading', isLoading: false });
                                });
                                
                                response.on('error', (error: Error) => {
                                    panel.webview.postMessage({ 
                                        command: 'showError', 
                                        text: `Streaming error: ${error.message}` 
                                    });
                                    panel.webview.postMessage({ command: 'showLoading', isLoading: false });
                                });
                            } else {
                                throw new Error(`HTTP error! status: ${response.statusCode}`);
                            }
                        } catch (error) {
                            panel.webview.postMessage({ 
                                command: 'showError', 
                                text: `Error: ${error.message}` 
                            });
                            panel.webview.postMessage({ command: 'showLoading', isLoading: false });
                        }
                        return;

                    case 'ingestLocal':
                        try {
                            panel.webview.postMessage({ command: 'showLoading', isLoading: true });
                            
                            const response = await makeRequest('http://localhost:8000/ingest/local', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ repo_path: message.repoPath })
                            });

                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }

                            try {
                                const result = response.json();
                                panel.webview.postMessage({ 
                                    command: 'showIngestResult', 
                                    text: `Local repository ingested successfully: ${JSON.stringify(result, null, 2)}` 
                                });
                            } catch (jsonError) {
                                // If JSON parsing fails, show as text
                                const textResult = response.text();
                                panel.webview.postMessage({ 
                                    command: 'showIngestResult', 
                                    text: `Local repository ingested successfully: ${textResult}` 
                                });
                            }
                        } catch (error) {
                            panel.webview.postMessage({ 
                                command: 'showError', 
                                text: `Error ingesting local repository: ${error.message}` 
                            });
                        } finally {
                            panel.webview.postMessage({ command: 'showLoading', isLoading: false });
                        }
                        return;

                    case 'ingestGit':
                        try {
                            panel.webview.postMessage({ command: 'showLoading', isLoading: true });
                            
                            const response = await makeRequest('http://localhost:8000/ingest/git', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                    repo_url: message.repoUrl,
                                    local_dir: message.localDir,
                                    branch: message.branch || 'main'
                                })
                            });

                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }

                            try {
                                const result = response.json();
                                panel.webview.postMessage({ 
                                    command: 'showIngestResult', 
                                    text: `Git repository ingested successfully: ${JSON.stringify(result, null, 2)}` 
                                });
                            } catch (jsonError) {
                                // If JSON parsing fails, show as text
                                const textResult = response.text();
                                panel.webview.postMessage({ 
                                    command: 'showIngestResult', 
                                    text: `Git repository ingested successfully: ${textResult}` 
                                });
                            }
                        } catch (error) {
                            panel.webview.postMessage({ 
                                command: 'showError', 
                                text: `Error ingesting Git repository: ${error.message}` 
                            });
                        } finally {
                            panel.webview.postMessage({ command: 'showLoading', isLoading: false });
                        }
                        return;

                    case 'checkHealth':
                        try {
                            const response = await makeRequest('http://localhost:8000/health', {
                                method: 'GET',
                                timeout: 5000 // 5 second timeout
                            });

                            if (response.ok) {
                                panel.webview.postMessage({ command: 'healthStatus', status: 'online' });
                            } else {
                                panel.webview.postMessage({ command: 'healthStatus', status: 'offline' });
                            }
                        } catch (error) {
                            panel.webview.postMessage({ command: 'healthStatus', status: 'offline' });
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

// Hàm này trả về nội dung HTML đầy đủ cho Webview Panel
function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ChaliceLab Project Agent</title>
        <style>
            /* CSS "lite" theo phong cách OpenUI */
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            h1 {
                font-size: 1.5em;
                font-weight: 600;
                margin-bottom: 10px;
            }
            h2 {
                font-size: 1.2em;
                font-weight: 500;
                margin-top: 30px;
                margin-bottom: 15px;
            }
            .status-indicator {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.9em;
                font-weight: 500;
                margin-bottom: 20px;
            }
            .status-online {
                background-color: #28a745;
                color: white;
            }
            .status-offline {
                background-color: #dc3545;
                color: white;
            }
            .status-checking {
                background-color: #ffc107;
                color: black;
            }
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: currentColor;
            }
            .section {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid var(--vscode-input-border);
                border-radius: 8px;
                background-color: var(--vscode-input-background);
            }
            textarea, input[type="text"] { 
                width: 100%; 
                margin-bottom: 15px; 
                padding: 10px;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                font-size: 1em;
                resize: vertical;
            }
            textarea {
                height: 100px;
            }
            textarea:focus, input[type="text"]:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }
            button { 
                padding: 10px 18px; 
                border: none;
                border-radius: 8px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                font-size: 1em;
                cursor: pointer;
                transition: opacity 0.2s;
                margin-right: 10px;
                margin-bottom: 10px;
            }
            button:hover {
                opacity: 0.8;
            }
            button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .result-container { 
                margin-top: 20px; 
                padding: 15px; 
                background-color: var(--vscode-textBlockQuote-background); 
                border-radius: 8px; 
                border: 1px solid var(--vscode-textBlockQuote-border);
                white-space: pre-wrap;
                font-family: 'Courier New', Courier, monospace;
                min-height: 60px;
                max-height: 400px;
                overflow-y: auto;
            }
            .loading {
                color: var(--vscode-progressBar-background);
                font-style: italic;
            }
            .error {
                color: var(--vscode-errorForeground);
            }
            .success {
                color: var(--vscode-terminal-ansiGreen);
            }
            .streaming {
                color: var(--vscode-editor-foreground);
                position: relative;
            }
            .streaming::after {
                content: '▊';
                animation: blink 1s infinite;
                color: var(--vscode-focusBorder);
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            .tabs {
                display: flex;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--vscode-input-border);
            }
            .tab {
                padding: 10px 20px;
                cursor: pointer;
                border: none;
                background: none;
                color: var(--vscode-editor-foreground);
                margin-right: 0;
                border-bottom: 2px solid transparent;
            }
            .tab.active {
                border-bottom-color: var(--vscode-focusBorder);
                color: var(--vscode-focusBorder);
            }
            .tab-content {
                display: none;
            }
            .tab-content.active {
                display: block;
            }
        </style>
    </head>
    <body>
        <h1>ChaliceLab Project Agent</h1>
        <div id="server-status" class="status-indicator status-checking">
            <div class="status-dot"></div>
            <span>Checking server status...</span>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="switchTab('query')">Query</button>
            <button class="tab" onclick="switchTab('ingest')">Ingest</button>
        </div>

        <div id="query-tab" class="tab-content active">
            <div class="section">
                <h2>Query ChaliceAssistant</h2>
                <p>Ask questions about the microservices architecture (streaming enabled):</p>
                <div class="form-group">
                    <label for="query-input">Your Question:</label>
                    <textarea id="query-input" placeholder="Example: What are the main microservices in ChaliceLab?"></textarea>
                </div>
                <button id="submit-query-button">Submit Query</button>
                <div id="query-result" class="result-container">Query results will appear here...</div>
            </div>
        </div>

        <div id="ingest-tab" class="tab-content">
            <div class="section">
                <h2>Ingest Local Repository</h2>
                <div class="form-group">
                    <label for="local-repo-path">Local Repository Path:</label>
                    <input type="text" id="local-repo-path" placeholder="/path/to/your/repository">
                </div>
                <button id="ingest-local-button">Ingest Local Repository</button>
            </div>

            <div class="section">
                <h2>Ingest Git Repository</h2>
                <div class="form-group">
                    <label for="git-repo-url">Git Repository URL:</label>
                    <input type="text" id="git-repo-url" placeholder="https://github.com/username/repo.git">
                </div>
                <div class="form-group">
                    <label for="git-local-dir">Local Directory:</label>
                    <input type="text" id="git-local-dir" placeholder="/path/to/clone/directory">
                </div>
                <div class="form-group">
                    <label for="git-branch">Branch (optional):</label>
                    <input type="text" id="git-branch" placeholder="main" value="main">
                </div>
                <button id="ingest-git-button">Ingest Git Repository</button>
            </div>

            <div id="ingest-result" class="result-container">Ingest results will appear here...</div>
        </div>
        
        <script>
            // Lấy API để giao tiếp với VS Code extension host
            const vscode = acquireVsCodeApi();

            // Elements
            const submitQueryButton = document.getElementById('submit-query-button');
            const queryInput = document.getElementById('query-input');
            const queryResult = document.getElementById('query-result');
            const ingestLocalButton = document.getElementById('ingest-local-button');
            const ingestGitButton = document.getElementById('ingest-git-button');
            const ingestResult = document.getElementById('ingest-result');
            const serverStatus = document.getElementById('server-status');

            // Tab switching
            function switchTab(tabName) {
                // Hide all tab contents
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show selected tab content
                document.getElementById(tabName + '-tab').classList.add('active');
                event.target.classList.add('active');
            }

            // Query functionality
            submitQueryButton.addEventListener('click', () => {
                const text = queryInput.value.trim();
                if (text) {
                    vscode.postMessage({
                        command: 'submitPrompt',
                        text: text
                    });
                }
            });

            // Local repository ingest
            ingestLocalButton.addEventListener('click', () => {
                const repoPath = document.getElementById('local-repo-path').value.trim();
                if (repoPath) {
                    vscode.postMessage({
                        command: 'ingestLocal',
                        repoPath: repoPath
                    });
                }
            });

            // Git repository ingest
            ingestGitButton.addEventListener('click', () => {
                const repoUrl = document.getElementById('git-repo-url').value.trim();
                const localDir = document.getElementById('git-local-dir').value.trim();
                const branch = document.getElementById('git-branch').value.trim() || 'main';
                
                if (repoUrl && localDir) {
                    vscode.postMessage({
                        command: 'ingestGit',
                        repoUrl: repoUrl,
                        localDir: localDir,
                        branch: branch
                    });
                }
            });

            // Health check functionality
            function checkHealth() {
                vscode.postMessage({
                    command: 'checkHealth'
                });
            }

            // Initial health check and periodic polling
            checkHealth();
            setInterval(checkHealth, 10000); // Check every 10 seconds

            // Listen for messages from extension host
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'showResult':
                        queryResult.textContent = message.text;
                        queryResult.className = 'result-container success';
                        break;
                    case 'showError':
                        queryResult.textContent = message.text;
                        queryResult.className = 'result-container error';
                        break;
                    case 'clearResult':
                        queryResult.textContent = '';
                        queryResult.className = 'result-container';
                        break;
                    case 'updateStreamingResult':
                        queryResult.textContent = message.text;
                        if (message.isComplete) {
                            queryResult.className = 'result-container success';
                        } else {
                            queryResult.className = 'result-container streaming';
                        }
                        // Auto-scroll to bottom
                        queryResult.scrollTop = queryResult.scrollHeight;
                        break;
                    case 'showLoading':
                        if (message.isLoading) {
                            submitQueryButton.disabled = true;
                            ingestLocalButton.disabled = true;
                            ingestGitButton.disabled = true;
                        } else {
                            submitQueryButton.disabled = false;
                            ingestLocalButton.disabled = false;
                            ingestGitButton.disabled = false;
                        }
                        break;
                    case 'showIngestResult':
                        ingestResult.textContent = message.text;
                        ingestResult.className = 'result-container success';
                        break;
                    case 'healthStatus':
                        updateServerStatus(message.status);
                        break;
                }
            });

            function updateServerStatus(status) {
                const statusElement = serverStatus;
                const statusText = statusElement.querySelector('span');
                
                statusElement.className = 'status-indicator';
                if (status === 'online') {
                    statusElement.classList.add('status-online');
                    statusText.textContent = 'Server Online';
                } else {
                    statusElement.classList.add('status-offline');
                    statusText.textContent = 'Server Offline';
                }
            }
        </script>
    </body>
    </html>`;
}

export function deactivate() {}