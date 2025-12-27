// ============================================
// SPACETRADERS v2 API CLIENT
// ============================================

export class SpaceTradersAPI {
    constructor(token) {
        this.baseURL = 'https://api.spacetraders.io/v2';
        this.token = token;
        this.headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // ============================================
    // CORE REQUEST METHOD
    // ============================================

    async #request(endpoint, method = 'GET', body = null) {
        const url = `${this.baseURL}/${endpoint}`;
        const options = {
            method,
            headers: this.headers,
            mode: 'cors',
            cache: 'no-cache'
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error?.message ||
                    `API Error ${response.status}: ${response.statusText}`;
                throw new Error(errorMsg);
            }

            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw new Error(`Network error: ${error.message}`);
        }
    }

    // ============================================
    // PUBLIC API METHODS
    // ============================================

    // Server status
    async getStatus() {
        const data = await this.#request('');
        return data;
    }

    // Agent endpoints
    async getMyAgent() {
        const data = await this.#request('my/agent');
        return data.data;
    }

    async updateAgent(symbol) {
        const data = await this.#request('my/agent', 'PATCH', { symbol });
        return data.data;
    }

    // Ship endpoints
    async getMyShips(page = 1, limit = 20) {
        const data = await this.#request(`my/ships?page=${page}&limit=${limit}`);
        return data;
    }

    async getShip(shipSymbol) {
        const data = await this.#request(`my/ships/${shipSymbol}`);
        return data.data;
    }

    async navigateShip(shipSymbol, waypointSymbol) {
        const data = await this.#request(
            `my/ships/${shipSymbol}/navigate`,
            'POST',
            { waypointSymbol }
        );
        return data.data;
    }

    async orbitShip(shipSymbol) {
        const data = await this.#request(`my/ships/${shipSymbol}/orbit`, 'POST');
        return data.data;
    }

    async dockShip(shipSymbol) {
        const data = await this.#request(`my/ships/${shipSymbol}/dock`, 'POST');
        return data.data;
    }

    async refuelShip(shipSymbol) {
        const data = await this.#request(`my/ships/${shipSymbol}/refuel`, 'POST');
        return data.data;
    }

    async extractResources(shipSymbol) {
        const data = await this.#request(`my/ships/${shipSymbol}/extract`, 'POST');
        return data.data;
    }

    // Contract endpoints
    async getMyContracts(page = 1, limit = 20) {
        const data = await this.#request(`my/contracts?page=${page}&limit=${limit}`);
        return data;
    }

    async getContract(contractId) {
        const data = await this.#request(`my/contracts/${contractId}`);
        return data.data;
    }

    async acceptContract(contractId) {
        const data = await this.#request(`my/contracts/${contractId}/accept`, 'POST');
        return data.data;
    }

    async deliverContract(contractId, shipSymbol, tradeSymbol, units) {
        const data = await this.#request(
            `my/contracts/${contractId}/deliver`,
            'POST',
            { shipSymbol, tradeSymbol, units }
        );
        return data.data;
    }

    async fulfillContract(contractId) {
        const data = await this.#request(`my/contracts/${contractId}/fulfill`, 'POST');
        return data.data;
    }

    // System endpoints
    async getSystems(page = 1, limit = 20) {
        const data = await this.#request(`systems?page=${page}&limit=${limit}`);
        return data;
    }

    async getSystem(systemSymbol) {
        const data = await this.#request(`systems/${systemSymbol}`);
        return data.data;
    }

    async getWaypoints(systemSymbol, page = 1, limit = 20) {
        const data = await this.#request(
            `systems/${systemSymbol}/waypoints?page=${page}&limit=${limit}`
        );
        return data;
    }

    async getWaypoint(systemSymbol, waypointSymbol) {
        const data = await this.#request(
            `systems/${systemSymbol}/waypoints/${waypointSymbol}`
        );
        return data.data;
    }

    async getMarket(systemSymbol, waypointSymbol) {
        const data = await this.#request(
            `systems/${systemSymbol}/waypoints/${waypointSymbol}/market`
        );
        return data.data;
    }

    async getShipyard(systemSymbol, waypointSymbol) {
        const data = await this.#request(
            `systems/${systemSymbol}/waypoints/${waypointSymbol}/shipyard`
        );
        return data.data;
    }

    async getJumpGate(systemSymbol, waypointSymbol) {
        const data = await this.#request(
            `systems/${systemSymbol}/waypoints/${waypointSymbol}/jump-gate`
        );
        return data.data;
    }

    // Trade endpoints
    async purchaseCargo(shipSymbol, symbol, units) {
        const data = await this.#request(
            `my/ships/${shipSymbol}/purchase`,
            'POST',
            { symbol, units }
        );
        return data.data;
    }

    async sellCargo(shipSymbol, symbol, units) {
        const data = await this.#request(
            `my/ships/${shipSymbol}/sell`,
            'POST',
            { symbol, units }
        );
        return data.data;
    }

    async transferCargo(shipSymbol, tradeSymbol, units, targetShipSymbol) {
        const data = await this.#request(
            `my/ships/${shipSymbol}/transfer`,
            'POST',
            { tradeSymbol, units, shipSymbol: targetShipSymbol }
        );
        return data.data;
    }

    async jettisonCargo(shipSymbol, symbol, units) {
        const data = await this.#request(
            `my/ships/${shipSymbol}/jettison`,
            'POST',
            { symbol, units }
        );
        return data.data;
    }

    // Faction endpoints
    async getFactions(page = 1, limit = 20) {
        const data = await this.#request(`factions?page=${page}&limit=${limit}`);
        return data;
    }

    async getFaction(factionSymbol) {
        const data = await this.#request(`factions/${factionSymbol}`);
        return data.data;
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    // Check if token is valid
    async validateToken() {
        try {
            await this.getMyAgent();
            return true;
        } catch {
            return false;
        }
    }

    // Get API rate limit info from response headers
    getRateLimitInfo(response) {
        return {
            limit: response.headers.get('X-Ratelimit-Limit'),
            remaining: response.headers.get('X-Ratelimit-Remaining'),
            reset: response.headers.get('X-Ratelimit-Reset')
        };
    }
}