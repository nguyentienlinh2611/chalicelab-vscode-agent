// src/services/ApiService.ts
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { EventEmitter } from 'events';

export class ApiService {
    private baseUrl = 'http://localhost:8000';

    public async getHealthStatus(): Promise<'online' | 'offline'> {
        try {
            const response = await this.makeRequest(`${this.baseUrl}/health`);
            return response.ok ? 'online' : 'offline';
        } catch {
            return 'offline';
        }
    }
    
    public async streamQuery(params: { query: string, conversationId: string | null, customTitle?: string }): Promise<EventEmitter> {
        const streamEmitter = new EventEmitter();
        const urlObj = new URL(`${this.baseUrl}/query`);
        
        const requestBody: any = {
            query: params.query,
            stream: true,
            conversation_id: params.conversationId,
        };
        if (!params.conversationId && params.customTitle) {
            requestBody.custom_title = params.customTitle;
        }

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };

        const req = http.request(options, (res) => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                res.on('data', chunk => streamEmitter.emit('data', chunk.toString()));
                res.on('end', () => streamEmitter.emit('end'));
                res.on('error', err => streamEmitter.emit('error', err));
            } else {
                streamEmitter.emit('error', new Error(`HTTP Error: ${res.statusCode}`));
            }
        });

        req.on('error', err => streamEmitter.emit('error', err));
        req.write(JSON.stringify(requestBody));
        req.end();
        
        return streamEmitter;
    }

    // ... Thêm các hàm khác ở đây: loadConversations, deleteConversation, etc.
    // bằng cách gọi this.makeRequest(...)

    private makeRequest(url: string, options: any = {}): Promise<any> {
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
}