
import type { Transaction } from './types';


export const mockTransactions: Transaction[] = [
    // --- JANUARY: NORMAL ACTIVITY ---
    {
        id: 'T-JAN-01',
        date: '2024-01-05',
        amount: 5000000,
        type: 'sale',
        partyName: 'Standard Client A',
        category: 'Revenue',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: 5000000,
    },
    {
        id: 'T-JAN-02',
        date: '2024-01-12',
        amount: 3000000,
        type: 'purchase',
        partyName: 'Vendor X',
        category: 'COGS',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: -3000000,
    },
    {
        id: 'T-JAN-03',
        date: '2024-01-20',
        amount: 15000000,
        type: 'sale',
        partyName: 'Retail Chain B',
        category: 'Revenue',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: 15000000,
    },

    // --- FEBRUARY: MINOR IRREGULARITIES ---
    {
        id: 'T-FEB-01',
        date: '2024-02-10',
        amount: 22000000,
        type: 'sale',
        partyName: 'Tech Corp',
        category: 'Revenue',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: 22000000,
    },
    {
        id: 'T-162', // Document Example: High sales growth but debtor balance increased
        date: '2024-02-25',
        amount: 42000000, // 4.2 Cr
        type: 'sale',
        partyName: 'Global Impex',
        category: 'Revenue',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: 0, // No cash received (Silence/Debtor risk)
    },

    // --- MARCH: THE FRAUD SPIKE ---
    // Layer 1: Business Logic Anomaly (Sudden Spike)
    // Layer 3: Cash Reality (Sales without cash)
    {
        id: 'T-101', // Document Example: Sudden year-end sale with no cash
        date: '2024-03-28',
        amount: 80000000, // 8.0 Cr
        type: 'sale',
        partyName: 'Viper Holdings', // New customer
        category: 'Revenue',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: 0,
    },

    // Layer 2: Relationship Check (Hidden Related Party)
    {
        id: 'T-145', // Document Example: Transaction with promoter-related entity not disclosed
        date: '2024-03-29',
        amount: 65000000, // 6.5 Cr
        type: 'sale',
        partyName: 'ABC Traders',
        category: 'Revenue',
        isRelatedParty: true, // Hidden relation
        isDisclosed: false,   // Alert!
        actualCashFlow: 0,
    },

    // TICC: Intent Consistency Check
    {
        id: 'T-TICC-01',
        date: '2024-03-15',
        amount: 100000000, // 10 Cr Loan
        type: 'loan_in',
        partyName: 'City Bank',
        category: 'Financial',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: 100000000,
        statedPurpose: 'New Factory Construction',
    },
    {
        id: 'T-TICC-02',
        date: '2024-03-16',
        amount: 40000000, // 4 Cr out
        type: 'expense',
        partyName: 'Promoter Shell Co',
        category: 'Operational',
        isRelatedParty: true,
        isDisclosed: false,
        actualCashFlow: -40000000,
        actualUsage: 'Paying Old Debts', // Mismatch with loan purpose
    },
    {
        id: 'T-TICC-03',
        date: '2024-03-18',
        amount: 20000000, // 2 Cr out
        type: 'expense',
        partyName: 'Staff Payroll',
        category: 'Operational',
        isRelatedParty: false,
        isDisclosed: true,
        actualCashFlow: -20000000,
        actualUsage: 'Salaries', // Mismatch with loan purpose
    },
];
