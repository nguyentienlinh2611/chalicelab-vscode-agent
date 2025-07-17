// src/webview/webviewContentProvider.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const distPath = vscode.Uri.joinPath(extensionUri, 'dist');
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'webview.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'webview.css'));
    const nonce = getNonce();
    
    // Tải template HTML từ file, ví dụ: src/webview/index.html
    const htmlTemplatePath = vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'index.html');
    let html = fs.readFileSync(htmlTemplatePath.fsPath, 'utf8');
    
    // Thay thế các placeholder
    html = html.replace(/\${cspSource}/g, webview.cspSource)
               .replace(/\${nonce}/g, nonce)
               .replace(/\${styleUri}/g, styleUri.toString())
               .replace(/\${scriptUri}/g, scriptUri.toString());
    return html;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}