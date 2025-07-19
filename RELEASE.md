# Release Process

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated release management.

## How to Release

### Using yarn commands:

```bash
# For any type of release (patch, minor, major) - semantic-release will determine based on commits
yarn release:patch   # Will run semantic-release
yarn release:minor   # Will run semantic-release  
yarn release:major   # Will run semantic-release
```

All release commands now run the same `semantic-release` process, which automatically determines the release type based on your commit messages.

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Release Types:
- `feat:` → **minor** version bump (new features)
- `fix:`, `perf:`, `revert:`, `refactor:` → **patch** version bump  
- `feat!:`, `fix!:` or any commit with `BREAKING CHANGE:` → **major** version bump
- `docs:`, `style:`, `chore:`, `test:`, `build:`, `ci:` → **no release**

#### Examples:
```bash
# Patch release
git commit -m "fix: resolve sidebar loading issue"

# Minor release  
git commit -m "feat: add new settings tab"

# Major release
git commit -m "feat!: redesign extension API"
# or
git commit -m "feat: add new API

BREAKING CHANGE: previous API is no longer supported"
```

## Automated Process

When you push to `main` branch or use `yarn release:*` commands:

1. **Analyze commits** since the last release
2. **Determine version bump** based on conventional commits
3. **Generate CHANGELOG.md** automatically
4. **Update package.json version**
5. **Create git tag**
6. **Create GitHub release** with VSIX file
7. **Commit changes** back to repository

## Manual Release

If you prefer manual control, you can also trigger releases via GitHub Actions:
- Go to Actions → Release VS Code Extension → Run workflow

## Files Involved

- `.releaserc.js` - semantic-release configuration
- `CHANGELOG.md` - automatically generated changelog
- `.github/workflows/release.yml` - GitHub Actions workflow
- `package.json` - version and release scripts
