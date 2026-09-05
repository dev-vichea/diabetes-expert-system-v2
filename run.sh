#!/usr/bin/env bash

# ==============================================================================
# Diabetes Expert System v2 - Fast Full-Stack Startup Script
# Concurrently launches Flask backend & Vite frontend with process management
# ==============================================================================

set -eo pipefail

# Determine repository root directory (supports running from anywhere)
CALL_DIR="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

# If invoked from within frontend/ or backend/ directory
if [ -f "$ROOT_DIR/../backend/run.py" ] && [ -f "$ROOT_DIR/../frontend/package.json" ]; then
    ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ANSI Color Codes
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
RED="\033[0;31m"
DIM="\033[2m"
NC="\033[0m" # No Color

# Default settings
MODE="all" # all | backend | frontend
OPEN_BROWSER=false
BACKEND_PORT=5001
FRONTEND_PORT=5173

# Display help documentation
show_help() {
    echo -e "${BOLD}Diabetes Expert System v2 - Startup Utility${NC}"
    echo ""
    echo -e "${BOLD}USAGE:${NC}"
    echo "  ./run.sh [OPTIONS] [COMMAND]"
    echo ""
    echo -e "${BOLD}COMMANDS:${NC}"
    echo "  (no command)     Run both Frontend and Backend concurrently (default)"
    echo "  backend, -b      Run only the Flask Backend server"
    echo "  frontend, -f     Run only the Vite Frontend dev server"
    echo ""
    echo -e "${BOLD}OPTIONS:${NC}"
    echo "  -o, --open       Open http://localhost:5173 in your default browser once ready"
    echo "  -h, --help       Show this help message"
    echo ""
    echo -e "${BOLD}EXAMPLES:${NC}"
    echo "  ./run.sh               # Fast start both servers"
    echo "  ./run.sh -o            # Start both and open in browser"
    echo "  ./run.sh backend       # Start backend only"
    echo ""
    exit 0
}

# Parse CLI arguments
for arg in "$@"; do
    case "$arg" in
        backend|-b|--backend)
            MODE="backend"
            ;;
        frontend|-f|--frontend)
            MODE="frontend"
            ;;
        -o|--open)
            OPEN_BROWSER=true
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown argument: $arg${NC}"
            echo "Run './run.sh --help' for available options."
            exit 1
            ;;
    esac
done

# Check and free occupied ports if already running from a previous instance
free_port() {
    local port="$1"
    local name="$2"
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}⚡ Port $port ($name) is currently occupied by PID(s): $pids${NC}"
        echo -e "${YELLOW}   Stopping previous process to allow clean startup...${NC}"
        kill -9 $pids 2>/dev/null || true
        sleep 0.5
    fi
}

# Ensure .env exists in backend and frontend
prepare_environment() {
    if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
        echo -e "${YELLOW}ℹ️  backend/.env not found. Auto-creating from .env.example...${NC}"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    fi

    if [ ! -f "$FRONTEND_DIR/.env" ] && [ -f "$FRONTEND_DIR/.env.example" ]; then
        echo -e "${YELLOW}ℹ️  frontend/.env not found. Auto-creating from .env.example...${NC}"
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
    fi

    # Read configured ports if available
    if [ -f "$BACKEND_DIR/.env" ]; then
        local env_port
        env_port=$(grep -E "^FLASK_RUN_PORT=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d ' "[:space:]')
        if [ -n "$env_port" ]; then
            BACKEND_PORT="$env_port"
        fi
    fi
}

# Locate Python binary (prioritize backend/.venv)
find_python() {
    if [ -f "$BACKEND_DIR/.venv/bin/python" ]; then
        echo "$BACKEND_DIR/.venv/bin/python"
    elif [ -f "$ROOT_DIR/.venv/bin/python" ]; then
        echo "$ROOT_DIR/.venv/bin/python"
    elif command -v python3 &>/dev/null; then
        echo "$(command -v python3)"
    else
        echo ""
    fi
}

# Output line prefixer to keep logs clear and distinct
prefix_stream() {
    local color="$1"
    local tag="$2"
    while IFS= read -r line || [ -n "$line" ]; do
        printf "%b[%s]%b %s\n" "$color" "$tag" "$NC" "$line"
    done
}

# Global PID tracking
BACKEND_PID=""
FRONTEND_PID=""

# Clean shutdown handler on exit or interruption
cleanup() {
    set +e
    trap - SIGINT SIGTERM EXIT
    echo ""
    echo -e "${YELLOW}🛑 Stopping Diabetes Expert System servers...${NC}"

    # Terminate recorded process IDs
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi

    # Terminate all background child jobs of this script
    kill $(jobs -p) 2>/dev/null || true

    # Extra safeguard: ensure backend & frontend ports are released
    if [ "$MODE" = "all" ] || [ "$MODE" = "backend" ]; then
        local bpids
        bpids=$(lsof -ti :"$BACKEND_PORT" 2>/dev/null || true)
        [ -n "$bpids" ] && kill -9 $bpids 2>/dev/null || true
    fi

    if [ "$MODE" = "all" ] || [ "$MODE" = "frontend" ]; then
        local fpids
        fpids=$(lsof -ti :"$FRONTEND_PORT" 2>/dev/null || true)
        [ -n "$fpids" ] && kill -9 $fpids 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ All services stopped cleanly. Goodbye!${NC}"
    exit 0
}

# Trap termination signals
trap cleanup SIGINT SIGTERM EXIT

# 1. Environment Preparation
prepare_environment

# 2. Check Port Availability
if [ "$MODE" = "all" ] || [ "$MODE" = "backend" ]; then
    free_port "$BACKEND_PORT" "Flask Backend"
fi
if [ "$MODE" = "all" ] || [ "$MODE" = "frontend" ]; then
    free_port "$FRONTEND_PORT" "Vite Frontend"
fi

# 3. Check Python and Backend setup
PYTHON_BIN=""
if [ "$MODE" = "all" ] || [ "$MODE" = "backend" ]; then
    PYTHON_BIN="$(find_python)"
    if [ -z "$PYTHON_BIN" ]; then
        echo -e "${RED}❌ Error: Python 3 not found!${NC}"
        echo "Please install Python 3.10+ and set up backend/.venv"
        exit 1
    fi

    # Check if dependencies are installed in .venv
    if [ ! -f "$BACKEND_DIR/.venv/bin/python" ]; then
        echo -e "${YELLOW}⚠️  backend/.venv not found. Creating virtual environment...${NC}"
        python3 -m venv "$BACKEND_DIR/.venv"
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        "$BACKEND_DIR/.venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"
        PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
    fi
fi

# 4. Check Node.js and Frontend setup
if [ "$MODE" = "all" ] || [ "$MODE" = "frontend" ]; then
    if ! command -v npm &>/dev/null; then
        echo -e "${RED}❌ Error: npm is not installed or not in PATH!${NC}"
        echo "Please install Node.js (v18+)."
        exit 1
    fi

    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}📦 Frontend node_modules missing. Installing npm dependencies...${NC}"
        (cd "$FRONTEND_DIR" && npm install)
    fi
fi

# Print Startup Banner
echo ""
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║       🩺  DIABETES EXPERT SYSTEM v2 - DEV RUNNER           ║${NC}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
if [ "$MODE" = "all" ] || [ "$MODE" = "frontend" ]; then
    echo -e "  ${GREEN}➜  Frontend:${NC}  ${BOLD}http://localhost:${FRONTEND_PORT}${NC}"
fi
if [ "$MODE" = "all" ] || [ "$MODE" = "backend" ]; then
    echo -e "  ${CYAN}➜  Backend:${NC}   ${BOLD}http://127.0.0.1:${BACKEND_PORT}${NC}"
    echo -e "  ${CYAN}➜  Health:${NC}    ${BOLD}http://127.0.0.1:${BACKEND_PORT}/health${NC}"
fi
echo -e "${DIM}  ────────────────────────────────────────────────────────────${NC}"
echo -e "  ${YELLOW}Press [Ctrl+C] anytime to stop all servers${NC}"
echo -e "${BOLD}${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

# 5. Start Servers
if [ "$MODE" = "all" ] || [ "$MODE" = "backend" ]; then
    (
        cd "$BACKEND_DIR"
        PYTHONUNBUFFERED=1 "$PYTHON_BIN" run.py 2>&1 | prefix_stream "$CYAN" "Backend"
    ) &
    BACKEND_PID=$!
fi

if [ "$MODE" = "all" ] || [ "$MODE" = "frontend" ]; then
    (
        cd "$FRONTEND_DIR"
        npm run dev -- --clearScreen false 2>&1 | prefix_stream "$GREEN" "Frontend"
    ) &
    FRONTEND_PID=$!
fi

# 6. Optional: Open default browser
if [ "$OPEN_BROWSER" = true ] && [ "$MODE" != "backend" ]; then
    (
        sleep 1.5
        if command -v open &>/dev/null; then
            open "http://localhost:${FRONTEND_PORT}"
        elif command -v xdg-open &>/dev/null; then
            xdg-open "http://localhost:${FRONTEND_PORT}"
        fi
    ) &
fi

# Wait for background jobs to keep script running until Ctrl+C
wait
