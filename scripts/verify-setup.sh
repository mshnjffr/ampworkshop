#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "🔍 Amp Workshop Setup Verification"
echo "======================================"
echo ""

# Track if all checks pass
ALL_PASS=true

# Function to check command existence
check_command() {
    local cmd=$1
    local name=$2
    local min_version=$3
    
    if command -v $cmd &> /dev/null; then
        if [ -n "$min_version" ]; then
            version=$($cmd --version 2>&1 | head -n 1)
            echo -e "${GREEN}✅${NC} $name installed: $version"
        else
            echo -e "${GREEN}✅${NC} $name is installed"
        fi
    else
        echo -e "${RED}❌${NC} $name is not installed"
        ALL_PASS=false
        return 1
    fi
}

# Function to check Node version
check_node_version() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        if [ "$NODE_MAJOR" -ge 18 ]; then
            echo -e "${GREEN}✅${NC} Node.js version: v$NODE_VERSION (>= 18.0.0)"
        else
            echo -e "${YELLOW}⚠️${NC} Node.js version: v$NODE_VERSION (recommended >= 18.0.0)"
        fi
    else
        echo -e "${RED}❌${NC} Node.js is not installed"
        ALL_PASS=false
    fi
}

# Function to check npm version
check_npm_version() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        NPM_MAJOR=$(echo $NPM_VERSION | cut -d'.' -f1)
        
        if [ "$NPM_MAJOR" -ge 8 ]; then
            echo -e "${GREEN}✅${NC} npm version: $NPM_VERSION (>= 8.0.0)"
        else
            echo -e "${YELLOW}⚠️${NC} npm version: $NPM_VERSION (recommended >= 8.0.0)"
        fi
    else
        echo -e "${RED}❌${NC} npm is not installed"
        ALL_PASS=false
    fi
}

# Function to check Amp installation
check_amp() {
    if command -v amp &> /dev/null; then
        AMP_VERSION=$(amp --version 2>&1 | head -n 1)
        echo -e "${GREEN}✅${NC} Amp CLI installed: $AMP_VERSION"
        
        # Test Amp functionality
        echo -n "  Testing Amp CLI... "
        if amp -x "echo 'Amp is working'" &> /dev/null; then
            echo -e "${GREEN}working${NC}"
        else
            echo -e "${YELLOW}may need configuration${NC}"
        fi
    else
        echo -e "${RED}❌${NC} Amp CLI is not installed"
        echo "  Please install from: https://ampcode.com"
        ALL_PASS=false
    fi
}

# Function to check VS Code
check_vscode() {
    if command -v code &> /dev/null; then
        echo -e "${GREEN}✅${NC} VS Code CLI is available"
        
        # Check for Amp extension
        if code --list-extensions 2>/dev/null | grep -q "sourcegraph.amp"; then
            echo -e "${GREEN}✅${NC} Amp VS Code extension is installed"
        else
            echo -e "${YELLOW}⚠️${NC} Amp VS Code extension not detected"
            echo "  Install from VS Code marketplace: 'Amp by Sourcegraph'"
        fi
    else
        echo -e "${YELLOW}⚠️${NC} VS Code CLI not found (optional but recommended)"
        echo "  You can add it from VS Code: Cmd+Shift+P > 'Install code command'"
    fi
}

# Function to check workshop structure
check_workshop_structure() {
    echo ""
    echo "📁 Checking workshop structure..."
    
    if [ -f "package.json" ]; then
        echo -e "${GREEN}✅${NC} Root package.json found"
    else
        echo -e "${RED}❌${NC} Root package.json not found"
        ALL_PASS=false
    fi
    
    if [ -f "AGENTS.md" ]; then
        echo -e "${GREEN}✅${NC} AGENTS.md configuration found"
    else
        echo -e "${YELLOW}⚠️${NC} AGENTS.md not found"
    fi
    
    # Check for directories
    if [ -d "apps" ] || [ -d "stretch-goals" ]; then
        echo -e "${GREEN}✅${NC} Exercise directories present"
    else
        echo -e "${YELLOW}⚠️${NC} Exercise directories not yet created"
    fi
}

# Main verification
echo "🔧 System Requirements:"
echo "----------------------"
check_node_version
check_npm_version
check_command "git" "Git"
echo ""

echo "🤖 Amp Setup:"
echo "-------------"
check_amp
check_vscode
echo ""

check_workshop_structure

# Final summary
echo ""
echo "======================================"
if [ "$ALL_PASS" = true ]; then
    echo -e "${GREEN}✅ All essential requirements met!${NC}"
    echo "You're ready to start the workshop!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run setup-all"
    echo "2. Navigate to an exercise: cd apps/01-hello-amp"
    echo "3. Start coding with Amp!"
else
    echo -e "${RED}❌ Some requirements are missing${NC}"
    echo "Please install missing components before starting."
    echo ""
    echo "Installation guides:"
    echo "- Node.js: https://nodejs.org/"
    echo "- Git: https://git-scm.com/"
    echo "- Amp: https://ampcode.com/"
    echo "- VS Code: https://code.visualstudio.com/"
    exit 1
fi
echo "======================================"
