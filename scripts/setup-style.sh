#!/bin/bash
echo "🎨 Setting up code style enforcement (tabs, 4-space width)..."

# Install minimal formatting dependencies
echo "📦 Installing dependencies..."
bun add -d prettier eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier husky

# Initialize husky (new way)
echo "🪝 Initializing Husky..."
bunx husky init

# Create pre-commit hook
echo "📝 Creating pre-commit hook..."
echo "echo '🎨 Formatting code...' && bun run style && git add . && bun run test" > .husky/pre-commit

# Make hook executable
chmod +x .husky/pre-commit

# Format all existing files
echo "✨ Formatting existing files..."
bun run format

# Run initial lint check
echo "🔍 Running initial lint check..."
bun run lint:fix

echo ""
echo "✅ Code style setup complete!"
echo ""
echo "Configuration:"
echo "  ✅ Tabs for indentation (4-space width)"
echo "  ✅ Double quotes for strings" 
echo "  ✅ Semicolons required"
echo "  ✅ 100 character line length"
echo ""
echo "Available commands:"
echo "  bun run format      - Format all files"
echo "  bun run lint        - Check for linting issues"
echo "  bun run lint:fix    - Fix linting issues automatically"
echo "  bun run style       - Format and fix all issues"
echo "  bun run style:check - Check formatting and linting"
echo ""
echo "Git hooks are now active - code will be formatted on commit!"
