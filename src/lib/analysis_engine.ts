
import { USER_DATA } from './user_data';
import type { Vendor, SalesRecord, CashFlowRecord, BankRecord, SalesSummaryRecord } from './user_data';

export interface AnalysisResult {
    duplicateVendors: { original: Vendor, duplicate: Vendor }[];
    duplicateSales: { original: SalesRecord, duplicate: SalesRecord }[];
    cashFlowAnomalies: { date: string, expected: number, actual: number, difference: number }[];
    circularTrading: { cycle: string[], amount: number }[];
    salesSpikes: { month: string, amount: number, growth: string }[];
}

export function analyzeUserData(): AnalysisResult {
    const result: AnalysisResult = {
        duplicateVendors: [],
        duplicateSales: [],
        cashFlowAnomalies: [],
        circularTrading: [],
        salesSpikes: []
    };

    // 1. Detect Duplicate Vendors (Same Bank Account)
    const vendorMap = new Map<string, Vendor>();
    USER_DATA.vendors.forEach(vendor => {
        if (vendor.Bank_Account_number === 'N/A') return;

        if (vendorMap.has(vendor.Bank_Account_number)) {
            result.duplicateVendors.push({
                original: vendorMap.get(vendor.Bank_Account_number)!,
                duplicate: vendor
            });
        } else {
            vendorMap.set(vendor.Bank_Account_number, vendor);
        }
    });

    // 2. Detect Duplicate Sales (Same ID or Details)
    const salesMap = new Map<number, SalesRecord>();
    USER_DATA.salesRegister.forEach(sale => {
        if (salesMap.has(sale.ID)) {
            result.duplicateSales.push({
                original: salesMap.get(sale.ID)!,
                duplicate: sale
            });
        } else {
            salesMap.set(sale.ID, sale);
        }
    });

    // 3. Analyze Cash Flow
    USER_DATA.cashFlow.forEach(record => {
        const expectedClosing = record.Opening_Cash + record.Cash_In - record.Cash_Out;
        if (expectedClosing !== record.Closing_Cash) {
            result.cashFlowAnomalies.push({
                date: record.Date,
                expected: expectedClosing,
                actual: record.Closing_Cash,
                difference: record.Closing_Cash - expectedClosing
            });
        }
    });

    // 4. Detect Circular Trading (Simple A->B->A check)
    // Looking for pattern: A -> B (Amt), B -> A (Amt - small diff)
    for (let i = 0; i < USER_DATA.bankStatement.length; i++) {
        const tx1 = USER_DATA.bankStatement[i];
        if (!tx1.To_Account || !tx1.From_Account) continue;

        for (let j = i + 1; j < USER_DATA.bankStatement.length; j++) {
            const tx2 = USER_DATA.bankStatement[j];

            // Checks if money returns to original sender
            if (tx1.To_Account === tx2.From_Account && tx1.From_Account === tx2.To_Account) {
                // Check if amounts are similar (within 5% margin)
                const margin = tx1.Amount * 0.05;
                if (Math.abs(tx1.Amount - tx2.Amount) <= margin) {
                    result.circularTrading.push({
                        cycle: [tx1.From_Account, tx1.To_Account, tx1.From_Account],
                        amount: tx1.Amount
                    });
                }
            }
        }
    }

    // 5. Detect Sales Spikes
    USER_DATA.salesSummary.forEach(record => {
        if (record.Remark && record.Remark.includes("HIGH JUMP")) {
            result.salesSpikes.push({
                month: record.Month,
                amount: record.Sales,
                growth: record.Remark
            });
        }
    });

    return result;
}
