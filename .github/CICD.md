# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for automated build, test, and release of the VS Code extension with **semantic-release** for automated version management based on conventional commits.

## Workflows

### 1. CI Pipeline (`ci.yml`)
**Trigger:** Push to `main`, `develop` branches or Pull Request to `main`

**Functions:**
- Code linting
- Type checking
- Extension build
- Run tests
- Create test package
- Security audit

### 2. Release Pipeline (`release.yml`)
**Trigger:** Push to `main` branch or manual workflow dispatch

**Functions:**
- Analyze commits using conventional commit format
- Automatically determine version bump (patch/minor/major)
- Generate changelog from commit messages
- Update package.json version
- Create git tag
- Build extension package (.vsix)
- Create GitHub Release with changelog and .vsix file
- Publish extension to VS Code Marketplace (when configured)

## Automated Release System

This project uses [semantic-release](https://semantic-release.gitbook.io/) for fully automated version management and package publishing based on conventional commit messages.

### How It Works

1. **Commit Analysis**: Analyzes commit messages since the last release
2. **Version Determination**: Automatically determines the next version based on commit types
3. **Changelog Generation**: Creates CHANGELOG.md from commit messages
4. **Version Bump**: Updates package.json version
5. **Tag Creation**: Creates and pushes git tag
6. **GitHub Release**: Creates GitHub release with generated changelog
7. **Package Publishing**: Builds and attaches .vsix file to release

### Release Commands

```bash
# All commands run semantic-release (version determined by commits)
yarn release:patch   # Runs semantic-release
yarn release:minor   # Runs semantic-release  
yarn release:major   # Runs semantic-release

# Test what would be released without actually releasing
yarn release:dry
```

**Note**: All `yarn release:*` commands run the same semantic-release process. The actual version bump is determined by analyzing your commit messages, not by the command suffix.

## Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types and Version Impact

#### Minor Release (e.g., 0.1.1 → 0.2.0)
- `feat:` - New features

#### Patch Release (e.g., 0.1.1 → 0.1.2)
- `fix:` - Bug fixes
- `perf:` - Performance improvements
- `revert:` - Reverts previous commits
- `refactor:` - Code refactoring without feature changes

#### Major Release (e.g., 0.1.1 → 1.0.0)
- `feat!:` - New features with breaking changes
- `fix!:` - Bug fixes with breaking changes
- Any commit with `BREAKING CHANGE:` in footer

#### No Release
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `chore:` - Maintenance tasks
- `test:` - Test changes
- `build:` - Build system changes
- `ci:` - CI configuration changes

### Examples

```bash
# Patch release (0.1.1 → 0.1.2)
git commit -m "fix: resolve sidebar loading issue"
git commit -m "perf: improve extension startup time"

# Minor release (0.1.1 → 0.2.0)
git commit -m "feat: add new settings tab"
git commit -m "feat(sidebar): add conversation search functionality"

# Major release (0.1.1 → 1.0.0)
git commit -m "feat!: redesign extension API"

# Or with breaking change footer
git commit -m "feat: add new API

BREAKING CHANGE: previous API endpoints are no longer supported"

# No release
git commit -m "docs: update README with new examples"
git commit -m "chore: update dependencies"
```

## Release Process

### Option 1: Automatic Release (Recommended)
Simply push to the `main` branch with proper conventional commits:

```bash
# Make your changes and commit with conventional format
git add .
git commit -m "feat: add new feature"
git push origin main

# The release workflow will automatically:
# 1. Analyze commits
# 2. Determine version bump
# 3. Update CHANGELOG.md
# 4. Create tag and GitHub release
```

**Important Note**: GitHub Actions has a security feature where workflows won't trigger from the same commit that creates or modifies the workflow file. If you just added the release workflow, you'll need to make another commit to trigger it.

### Option 2: Manual Release via Yarn Commands
```bash
# Test what would be released (dry run)
yarn release:dry

# Run actual release
yarn release:patch   # (same as yarn release:minor or yarn release:major)
```

### Option 3: Manual Release via GitHub Actions
1. Go to the repository on GitHub
2. Click "Actions" tab
3. Select "Release VS Code Extension" workflow
4. Click "Run workflow"
5. The workflow will analyze commits and create appropriate release

## Setup Requirements

### 1. GitHub Secrets
Set up the following secrets in your GitHub repository:

#### VSCE_PAT (Required for Marketplace publishing)
1. Go to [Azure DevOps](https://dev.azure.com)
2. Create Personal Access Token with "Marketplace (Manage)" permission
3. Add token to GitHub Secrets as `VSCE_PAT`

### 2. VS Code Marketplace Setup
1. Create publisher account on [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. Update `publisher` field in `package.json`

## Version Management

### Semantic Versioning
The pipeline uses semantic versioning (semver):
- **Patch** (v0.0.1 → v0.0.2): Bug fixes, performance improvements
- **Minor** (v0.0.1 → v0.1.0): New features, backward compatible
- **Major** (v0.0.1 → v1.0.0): Breaking changes

### Tag Format
- Tags follow format: `v*.*.*` (e.g., `v0.0.1`, `v1.2.3`)
- Created automatically by semantic-release

## Changelog Generation

The CHANGELOG.md is automatically generated from commit messages using conventional commits format. The changelog includes:

- **Features**: New functionality (`feat:` commits)
- **Bug Fixes**: Bug fixes (`fix:` commits)
- **Performance**: Performance improvements (`perf:` commits)
- **Documentation**: Documentation updates (`docs:` commits)
- **Breaking Changes**: Any commit with `!` or `BREAKING CHANGE:` footer

## Package Scripts

```bash
# Development
yarn compile          # Build for development
yarn watch            # Watch mode for development
yarn test             # Run tests
yarn lint             # Run ESLint
yarn check-types      # TypeScript type checking

# Release
yarn package          # Build for production
yarn package:vsix     # Create .vsix package
yarn publish:vsce     # Publish to marketplace

# Automated Release (all run semantic-release)
yarn release         # Run semantic-release
yarn release:dry     # Test release (dry run)
yarn release:patch   # Run semantic-release
yarn release:minor   # Run semantic-release
yarn release:major   # Run semantic-release
```

## Configuration Files

```
.github/
├── workflows/
│   ├── ci.yml           # CI pipeline
│   └── release.yml      # Release pipeline with semantic-release
├── README.md            # This documentation
.releaserc.js            # Semantic-release configuration
CHANGELOG.md             # Auto-generated changelog
RELEASE.md               # Release process documentation
```

## Troubleshooting

### Common Issues

1. **Tests failing in CI**
   - Check xvfb setup for headless testing
   - Ensure all dependencies are installed properly

2. **VSCE_PAT not working**
   - Verify token is still valid
   - Ensure token has Marketplace (Manage) permissions

3. **Package build failures**
   - Check .vscodeignore file
   - Ensure all required files are in dist/

4. **No release created**
   - Verify commits follow conventional commit format
   - Check that commit types trigger releases (feat, fix, perf, etc.)
   - Use `yarn release:dry` to test what would be released
   - **Important**: Workflows don't trigger from commits that create/modify the workflow file

5. **Workflow not triggering on push**
   - GitHub Actions won't run workflows from the same commit that creates/modifies them
   - Make a new commit after adding workflow files
   - Check repository Actions tab for workflow runs
   - Verify the workflow file syntax is correct

6. **Permission denied errors (EGITNOPERMISSION)**
   - Ensure workflow has proper permissions:
   ```yaml
   permissions:
     contents: write
     issues: write
     pull-requests: write
     actions: read
   ```
   - Check that GITHUB_TOKEN is properly configured in workflow env

7. **Semantic-release errors**
   - Ensure all required dependencies are installed
   - Check GitHub token permissions for repository access
   - Verify conventional commit message format

### Debugging Releases

```bash
# Test what version would be released
yarn release:dry

# Check commit analysis
git log --oneline v0.1.1..HEAD  # Replace v0.1.1 with last release tag

# Verify conventional commit format
# Example good commits:
# ✅ feat: add new feature
# ✅ fix: resolve bug
# ✅ feat!: breaking change
# ❌ Add new feature (missing type)
# ❌ feature: add new feature (wrong type)
```

## Security

- Never commit sensitive data or tokens
- Use GitHub Secrets for all authentication tokens
- Regularly update dependencies
- Review security audit results in CI
- All releases are automatically signed and verified

## Quick Start Guide

### For Development
```bash
# Clone and setup
git clone <repository>
cd chalicelab-vscode-agent
yarn install

# Start development
yarn watch           # Auto-rebuild on changes
yarn test           # Run tests
```

### For Releases
```bash
# Make changes and commit with conventional format
git add .
git commit -m "feat: add amazing new feature"
git push origin main

# Or test release locally first
yarn release:dry    # See what would be released

# Manual release (if needed)
yarn release        # Run semantic-release
```

### Quick Reference
- `feat:` → Minor version (0.1.0 → 0.2.0)
- `fix:` → Patch version (0.1.0 → 0.1.1)  
- `feat!:` or `BREAKING CHANGE:` → Major version (0.1.0 → 1.0.0)
- `docs:`, `chore:`, `style:` → No release

**Everything is automated** - just push with proper commit messages! 🚀
