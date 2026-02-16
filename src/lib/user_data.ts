
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

export const USER_DATA = {
    vendors: [
        { Vendor_ID: 1, Vendor_Name: "Rajesh Kumar Sharma", Bank_Account_number: "987654-321012", IFSC_CODE: "SBIN0001234", BANK_ADDRESS: "Pali Main Branch, Rajasthan", GST_No: "08AAAAA0000A1Z5" },
        { Vendor_ID: 2, Vendor_Name: "Amit Singh", Bank_Account_number: "501001-234567", IFSC_CODE: "HDFC0000456", BANK_ADDRESS: "Mumbai, Maharashtra", GST_No: "27AAAAA0000A1Z5" },
        { Vendor_ID: 3, Vendor_Name: "Priya Verma", Bank_Account_number: "40500-0123456", IFSC_CODE: "ICIC0000004", BANK_ADDRESS: "Delhi, Connaught Place", GST_No: "07BBBBB1111B1Z2" },
        { Vendor_ID: 4, Vendor_Name: "Rajesh Kumar Sharma", Bank_Account_number: "987654-321012", IFSC_CODE: "SBIN0001234", BANK_ADDRESS: "Pali Main Branch, Rajasthan", GST_No: "08AAAAA0000A1Z5" }, // Duplicate of 1
        { Vendor_ID: 5, Vendor_Name: "Suresh bhati", Bank_Account_number: "N/A", IFSC_CODE: "N/A", BANK_ADDRESS: "JODHPUR", GST_No: "NA" }
    ] as Vendor[],

    salesRegister: [
        { ID: 101, Customer_Name: "ABC Traders", Bank_Account_number: "30210015000123", IFSC_CODE: "PUNB0302100", Location: "Jodhpur, Rajasthan", GST_No: "08CCCCC2222C1Z9" },
        { ID: 102, Customer_Name: "XYZ Corp", Bank_Account_number: "12340100012345", IFSC_CODE: "BARB0PAL0XX", Location: "Pali, Rajasthan", GST_No: "08DDDDD3333D1Z0" }, // IFSC Typo in image? Using provided text
        { ID: 103, Customer_Name: "Dummy Customer", Bank_Account_number: "915010045678901", IFSC_CODE: "UTIB0000123", Location: "Bangalore, Karnataka", GST_No: "29EEEEE4444E1Z7" },
        { ID: 104, Customer_Name: "cbd company", Bank_Account_number: "N/A", IFSC_CODE: "N/A", Location: "N/A", GST_No: "N/A" },
        { ID: 105, Customer_Name: "ABC Traders", Bank_Account_number: "30210015000123", IFSC_CODE: "PUNB0302100", Location: "Jodhpur, Rajasthan", GST_No: "08CCCCC2222C1Z9" }, // Duplicate of 101
        { ID: 106, Customer_Name: "XYZ Corp", Bank_Account_number: "12340100012345", IFSC_CODE: "BARB0PAL0XX", Location: "Pali, Rajasthan", GST_No: "08DDDDD3333D1Z0" }  // Duplicate of 102
    ] as SalesRecord[],

    cashFlow: [
        { Date: "2025-01-05", Opening_Cash: 200000, Cash_In: 50000, Cash_Out: 30000, Closing_Cash: 220000, Flag: "OK" },
        { Date: "2025-01-06", Opening_Cash: 220000, Cash_In: 90000, Cash_Out: 150000, Closing_Cash: 160000, Flag: "Cash Missing" },
        { Date: "2025-01-07", Opening_Cash: 160000, Cash_In: 80000, Cash_Out: 120000, Closing_Cash: 120000, Flag: "Cash Missing" },
        { Date: "2025-01-08", Opening_Cash: 120000, Cash_In: 80000, Cash_Out: 60000, Closing_Cash: 140000, Flag: "ok" },
        { Date: "2025-01-09", Opening_Cash: 140000, Cash_In: 70000, Cash_Out: 90000, Closing_Cash: 120000, Flag: "Cash Missing" }
    ] as CashFlowRecord[],

    bankStatement: [
        { From_Account: "Company A", To_Account: "Vendor X", Amount: 100000, Remark: "Payment" },
        { From_Account: "Vendor X", To_Account: "Company A", Amount: 98000, Remark: "Returned" },
        { From_Account: "Company A", To_Account: "Vendor X", Amount: 100000, Remark: "Repeated Cycle" },
        { From_Account: "BANK LOAN", To_Account: "", Amount: 1000000, Remark: "RECEIVED", Reason: "MANUFACTURING" },
        { From_Account: "PAD SALARY", To_Account: "", Amount: 500000, Remark: "Payment", Reason: "SALARY" },
        { From_Account: "OLD DEBTS", To_Account: "", Amount: 500000, Remark: "Payment", Reason: "OLD DUE CLEARING" }
    ] as BankRecord[],

    salesSummary: [
        { Month: "APR", Sales: 45000 },
        { Month: "MAY", Sales: 50000 },
        { Month: "JUNE", Sales: 120000, Remark: "HIGH JUMP" },
        { Month: "JULY", Sales: 60000 },
        { Month: "AUG", Sales: 65000 },
        { Month: "NOV", Sales: 1000000, Remark: "HIGH JUMP" },
        { Month: "DEC", Sales: 70000 }
    ] as SalesSummaryRecord[]
};
