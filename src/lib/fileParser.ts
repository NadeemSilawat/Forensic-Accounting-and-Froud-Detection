import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Transaction } from './types';

/**
 * Expected column headers in the uploaded file.
 * Users can have any of these columns (case-insensitive).
 * The parser will map them to our Transaction interface.
 */
const COLUMN_MAPPINGS: Record<string, keyof Transaction> = {
    'transaction id': 'id',
    'id': 'id',
    'txn id': 'id',
    'date': 'date',
    'transaction date': 'date',
    'txn date': 'date',
    'amount': 'amount',
    'value': 'amount',
    'type': 'type',
    'transaction type': 'type',
    'txn type': 'type',
    'party name': 'partyName',
    'party': 'partyName',
    'customer': 'partyName',
    'vendor': 'partyName',
    'counterparty': 'partyName',
    'category': 'category',
    'head': 'category',
    'account head': 'category',
    'related party': 'isRelatedParty',
    'is related party': 'isRelatedParty',
    'related': 'isRelatedParty',
    'disclosed': 'isDisclosed',
    'is disclosed': 'isDisclosed',
    'cash flow': 'actualCashFlow',
    'actual cash flow': 'actualCashFlow',
    'cash received': 'actualCashFlow',
    'cash': 'actualCashFlow',
    'stated purpose': 'statedPurpose',
    'purpose': 'statedPurpose',
    'loan purpose': 'statedPurpose',
    'actual usage': 'actualUsage',
    'usage': 'actualUsage',
    'actual use': 'actualUsage',
};

function normalizeHeader(header: string): string {
    return header.trim().toLowerCase().replace(/[_\-]+/g, ' ');
}

function parseBoolean(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    const s = String(val).trim().toLowerCase();
    return ['yes', 'true', '1', 'y'].includes(s);
}

function parseType(val: any): Transaction['type'] {
    const s = String(val).trim().toLowerCase().replace(/[_\-\s]+/g, '');
    if (s.includes('sale') || s === 'revenue' || s === 'income') return 'sale';
    if (s.includes('purchase') || s === 'buy' || s === 'cogs') return 'purchase';
    if (s.includes('expense') || s === 'operational') return 'expense';
    if (s.includes('transfer')) return 'transfer';
    if (s.includes('loanin') || s.includes('borrow') || s === 'loan') return 'loan_in';
    if (s.includes('loanout') || s.includes('lend') || s.includes('advance')) return 'loan_out';
    return 'sale'; // default
}

function rowToTransaction(row: Record<string, any>, index: number): Transaction {
    const mapped: Partial<Transaction> = {};

    for (const [rawHeader, value] of Object.entries(row)) {
        const normalized = normalizeHeader(rawHeader);
        const field = COLUMN_MAPPINGS[normalized];
        if (!field) continue;

        switch (field) {
            case 'id':
                mapped.id = String(value);
                break;
            case 'date':
                mapped.date = String(value);
                break;
            case 'amount':
                mapped.amount = Math.abs(parseFloat(String(value).replace(/[₹,\s]/g, '')) || 0);
                break;
            case 'type':
                mapped.type = parseType(value);
                break;
            case 'partyName':
                mapped.partyName = String(value);
                break;
            case 'category':
                mapped.category = String(value);
                break;
            case 'isRelatedParty':
                mapped.isRelatedParty = parseBoolean(value);
                break;
            case 'isDisclosed':
                mapped.isDisclosed = parseBoolean(value);
                break;
            case 'actualCashFlow':
                mapped.actualCashFlow = parseFloat(String(value).replace(/[₹,\s]/g, '')) || 0;
                break;
            case 'statedPurpose':
                mapped.statedPurpose = String(value) || undefined;
                break;
            case 'actualUsage':
                mapped.actualUsage = String(value) || undefined;
                break;
        }
    }

    // Fill defaults for missing fields
    return {
        id: mapped.id || `T-UPLOAD-${index + 1}`,
        date: mapped.date || new Date().toISOString().split('T')[0],
        amount: mapped.amount || 0,
        type: mapped.type || 'sale',
        partyName: mapped.partyName || 'Unknown',
        category: mapped.category || 'General',
        isRelatedParty: mapped.isRelatedParty ?? false,
        isDisclosed: mapped.isDisclosed ?? true,
        actualCashFlow: mapped.actualCashFlow ?? mapped.amount ?? 0,
        statedPurpose: mapped.statedPurpose,
        actualUsage: mapped.actualUsage,
    };
}

export function parseCSV(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const transactions = (results.data as Record<string, any>[]).map(
                    (row, i) => rowToTransaction(row, i)
                );
                resolve(transactions);
            },
            error: (err) => reject(err),
        });
    });
}

export function parseExcel(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);
                const transactions = jsonData.map((row, i) => rowToTransaction(row, i));
                resolve(transactions);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

export async function parseFile(file: File): Promise<Transaction[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
        return parseCSV(file);
    } else if (['xlsx', 'xls'].includes(ext || '')) {
        return parseExcel(file);
    } else {
        throw new Error(`Unsupported file format: .${ext}. Please upload .csv, .xlsx, or .xls files.`);
    }
}

/**
 * Generates a sample CSV template that users can download and fill in.
 */
export function generateSampleCSV(): string {
    const headers = [
        'Transaction ID', 'Date', 'Amount', 'Type', 'Party Name',
        'Category', 'Related Party', 'Disclosed', 'Cash Flow',
        'Stated Purpose', 'Actual Usage'
    ];
    const sampleRows = [
        ['T-001', '2024-01-15', '5000000', 'Sale', 'Client A', 'Revenue', 'No', 'Yes', '5000000', '', ''],
        ['T-002', '2024-02-10', '3000000', 'Purchase', 'Vendor X', 'COGS', 'No', 'Yes', '-3000000', '', ''],
        ['T-003', '2024-03-28', '8000000', 'Sale', 'ABC Traders', 'Revenue', 'Yes', 'No', '0', '', ''],
        ['T-004', '2024-03-15', '10000000', 'Loan_In', 'City Bank', 'Financial', 'No', 'Yes', '10000000', 'New Factory', 'Paying Old Debts'],
    ];
    const csv = [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    return csv;
}
