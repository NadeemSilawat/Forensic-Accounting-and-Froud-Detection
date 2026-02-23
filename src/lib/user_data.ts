
import type { FormData, VendorEntry, CashFlowEntry, BankEntry, MonthlySummaryEntry } from './types';

// ─── Static Interfaces (kept for analysis_engine.ts compatibility) ─────────────

export interface Vendor {
    Vendor_ID: number;
    Vendor_Name: string;
    Bank_Account_number: string;
    IFSC_CODE: string;
    BANK_ADDRESS: string;
    GST_No: string;
}

export interface SalesRecord {
    ID: number;
    Customer_Name: string;
    Bank_Account_number: string;
    IFSC_CODE: string;
    Location: string;
    GST_No: string;
}

export interface CashFlowRecord {
    Date: string;
    Opening_Cash: number;
    Cash_In: number;
    Cash_Out: number;
    Closing_Cash: number;
    Flag: string;
}

export interface BankRecord {
    From_Account: string;
    To_Account: string;
    Amount: number;
    Remark: string;
    Reason?: string;
}

export interface SalesSummaryRecord {
    Month: string;
    Sales: number;
    Remark?: string;
}

export interface UserDataShape {
    vendors: Vendor[];
    salesRegister: SalesRecord[];
    cashFlow: CashFlowRecord[];
    bankStatement: BankRecord[];
    salesSummary: SalesSummaryRecord[];
}

// ─── Converter: FormData → UserDataShape ──────────────────────────────────────

export function formDataToUserData(formData: FormData): UserDataShape {
    const vendors: Vendor[] = formData.vendors.map((v: VendorEntry, i: number) => ({
        Vendor_ID: i + 1,
        Vendor_Name: v.vendorName || 'Unknown',
        Bank_Account_number: v.bankAccountNo || 'N/A',
        IFSC_CODE: v.ifscCode || 'N/A',
        BANK_ADDRESS: v.bankAddress || 'N/A',
        GST_No: v.gstOrPan || 'N/A',
    }));

    const salesRegister: SalesRecord[] = formData.vendors
        .filter(v => v.type.toLowerCase().includes('sale'))
        .map((v: VendorEntry, i: number) => ({
            ID: i + 101,
            Customer_Name: v.vendorName || 'Unknown',
            Bank_Account_number: v.bankAccountNo || 'N/A',
            IFSC_CODE: v.ifscCode || 'N/A',
            Location: v.bankAddress || 'N/A',
            GST_No: v.gstOrPan || 'N/A',
        }));

    const cashFlow: CashFlowRecord[] = formData.cashFlow.map((cf: CashFlowEntry) => ({
        Date: cf.date,
        Opening_Cash: parseFloat(cf.openingCash) || 0,
        Cash_In: parseFloat(cf.cashIn) || 0,
        Cash_Out: parseFloat(cf.cashOut) || 0,
        Closing_Cash: parseFloat(cf.closingCash) || 0,
        Flag: cf.flag || 'OK',
    }));

    const bankStatement: BankRecord[] = formData.bankDetails.map((b: BankEntry) => ({
        From_Account: b.fromAccount,
        To_Account: b.toAccount,
        Amount: parseFloat(b.amount) || 0,
        Remark: b.remark,
    }));

    // Build sales summary with spike detection
    const salesSummary: SalesSummaryRecord[] = buildSalesSummary(formData.salesSummary);

    return { vendors, salesRegister, cashFlow, bankStatement, salesSummary };
}

function buildSalesSummary(entries: MonthlySummaryEntry[]): SalesSummaryRecord[] {
    if (entries.length === 0) return [];
    const amounts = entries.map(e => parseFloat(e.amount) || 0);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    return entries.map((e, i) => {
        const amount = amounts[i];
        const remark = amount > avg * 1.5 ? 'HIGH JUMP' : undefined;
        return { Month: e.month, Sales: amount, Remark: remark };
    });
}


// ─── Default / Empty FormData ─────────────────────────────────────────────────

export function emptyFormData(): FormData {
    return {
        company: { name: '', address: '', gstNo: '', cin: '', financialYear: '' },
        directors: [],
        transactions: [],
        vendors: [],
        cashFlow: [],
        salesSummary: [],
        purchaseSummary: [],
        bankDetails: [],
    };
}
