# ChaliceLab VS Code Agent

A powerful VS Code extension that provides an intelligent AI assistant interface for the ChaliceLab project ecosystem. This extension integrates with a RAG (Retrieval-Augmented Generation) server to offer context-aware programming assistance, project guidance, and service deployment support.

## 🌟 Overview

ChaliceLab VS Code Agent is designed to enhance developer productivity within the ChaliceLab project environment. It provides a chat-based interface where developers can interact with an AI agent that has deep knowledge of the project's codebase, documentation, and system architecture.

## ✨ Features

### 🤖 Intelligent AI Assistant
- **Context-Aware Chat Interface**: Interactive chat UI for seamless communication with the AI agent
- **Project-Specific Knowledge**: AI trained on ChaliceLab project documentation and codebase
- **Real-time Streaming Responses**: Get immediate feedback with streaming response capability

### 📚 Repository Integration
- **Multi-Repository Ingestion**: Ingest and index multiple repositories from the ChaliceLab ecosystem
- **Local Repository Support**: Index local project files for enhanced context understanding
- **Git Repository Integration**: Direct integration with remote Git repositories
- **Documentation Indexing**: Automatically process and index system documentation

### 🔧 Development Support
- **Code Analysis**: Get insights and suggestions based on your current codebase
- **Service Deployment Guidance**: Receive assistance with ChaliceLab service deployment
- **Architecture Recommendations**: Get architectural advice based on project patterns
- **Troubleshooting Support**: Debug issues with context from project history

### 💬 Advanced Chat Features
- **Conversation Management**: Save, load, and manage multiple conversation threads
- **Conversation History**: Access previous discussions and maintain context
- **Custom Conversation Titles**: Organize conversations with meaningful names
- **Export Conversations**: Save important discussions for future reference

### ⚙️ Configuration & Settings
- **RAG Server Configuration**: Configure connection to your RAG server
- **Model Selection**: Choose from available AI models
- **Connection Testing**: Verify server connectivity and health status
- **Workspace Integration**: Seamless integration with VS Code workspace settings

## 🚀 Getting Started

### Prerequisites

- **VS Code**: Version 1.101.0 or higher
- **RAG Server**: A running ChaliceLab RAG server instance
- **Node.js**: For development and extension compilation

### Installation

#### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "ChaliceLab VS Code Agent"
4. Click Install

#### Manual Installation
1. Download the latest `.vsix` file from [Releases](https://github.com/nguyentienlinh2611/chalicelab-vscode-agent/releases)
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
4. Click the three dots menu (...) → "Install from VSIX..."
5. Select the downloaded `.vsix` file

### Quick Setup

1. **Open the Extension**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "ChaliceLab Project Agent" and select the command

2. **Configure RAG Server**:
   - Click the settings icon in the extension panel
   - Enter your RAG server URL (default: `http://localhost:8000`)
   - Test the connection to ensure connectivity

3. **Ingest Your Project**:
   - Use the "Ingest" tab to add your repositories
   - Choose between local repository or Git repository ingestion
   - Wait for the indexing process to complete

4. **Start Chatting**:
   - Switch to the "Chat" tab
   - Begin asking questions about your ChaliceLab project

## 🏗️ Architecture

The extension consists of several key components:

### Frontend Components
- **Chat Interface**: Main conversation UI with message history and streaming support
- **Sidebar Navigation**: Conversation management and navigation
- **Settings Panel**: Configuration and server connection management
- **Ingest Interface**: Repository ingestion and indexing controls

### Backend Integration
- **API Service**: Handles communication with the RAG server
- **WebView Manager**: Manages VS Code webview panels and messaging
- **Health Checker**: Monitors RAG server connectivity and status

### Data Flow
```
VS Code Extension ↔ RAG Server ↔ Vector Database ↔ Indexed Repositories
```

## 🔧 Configuration

### Extension Settings

The extension stores configuration in VS Code workspace settings:

- **RAG Server Host**: URL of your RAG server instance
- **Selected Model**: AI model to use for responses
- **Connection Timeout**: Timeout for server requests

### RAG Server Setup

Ensure your RAG server supports the following endpoints:
- `/health` - Health check endpoint
- `/query` - Main query endpoint with streaming support
- `/conversations` - Conversation management
- `/ingest/local` - Local repository ingestion
- `/ingest/git` - Git repository ingestion

## 📖 Usage Examples

### Basic Chat Interaction
```
User: How do I deploy the authentication service in ChaliceLab?
AI: Based on the ChaliceLab documentation, here's how to deploy the authentication service...
```

### Repository Analysis
```
User: What's the structure of the user management module?
AI: The user management module in ChaliceLab follows this structure...
```

### Troubleshooting Support
```
User: I'm getting a connection error when starting the API gateway
AI: This error typically occurs when... Here are the troubleshooting steps...
```

## 🚀 Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/nguyentienlinh2611/chalicelab-vscode-agent.git
cd chalicelab-vscode-agent

# Install dependencies
yarn install

# Compile the extension
yarn compile

# Package for distribution
yarn package
```

### Development Workflow

```bash
# Start development with watch mode
yarn watch

# Run tests
yarn test

# Lint code
yarn lint

# Type checking
yarn check-types
```

## 📝 Release Notes

### 0.0.1 (Initial Release)

- ✨ Initial chat interface with AI agent integration
- 🔧 RAG server configuration and connection management
- 📚 Local and Git repository ingestion support
- 💬 Conversation management and history
- ⚙️ Settings panel for server configuration
- 🏥 Health monitoring and connection status

## 🔗 Links

- [Repository](https://github.com/nguyentienlinh2611/chalicelab-vscode-agent)
- [Issues](https://github.com/nguyentienlinh2611/chalicelab-vscode-agent/issues)
- [Releases](https://github.com/nguyentienlinh2611/chalicelab-vscode-agent/releases)
- [ChaliceLab Project](https://github.com/nguyentienlinh2611)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
