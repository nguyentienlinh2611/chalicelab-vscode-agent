import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    // Đăng ký lệnh 'prompt-helper-lite.start'
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
            message => {
                switch (message.command) {
                    case 'submitPrompt':
                        // Trong một ứng dụng thực tế, đây là nơi bạn sẽ gọi API của LLM
                        // với nội dung là `message.text`
                        vscode.window.showInformationMessage('Prompt đã nhận: ' + message.text);
                        
                        // Giả lập một kết quả trả về từ LLM
                        const resultFromLLM = `Đây là kết quả từ LLM cho prompt của bạn: "${message.text}"`;

                        // Gửi kết quả lại cho webview để hiển thị
                        panel.webview.postMessage({ command: 'showResult', text: resultFromLLM });
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
        <title>Prompt Helper</title>
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
            }
            textarea { 
                width: 100%; 
                height: 250px; 
                margin-bottom: 1em; 
                padding: 10px;
                box-sizing: border-box;
                border-radius: 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                font-size: 1em;
                resize: vertical;
            }
            textarea:focus {
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
            }
            button:hover {
                opacity: 0.8;
            }
            #result-container { 
                margin-top: 1.5em; 
                padding: 15px; 
                background-color: var(--vscode-textBlockQuote-background); 
                border-radius: 8px; 
                border: 1px solid var(--vscode-textBlockQuote-border);
                white-space: pre-wrap; /* Giữ nguyên định dạng xuống dòng */
                font-family: 'Courier New', Courier, monospace;
            }
        </style>
    </head>
    <body>
        <h1>Prompt Helper Lite</h1>
        <p>Nhập prompt của bạn vào ô dưới đây và chạy để nhận kết quả.</p>

        <textarea id="prompt-input" placeholder="Ví dụ: Giải thích khái niệm RAG trong 3 dòng..."></textarea>
        
        <button id="submit-button">Chạy Prompt</button>
        
        <div id="result-container">Kết quả sẽ được hiển thị ở đây...</div>
        
        <script>
            // Lấy API để giao tiếp với VS Code extension host
            const vscode = acquireVsCodeApi();

            const submitButton = document.getElementById('submit-button');
            const promptInput = document.getElementById('prompt-input');
            const resultContainer = document.getElementById('result-container');

            // Gửi prompt đến extension host khi nhấn nút
            submitButton.addEventListener('click', () => {
                const text = promptInput.value;
                if (text) {
                    resultContainer.textContent = 'Đang xử lý...';
                    vscode.postMessage({
                        command: 'submitPrompt',
                        text: text
                    });
                }
            });

            // Lắng nghe tin nhắn từ extension host (kết quả từ LLM)
            window.addEventListener('message', event => {
                const message = event.data; // Dữ liệu được gửi từ extension host
                switch (message.command) {
                    case 'showResult':
                        resultContainer.textContent = message.text;
                        break;
                }
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {}