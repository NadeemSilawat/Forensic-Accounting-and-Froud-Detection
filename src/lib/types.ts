export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Transaction {
    id: string;
    date: string; // ISO Date string
    amount: number;
    type: 'sale' | 'purchase' | 'expense' | 'transfer' | 'loan_in' | 'loan_out';
    partyName: string;
    category: string;
    // Simulation attributes
    isRelatedParty: boolean;
    isDisclosed: boolean;
    actualCashFlow: number; // The real cash movement (e.g. 0 for fake sales)
    statedPurpose?: string; // For TICC
    actualUsage?: string;   // For TICC
}

export interface RiskAnalysisResult {
    transactionId: string;
    riskLevel: RiskLevel;
    riskFactors: string[];
    score: number;
}

export interface MonthlyStats {
    month: string;
    totalSales: number;
    totalCashFlow: number;
    riskScore: number; // 0-100
    flaggedTransactions: number;
}
