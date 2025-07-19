import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { EventEmitter } from 'events';

/**
 * Định nghĩa một kiểu tùy chỉnh cho EventEmitter để nó tường minh hơn.
 * Nó sẽ phát ra các sự kiện 'data', 'end', và 'error'.
 */
export interface StreamEventEmitter extends EventEmitter {
    destroy(): void;
}

export class ApiService {
    private host: string = 'http://localhost:8000';

    public setHost(host: string) {
        this.host = host;
    }

    /**
     * Kiểm tra trạng thái của server backend.
     */
    public async getHealthStatus(host?: string): Promise<'online' | 'offline'> {
        const targetHost = host || this.host;
        try {
            const response = await fetch(`${targetHost}/health`);
            if (response.ok) {
                return 'online';
            }
            return 'offline';
        } catch (error) {
            return 'offline';
        }
    }

    /**
     * Gửi một truy vấn và nhận về một stream các câu trả lời.
     */
    public async streamQuery(params: {
        query: string;
        conversationId?: string | null;
        customTitle?: string | null;
    }): Promise<StreamEventEmitter> {
        const streamEmitter = new EventEmitter() as StreamEventEmitter;
        const urlObj = new URL(`${this.host}/query`);
        if (params.conversationId) {
            urlObj.searchParams.append('conversation_id', params.conversationId);
        }
        if (params.customTitle) {
            urlObj.searchParams.append('custom_title', params.customTitle);
        }

        const requestBody: any = {
            query: params.query,
            stream: true,
        };

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };

        const req = http.request(options, (res) => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                res.on('data', (chunk: Buffer) => {
                    const chunkText = chunk.toString();
                    console.log('Received chunk:', chunkText);
                    // Giả sử server trả về JSON trên mỗi dòng
                    streamEmitter.emit('data', { "conversation_id": params.conversationId, "response": chunkText });
                });
                res.on('end', () => streamEmitter.emit('end'));
                res.on('error', (err) => streamEmitter.emit('error', err));
            } else {
                streamEmitter.emit('error', new Error(`HTTP Error: ${res.statusCode}`));
            }
        });

        req.on('error', (err) => streamEmitter.emit('error', err));
        req.on('timeout', () => {
            req.destroy();
            streamEmitter.emit('error', new Error('Request timeout'));
        });

        // Cung cấp một hàm để hủy stream từ bên ngoài
        streamEmitter.destroy = () => {
            if (!req.destroyed) {
                req.destroy();
            }
        };

        req.write(JSON.stringify(requestBody));
        req.end();
        
        return streamEmitter;
    }

    private async makeRequest(url: string, options: RequestInit = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Tải danh sách tất cả các cuộc hội thoại.
     */
    public async loadConversations(): Promise<{conversations: []}> {
        return this.makeRequest(`${this.host}/conversations`);
    }

    /**
     * Tải chi tiết một cuộc hội thoại.
     */
    public async loadConversation(id: string): Promise<any> {
        return this.makeRequest(`${this.host}/conversations/${id}`);
    }

    /**
     * Xóa một cuộc hội thoại.
     */
    public async deleteConversation(id: string): Promise<void> {
        await this.makeRequest(`${this.host}/conversations/${id}`, { method: 'DELETE' });
    }

    /**
     * Đổi tên một cuộc hội thoại.
     */
    public async renameConversation(id: string, newTitle: string): Promise<void> {
        await this.makeRequest(`${this.host}/conversations/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title: newTitle }),
        });
    }

    /**
     * Nạp dữ liệu từ một repository cục bộ.
     */
    public async ingestLocal(repoPath: string): Promise<any> {
        return this.makeRequest(`${this.host}/ingest/local`, {
            method: 'POST',
            body: JSON.stringify({ repo_path: repoPath }),
        });
    }

    /**
     * Nạp dữ liệu từ một Git repository.
     */
    public async ingestGit(params: { repo_url: string; local_dir: string; branch?: string }): Promise<any> {
        return this.makeRequest(`${this.host}/ingest/git`, {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }
}