// ============================================
// SPACETRADERS v2 TERMINAL - MAIN SCRIPT
// ============================================

// Global variables
let api = null;
let commandHistory = [];
let historyIndex = -1;
let currentInput = '';
let isBootComplete = false;
let agentData = null;

// DOM Elements
const output = document.getElementById('output');
const input = document.getElementById('command-input');
const cursor = document.getElementById('cursor');
const connectionStatus = document.getElementById('connection-status');
const agentStatus = document.getElementById('agent-status');
const creditsStatus = document.getElementById('credits-status');
const timestamp = document.getElementById('timestamp');
const typeSound = document.getElementById('typeSound');

// ============================================
// INITIALIZATION
// ============================================

// Initialize on page load
window.onload = async () => {
    // Start boot sequence
    playBootSequence();

    // Update timestamp every second
    updateTimestamp();
    setInterval(updateTimestamp, 1000);

    // Focus input after boot sequence
    setTimeout(() => {
        input.focus();
        isBootComplete = true;
    }, 4000);

    // Load saved token if available
    const savedToken = localStorage.getItem('spacetraders_token');
    if (savedToken) {
        printToTerminal(`> Found saved credentials`, 'system');
        // Initialize API with saved token
        setTimeout(() => initializeAPI(savedToken), 500);
    }
};

// ============================================
// BOOT SEQUENCE
// ============================================

function playBootSequence() {
    const messages = [
        "> ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL",
        "> SPACETRADERS NETWORK v2.12.7",
        "> ",
        "> CHECKING CRYPTOKEYS...",
        "  ...██████████████████ 100%",
        "> KEYS: VALID",
        "> ",
        "> ESTABLISHING SECURE LINK...",
        "  ...██████████████████ 100%",
        "> LINK: ESTABLISHED",
        "> ",
        "> MEMORY TEST: 64K OK",
        "> SYSTEMS: NOMINAL",
        "> ",
        "> #####################################",
        "> #                                   #",
        "> #    SPACETRADERS v2 TERMINAL       #",
        "> #          [ONLINE MODE]            #",
        "> #                                   #",
        "> #####################################",
        "> ",
        "> WELCOME, AGENT.",
        "> ",
        "> TYPE 'help' FOR COMMANDS",
        "> TYPE 'auth <token>' TO CONNECT",
        "> "
    ];

    output.innerHTML = '';

    messages.forEach((msg, index) => {
        setTimeout(() => {
            const lineClass = index < 3 ? 'system-line' :
                msg.includes('...') ? '' :
                    msg.includes('█') ? 'success-line' :
                        msg.includes('WELCOME') ? 'prompt-line' : 'system-line';

            const lineDiv = document.createElement('div');
            lineDiv.className = lineClass;
            lineDiv.textContent = msg;
            output.appendChild(lineDiv);

            // Scroll to bottom
            output.scrollTop = output.scrollHeight;

            // Play sound for certain lines
            if (msg.includes('█') || msg.includes('...')) {
                playTypeSound();
            }
        }, index * 120);
    });
}

// ============================================
// API INITIALIZATION
// ============================================

async function initializeAPI(token) {
    try {
        // Import and initialize API
        const apiModule = await import('./api/spacetraders.js');
        api = new apiModule.SpaceTradersAPI(token);

        // Test connection
        printToTerminal(`> Testing API connection...`, 'system');
        const status = await api.getStatus();

        // Update connection status
        connectionStatus.textContent = '● ONLINE';
        connectionStatus.className = 'status-online';
        printToTerminal(`> ✓ Connected to SpaceTraders v2`, 'success');
        printToTerminal(`> Server: ${status.status} | Version: ${status.version}`, 'system');

        // Try to get agent data
        try {
            agentData = await api.getMyAgent();
            updateAgentStatus(agentData);
            printToTerminal(`> Agent: ${agentData.symbol} | Credits: Ƶ${agentData.credits.toLocaleString()}`, 'success');
        } catch (agentErr) {
            printToTerminal(`> Note: Valid token but no agent data. Using limited mode.`, 'system');
        }

        // Save token to localStorage
        localStorage.setItem('spacetraders_token', token);

    } catch (error) {
        connectionStatus.textContent = '● OFFLINE';
        connectionStatus.className = 'status-offline';
        printToTerminal(`> ✗ Connection failed: ${error.message}`, 'error');
        api = null;
    }
}

// ============================================
// COMMAND PROCESSOR
// ============================================

const commands = {
    'help': {
        desc: 'Displays available commands',
        fn: async () => {
            return `> AVAILABLE COMMANDS:\n` +
                `> ====================\n` +
                Object.keys(commands)
                    .map(cmd => `  ${cmd.padEnd(15)} - ${commands[cmd].desc}`)
                    .join('\n') +
                `\n> \n` +
                `> API COMMANDS (require authentication):\n` +
                `> ======================================\n` +
                `  status          Check server status\n` +
                `  agent           Display your agent details\n` +
                `  ships           List your ships\n` +
                `  contracts       List available contracts\n` +
                `  navigate <ship> <waypoint>  Navigate ship\n` +
                `  clear           Clear terminal\n` +
                `  auth <token>    Set authentication token\n` +
                `  logout          Clear saved credentials`;
        }
    },

    'auth': {
        desc: 'Set your SpaceTraders API token',
        fn: async (token) => {
            if (!token) {
                return `> Usage: auth <your_token>\n` +
                    `> Get token from: https://spacetraders.io/account`;
            }
            printToTerminal(`> Initializing connection...`, 'system');
            await initializeAPI(token);
            return null; // Message already printed
        }
    },

    'status': {
        desc: 'Check server status',
        fn: async () => {
            if (!api) return `> Not connected. Use 'auth <token>' first.`;
            try {
                const status = await api.getStatus();
                return `> SERVER STATUS:\n` +
                    `> - Status: ${status.status.toUpperCase()}\n` +
                    `> - Version: ${status.version}\n` +
                    `> - Description: ${status.description}\n` +
                    `> - Reset Date: ${new Date(status.resetDate).toLocaleString()}\n` +
                    `> - Stats:\n` +
                    `>   • Agents: ${status.stats.agents.toLocaleString()}\n` +
                    `>   • Ships: ${status.stats.ships.toLocaleString()}\n` +
                    `>   • Systems: ${status.stats.systems.toLocaleString()}\n` +
                    `>   • Waypoints: ${status.stats.waypoints.toLocaleString()}`;
            } catch (error) {
                return `> Error: ${error.message}`;
            }
        }
    },

    'agent': {
        desc: 'Display your agent details',
        fn: async () => {
            if (!api) return `> Not connected. Use 'auth <token>' first.`;
            try {
                const agent = await api.getMyAgent();
                updateAgentStatus(agent);
                return `> AGENT DETAILS:\n` +
                    `> - Symbol: ${agent.symbol}\n` +
                    `> - Headquarters: ${agent.headquarters}\n` +
                    `> - Credits: Ƶ${agent.credits.toLocaleString()}\n` +
                    `> - Starting Faction: ${agent.startingFaction}\n` +
                    `> - Ship Count: ${agent.shipCount}`;
            } catch (error) {
                return `> Error: ${error.message}`;
            }
        }
    },

    'ships': {
        desc: 'List your ships',
        fn: async () => {
            if (!api) return `> Not connected. Use 'auth <token>' first.`;
            try {
                const shipsData = await api.getMyShips();
                if (!shipsData.data || shipsData.data.length === 0) {
                    return `> FLEET: NO SHIPS REGISTERED`;
                }

                let report = `> FLEET REPORT (${shipsData.data.length} SHIPS):\n` +
                    `> =================================\n`;

                shipsData.data.forEach((ship, index) => {
                    const fuel = `${ship.fuel.current}/${ship.fuel.capacity}`;
                    const cargo = `${ship.cargo.units}/${ship.cargo.capacity}`;
                    const condition = ship.frame.condition >= 50 ? 'GOOD' :
                        ship.frame.condition >= 25 ? 'DAMAGED' : 'CRITICAL';

                    report += `\n> [${ship.symbol}]\n` +
                        `>   Role: ${ship.registration.role}\n` +
                        `>   Location: ${ship.nav.waypointSymbol}\n` +
                        `>   Status: ${ship.nav.status}\n` +
                        `>   Condition: ${condition} (${ship.frame.condition}%)\n` +
                        `>   Fuel: ${fuel} | Cargo: ${cargo}`;

                    if (ship.cargo.units > 0) {
                        report += `\n>   Cargo: ` +
                            ship.cargo.inventory.map(item =>
                                `${item.name} (${item.units})`
                            ).join(', ');
                    }

                    if (index < shipsData.data.length - 1) {
                        report += `\n>   ---`;
                    }
                });

                return report;
            } catch (error) {
                return `> Error: ${error.message}`;
            }
        }
    },

    'navigate': {
        desc: 'Navigate ship to waypoint',
        fn: async (shipSymbol, waypoint) => {
            if (!api) return `> Not connected. Use 'auth <token>' first.`;
            if (!shipSymbol || !waypoint) {
                return `> Usage: navigate <ship_symbol> <waypoint>\n` +
                    `> Example: navigate SHIP_1 X1-DF55-20250Z`;
            }
            try {
                printToTerminal(`> Requesting navigation for ${shipSymbol}...`, 'system');
                const result = await api.navigateShip(shipSymbol, waypoint);
                return `> NAVIGATION INITIATED:\n` +
                    `> - Ship: ${result.shipSymbol}\n` +
                    `> - Destination: ${result.nav.route.destination.symbol}\n` +
                    `> - Departure: ${result.nav.route.departure.symbol}\n` +
                    `> - Arrival: ${new Date(result.nav.route.arrival).toLocaleTimeString()}\n` +
                    `> - Fuel Cost: ${result.fuel.consumed.amount}\n` +
                    `> - Remaining Fuel: ${result.fuel.remaining}`;
            } catch (error) {
                return `> Navigation failed: ${error.message}`;
            }
        }
    },

    'contracts': {
        desc: 'List available contracts',
        fn: async () => {
            if (!api) return `> Not connected. Use 'auth <token>' first.`;
            try {
                const contracts = await api.getMyContracts();
                if (!contracts.data || contracts.data.length === 0) {
                    return `> No contracts available`;
                }

                let report = `> AVAILABLE CONTRACTS (${contracts.data.length}):\n` +
                    `> =================================\n`;

                contracts.data.forEach((contract, index) => {
                    report += `\n> Contract: ${contract.id}\n` +
                        `>   Type: ${contract.type}\n` +
                        `>   Faction: ${contract.factionSymbol}\n` +
                        `>   Payment: Ƶ${contract.terms.payment.onAccepted + contract.terms.payment.onFulfilled}\n` +
                        `>   Status: ${contract.fulfilled ? 'FULFILLED' : contract.accepted ? 'ACCEPTED' : 'AVAILABLE'}`;

                    if (contract.terms.deliver && contract.terms.deliver.length > 0) {
                        report += `\n>   Deliver to: ${contract.terms.deliver[0].destinationSymbol}`;
                    }

                    if (index < contracts.data.length - 1) {
                        report += `\n>   ---`;
                    }
                });

                return report;
            } catch (error) {
                return `> Error: ${error.message}`;
            }
        }
    },

    'clear': {
        desc: 'Clear terminal screen',
        fn: () => {
            output.innerHTML = `<div class="system-line">> TERMINAL CLEARED [${new Date().toLocaleTimeString()}]</div>`;
            return null;
        }
    },

    'logout': {
        desc: 'Clear saved credentials',
        fn: () => {
            localStorage.removeItem('spacetraders_token');
            api = null;
            agentData = null;
            updateAgentStatus(null);
            connectionStatus.textContent = '● OFFLINE';
            connectionStatus.className = 'status-offline';
            return `> Credentials cleared. Use 'auth <token>' to reconnect.`;
        }
    }
};

// ============================================
// INPUT HANDLING
// ============================================

// Handle keyboard input
input.addEventListener('keydown', async (e) => {
    playTypeSound();

    // Handle command history (Up/Down arrows)
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length === 0) return;

        if (historyIndex === -1) {
            currentInput = input.value;
            historyIndex = commandHistory.length - 1;
        } else if (historyIndex > 0) {
            historyIndex--;
        }
        input.value = commandHistory[historyIndex];
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex === -1) return;

        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[historyIndex];
        } else {
            historyIndex = -1;
            input.value = currentInput;
        }
    }

    // Handle Enter key (command execution)
    if (e.key === 'Enter') {
        e.preventDefault();
        const fullCommand = input.value.trim();
        input.value = '';

        if (!fullCommand) return;

        // Save to command history
        if (commandHistory[commandHistory.length - 1] !== fullCommand) {
            commandHistory.push(fullCommand);
            if (commandHistory.length > 50) commandHistory.shift();
        }

        // Reset history navigation
        historyIndex = -1;
        currentInput = '';

        // Display command in terminal
        printToTerminal(`$> ${fullCommand}`, 'prompt');

        // Parse and execute command
        const [baseCmd, ...args] = fullCommand.split(' ');
        const cmdLower = baseCmd.toLowerCase();

        // Check if command exists
        if (!commands[cmdLower]) {
            printToTerminal(`> Unknown command: "${baseCmd}". Type 'help' for available commands.`, 'error');
            return;
        }

        // Execute command
        try {
            const result = await commands[cmdLower].fn(...args);
            if (result) {
                printToTerminal(result, 'system');
            }
        } catch (error) {
            printToTerminal(`> Command failed: ${error.message}`, 'error');
        }
    }

    // Handle Tab for auto-completion
    if (e.key === 'Tab') {
        e.preventDefault();
        const partial = input.value.toLowerCase();
        const matches = Object.keys(commands).filter(cmd =>
            cmd.startsWith(partial)
        );

        if (matches.length === 1) {
            input.value = matches[0];
        } else if (matches.length > 1) {
            printToTerminal(`> Possible completions: ${matches.join(', ')}`, 'system');
        }
    }
});

// Keep cursor visible when input is focused
input.addEventListener('focus', () => {
    cursor.style.opacity = '1';
});

input.addEventListener('blur', () => {
    cursor.style.opacity = '0.5';
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function printToTerminal(text, type = 'system') {
    const lines = text.split('\n');
    lines.forEach(line => {
        const lineDiv = document.createElement('div');
        lineDiv.className = `${type}-line`;
        lineDiv.textContent = line;
        output.appendChild(lineDiv);
    });

    // Scroll to bottom
    output.scrollTop = output.scrollHeight;
}

function playTypeSound() {
    if (typeSound && isBootComplete) {
        typeSound.currentTime = 0;
        typeSound.play().catch(() => {
            // Ignore errors (autoplay restrictions)
        });
    }
}

function updateAgentStatus(agent) {
    if (agent) {
        agentStatus.textContent = `AGENT: ${agent.symbol}`;
        creditsStatus.textContent = `CREDITS: Ƶ${agent.credits.toLocaleString()}`;
    } else {
        agentStatus.textContent = `AGENT: --`;
        creditsStatus.textContent = `CREDITS: Ƶ--`;
    }
}

function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    timestamp.textContent = timeString;
}

// ============================================
// EXPORT FOR CONSOLE DEBUGGING
// ============================================
window.terminal = {
    print: printToTerminal,
    commands: commands,
    getAPI: () => api,
    clearHistory: () => {
        commandHistory = [];
        printToTerminal('> Command history cleared', 'system');
    }
};