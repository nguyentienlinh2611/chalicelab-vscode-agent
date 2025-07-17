# Markdown Renderer Test

## Features Supported

### Text Formatting
- **Bold text** using `**bold**` or `__bold__`
- *Italic text* using `*italic*` or `_italic_`
- `Inline code` using backticks

### Code Blocks
```javascript
function helloWorld() {
    console.log("Hello, World!");
    return "success";
}
```

```python
def hello_world():
    print("Hello, World!")
    return "success"
```

```json
{
    "name": "ChaliceLab Agent",
    "version": "1.0.0",
    "features": ["markdown", "streaming", "CSP-compliant"]
}
```

### Lists

#### Unordered Lists
- Item 1
- Item 2
- Item 3

#### Ordered Lists
1. First item
2. Second item
3. Third item

### Blockquotes
> This is a blockquote
> It can span multiple lines

### Headers
# H1 Header
## H2 Header
### H3 Header

### Streaming Support
The renderer supports:
- Partial markdown rendering during streaming
- Complete markdown rendering when streaming is done
- Proper handling of incomplete markdown syntax
- Syntax highlighting for common languages

This implementation is CSP-compliant and doesn't require external libraries!
