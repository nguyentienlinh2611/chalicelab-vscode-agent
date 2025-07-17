// src/webview/webviewContentProvider.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const distPath = vscode.Uri.joinPath(extensionUri, 'dist');
    const extensionPath = extensionUri.fsPath;
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'main.css'));
    const highlightJsStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'highlightjs.min.css'));
    const githubDarkStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'github-dark.css'));
    const nonce = getNonce();
    
    // Tải template HTML từ file, ví dụ: src/webview/index.html
    const htmlTemplatePath = vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'index.html');
    let html = fs.readFileSync(htmlTemplatePath.fsPath, 'utf8');


    const sidebarHTML = fs.readFileSync(path.join(extensionPath, 'src', 'components', 'sidebar', 'sidebar.html'), 'utf8');
    const chatHTML = fs.readFileSync(path.join(extensionPath, 'src', 'components', 'chat', 'chat.html'), 'utf8');
    const ingestHTML = fs.readFileSync(path.join(extensionPath, 'src', 'components', 'ingest', 'ingest.html'), 'utf8');
    const settingsHTML = fs.readFileSync(path.join(extensionPath, 'src', 'components', 'settings', 'settings.html'), 'utf8');
    const modalsHTML = fs.readFileSync(path.join(extensionPath, 'src', 'components', 'modals', 'modals.html'), 'utf8');
    
    
    // Thay thế các placeholder
    html = html.replace(/\${cspSource}/g, webview.cspSource)
               .replace(/\${nonce}/g, nonce)
               .replace(/\${styleUri}/g, styleUri.toString())
               .replace(/\${highlightJsStyleUri}/g, highlightJsStyleUri.toString())
               .replace(/\${githubDarkStyleUri}/g, githubDarkStyleUri.toString())
               .replace(/\${scriptUri}/g, scriptUri.toString())
               .replace(/\$\{sidebarHTML\}/g, sidebarHTML)
               .replace(/\$\{chatHTML\}/g, chatHTML)
               .replace(/\$\{ingestHTML\}/g, ingestHTML)
               .replace(/\$\{settingsHTML\}/g, settingsHTML)
               .replace(/\$\{modalsHTML\}/g, modalsHTML);
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