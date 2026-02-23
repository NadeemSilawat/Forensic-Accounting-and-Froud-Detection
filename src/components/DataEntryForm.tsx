import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
    Building2, Users, CreditCard, ShoppingCart, Banknote,
    BarChart3, Landmark, ChevronRight, ChevronLeft, Plus,
    Trash2, CheckCircle, ScanLine, Upload, FileSpreadsheet
} from 'lucide-react';
import { cn } from '../lib/utils';
import type {
    FormData, CompanyInfo, Director, VendorEntry,
    CashFlowEntry, MonthlySummaryEntry, BankEntry, Transaction
} from '../lib/types';
import { emptyFormData } from '../lib/user_data';

interface DataEntryFormProps {
    onSubmit: (data: FormData) => void;
}

const STEPS = [
    { id: 1, label: 'Company Info', icon: Building2 },
    { id: 2, label: 'Board of Directors', icon: Users },
    { id: 3, label: 'Transactions', icon: CreditCard },
    { id: 4, label: 'Vendor List', icon: ShoppingCart },
    { id: 5, label: 'Cash Flow', icon: Banknote },
    { id: 6, label: 'Sales & Purchase', icon: BarChart3 },
    { id: 7, label: 'Bank Details', icon: Landmark },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

function normalizeKey(k: string) {
    return k.trim().toLowerCase().replace(/[\s_\-\/]+/g, '');
}

function parseExcelFile<T>(file: File, mapRow: (row: Record<string, any>, i: number) => T): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
                // normalize keys
                const normalized = json.map(row => {
                    const out: Record<string, any> = {};
                    for (const [k, v] of Object.entries(row)) out[normalizeKey(k)] = v;
                    return out;
                });
                resolve(normalized.map(mapRow));
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={cn('flex flex-col gap-1', className)}>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
const tableInput = "w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-white placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors min-w-[80px]";
const tableSelect = tableInput + " cursor-pointer";

const AddRowBtn = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}
        className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Plus className="h-4 w-4" /> Add Row
    </button>
);

const DelBtn = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}
        className="rounded p-1.5 text-muted-foreground hover:bg-red-950/40 hover:text-red-400 transition-colors" title="Delete row">
        <Trash2 className="h-4 w-4" />
    </button>
);

const TH = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <th className={cn("px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap", className)}>
        {children}
    </th>
);

const TD = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <td className={cn("px-2 py-1.5", className)}>{children}</td>
);

// ─── Excel Upload Banner ───────────────────────────────────────────────────────

interface ExcelUploadBannerProps {
    label: string;
    columns: string;
    onUpload: (file: File) => void;
}

const ExcelUploadBanner: React.FC<ExcelUploadBannerProps> = ({ label, columns, onUpload }) => {
    const ref = useRef<HTMLInputElement>(null);
    const [name, setName] = useState<string | null>(null);

    const handle = (file: File) => {
        setName(file.name);
        onUpload(file);
    };

    return (
        <div className="flex items-center gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-3">
            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate">Columns: {columns}</p>
                {name && <p className="text-[10px] text-green-400 mt-0.5">✓ {name} loaded</p>}
            </div>
            <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
            <button type="button"
                onClick={() => ref.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
                <Upload className="h-3.5 w-3.5" /> Upload Excel
            </button>
        </div>
    );
};

// ─── Step 1 — Company Info ─────────────────────────────────────────────────────

const StepCompany = ({ data, onChange }: { data: CompanyInfo; onChange: (d: CompanyInfo) => void }) => {
    const set = (k: keyof CompanyInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange({ ...data, [k]: e.target.value });
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Company Name" className="sm:col-span-2">
                <input className={inputCls} placeholder="e.g. Acme Pvt. Ltd." value={data.name} onChange={set('name')} />
            </Field>
            <Field label="Registered Address" className="sm:col-span-2">
                <input className={inputCls} placeholder="Full registered address" value={data.address} onChange={set('address')} />
            </Field>
            <Field label="GST Number">
                <input className={inputCls} placeholder="e.g. 27AAAAA0000A1Z5" value={data.gstNo} onChange={set('gstNo')} />
            </Field>
            <Field label="CIN (Company ID)">
                <input className={inputCls} placeholder="e.g. U12345MH2020PTC123456" value={data.cin} onChange={set('cin')} />
            </Field>
            <Field label="Financial Year" className="sm:col-span-2">
                <input className={inputCls} placeholder="e.g. 2024-25" value={data.financialYear} onChange={set('financialYear')} />
            </Field>
        </div>
    );
};

// ─── Step 2 — Board of Directors ───────────────────────────────────────────────

const StepDirectors = ({ data, onChange }: { data: Director[]; onChange: (d: Director[]) => void }) => {
    const add = () => onChange([...data, { id: uid(), name: '', mobile: '', homeAddress: '', bankAccountNo: '', ifscCode: '', bankAddress: '' }]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof Director, v: string) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/10">
                        <tr>
                            <TH>#</TH>
                            <TH>Director Name</TH>
                            <TH>Mobile No.</TH>
                            <TH>Home Address</TH>
                            <TH>Bank Account No.</TH>
                            <TH>IFSC Code</TH>
                            <TH>Bank Address</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">No directors added. Click "Add Row" below.</td></tr>
                        )}
                        {data.map((r, i) => (
                            <tr key={r.id} className="hover:bg-muted/10">
                                <TD className="text-xs text-muted-foreground">{i + 1}</TD>
                                <TD><input className={tableInput} placeholder="Full Name" value={r.name} onChange={e => set(r.id, 'name', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="+91..." value={r.mobile} onChange={e => set(r.id, 'mobile', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Address" value={r.homeAddress} onChange={e => set(r.id, 'homeAddress', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Account No." value={r.bankAccountNo} onChange={e => set(r.id, 'bankAccountNo', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="IFSC" value={r.ifscCode} onChange={e => set(r.id, 'ifscCode', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Bank Address" value={r.bankAddress} onChange={e => set(r.id, 'bankAddress', e.target.value)} /></TD>
                                <TD><DelBtn onClick={() => del(r.id)} /></TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddRowBtn onClick={add} />
        </div>
    );
};

// ─── Step 3 — Transactions ─────────────────────────────────────────────────────

const TYPES: Transaction['type'][] = ['sale', 'purchase', 'expense', 'transfer', 'loan_in', 'loan_out'];

const StepTransactions = ({
    data, directors, onChange
}: { data: Transaction[]; directors: Director[]; onChange: (d: Transaction[]) => void }) => {

    const directorNames = directors.map(d => d.name.trim().toLowerCase()).filter(Boolean);

    const isRelated = (partyName: string) =>
        directorNames.includes(partyName.trim().toLowerCase());

    const makeBlank = (): Transaction => ({
        id: `T-${Date.now()}`, date: '', amount: 0, type: 'sale',
        partyName: '', bankAccountNo: '', ifscCode: '', bankAddress: '',
        category: 'General', isRelatedParty: false, isDisclosed: true, actualCashFlow: 0,
    });

    const add = () => onChange([...data, makeBlank()]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof Transaction, v: any) =>
        onChange(data.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [k]: v };
            // auto-flag related party if name matches a director
            if (k === 'partyName') updated.isRelatedParty = isRelated(String(v));
            return updated;
        }));

    const handleExcel = async (file: File) => {
        const rows = await parseExcelFile(file, (row, i) => {
            const p = (keys: string[]) => {
                for (const k of keys) if (row[k] !== undefined && row[k] !== '') return String(row[k]);
                return '';
            };
            const partyName = p(['partyname', 'party', 'customer', 'vendor']);
            return {
                id: p(['transactionid', 'txnid', 'id']) || `T-UPLOAD-${i + 1}`,
                date: p(['date', 'transactiondate']),
                amount: Math.abs(parseFloat(p(['amount', 'value'])) || 0),
                type: (p(['type', 'transactiontype']) || 'sale').toLowerCase().trim() as Transaction['type'],
                partyName,
                bankAccountNo: p(['bankaccountno', 'bankaccount', 'accountno', 'account']),
                ifscCode: p(['ifsccode', 'ifsc']),
                bankAddress: p(['bankaddress', 'bankaddr']),
                category: p(['category', 'head']) || 'General',
                isRelatedParty: isRelated(partyName),
                isDisclosed: true,
                actualCashFlow: parseFloat(p(['cashflow', 'actualcashflow', 'cash'])) || 0,
            } as Transaction;
        });
        onChange([...data, ...rows]);
    };

    return (
        <div className="space-y-4">
            <ExcelUploadBanner
                label="Import Transactions from Excel"
                columns="ID, Date, Amount, Type, Party Name, Bank Account No., IFSC Code, Bank Address"
                onUpload={handleExcel}
            />

            {directorNames.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-900/40 bg-blue-950/20 px-4 py-2 text-xs text-blue-300">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>Party names matching a director will be auto-flagged as <strong>Related Party</strong>: {directors.map(d => d.name).filter(Boolean).join(', ')}</span>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/10">
                        <tr>
                            <TH>#</TH>
                            <TH>Date</TH>
                            <TH>Amount (₹)</TH>
                            <TH>Type</TH>
                            <TH>Party Name</TH>
                            <TH>Bank Account No.</TH>
                            <TH>IFSC Code</TH>
                            <TH>Bank Address</TH>
                            <TH>Related?</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={10} className="px-4 py-6 text-center text-sm text-muted-foreground">No transactions added.</td></tr>
                        )}
                        {data.map((r, i) => {
                            const related = isRelated(r.partyName);
                            return (
                                <tr key={r.id} className={cn("hover:bg-muted/10", related ? "bg-orange-950/10" : "")}>
                                    <TD className="text-xs text-muted-foreground">{i + 1}</TD>
                                    <TD><input type="date" className={tableInput} value={r.date} onChange={e => set(r.id, 'date', e.target.value)} /></TD>
                                    <TD><input type="number" className={tableInput} placeholder="0" value={r.amount || ''} onChange={e => set(r.id, 'amount', parseFloat(e.target.value) || 0)} /></TD>
                                    <TD>
                                        <select className={tableSelect} value={r.type} onChange={e => set(r.id, 'type', e.target.value as Transaction['type'])}>
                                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </TD>
                                    <TD><input className={tableInput} placeholder="Party / Company" value={r.partyName} onChange={e => set(r.id, 'partyName', e.target.value)} /></TD>
                                    <TD><input className={tableInput} placeholder="Account No." value={r.bankAccountNo || ''} onChange={e => set(r.id, 'bankAccountNo', e.target.value)} /></TD>
                                    <TD><input className={tableInput} placeholder="IFSC" value={r.ifscCode || ''} onChange={e => set(r.id, 'ifscCode', e.target.value)} /></TD>
                                    <TD><input className={tableInput} placeholder="Bank Address" value={r.bankAddress || ''} onChange={e => set(r.id, 'bankAddress', e.target.value)} /></TD>
                                    <TD className="text-center">
                                        {related
                                            ? <span className="inline-flex items-center gap-1 rounded-full bg-orange-400/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">✓ Director</span>
                                            : <span className="text-[10px] text-muted-foreground">—</span>}
                                    </TD>
                                    <TD><DelBtn onClick={() => del(r.id)} /></TD>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <AddRowBtn onClick={add} />
        </div>
    );
};

// ─── Step 4 — Vendor List ──────────────────────────────────────────────────────

const StepVendors = ({ data, onChange }: { data: VendorEntry[]; onChange: (d: VendorEntry[]) => void }) => {
    const makeBlank = (): VendorEntry => ({
        id: uid(), transactionId: '', date: '', amount: '', type: 'Purchase',
        vendorName: '', bankAccountNo: '', ifscCode: '', bankAddress: '',
        gstOrPan: '', isRelatedParty: false, isDisclosed: true,
    });

    const add = () => onChange([...data, makeBlank()]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof VendorEntry, v: any) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

    const handleExcel = async (file: File) => {
        const rows = await parseExcelFile(file, (row, i) => {
            const p = (keys: string[]) => {
                for (const k of keys) if (row[k] !== undefined && row[k] !== '') return String(row[k]);
                return '';
            };
            return {
                id: uid(),
                transactionId: p(['transactionid', 'txnid', 'id']) || `V-${i + 1}`,
                date: p(['date']),
                amount: p(['amount', 'value']),
                type: p(['type']) || 'Purchase',
                vendorName: p(['vendorname', 'suppliername', 'vendor', 'supplier', 'name']),
                bankAccountNo: p(['bankaccountno', 'bankaccount', 'accountno', 'account', 'bankaccountnumber']),
                ifscCode: p(['ifsccode', 'ifsc']),
                bankAddress: p(['bankaddress', 'bankaddr']),
                gstOrPan: p(['gstno', 'pan', 'gstorpan', 'gstin', 'gst']),
                isRelatedParty: false,
                isDisclosed: true,
            } as VendorEntry;
        });
        onChange([...data, ...rows]);
    };

    return (
        <div className="space-y-4">
            <ExcelUploadBanner
                label="Import Vendor List from Excel"
                columns="Txn ID, Date, Amount, Type, Vendor Name, Bank Account No., IFSC Code, Bank Address, GST/PAN"
                onUpload={handleExcel}
            />
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/10">
                        <tr>
                            <TH>#</TH>
                            <TH>Txn ID</TH>
                            <TH>Date</TH>
                            <TH>Amount (₹)</TH>
                            <TH>Type</TH>
                            <TH>Vendor / Supplier Name</TH>
                            <TH>Bank Account No.</TH>
                            <TH>IFSC Code</TH>
                            <TH>Bank Address</TH>
                            <TH>GST / PAN</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={11} className="px-4 py-6 text-center text-sm text-muted-foreground">No vendors added.</td></tr>
                        )}
                        {data.map((r, i) => (
                            <tr key={r.id} className="hover:bg-muted/10">
                                <TD className="text-xs text-muted-foreground">{i + 1}</TD>
                                <TD><input className={tableInput} placeholder="TXN-001" value={r.transactionId} onChange={e => set(r.id, 'transactionId', e.target.value)} /></TD>
                                <TD><input type="date" className={tableInput} value={r.date} onChange={e => set(r.id, 'date', e.target.value)} /></TD>
                                <TD><input type="number" className={tableInput} placeholder="0" value={r.amount} onChange={e => set(r.id, 'amount', e.target.value)} /></TD>
                                <TD>
                                    <select className={tableSelect} value={r.type} onChange={e => set(r.id, 'type', e.target.value)}>
                                        <option>Purchase</option>
                                        <option>Sale</option>
                                        <option>Expense</option>
                                        <option>Transfer</option>
                                    </select>
                                </TD>
                                <TD><input className={tableInput} placeholder="Vendor Name" value={r.vendorName} onChange={e => set(r.id, 'vendorName', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Account No." value={r.bankAccountNo} onChange={e => set(r.id, 'bankAccountNo', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="IFSC" value={r.ifscCode} onChange={e => set(r.id, 'ifscCode', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Bank Address" value={r.bankAddress} onChange={e => set(r.id, 'bankAddress', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="GST/PAN" value={r.gstOrPan} onChange={e => set(r.id, 'gstOrPan', e.target.value)} /></TD>
                                <TD><DelBtn onClick={() => del(r.id)} /></TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddRowBtn onClick={add} />
        </div>
    );
};

// ─── Step 5 — Cash Flow ────────────────────────────────────────────────────────

const StepCashFlow = ({ data, onChange }: { data: CashFlowEntry[]; onChange: (d: CashFlowEntry[]) => void }) => {
    const makeBlank = (): CashFlowEntry => ({ id: uid(), date: '', openingCash: '', cashIn: '', cashOut: '', closingCash: '', flag: 'OK' });
    const add = () => onChange([...data, makeBlank()]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof CashFlowEntry, v: string) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

    const handleExcel = async (file: File) => {
        const rows = await parseExcelFile(file, row => {
            const p = (keys: string[]) => {
                for (const k of keys) if (row[k] !== undefined && row[k] !== '') return String(row[k]);
                return '';
            };
            return {
                id: uid(),
                date: p(['date']),
                openingCash: p(['openingcash', 'opening']),
                cashIn: p(['cashin', 'cashinflow', 'in']),
                cashOut: p(['cashout', 'cashoutflow', 'out']),
                closingCash: p(['closingcash', 'closing']),
                flag: p(['flag', 'status']) || 'OK',
            } as CashFlowEntry;
        });
        onChange([...data, ...rows]);
    };

    const computeExpected = (r: CashFlowEntry) => {
        const o = parseFloat(r.openingCash) || 0;
        const ci = parseFloat(r.cashIn) || 0;
        const co = parseFloat(r.cashOut) || 0;
        const cl = parseFloat(r.closingCash) || 0;
        const exp = o + ci - co;
        return exp !== cl && r.closingCash !== '' ? `Expected: ₹${exp.toLocaleString('en-IN')}` : null;
    };

    return (
        <div className="space-y-4">
            <ExcelUploadBanner
                label="Import Cash Flow from Excel"
                columns="Date, Opening Cash, Cash In, Cash Out, Closing Cash, Flag"
                onUpload={handleExcel}
            />
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/10">
                        <tr>
                            <TH>#</TH>
                            <TH>Date</TH>
                            <TH>Opening Cash (₹)</TH>
                            <TH>Cash In (₹)</TH>
                            <TH>Cash Out (₹)</TH>
                            <TH>Closing Cash (₹)</TH>
                            <TH>Flag</TH>
                            <TH>Check</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={9} className="px-4 py-6 text-center text-sm text-muted-foreground">No cash flow entries added.</td></tr>
                        )}
                        {data.map((r, i) => {
                            const warn = computeExpected(r);
                            return (
                                <tr key={r.id} className={cn("hover:bg-muted/10", warn ? "bg-red-950/10" : "")}>
                                    <TD className="text-xs text-muted-foreground">{i + 1}</TD>
                                    <TD><input type="date" className={tableInput} value={r.date} onChange={e => set(r.id, 'date', e.target.value)} /></TD>
                                    <TD><input type="number" className={tableInput} placeholder="0" value={r.openingCash} onChange={e => set(r.id, 'openingCash', e.target.value)} /></TD>
                                    <TD><input type="number" className={tableInput} placeholder="0" value={r.cashIn} onChange={e => set(r.id, 'cashIn', e.target.value)} /></TD>
                                    <TD><input type="number" className={tableInput} placeholder="0" value={r.cashOut} onChange={e => set(r.id, 'cashOut', e.target.value)} /></TD>
                                    <TD><input type="number" className={tableInput} placeholder="0" value={r.closingCash} onChange={e => set(r.id, 'closingCash', e.target.value)} /></TD>
                                    <TD>
                                        <select className={tableSelect} value={r.flag} onChange={e => set(r.id, 'flag', e.target.value)}>
                                            <option>OK</option>
                                            <option>Cash Missing</option>
                                            <option>Excess Cash</option>
                                            <option>Suspicious</option>
                                        </select>
                                    </TD>
                                    <TD className={cn("text-xs", warn ? "text-red-400 font-medium" : "text-green-400")}>
                                        {warn || (r.closingCash !== '' ? "✓ OK" : "")}
                                    </TD>
                                    <TD><DelBtn onClick={() => del(r.id)} /></TD>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <AddRowBtn onClick={add} />
        </div>
    );
};

// ─── Step 6 — Sales & Purchase Summary ────────────────────────────────────────

const MonthTable = ({ title, color, data, onChange }: {
    title: string; color: string;
    data: MonthlySummaryEntry[]; onChange: (d: MonthlySummaryEntry[]) => void;
}) => {
    const add = () => onChange([...data, { id: uid(), month: '', amount: '' }]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof MonthlySummaryEntry, v: string) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));
    const total = data.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

    return (
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <h4 className={cn("flex items-center gap-2 font-semibold text-base", color)}>
                <BarChart3 className="h-4 w-4" /> {title}
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/10">
                        <tr>
                            <TH>Month</TH>
                            <TH>Amount (₹)</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={3} className="px-4 py-5 text-center text-sm text-muted-foreground">No entries.</td></tr>
                        )}
                        {data.map(r => (
                            <tr key={r.id} className="hover:bg-muted/10">
                                <TD>
                                    <select className={tableSelect} value={r.month} onChange={e => set(r.id, 'month', e.target.value)}>
                                        <option value="">Select Month</option>
                                        {['APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </TD>
                                <TD><input type="number" className={tableInput} placeholder="0" value={r.amount} onChange={e => set(r.id, 'amount', e.target.value)} /></TD>
                                <TD><DelBtn onClick={() => del(r.id)} /></TD>
                            </tr>
                        ))}
                        {data.length > 0 && (
                            <tr className="border-t-2 border-border bg-muted/20">
                                <TD className="text-xs font-bold text-white">Total</TD>
                                <TD className="text-xs font-bold text-white">₹ {total.toLocaleString('en-IN')}</TD>
                                <TD />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <AddRowBtn onClick={add} />
        </div>
    );
};

const StepSalesPurchase = ({
    sales, purchases, onSalesChange, onPurchasesChange
}: {
    sales: MonthlySummaryEntry[]; purchases: MonthlySummaryEntry[];
    onSalesChange: (d: MonthlySummaryEntry[]) => void;
    onPurchasesChange: (d: MonthlySummaryEntry[]) => void;
}) => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthTable title="Sales — Month-wise Summary" color="text-green-400" data={sales} onChange={onSalesChange} />
        <MonthTable title="Purchase — Month-wise Summary" color="text-orange-400" data={purchases} onChange={onPurchasesChange} />
    </div>
);

// ─── Step 7 — Bank Details ─────────────────────────────────────────────────────

const StepBankDetails = ({ data, onChange }: { data: BankEntry[]; onChange: (d: BankEntry[]) => void }) => {
    const makeBlank = (): BankEntry => ({ id: uid(), fromAccount: '', toAccount: '', amount: '', remark: '' });
    const add = () => onChange([...data, makeBlank()]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof BankEntry, v: string) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

    const handleExcel = async (file: File) => {
        const rows = await parseExcelFile(file, row => {
            const p = (keys: string[]) => {
                for (const k of keys) if (row[k] !== undefined && row[k] !== '') return String(row[k]);
                return '';
            };
            return {
                id: uid(),
                fromAccount: p(['fromaccount', 'from', 'sender']),
                toAccount: p(['toaccount', 'to', 'receiver', 'recipient']),
                amount: p(['amount', 'value']),
                remark: p(['remark', 'description', 'narration', 'note']),
            } as BankEntry;
        });
        onChange([...data, ...rows]);
    };

    return (
        <div className="space-y-4">
            <ExcelUploadBanner
                label="Import Bank Statement from Excel"
                columns="From Account, To Account, Amount, Remark"
                onUpload={handleExcel}
            />
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/10">
                        <tr>
                            <TH>#</TH>
                            <TH>From Account</TH>
                            <TH>To Account</TH>
                            <TH>Amount (₹)</TH>
                            <TH>Remark</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">No bank entries added.</td></tr>
                        )}
                        {data.map((r, i) => (
                            <tr key={r.id} className="hover:bg-muted/10">
                                <TD className="text-xs text-muted-foreground">{i + 1}</TD>
                                <TD><input className={tableInput} placeholder="Company / Account name" value={r.fromAccount} onChange={e => set(r.id, 'fromAccount', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Vendor / Account name" value={r.toAccount} onChange={e => set(r.id, 'toAccount', e.target.value)} /></TD>
                                <TD><input type="number" className={tableInput} placeholder="0" value={r.amount} onChange={e => set(r.id, 'amount', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="e.g. Payment, Returned" value={r.remark} onChange={e => set(r.id, 'remark', e.target.value)} /></TD>
                                <TD><DelBtn onClick={() => del(r.id)} /></TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddRowBtn onClick={add} />
        </div>
    );
};

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const DataEntryForm: React.FC<DataEntryFormProps> = ({ onSubmit }) => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>(emptyFormData);

    const update = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
        setForm(prev => ({ ...prev, [key]: val }));
    }, []);

    const handleSubmit = () => {
        // Auto-compute isRelatedParty based on directors list before submitting
        const directorNames = form.directors.map(d => d.name.trim().toLowerCase()).filter(Boolean);
        const enriched = form.transactions.map(tx => ({
            ...tx,
            isRelatedParty: directorNames.includes(tx.partyName.trim().toLowerCase()),
            isDisclosed: !directorNames.includes(tx.partyName.trim().toLowerCase()), // undisclosed if related
            actualCashFlow: tx.actualCashFlow ||
                (tx.type === 'expense' || tx.type === 'purchase' || tx.type === 'loan_out'
                    ? -tx.amount : tx.amount),
        }));
        onSubmit({ ...form, transactions: enriched });
    };

    const stepContent = () => {
        switch (step) {
            case 1: return <StepCompany data={form.company} onChange={v => update('company', v)} />;
            case 2: return <StepDirectors data={form.directors} onChange={v => update('directors', v)} />;
            case 3: return <StepTransactions data={form.transactions} directors={form.directors} onChange={v => update('transactions', v)} />;
            case 4: return <StepVendors data={form.vendors} onChange={v => update('vendors', v)} />;
            case 5: return <StepCashFlow data={form.cashFlow} onChange={v => update('cashFlow', v)} />;
            case 6: return (
                <StepSalesPurchase
                    sales={form.salesSummary} purchases={form.purchaseSummary}
                    onSalesChange={v => update('salesSummary', v)}
                    onPurchasesChange={v => update('purchaseSummary', v)}
                />
            );
            case 7: return <StepBankDetails data={form.bankDetails} onChange={v => update('bankDetails', v)} />;
            default: return null;
        }
    };

    const currentStep = STEPS[step - 1];
    const StepIcon = currentStep.icon;

    return (
        <div className="min-h-screen bg-background font-mono text-foreground flex">
            {/* Sidebar */}
            <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-8">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                        <ScanLine className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">TTMS</p>
                        <p className="text-[10px] text-muted-foreground">Data Entry Wizard</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-1">
                    {STEPS.map(s => {
                        const Icon = s.icon;
                        const done = s.id < step;
                        const active = s.id === step;
                        return (
                            <button key={s.id} onClick={() => setStep(s.id)}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-all",
                                    active ? "bg-primary text-primary-foreground font-semibold" :
                                        done ? "text-green-400 hover:bg-muted/30" :
                                            "text-muted-foreground hover:bg-muted/30 hover:text-white"
                                )}>
                                {done ? <CheckCircle className="h-4 w-4 shrink-0 text-green-400" /> : <Icon className="h-4 w-4 shrink-0" />}
                                <span>{s.id}. {s.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="border-b border-border bg-card/50 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <StepIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white">{currentStep.label}</h1>
                            <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="w-40 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${(step / STEPS.length) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round((step / STEPS.length) * 100)}%</span>
                    </div>
                </header>

                {/* Step Content */}
                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">{stepContent()}</div>
                </main>

                {/* Footer */}
                <footer className="border-t border-border bg-card/50 px-8 py-4 flex items-center justify-between">
                    <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition-colors",
                            step === 1 ? "opacity-30 cursor-not-allowed text-muted-foreground" : "text-white hover:bg-muted"
                        )}>
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </button>

                    {/* Mobile dots */}
                    <div className="flex lg:hidden gap-1.5">
                        {STEPS.map(s => (
                            <div key={s.id} className={cn("h-1.5 rounded-full transition-all",
                                s.id === step ? "w-6 bg-primary" : s.id < step ? "w-3 bg-green-500" : "w-3 bg-border")} />
                        ))}
                    </div>

                    {step < STEPS.length ? (
                        <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-900/30">
                            <ScanLine className="h-4 w-4" /> Run Analysis →
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default DataEntryForm;
