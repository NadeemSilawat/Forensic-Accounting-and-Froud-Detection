
import type { UserDataShape } from './user_data';

export interface AnalysisResult {
    duplicateVendors: { original: any, duplicate: any }[];
    duplicateSales: { original: any, duplicate: any }[];
    cashFlowAnomalies: { date: string, expected: number, actual: number, difference: number }[];
    circularTrading: { cycle: string[], amount: number }[];
    salesSpikes: { month: string, amount: number, growth: string }[];
}

export function analyzeUserData(userData: UserDataShape): AnalysisResult {
    const result: AnalysisResult = {
        duplicateVendors: [],
        duplicateSales: [],
        cashFlowAnomalies: [],
        circularTrading: [],
        salesSpikes: []
    };

    // 1. Detect Duplicate Vendors (Same Bank Account)
    const vendorMap = new Map<string, any>();
    userData.vendors.forEach(vendor => {
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

    // 2. Detect Duplicate Sales (Same ID)
    const salesMap = new Map<number, any>();
    userData.salesRegister.forEach(sale => {
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
    userData.cashFlow.forEach(record => {
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

    // 4. Detect Circular Trading (A→B→A check)
    for (let i = 0; i < userData.bankStatement.length; i++) {
        const tx1 = userData.bankStatement[i];
        if (!tx1.To_Account || !tx1.From_Account) continue;
        for (let j = i + 1; j < userData.bankStatement.length; j++) {
            const tx2 = userData.bankStatement[j];
            if (tx1.To_Account === tx2.From_Account && tx1.From_Account === tx2.To_Account) {
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
    userData.salesSummary.forEach(record => {
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
