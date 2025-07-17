import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class WebviewManager {
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;

    constructor(panel: vscode.WebviewPanel, extensionPath: string) {
        this._panel = panel;
        this._extensionPath = extensionPath;

        // Thiết lập nội dung HTML cho webview
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Tạo đường dẫn an toàn cho các tài nguyên đã được build
        const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'dist', 'webview.js'));
        const stylePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'dist', 'webview.css'));
        
        // Chuyển đổi thành URI mà webview có thể sử dụng
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        const styleUri = webview.asWebviewUri(stylePathOnDisk);

        // Tạo nonce để tăng cường bảo mật
        const nonce = getNonce();

        // Tải template HTML từ file thay vì hardcode
        const htmlTemplatePath = path.join(this._extensionPath, 'src', 'webview', 'index.html');
        let html = fs.readFileSync(htmlTemplatePath, 'utf8');

        // Thay thế các placeholder bằng URI và nonce
        html = html.replace(/\${cspSource}/g, webview.cspSource);
        html = html.replace(/\${nonce}/g, nonce);
        html = html.replace(/\${styleUri}/g, styleUri.toString());
        html = html.replace(/\${scriptUri}/g, scriptUri.toString());
        
        return html;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}