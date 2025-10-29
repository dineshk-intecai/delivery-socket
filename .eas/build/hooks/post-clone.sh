#!/bin/bash
set -e

echo "=============================="
echo "🔧 EAS Post-Clone Hook Started"
echo "=============================="

# Go to project root (EAS may start elsewhere)
cd "$EAS_BUILD_WORKING_DIR" || exit 1

echo "📦 Initializing submodules..."
git submodule sync --recursive
git submodule update --init --recursive --depth 1

echo "🧱 Running Expo prebuild..."
npx expo prebuild --non-interactive

echo "✅ Post-clone hook completed successfully!"
