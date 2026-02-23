
import type { Transaction, RiskAnalysisResult, MonthlyStats } from './types';


// Helper to check if date is in March
const isMarch = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === 2; // March is 2 (0-indexed)
}

export function analyzeTransaction(tx: Transaction, _history: Transaction[]): RiskAnalysisResult {
    const factors: string[] = [];
    let score = 0;

    // --- LAYER 1: BUSINESS LOGIC CHECK (Anomaly Detection) ---
    // Check for sudden spikes in March sales
    if (tx.type === 'sale' && isMarch(tx.date) && tx.amount > 50000000) {
        factors.push("Layer 1: Sudden high value transaction in March (Year-end spike).");
        score += 40;
    }

    // --- LAYER 2: RELATIONSHIP CHECK (Hidden Related Party) ---
    if (tx.isRelatedParty && !tx.isDisclosed) {
        factors.push("Layer 2: Undisclosed Related Party Transaction detection.");
        score += 50;
    }

    // --- LAYER 3: CASH REALITY CHECK (Profit vs Cash) ---
    if (tx.type === 'sale' && tx.actualCashFlow === 0) {
        factors.push("Layer 3: Revenue recognized but no cash received (Fake Profit risk).");
        score += 45;
    }

    // --- TICC: INTENT CONSISTENCY CHECK ---
    if (tx.statedPurpose && tx.actualUsage && tx.statedPurpose !== tx.actualUsage) {
        factors.push(`TICC Intent Violation: Funds for '${tx.statedPurpose}' diverted to '${tx.actualUsage}'.`);
        score += 60;
    }

    // Normalization
    if (score > 100) score = 100;

    let level: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (score > 80) level = 'Critical';
    else if (score > 60) level = 'High';
    else if (score > 30) level = 'Medium';

    return {
        transactionId: tx.id,
        riskLevel: level,
        riskFactors: factors,
        score
    };
}

export function generateMonthlyStats(transactions: Transaction[]): MonthlyStats[] {
    const stats: Record<string, MonthlyStats> = {};

    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const monthKey = date.toLocaleString('default', { month: 'long' });

        if (!stats[monthKey]) {
            stats[monthKey] = {
                month: monthKey,
                totalSales: 0,
                totalCashFlow: 0,
                riskScore: 0,
                flaggedTransactions: 0
            };
        }

        if (tx.type === 'sale') {
            stats[monthKey].totalSales += tx.amount;
        }
        stats[monthKey].totalCashFlow += tx.actualCashFlow;

        const analysis = analyzeTransaction(tx, transactions);
        if (analysis.riskLevel !== 'Low') {
            stats[monthKey].flaggedTransactions++;
            stats[monthKey].riskScore += analysis.score;
        }
    });

    // Normalize risk score for the month (average of flagged)
    Object.values(stats).forEach(stat => {
        if (stat.flaggedTransactions > 0) {
            stat.riskScore = Math.round(stat.riskScore / stat.flaggedTransactions);
        }

        // --- SPD: SILENCE PATTERN DETECTION ---
        // If Sales are high but Cash Flow is negative/low, flag silence on bad debts
        if (stat.totalSales > 50000000 && stat.totalCashFlow < 0) {
            // This is a heuristic for "Silence" about bad debts
            // In a real app, we'd check if a Provision entry exists.
            // For simulation, we assume silence if high sales + neg cash.
            stat.riskScore = Math.max(stat.riskScore, 85);
            // We can't easily add a "factor" to a monthly stat in this interface, 
            // but the high score will turn the heat map RED.
        }
    });

    // Return array sorted by month (Jan, Feb, Mar)
    const order = ['January', 'February', 'March'];
    return Object.values(stats).sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month));
}
