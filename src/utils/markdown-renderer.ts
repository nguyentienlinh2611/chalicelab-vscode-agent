import { marked } from 'marked';
import hljs from 'highlight.js';

export class MarkdownRenderer {
    private static instance: MarkdownRenderer;

    private constructor() {
        this.configureMarked();
    }

    public static getInstance(): MarkdownRenderer {
        if (!MarkdownRenderer.instance) {
            MarkdownRenderer.instance = new MarkdownRenderer();
        }
        return MarkdownRenderer.instance;
    }

    private configureMarked(): void {
        const renderer = new marked.Renderer();
        renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
            const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
            const highlightedCode = hljs.highlight(text, { language }).value;
            return `
                <div class="code-container">
                    <button class="copy-btn" title="Copy to clipboard">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>Copy</span>
                    </button>
                    <pre><code class="hljs ${language}">${highlightedCode}</code></pre>
                </div>
            `;
        };

        marked.setOptions({
            renderer,
            gfm: true,
            breaks: true,
        });
    }

    public renderMarkdown(content: any): string {
        console.log('Rendering markdown content:', content);
        // Defensive check: ensure content is a string.
        if (typeof content !== 'string') {
            console.warn('MarkdownRenderer.renderMarkdown received a non-string value:', content);
            if (typeof content === 'object' && content !== null) {
                // If it's an object, format it as a JSON markdown block.
                content = '```json\n' + JSON.stringify(content, null, 2) + '\n```';
            } else {
                // Otherwise, convert it to a string.
                content = String(content);
            }
        }

        try {
            return marked.parse(content) as string;
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return this.escapeHtml(content);
        }
    }

    public renderPartialMarkdown(content: any): string {
        // Defensive check: ensure content is a string.
        if (typeof content !== 'string') {
            console.warn('MarkdownRenderer.renderPartialMarkdown received a non-string value:', content);
            if (typeof content === 'object' && content !== null) {
                content = '```json\n' + JSON.stringify(content, null, 2) + '\n```';
            } else {
                content = String(content);
            }
        }

        try {
            if (this.isIncompleteMarkdown(content)) {
                return `<pre class="partial-markdown">${this.escapeHtml(content)}</pre>`;
            }
            return marked.parse(content) as string;
        } catch (error) {
            console.error('Error rendering partial markdown:', error);
            return this.escapeHtml(content);
        }
    }

    private isIncompleteMarkdown(content: string): boolean {
        const codeBlockMatches = content.match(/```/g);
        return codeBlockMatches !== null && codeBlockMatches.length % 2 === 1;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
