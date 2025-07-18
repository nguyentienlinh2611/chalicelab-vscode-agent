# CI/CD Pipeline Documentation

## Overview

Pipeline này sử dụng GitHub Actions để tự động build, test và release VS Code extension. Nó bao gồm 3 workflows chính:

## Workflows

### 1. CI Pipeline (`ci.yml`)
**Kích hoạt:** Push vào `main`, `develop` branches hoặc Pull Request vào `main`

**Chức năng:**
- Lint code
- Type checking
- Build extension
- Chạy tests
- Tạo package thử nghiệm
- Security audit

### 2. Tag Release (`tag-release.yml`)
**Kích hoạt:** Manual dispatch từ GitHub UI

**Chức năng:**
- Cho phép chọn loại version bump (patch/minor/major) hoặc custom version
- Tự động cập nhật version trong package.json
- Chạy tests
- Commit và push version bump
- Tạo và push tag theo format `v*.*.*`

**Cách sử dụng:**
1. Vào GitHub repository
2. Click "Actions" tab
3. Chọn "Create Release Tag" workflow
4. Click "Run workflow"
5. Chọn version type hoặc nhập custom version
6. Click "Run workflow"

### 3. Release Pipeline (`release.yml`)
**Kích hoạt:** Tự động khi có tag mới được push (format `v*`)

**Chức năng:**
- Build extension
- Chạy tests
- Tạo package (.vsix)
- Tự động tạo changelog từ commit messages
- Tạo GitHub Release với changelog và file .vsix
- Publish extension lên VS Code Marketplace

## Setup Requirements

### 1. GitHub Secrets
Cần thiết lập các secrets sau trong GitHub repository:

#### VSCE_PAT (Required for Marketplace publishing)
1. Vào [Azure DevOps](https://dev.azure.com)
2. Tạo Personal Access Token với quyền "Marketplace (Manage)"
3. Thêm token vào GitHub Secrets với tên `VSCE_PAT`

### 2. VS Code Marketplace Setup
1. Tạo tài khoản publisher trên [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. Cập nhật `publisher` field trong `package.json`

## Version Management

### Semantic Versioning
Pipeline sử dụng semantic versioning (semver):
- **Patch** (v0.0.1 → v0.0.2): Bug fixes
- **Minor** (v0.0.1 → v0.1.0): New features, backward compatible
- **Major** (v0.0.1 → v1.0.0): Breaking changes

### Tag Format
- Tags phải có format: `v*.*.*` (ví dụ: `v0.0.1`, `v1.2.3`)
- Bắt đầu từ `v0.0.1`

## Changelog Generation

Changelog được tự động tạo dựa trên commit messages và PR titles. Để có changelog tốt hơn, sử dụng conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
chore: maintenance tasks
```

Hoặc sử dụng labels trên PRs:
- `feature`, `enhancement` → Features section
- `bug`, `fix` → Bug Fixes section
- `documentation`, `docs` → Documentation section
- `maintenance`, `chore` → Maintenance section
- `breaking` → Breaking Changes section

## Manual Release Process

### Option 1: Using GitHub UI (Recommended)
1. Vào Actions tab
2. Chọn "Create Release Tag"
3. Chọn version type và run workflow
4. Pipeline sẽ tự động tạo tag và trigger release

### Option 2: Using Git Commands
```bash
# Cập nhật version trong package.json
npm version patch  # or minor, major

# Push changes và tags
git push && git push --tags
```

### Option 3: Manual Tag Creation
```bash
# Tạo tag
git tag v0.0.2

# Push tag
git push origin v0.0.2
```

## Package Scripts

```bash
# Development
yarn compile          # Build for development
yarn watch            # Watch mode
yarn test             # Run tests

# Release
yarn package          # Build for production
yarn package:vsix     # Create .vsix package
yarn publish:vsce     # Publish to marketplace

# Version management
yarn release:patch    # Bump patch version and create tag
yarn release:minor    # Bump minor version and create tag
yarn release:major    # Bump major version and create tag
```

## File Structure

```
.github/
├── workflows/
│   ├── ci.yml           # CI pipeline
│   ├── tag-release.yml  # Manual tag creation
│   └── release.yml      # Release pipeline
```

## Troubleshooting

### Common Issues

1. **Tests failing in CI**
   - Kiểm tra xvfb setup cho headless testing
   - Đảm bảo all dependencies được install

2. **VSCE_PAT không hoạt động**
   - Kiểm tra token còn valid
   - Đảm bảo có quyền Marketplace (Manage)

3. **Package không build**
   - Kiểm tra .vscodeignore file
   - Đảm bảo all required files có trong dist/

4. **Changelog trống**
   - Sử dụng conventional commits
   - Thêm proper labels cho PRs

## Security

- Không commit sensitive data
- Sử dụng GitHub Secrets cho tokens
- Regularly update dependencies
- Review security audit results
