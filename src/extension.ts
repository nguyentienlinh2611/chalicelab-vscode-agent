// src/extension.ts
import * as vscode from 'vscode';
import { ChaliceLabAgentProvider } from './providers/ChaliceLabAgentProvider';

export function activate(context: vscode.ExtensionContext) {
    // Chỉ đăng ký command.
    context.subscriptions.push(
        vscode.commands.registerCommand('chalicelab-vscode-agent.start', () => {
            // Gọi phương thức static và truyền context vào.
            // Class ChaliceLabAgentProvider sẽ tự quản lý việc tạo hoặc hiển thị panel.
            ChaliceLabAgentProvider.createOrShow(context);
        })
    );
}

export function deactivate() {}