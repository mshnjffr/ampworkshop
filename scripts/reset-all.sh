#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "🔄 Amp Workshop Reset Script"
echo "======================================"
echo ""

# Function to reset a single exercise
reset_exercise() {
    local dir=$1
    local name=$(basename $dir)
    
    if [ -d "$dir" ]; then
        echo -e "${BLUE}Resetting${NC} $name..."
        
        # Remove node_modules
        if [ -d "$dir/node_modules" ]; then
            rm -rf "$dir/node_modules"
            echo "  - Removed node_modules"
        fi
        
        # Remove build artifacts
        if [ -d "$dir/dist" ]; then
            rm -rf "$dir/dist"
            echo "  - Removed dist/"
        fi
        if [ -d "$dir/build" ]; then
            rm -rf "$dir/build"
            echo "  - Removed build/"
        fi
        if [ -d "$dir/.next" ]; then
            rm -rf "$dir/.next"
            echo "  - Removed .next/"
        fi
        
        # Remove coverage reports
        if [ -d "$dir/coverage" ]; then
            rm -rf "$dir/coverage"
            echo "  - Removed coverage/"
        fi
        
        # Reset PROGRESS.md if it exists
        if [ -f "$dir/PROGRESS.md" ]; then
            cat > "$dir/PROGRESS.md" << 'EOF'
# Progress Tracker

## Tasks
- [ ] Task 1: Not started
- [ ] Task 2: Not started
- [ ] Task 3: Not started
- [ ] Bonus: Not started

## Notes
_Your notes here_

## Started: [Date]
## Completed: [Date]
EOF
            echo "  - Reset PROGRESS.md"
        fi
        
        # Remove any .env.local files (keep .env.example)
        if [ -f "$dir/.env.local" ]; then
            rm "$dir/.env.local"
            echo "  - Removed .env.local"
        fi
        
        # Git reset if it's a git repo
        if [ -d "$dir/.git" ]; then
            cd "$dir"
            git reset --hard HEAD &> /dev/null
            git clean -fd &> /dev/null
            cd - > /dev/null
            echo "  - Git reset to HEAD"
        fi
        
        echo -e "  ${GREEN}✓${NC} Reset complete"
    fi
}

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING:${NC} This will reset all exercises to their initial state!"
echo "This includes:"
echo "  • Removing all node_modules"
echo "  • Deleting build artifacts"
echo "  • Resetting PROGRESS.md files"
echo "  • Removing environment files"
echo "  • Git reset (if applicable)"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Reset cancelled${NC}"
    exit 1
fi

echo ""
echo "Starting reset process..."
echo "----------------------"

# Reset main apps
if [ -d "apps" ]; then
    echo -e "\n${BLUE}📁 Resetting main exercises (apps/)${NC}"
    for dir in apps/*/; do
        if [ -d "$dir" ]; then
            reset_exercise "$dir"
        fi
    done
else
    echo -e "${YELLOW}No apps/ directory found${NC}"
fi

# Reset stretch goals
if [ -d "stretch-goals" ]; then
    echo -e "\n${BLUE}📁 Resetting stretch goals${NC}"
    for dir in stretch-goals/*/; do
        if [ -d "$dir" ]; then
            reset_exercise "$dir"
        fi
    done
else
    echo -e "${YELLOW}No stretch-goals/ directory found${NC}"
fi

# Clean root node_modules
echo -e "\n${BLUE}📁 Cleaning root directory${NC}"
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "  - Removed root node_modules"
fi

# Remove package-lock.json files if requested
read -p "Remove all package-lock.json files? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    find . -name "package-lock.json" -type f -delete
    echo -e "  ${GREEN}✓${NC} Removed all package-lock.json files"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ Reset complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm run setup-all (to reinstall dependencies)"
echo "2. Navigate to an exercise: cd apps/01-hello-amp"
echo "3. Start fresh with Amp!"
echo "======================================"
