# CI/CD Setup Guide

This document explains how to set up and configure the CI/CD pipelines for the Code Check project.

## Overview

The project uses GitHub Actions for continuous integration and deployment with the following workflows:

- **CI Pipeline** (`ci.yml`) - Linting, type checking, testing, and building
- **Docker Pipeline** (`docker.yml`) - Building and publishing Docker images
- **Release Pipeline** (`release.yml`) - Publishing VS Code extensions and npm packages
- **Storybook Pipeline** (`storybook.yml`) - Building and deploying UI documentation
- **Security Pipeline** (`security.yml`) - Security scanning and vulnerability detection
- **Deploy Pipeline** (`deploy.yml`) - Deploying web applications and Docker images

## Required Secrets

To enable all CI/CD features, configure the following secrets in your GitHub repository:

### VS Code Extension Publishing

- `VSCE_PAT`: Personal Access Token for VS Code Marketplace
- `OVSX_PAT`: Personal Access Token for OpenVSX Registry

### NPM Package Publishing

- `NPM_TOKEN`: NPM authentication token for package publishing

### Storybook & Visual Testing

- `CHROMATIC_PROJECT_TOKEN`: Chromatic project token for visual testing

### Container Registry

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions (no setup required)

## Setting Up Secrets

### 1. VS Code Marketplace Token (VSCE_PAT)

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Create a new Personal Access Token with **All accessible organizations** scope
3. Add the token as `VSCE_PAT` in GitHub repository secrets

### 2. OpenVSX Registry Token (OVSX_PAT)

1. Go to [OpenVSX Registry](https://openvsx.org/)
2. Create an account and generate an access token
3. Add the token as `OVSX_PAT` in GitHub repository secrets

### 3. NPM Token (NPM_TOKEN)

1. Create an NPM account and login: `npm login`
2. Generate an access token: `npm token create --read-write`
3. Add the token as `NPM_TOKEN` in GitHub repository secrets

### 4. Chromatic Token (CHROMATIC_PROJECT_TOKEN)

1. Sign up at [Chromatic](https://www.chromatic.com/)
2. Create a new project and get the project token
3. Add the token as `CHROMATIC_PROJECT_TOKEN` in GitHub repository secrets

## Workflow Triggers

### Continuous Integration (CI)

- **Trigger**: Push to `main` or `develop`, Pull requests
- **Jobs**: Lint, Type Check, Test, Build
- **Artifacts**: Build artifacts, VS Code extension (.vsix)

### Docker Build

- **Trigger**: Push to `main`/`develop`, Tags starting with `v*`
- **Jobs**: Build and push Docker images, Security scanning
- **Registry**: GitHub Container Registry (ghcr.io)

### Release

- **Trigger**: Tags starting with `v*`, Manual workflow dispatch
- **Jobs**: Build, package, and publish to marketplaces
- **Outputs**: VS Code extension, NPM packages, GitHub release

### Storybook

- **Trigger**: Changes to web-app or shared packages
- **Jobs**: Build Storybook, Deploy to GitHub Pages, Visual testing
- **Output**: Storybook documentation site

### Security

- **Trigger**: Push, Pull requests, Weekly schedule
- **Jobs**: NPM audit, CodeQL analysis, Semgrep, Secret scanning
- **Output**: Security reports in GitHub Security tab

### Deploy

- **Trigger**: Push to `main`, Tags starting with `v*`
- **Jobs**: Deploy web app to GitHub Pages, Deploy Docker images
- **Environments**: GitHub Pages, Container Registry

## Branch Strategy

- **main**: Production branch, deploys automatically
- **develop**: Development branch, runs CI but doesn't deploy
- **feature/\***: Feature branches, runs CI on pull requests

## Local Development

### Prerequisites

```bash
# Install Node.js 18+
node --version

# Install pnpm
npm install -g pnpm@8.15.6

# Install dependencies
pnpm install
```

### Development Commands

```bash
# Run development server
pnpm run dev

# Run linting
pnpm run lint

# Run tests
pnpm run test

# Run type checking
pnpm run typecheck

# Build all packages
pnpm run build

# Format code
pnpm run format

# Package VS Code extension
cd packages/vscode-extension
pnpm run package
```

### Storybook Development

```bash
# Start Storybook development server
cd packages/web-app
pnpm run storybook

# Build Storybook for production
pnpm run build-storybook
```

### Docker Development

```bash
# Build Docker image locally
docker build -f packages/api-backend/Dockerfile -t code-check-api .

# Run Docker container
docker run -p 3000:3000 code-check-api
```

## Release Process

### Automated Release (Recommended)

1. Create a git tag with semantic versioning:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. The release workflow will automatically:
   - Build all packages
   - Package VS Code extension
   - Publish to VS Code Marketplace and OpenVSX
   - Publish npm packages
   - Create GitHub release with artifacts

### Manual Release

1. Use GitHub's workflow dispatch feature
2. Go to Actions tab → Release workflow → "Run workflow"
3. Select release type (patch/minor/major)

## Monitoring and Maintenance

### Dependabot

- Automatically creates PRs for dependency updates
- Runs weekly on Mondays at 9 AM
- Updates npm dependencies and GitHub Actions

### Security Scanning

- Runs on every push and PR
- Weekly scheduled scans for vulnerabilities
- Results appear in GitHub Security tab

### Build Artifacts

- Build artifacts are stored for 7 days
- VS Code extensions are stored for 30 days
- Docker images are stored in GitHub Container Registry

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are installed
   - Verify package.json scripts

2. **VS Code Extension Publishing**
   - Verify VSCE_PAT token has correct permissions
   - Check extension manifest (package.json)
   - Ensure version is incremented

3. **Docker Build Issues**
   - Check Dockerfile syntax
   - Verify file paths and dependencies
   - Test build locally first

4. **Storybook Build Failures**
   - Ensure Storybook dependencies are installed
   - Check story file syntax
   - Verify component imports

### Getting Help

- Check workflow logs in GitHub Actions tab
- Review error messages and stack traces
- Consult package-specific documentation
- Check GitHub Issues for known problems

## Performance Optimization

### Caching Strategy

- pnpm dependencies are cached across workflow runs
- Docker layer caching is enabled for faster builds
- Build artifacts are reused between jobs

### Parallel Execution

- Lint, type check, and test jobs run in parallel
- Multi-platform Docker builds use parallelization
- Storybook builds run independently of main CI

### Resource Usage

- Most jobs run on `ubuntu-latest` for speed
- Desktop app builds use matrix strategy for multiple platforms
- Security scans run on schedule to avoid blocking development
