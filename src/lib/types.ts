export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    type: 'sale' | 'purchase' | 'expense' | 'transfer' | 'loan_in' | 'loan_out';
    partyName: string;
    category: string;
    // Bank details (from new form)
    bankAccountNo?: string;
    ifscCode?: string;
    bankAddress?: string;
    gstOrPan?: string;
    // Engine-computed fields (auto-derived, not entered manually)
    isRelatedParty: boolean;
    isDisclosed: boolean;
    actualCashFlow: number;
    statedPurpose?: string;
    actualUsage?: string;
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
    riskScore: number;
    flaggedTransactions: number;
}

// ─── New Form Types ───────────────────────────────────────────────────────────

export interface CompanyInfo {
    name: string;
    address: string;
    gstNo: string;
    cin: string;
    financialYear: string;
}

export interface Director {
    id: string;
    name: string;
    mobile: string;
    homeAddress: string;
    bankAccountNo: string;
    ifscCode: string;
    bankAddress: string;
}

export interface VendorEntry {
    id: string;
    transactionId: string;
    date: string;
    amount: string;
    type: string;
    vendorName: string;
    bankAccountNo: string;
    ifscCode: string;
    bankAddress: string;
    gstOrPan: string;
    isRelatedParty: boolean;
    isDisclosed: boolean;
}

export interface CashFlowEntry {
    id: string;
    date: string;
    openingCash: string;
    cashIn: string;
    cashOut: string;
    closingCash: string;
    flag: string;
}

export interface MonthlySummaryEntry {
    id: string;
    month: string;
    amount: string;
}

export interface BankEntry {
    id: string;
    fromAccount: string;
    toAccount: string;
    amount: string;
    remark: string;
}

export interface FormData {
    company: CompanyInfo;
    directors: Director[];
    transactions: Transaction[];
    vendors: VendorEntry[];
    cashFlow: CashFlowEntry[];
    salesSummary: MonthlySummaryEntry[];
    purchaseSummary: MonthlySummaryEntry[];
    bankDetails: BankEntry[];
}
