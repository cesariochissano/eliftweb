
// eLift Core Intelligence - System Rules & Logic
// This file implements the "Permanent and Non-Negotiable" rules of the eLift AI system.

export interface PricingParams {
    distanceKm: number;
    durationMin: number;
    basePrice: number;
    serviceType: string;
    demandFactor?: number;
    isNight?: boolean;
    isRain?: boolean;
    waitingTimeMin?: number;
    routeAdjustmentKm?: number;
    routeAdjustmentCost?: number;
}

export interface FareBreakdown {
    basePrice: number;
    routeAdjustment: number;
    waitingCost: number;
    total: number;
}

export interface CommissionParams {
    tripPrice: number;
    driverRating: number;
    tripsToday: number;
    isFleetDriver: boolean;
    cancelRate: number;
}

export interface FleetSplitParams {
    tripPrice: number;
    platformCommission: number; // The amount already calculated by calculateCommission
    fleetType: 'INDIVIDUAL' | 'CORPORATE';
    ownerCommissionRate: number; // e.g. 10 for 10%
}

export interface SplitResult {
    platformTake: number;
    fleetTake: number;
    driverTake: number;
}

export const SYSTEM_PROMPT = `
Implemente as seguintes funções como regras permanentes e inegociáveis do sistema de Inteligência Artificial do eLift.
Este prompt define o comportamento, limites, lógica de negócio e decisões automáticas da plataforma.

Você é a **IA Central do eLift**, operando em segundo plano.
Você **não é um chatbot visível**, não conversa livremente com usuários e **nunca contradiz estas regras**.

## 1. Estrutura Geral
* Operar de forma contextual e baseada em dados reais do sistema.
* Priorizar segurança, sustentabilidade financeira e confiança.

## 2. Cálculo Avançado de Comissão do eLift
A comissão **não é fixa** e deve ser calculada combinando múltiplas variáveis.

## 3. Precificação Dinâmica
Calcular tarifas com base em oferta e demanda, evitando picos abusivos.

## 4. Matching Inteligente
Selecionar motoristas considerando proximidade, histórico, e tipo de veículo.

## 8. Limites do Sistema
* Nunca prometer algo fora das regras.
* Nunca tomar decisões legais finais.
* Sempre escalar casos críticos para humanos.
`;

export const ASSISTANT_PROMPT = `
Você é a **Assistente eLift**, a IA conversacional do aplicativo.
Você interage diretamente com passageiros, motoristas e frotistas de forma clara, humana e objetiva.
Você **obedece integralmente** ao System Prompt e nunca o contradiz.

## 1. Consciência de Contexto
Identifique automaticamente o tipo de utilizador e estado atual.

## 6. Linguagem e Tom
* Linguagem simples e profissional.
* Respostas claras e objetivas.
* Nunca discutir com o utilizador.
`;


// Pricing Configuration


const PRICING_RULES: Record<string, { base: number; perKm: number; perMin: number; minPrice: number }> = {
    'drive': { base: 70, perKm: 45, perMin: 4, minPrice: 80 },
    'txopela': { base: 40, perKm: 30, perMin: 2.5, minPrice: 60 },
    'bike': { base: 30, perKm: 25, perMin: 2, minPrice: 50 },
    'carga': { base: 250, perKm: 85, perMin: 5, minPrice: 200 },
};

export class EliftIntelligence {

    // --- 3. Precificação Dinâmica ---
    static calculatePrice(params: PricingParams): number {
        const { distanceKm, durationMin, serviceType, demandFactor = 1.0, isNight = false, isRain = false, waitingTimeMin = 0, routeAdjustmentKm = 0, routeAdjustmentCost = 0 } = params;

        const rules = PRICING_RULES[serviceType] || PRICING_RULES['drive'];

        // Core Calculation
        const priceDistance = (distanceKm + routeAdjustmentKm) * rules.perKm;
        const priceTime = durationMin * rules.perMin;
        const waitingCost = waitingTimeMin * 1; // 1 MT/min (Bloco 7.4)

        const subtotal = rules.base + priceDistance + priceTime + waitingCost + routeAdjustmentCost;

        // Multipliers (Surge Pricing)
        let multiplier = demandFactor;
        const hour = new Date().getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
        const isLateNight = hour >= 23 || hour <= 4;

        if (isRushHour) multiplier += 0.2;
        if (isLateNight || isNight) multiplier += 0.3;
        if (isRain) multiplier += 0.2;

        multiplier = Math.min(multiplier, 3.0);

        let finalPrice = subtotal * multiplier;

        finalPrice = Math.max(finalPrice, rules.minPrice);

        return Math.ceil(finalPrice / 10) * 10;
    }

    // --- Bloco 7.4: Detalhado (X + Y + Z) ---
    static getFareBreakdown(params: PricingParams): FareBreakdown {
        const { distanceKm, durationMin, serviceType, waitingTimeMin = 0, routeAdjustmentKm = 0 } = params;
        const rules = PRICING_RULES[serviceType] || PRICING_RULES['drive'];

        const base = rules.base + (distanceKm * rules.perKm) + (durationMin * rules.perMin);
        const reroute = routeAdjustmentKm * rules.perKm;
        const wait = waitingTimeMin * 1; // 1 MT/min

        return {
            basePrice: base,
            routeAdjustment: reroute,
            waitingCost: wait,
            total: base + reroute + wait
        };
    }

    // --- Bloco 7.5: Cálculo de Impacto de Paragens Dinâmicas ---
    static calculateStopImpact(params: {
        serviceType: string;
        originalDistanceKm: number;
        newDistanceKm: number;
        originalDurationMin: number;
        newDurationMin: number;
    }): { extraCost: number; deltaDistance: number; deltaTime: number } {
        const rules = PRICING_RULES[params.serviceType] || PRICING_RULES['drive'];

        const deltaDistance = Math.max(0, params.newDistanceKm - params.originalDistanceKm);
        const deltaTime = Math.max(0, params.newDurationMin - params.originalDurationMin);

        const baseStopFee = 10; // Taxa de conveniência por paragem
        const distanceCost = deltaDistance * rules.perKm;
        const timeCost = deltaTime * rules.perMin;

        // Fórmula: Base + (Adicional de Distância) + (Adicional de Tempo)
        let extraCost = baseStopFee + distanceCost + timeCost;

        // Arredondamento para os 5 MT mais próximos
        extraCost = Math.ceil(extraCost / 5) * 5;

        return {
            extraCost,
            deltaDistance,
            deltaTime
        };
    }

    // --- 2. Cálculo Avançado de Comissão ---
    // Returns the AMOUNT the platform takes (The Commission)
    static calculateCommission(params: CommissionParams): number {
        const { tripPrice, driverRating, tripsToday, isFleetDriver, cancelRate } = params;

        // Base Commission: 20%
        let commRate = 0.20;

        // Rule: Reduced commission for productive drivers
        if (tripsToday > 10) commRate -= 0.02; // -2% if > 10 trips
        if (tripsToday > 20) commRate -= 0.03; // -3% extra if > 20 trips

        // Rule: Performance Penalty
        if (driverRating < 4.5) commRate += 0.05; // +5% penalty
        if (cancelRate > 10) commRate += 0.05; // +5% penalty for high cancellations

        // Rule: Fleet Differentiation
        if (isFleetDriver) {
            // Fleet drivers might have a slightly higher base platform fee if the fleet agreement covers it, 
            // OR lower if the fleet manages support. Let's assume Standard:
            // Actually, usually fleets negotiate lower rates.
            commRate = 0.18; // Flat 18% for fleets
        }

        // Rule: Hard Limits (Min 10%, Max 35%)
        commRate = Math.max(0.10, Math.min(0.35, commRate));

        return Math.round(tripPrice * commRate);
    }

    // --- 4. Cálculo de Divisão (Split) de Frotas ---
    static calculateSplit(params: FleetSplitParams): SplitResult {
        const { tripPrice, platformCommission, fleetType, ownerCommissionRate } = params;

        const platformTake = platformCommission;
        let fleetTake = 0;
        let driverTake = 0;

        if (fleetType === 'CORPORATE') {
            // Corporate Model (Bipartite): 
            // eLift takes commission, Fleet takes EVERYTHING ELSE.
            // Driver is paid fixed salary outside.
            fleetTake = tripPrice - platformTake;
            driverTake = 0;
        } else {
            // Individual Model (Tripartite):
            // eLift takes commission, Fleet takes its %, Driver takes the rest.
            fleetTake = Math.round(tripPrice * (ownerCommissionRate / 100));
            driverTake = tripPrice - platformTake - fleetTake;

            // Safety: ensure driverTake isn't negative (unlikely but safe)
            if (driverTake < 0) driverTake = 0;
        }

        return {
            platformTake,
            fleetTake,
            driverTake
        };
    }

    // --- 5. Matching Inteligente (Simulation) ---
    // Returns a score for a driver. Higher is better.
    static scoreDriverForMatch(driver: any, pickupLat: number, pickupLng: number): number {
        let score = 100;

        // Proximity (The most important)
        const distance = Math.sqrt(
            Math.pow(driver.lat - pickupLat, 2) + Math.pow(driver.lng - pickupLng, 2)
        );
        score -= distance * 1000; // Penalize distance heavily

        // History / Rating
        if (driver.rating) score += (driver.rating - 4.0) * 20; // Bonus for high rating

        // Vehicle Type would be filtered before scoring

        return score;
    }

    // --- 5. Análise de Performance & Assistente (Simulation) ---
    static processAssistantMessage(message: string, context: { userRole: 'passenger' | 'driver' | 'fleet', tripStatus: string, userId?: string, stats?: any, tripDetails?: any }): { text: string; action?: string } {
        const msg = message.toLowerCase();

        // --- PASSENGER CONTEXT ---
        if (context.userRole === 'passenger') {
            if (msg.includes('cancel') || msg.includes('cancelar')) {
                return { text: "Você pode cancelar a viagem a qualquer momento. Se o motorista já estiver a caminho, uma taxa de cancelamento poderá ser aplicada. Deseja prosseguir?" };
            }
            if (msg.includes('preço') || msg.includes('price') || msg.includes('valor')) {
                return { text: "O preço da viagem é calculado dinamicamente com base na distância, tempo estimado e demanda atual da região." };
            }
            if (msg.includes('ola') || msg.includes('olá') || msg.includes('oi')) {
                return { text: "Olá! Sou a Assistente eLift. Como posso ajudar com a sua viagem hoje?" };
            }
            if (msg.includes('objeto') || msg.includes('perde') || msg.includes('esqueci')) {
                return { text: "Lamento ouvir isso. Por favor, vá ao menu Histórico, selecione a viagem e use a opção 'Reportar Objeto Perdido' para contactarmos o motorista." };
            }
        }

        // --- DRIVER CONTEXT ---
        if (context.userRole === 'driver') {
            const earnings = context.stats?.todayEarnings || 0;
            const trips = context.stats?.todayTrips || 0;

            if (msg.includes('ganho') || msg.includes('faturei') || msg.includes('rendimento')) {
                return { text: `Hoje você já faturou ${earnings.toLocaleString()} MZN em ${trips} viagens. Continue assim!` };
            }
            if (msg.includes('meta') || msg.includes('objetivo')) {
                const remaining = Math.max(0, 5000 - earnings);
                return { text: remaining > 0 ? `Faltam ${remaining.toLocaleString()} MZN para sua meta diária de 5.000 MZN.` : "Parabéns! Você já atingiu a meta diária de 5.000 MZN!" };
            }
            if (msg.includes('comissão') || msg.includes('taxa')) {
                return { text: "A comissão do eLift varia entre 10% e 35%, dependendo da sua performance, horário e zona. Motoristas com avaliação alta e muitas viagens pagam menos comissão!" };
            }
            if (msg.includes('cancel')) {
                return { text: "Cancelamentos excessivos podem afetar sua taxa de aceitação e aumentar sua comissão. Recomendamos cancelar apenas em emergências." };
            }
        }

        // Default response
        return { text: "Desculpe, ainda estou aprendendo. Pode reformular a sua questão?" };
    }

    // --- 6. Mensagens Rápidas Inteligentes ---
    static getQuickMessages(status: string, role: 'passenger' | 'driver'): string[] {
        if (role === 'driver') {
            switch (status) {
                case 'ACCEPTED': return ["Estou a caminho!", "Chego em 5 minutos.", "Trânsito intenso, um pouco de atraso.", "Já estou quase aí."];
                case 'ARRIVED': return ["Já estou no local.", "Estou parado em frente.", "Onde você está?", "Ligue o pisca-alerta se me vir."];
                case 'IN_PROGRESS': return ["Iniciando a viagem.", "O destino está correto?", "Vou seguir pelo GPS.", "Posso ligar o AC?"];
                default: return ["Olá!", "Ok, obrigado.", "Entendido."];
            }
        } else {
            switch (status) {
                case 'ACCEPTED': return ["Estou à espera!", "Pode vir.", "Qual é a cor do carro?", "Estou em frente ao prédio."];
                case 'ARRIVED': return ["Estou a sair agora.", "Desço em 1 minuto.", "Já te vi!", "Pode esperar um pouco?"];
                case 'IN_PROGRESS': return ["Pode ir mais rápido?", "Obrigado pela viagem.", "Pode mudar a música?", "Tudo bem."];
                default: return ["Olá!", "Ok, obrigado.", "Entendido."];
            }
        }
    }

    // --- Bloco 7.4: Anti-Abuso & Validação Geográfica ---

    static validateArrivedStatus(driverLat: number, driverLng: number, targetLat: number, targetLng: number, speedKmh: number): { valid: boolean; reason?: string } {
        // GPS Distance (Approximate Haversine)
        const R = 6371e3; // metres
        const φ1 = driverLat * Math.PI / 180;
        const φ2 = targetLat * Math.PI / 180;
        const Δφ = (targetLat - driverLat) * Math.PI / 180;
        const Δλ = (targetLng - driverLng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // in metres

        if (distance > 60) { // 60m buffer (slightly more than 50m for GPS jitter)
            return { valid: false, reason: "Você ainda não chegou ao ponto de recolha." };
        }

        if (speedKmh > 10) { // Should be almost stopped
            return { valid: false, reason: "Por favor, pare o veículo para marcar chegada." };
        }

        return { valid: true };
    }

    static generateSecurityPin(): string {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    static shouldEnforcePin(isCriticalZone: boolean, isNight: boolean): boolean {
        return isCriticalZone || isNight;
    }

    // Heurística para botão "Estou no Lift"
    static shouldAskForOnboardConfirmation(passengerLoc: { lat: number, lng: number }, driverLoc: { lat: number, lng: number }): boolean {
        const dist = Math.sqrt(Math.pow(passengerLoc.lat - driverLoc.lat, 2) + Math.pow(passengerLoc.lng - driverLoc.lng, 2));
        return dist > 0.0005; // ~50m apart in lat/lng units (simplified)
    }
}
