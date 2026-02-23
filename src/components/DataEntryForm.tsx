import React, { useState, useCallback } from 'react';
import {
    Building2, Users, CreditCard, ShoppingCart, Banknote,
    BarChart3, Landmark, ChevronRight, ChevronLeft, Plus,
    Trash2, CheckCircle, ScanLine
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

// ─── Utility ──────────────────────────────────────────────────────────────────

function uid() {
    return Math.random().toString(36).slice(2);
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
    <div className={cn('flex flex-col gap-1', className)}>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";


const AddRowBtn = ({ onClick }: { onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
    >
        <Plus className="h-4 w-4" /> Add Row
    </button>
);

const DelBtn = ({ onClick }: { onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="rounded p-1.5 text-muted-foreground hover:bg-red-950/40 hover:text-red-400 transition-colors"
        title="Delete row"
    >
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

const tableInput = "w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-white placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors min-w-[80px]";
const tableSelect = tableInput + " cursor-pointer";

// ─── Step Components ──────────────────────────────────────────────────────────

// STEP 1 — Company Info
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

// STEP 2 — Board of Directors
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

// STEP 3 — Transactions
const TYPES: Transaction['type'][] = ['sale', 'purchase', 'expense', 'transfer', 'loan_in', 'loan_out'];

const StepTransactions = ({ data, onChange }: { data: Transaction[]; onChange: (d: Transaction[]) => void }) => {
    const add = () => onChange([...data, {
        id: `T-${uid().toUpperCase()}`, date: '', amount: 0, type: 'sale',
        partyName: '', category: '', isRelatedParty: false, isDisclosed: true, actualCashFlow: 0,
        statedPurpose: '', actualUsage: '',
    }]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof Transaction, v: any) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/10">
                        <tr>
                            <TH>ID</TH>
                            <TH>Date</TH>
                            <TH>Amount (₹)</TH>
                            <TH>Type</TH>
                            <TH>Party Name</TH>
                            <TH>Category</TH>
                            <TH>Related?</TH>
                            <TH>Disclosed?</TH>
                            <TH>Cash Flow (₹)</TH>
                            <TH>Stated Purpose</TH>
                            <TH>Actual Usage</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={12} className="px-4 py-6 text-center text-sm text-muted-foreground">No transactions added.</td></tr>
                        )}
                        {data.map((r, i) => (
                            <tr key={r.id} className="hover:bg-muted/10">
                                <TD className="text-xs text-muted-foreground font-medium text-white">{i + 1}</TD>
                                <TD><input type="date" className={tableInput} value={r.date} onChange={e => set(r.id, 'date', e.target.value)} /></TD>
                                <TD><input type="number" className={tableInput} placeholder="0" value={r.amount || ''} onChange={e => set(r.id, 'amount', parseFloat(e.target.value) || 0)} /></TD>
                                <TD>
                                    <select className={tableSelect} value={r.type} onChange={e => set(r.id, 'type', e.target.value as Transaction['type'])}>
                                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </TD>
                                <TD><input className={tableInput} placeholder="Party" value={r.partyName} onChange={e => set(r.id, 'partyName', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Category" value={r.category} onChange={e => set(r.id, 'category', e.target.value)} /></TD>
                                <TD className="text-center">
                                    <input type="checkbox" className="h-4 w-4 accent-primary cursor-pointer" checked={r.isRelatedParty} onChange={e => set(r.id, 'isRelatedParty', e.target.checked)} />
                                </TD>
                                <TD className="text-center">
                                    <input type="checkbox" className="h-4 w-4 accent-primary cursor-pointer" checked={r.isDisclosed} onChange={e => set(r.id, 'isDisclosed', e.target.checked)} />
                                </TD>
                                <TD><input type="number" className={tableInput} placeholder="0" value={r.actualCashFlow || ''} onChange={e => set(r.id, 'actualCashFlow', parseFloat(e.target.value) || 0)} /></TD>
                                <TD><input className={tableInput} placeholder="Purpose (for loans)" value={r.statedPurpose || ''} onChange={e => set(r.id, 'statedPurpose', e.target.value)} /></TD>
                                <TD><input className={tableInput} placeholder="Actual usage" value={r.actualUsage || ''} onChange={e => set(r.id, 'actualUsage', e.target.value)} /></TD>
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

// STEP 4 — Vendor List
const StepVendors = ({ data, onChange }: { data: VendorEntry[]; onChange: (d: VendorEntry[]) => void }) => {
    const add = () => onChange([...data, {
        id: uid(), transactionId: '', date: '', amount: '', type: 'Purchase',
        vendorName: '', bankAccountNo: '', ifscCode: '', bankAddress: '',
        gstOrPan: '', isRelatedParty: false, isDisclosed: true,
    }]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof VendorEntry, v: any) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

    return (
        <div className="space-y-4">
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
                            <TH>Related?</TH>
                            <TH>Disclosed?</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 && (
                            <tr><td colSpan={13} className="px-4 py-6 text-center text-sm text-muted-foreground">No vendors added.</td></tr>
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
                                <TD className="text-center">
                                    <input type="checkbox" className="h-4 w-4 accent-primary cursor-pointer" checked={r.isRelatedParty} onChange={e => set(r.id, 'isRelatedParty', e.target.checked)} />
                                </TD>
                                <TD className="text-center">
                                    <input type="checkbox" className="h-4 w-4 accent-primary cursor-pointer" checked={r.isDisclosed} onChange={e => set(r.id, 'isDisclosed', e.target.checked)} />
                                </TD>
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

// STEP 5 — Cash Flow
const StepCashFlow = ({ data, onChange }: { data: CashFlowEntry[]; onChange: (d: CashFlowEntry[]) => void }) => {
    const add = () => onChange([...data, { id: uid(), date: '', openingCash: '', cashIn: '', cashOut: '', closingCash: '', flag: 'OK' }]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof CashFlowEntry, v: string) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

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

// STEP 6 — Sales & Purchase Summary
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
    sales: MonthlySummaryEntry[];
    purchases: MonthlySummaryEntry[];
    onSalesChange: (d: MonthlySummaryEntry[]) => void;
    onPurchasesChange: (d: MonthlySummaryEntry[]) => void;
}) => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthTable title="Sales — Month-wise Summary" color="text-green-400" data={sales} onChange={onSalesChange} />
        <MonthTable title="Purchase — Month-wise Summary" color="text-orange-400" data={purchases} onChange={onPurchasesChange} />
    </div>
);

// STEP 7 — Bank Details
const StepBankDetails = ({ data, onChange }: { data: BankEntry[]; onChange: (d: BankEntry[]) => void }) => {
    const add = () => onChange([...data, { id: uid(), fromAccount: '', toAccount: '', amount: '', remark: '' }]);
    const del = (id: string) => onChange(data.filter(r => r.id !== id));
    const set = (id: string, k: keyof BankEntry, v: string) =>
        onChange(data.map(r => r.id === id ? { ...r, [k]: v } : r));

    return (
        <div className="space-y-4">
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

    const handleSubmit = () => onSubmit(form);

    const stepContent = () => {
        switch (step) {
            case 1: return <StepCompany data={form.company} onChange={v => update('company', v)} />;
            case 2: return <StepDirectors data={form.directors} onChange={v => update('directors', v)} />;
            case 3: return <StepTransactions data={form.transactions} onChange={v => update('transactions', v)} />;
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
                            <button
                                key={s.id}
                                onClick={() => setStep(s.id)}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-all",
                                    active ? "bg-primary text-primary-foreground font-semibold" :
                                        done ? "text-green-400 hover:bg-muted/30" :
                                            "text-muted-foreground hover:bg-muted/30 hover:text-white"
                                )}
                            >
                                {done ? (
                                    <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
                                ) : (
                                    <Icon className="h-4 w-4 shrink-0" />
                                )}
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
                    {/* Progress bar */}
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="w-40 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${(step / STEPS.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round((step / STEPS.length) * 100)}%</span>
                    </div>
                </header>

                {/* Step Content */}
                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {stepContent()}
                    </div>
                </main>

                {/* Footer Navigation */}
                <footer className="border-t border-border bg-card/50 px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1}
                        className={cn(
                            "flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition-colors",
                            step === 1 ? "opacity-30 cursor-not-allowed text-muted-foreground" : "text-white hover:bg-muted"
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </button>

                    {/* Mobile step dots */}
                    <div className="flex lg:hidden gap-1.5">
                        {STEPS.map(s => (
                            <div
                                key={s.id}
                                className={cn(
                                    "h-1.5 rounded-full transition-all",
                                    s.id === step ? "w-6 bg-primary" : s.id < step ? "w-3 bg-green-500" : "w-3 bg-border"
                                )}
                            />
                        ))}
                    </div>

                    {step < STEPS.length ? (
                        <button
                            onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-900/30"
                        >
                            <ScanLine className="h-4 w-4" /> Run Analysis →
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default DataEntryForm;
