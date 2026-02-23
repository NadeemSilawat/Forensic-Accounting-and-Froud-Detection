
import React, { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    ShieldAlert,
    Search,
    Activity,
    FileText,
    ScanLine,
    AlertTriangle,
    ArrowLeft,
    TrendingUp,
    CreditCard,
    Download,
    X,
    CheckCircle2,
    Users,
    Repeat,
    Building2,
    BarChart3
} from 'lucide-react';
import { analyzeTransaction, generateMonthlyStats } from '../lib/engine';
import { formDataToUserData } from '../lib/user_data';
import { cn } from '../lib/utils';
import type { FormData } from '../lib/types';

interface DashboardProps {
    formData: FormData;
    onBack: () => void;
}

// ─── Analysis Engine (pattern detection) ─────────────────────────────────────

function analyzeFromFormData(formData: FormData) {
    const userData = formDataToUserData(formData);

    const result = {
        duplicateVendors: [] as { original: any; duplicate: any }[],
        duplicateSales: [] as { original: any; duplicate: any }[],
        cashFlowAnomalies: [] as { date: string; expected: number; actual: number; difference: number }[],
        circularTrading: [] as { cycle: string[]; amount: number }[],
        salesSpikes: [] as { month: string; amount: number; growth: string }[],
    };

    // 1. Duplicate Vendors
    const vendorMap = new Map<string, any>();
    userData.vendors.forEach(v => {
        if (v.Bank_Account_number === 'N/A') return;
        if (vendorMap.has(v.Bank_Account_number)) {
            result.duplicateVendors.push({ original: vendorMap.get(v.Bank_Account_number), duplicate: v });
        } else {
            vendorMap.set(v.Bank_Account_number, v);
        }
    });

    // 2. Cash Flow Anomalies
    userData.cashFlow.forEach(cf => {
        const expected = cf.Opening_Cash + cf.Cash_In - cf.Cash_Out;
        if (expected !== cf.Closing_Cash) {
            result.cashFlowAnomalies.push({
                date: cf.Date, expected, actual: cf.Closing_Cash,
                difference: cf.Closing_Cash - expected
            });
        }
    });

    // 3. Circular Trading (A→B, B→A within 5%)
    const bs = userData.bankStatement;
    for (let i = 0; i < bs.length; i++) {
        const tx1 = bs[i];
        if (!tx1.To_Account || !tx1.From_Account) continue;
        for (let j = i + 1; j < bs.length; j++) {
            const tx2 = bs[j];
            if (tx1.To_Account === tx2.From_Account && tx1.From_Account === tx2.To_Account) {
                if (Math.abs(tx1.Amount - tx2.Amount) <= tx1.Amount * 0.05) {
                    result.circularTrading.push({ cycle: [tx1.From_Account, tx1.To_Account, tx1.From_Account], amount: tx1.Amount });
                }
            }
        }
    }

    // 4. Sales Spikes
    userData.salesSummary.filter(s => s.Remark?.includes('HIGH JUMP')).forEach(s => {
        result.salesSpikes.push({ month: s.Month, amount: s.Sales, growth: s.Remark! });
    });

    return { result, userData };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard: React.FC<DashboardProps> = ({ formData, onBack }) => {
    const [showReport, setShowReport] = useState(false);

    const transactions = formData.transactions;

    const monthlyStats = useMemo(() => generateMonthlyStats(transactions), [transactions]);

    const { result: analysis, userData } = useMemo(() => analyzeFromFormData(formData), [formData]);

    const riskyTransactions = useMemo(() => {
        return transactions
            .map(tx => analyzeTransaction(tx, transactions))
            .filter(res => res.riskLevel !== 'Low')
            .sort((a, b) => b.score - a.score);
    }, [transactions]);

    const totalRiskScore = useMemo(() => {
        if (riskyTransactions.length === 0) return 0;
        return Math.round(riskyTransactions.reduce((acc, curr) => acc + curr.score, 0) / riskyTransactions.length);
    }, [riskyTransactions]);

    const totalDiscrepancy = useMemo(() => {
        return analysis.cashFlowAnomalies.reduce((s, a) => s + Math.abs(a.difference), 0);
    }, [analysis]);

    const getRiskColor = (score: number) => {
        if (score > 80) return '#ef4444';
        if (score > 50) return '#eab308';
        return '#22c55e';
    };

    return (
        <div className="min-h-screen bg-background p-8 font-mono text-foreground relative">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between border-b border-border pb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="rounded-lg border border-border p-2 hover:bg-muted transition-colors" title="Back to Form">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <div className="rounded-lg bg-primary/10 p-3">
                        <ScanLine className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">TTMS Forensic Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            {formData.company.name || 'Company'} — {formData.company.financialYear || 'FY'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                        <div className={`h-2.5 w-2.5 rounded-full ${totalRiskScore > 50 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        {totalRiskScore > 50 ? 'CRITICAL RISK DETECTED' : 'Secure'}
                    </div>
                    <button
                        onClick={() => setShowReport(true)}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Download className="h-4 w-4" /> Generate Audit Report
                    </button>
                </div>
            </header>

            {/* Company Info Strip */}
            {formData.company.name && (
                <div className="mb-6 rounded-xl border border-border bg-card px-6 py-4 flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2 text-white">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{formData.company.name}</span>
                    </div>
                    {formData.company.gstNo && <span className="text-xs text-muted-foreground">GST: <span className="text-white">{formData.company.gstNo}</span></span>}
                    {formData.company.cin && <span className="text-xs text-muted-foreground">CIN: <span className="text-white">{formData.company.cin}</span></span>}
                    {formData.company.financialYear && <span className="text-xs text-muted-foreground">FY: <span className="text-white">{formData.company.financialYear}</span></span>}
                    {formData.directors.length > 0 && (
                        <span className="text-xs text-muted-foreground">Directors: <span className="text-white">{formData.directors.map(d => d.name).filter(Boolean).join(', ')}</span></span>
                    )}
                </div>
            )}

            {/* KPI Stats */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                <StatsCard title="Total Transactions" value={transactions.length.toString()} icon={FileText} trend={`${transactions.length} entries`} />
                <StatsCard title="Flagged Risks" value={riskyTransactions.length.toString()} icon={AlertTriangle} className="text-red-500" trend="Requires Review" />
                <StatsCard
                    title="Avg Risk Score"
                    value={totalRiskScore.toString()}
                    icon={ShieldAlert}
                    className={totalRiskScore > 50 ? "text-red-500" : "text-yellow-500"}
                    trend={totalRiskScore > 80 ? "Critical" : totalRiskScore > 50 ? "High" : "Medium"}
                />
                <StatsCard
                    title="Cash Flow Gap"
                    value={totalDiscrepancy > 0 ? `₹${(totalDiscrepancy / 100000).toFixed(1)}L` : '₹0'}
                    icon={CreditCard}
                    className={totalDiscrepancy > 0 ? "text-orange-500" : "text-green-500"}
                    trend={totalDiscrepancy > 0 ? "Discrepancy" : "Balanced"}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Fraud Heat Map */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                            <Activity className="h-5 w-5 text-primary" /> Fraud Risk Heat Map (Monthly)
                        </h2>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-green-500" />Low</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-yellow-500" />Med</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-red-500" />High</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {monthlyStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyStats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                    <XAxis dataKey="month" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="riskScore" name="Risk Score">
                                        {monthlyStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskScore)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No transaction data to visualize.</div>
                        )}
                    </div>
                </div>

                {/* Critical Alerts */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <ShieldAlert className="h-5 w-5 text-red-500" /> Critical Alerts
                    </h2>
                    <div className="space-y-4">
                        {riskyTransactions.length === 0 && (
                            <p className="text-sm text-muted-foreground">No critical alerts detected.</p>
                        )}
                        {riskyTransactions.slice(0, 3).map((tx) => (
                            <div key={tx.transactionId} className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold text-red-400">{tx.riskLevel.toUpperCase()} RISK</span>
                                    <span className="text-xs text-muted-foreground">{tx.transactionId}</span>
                                </div>
                                <p className="text-sm font-medium text-red-200">{tx.riskFactors[0]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Flagged Transactions Table */}
            {riskyTransactions.length > 0 && (
                <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                        <Search className="h-5 w-5 text-primary" /> Flagged Transactions Analysis
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                                    <th className="px-4 py-3">Transaction ID</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Risk Level</th>
                                    <th className="px-4 py-3">Primary Risk Factor</th>
                                    <th className="px-4 py-3 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {riskyTransactions.map((tx) => (
                                    <tr key={tx.transactionId} className="transition-colors hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium text-white">{tx.transactionId}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {transactions.find(t => t.id === tx.transactionId)?.date || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                tx.riskLevel === 'Critical' ? 'bg-red-400/10 text-red-400 ring-red-400/20' :
                                                    tx.riskLevel === 'High' ? 'bg-orange-400/10 text-orange-400 ring-orange-400/20' :
                                                        'bg-yellow-400/10 text-yellow-400 ring-yellow-400/20'
                                            )}>
                                                {tx.riskLevel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {tx.riskFactors[0]}
                                            {tx.riskFactors.length > 1 && (
                                                <span className="ml-2 text-xs text-primary">+ {tx.riskFactors.length - 1} more</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-white">{tx.score}/100</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Advanced Pattern Analysis */}
            <h2 className="mt-8 mb-4 text-xl font-bold text-white flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" /> Advanced Pattern Analysis
            </h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Duplicate Vendor Detection */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Users className="h-5 w-5 text-orange-500" /> Duplicate Vendor Detection
                    </h3>
                    {analysis.duplicateVendors.length > 0 ? (
                        <div className="space-y-4">
                            {analysis.duplicateVendors.map((dup, idx) => (
                                <div key={idx} className="rounded-lg border border-orange-900/50 bg-orange-950/20 p-4">
                                    <div className="text-sm text-orange-200 mb-2">
                                        <span className="font-bold">Match Found:</span> Same Bank Account ({dup.original.Bank_Account_number})
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-muted-foreground">Original Vendor</p>
                                            <p className="font-medium text-white">{dup.original.Vendor_Name} (ID: {dup.original.Vendor_ID})</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Duplicate Entry</p>
                                            <p className="font-medium text-white">{dup.duplicate.Vendor_Name} (ID: {dup.duplicate.Vendor_ID})</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No duplicate vendors detected.</p>
                    )}
                </div>

                {/* Circular Trading */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <Repeat className="h-5 w-5 text-red-500" /> Circular Trading Patterns
                    </h3>
                    {analysis.circularTrading.length > 0 ? (
                        <div className="space-y-4">
                            {analysis.circularTrading.map((cycle, idx) => (
                                <div key={idx} className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-red-400">CYCLE DETECTED</span>
                                        <span className="text-xs text-white bg-red-900/50 px-2 py-1 rounded">₹ {cycle.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-red-200 flex-wrap">
                                        <span>{cycle.cycle[0]}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span>{cycle.cycle[1]}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span>{cycle.cycle[2]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No circular trading patterns detected.</p>
                    )}
                </div>

                {/* Cash Flow Verification */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                        <CreditCard className="h-5 w-5 text-yellow-500" /> Cash Flow Verification
                    </h3>
                    {userData.cashFlow.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No cash flow data entered.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Expected Closing</th>
                                        <th className="px-4 py-2">Actual Closing</th>
                                        <th className="px-4 py-2">Discrepancy</th>
                                        <th className="px-4 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {userData.cashFlow.map((cf, idx) => {
                                        const anomaly = analysis.cashFlowAnomalies.find(a => a.date === cf.Date);
                                        const isFlagged = cf.Flag.toLowerCase() !== 'ok';
                                        const isRisk = anomaly || isFlagged;
                                        return (
                                            <tr key={idx} className={cn("transition-colors", isRisk ? "bg-red-950/10 hover:bg-red-950/20" : "hover:bg-muted/50")}>
                                                <td className="px-4 py-2 font-medium text-white">{cf.Date}</td>
                                                <td className="px-4 py-2 text-muted-foreground">₹ {(cf.Opening_Cash + cf.Cash_In - cf.Cash_Out).toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-2 text-white">₹ {cf.Closing_Cash.toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-2 text-red-400">{anomaly ? `₹ ${anomaly.difference.toLocaleString('en-IN')}` : '-'}</td>
                                                <td className="px-4 py-2">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                                        cf.Flag.toLowerCase() === 'ok' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                                                    )}>
                                                        {cf.Flag}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sales & Purchase Summary */}
                {(formData.salesSummary.length > 0 || formData.purchaseSummary.length > 0) && (
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                            <BarChart3 className="h-5 w-5 text-blue-400" /> Sales & Purchase Summary
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {formData.salesSummary.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-green-400 mb-3">Sales — Month-wise</h4>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                                                <th className="px-3 py-2 text-left">Month</th>
                                                <th className="px-3 py-2 text-right">Amount (₹)</th>
                                                <th className="px-3 py-2 text-center">Flag</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {formData.salesSummary.map(e => {
                                                const ss = userData.salesSummary.find(s => s.Month === e.month);
                                                return (
                                                    <tr key={e.id} className="hover:bg-muted/30">
                                                        <td className="px-3 py-2 text-white">{e.month}</td>
                                                        <td className="px-3 py-2 text-right text-white">₹ {parseFloat(e.amount || '0').toLocaleString('en-IN')}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            {ss?.Remark ? (
                                                                <span className="rounded-full bg-red-400/10 text-red-400 px-2 py-0.5 text-xs">{ss.Remark}</span>
                                                            ) : (
                                                                <span className="rounded-full bg-green-400/10 text-green-400 px-2 py-0.5 text-xs">Normal</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {formData.purchaseSummary.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-orange-400 mb-3">Purchase — Month-wise</h4>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                                                <th className="px-3 py-2 text-left">Month</th>
                                                <th className="px-3 py-2 text-right">Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {formData.purchaseSummary.map(e => (
                                                <tr key={e.id} className="hover:bg-muted/30">
                                                    <td className="px-3 py-2 text-white">{e.month}</td>
                                                    <td className="px-3 py-2 text-right text-white">₹ {parseFloat(e.amount || '0').toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Report Modal */}
            {showReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border p-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="text-primary" /> Forensic Audit Report
                            </h3>
                            <button onClick={() => setShowReport(false)} className="text-muted-foreground hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {formData.company.name && (
                                <div className="rounded-lg bg-muted/20 p-4">
                                    <p className="text-xs text-muted-foreground">Company</p>
                                    <p className="text-lg font-bold text-white">{formData.company.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formData.company.address}</p>
                                </div>
                            )}
                            <div className="rounded-lg bg-red-950/30 p-4 border border-red-900/50">
                                <h4 className="font-semibold text-red-400 mb-2">Key Observations</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
                                    {riskyTransactions.length > 0 && <li>{riskyTransactions.length} transaction(s) flagged with risk score {totalRiskScore}/100.</li>}
                                    {analysis.duplicateVendors.length > 0 && <li>{analysis.duplicateVendors.length} duplicate vendor pair(s) detected (same bank account).</li>}
                                    {analysis.cashFlowAnomalies.length > 0 && <li>{analysis.cashFlowAnomalies.length} cash flow discrepancies found — total ₹{totalDiscrepancy.toLocaleString('en-IN')} gap.</li>}
                                    {analysis.circularTrading.length > 0 && <li>{analysis.circularTrading.length} circular trading pattern(s) detected.</li>}
                                    {analysis.salesSpikes.length > 0 && <li>Unusual sales spikes in: {analysis.salesSpikes.map(s => s.month).join(', ')}.</li>}
                                    {riskyTransactions.length === 0 && analysis.duplicateVendors.length === 0 && analysis.cashFlowAnomalies.length === 0 && analysis.circularTrading.length === 0 && (
                                        <li>No significant anomalies detected from the entered data.</li>
                                    )}
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/30">
                                    <span className="text-xs text-muted-foreground">Total Cash Gap</span>
                                    <div className="text-2xl font-bold text-white">₹ {totalDiscrepancy.toLocaleString('en-IN')}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/30">
                                    <span className="text-xs text-muted-foreground">Risk Score</span>
                                    <div className={cn("text-2xl font-bold", totalRiskScore > 80 ? "text-red-500" : totalRiskScore > 50 ? "text-yellow-500" : "text-green-500")}>
                                        {totalRiskScore > 80 ? 'CRITICAL' : totalRiskScore > 50 ? 'HIGH' : totalRiskScore > 0 ? 'MEDIUM' : 'CLEAN'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-2">Verification Layers</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {[
                                        'Layer 1: Business Logic', 'Layer 2: Relationship Scan',
                                        'Layer 3: Cash Reality', 'TICC: Intent Match'
                                    ].map(l => (
                                        <div key={l} className="flex items-center gap-2 text-emerald-400">
                                            <CheckCircle2 className="h-4 w-4" /> {l}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-border p-6 flex justify-end">
                            <button onClick={() => setShowReport(false)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, trend, className }: any) => (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/50">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <Icon className={cn("h-4 w-4 text-muted-foreground", className)} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
            <h3 className={cn("text-2xl font-bold text-white", className)}>{value}</h3>
            <span className="flex items-center text-xs font-medium text-emerald-500">
                <TrendingUp className="mr-1 h-3 w-3" />{trend}
            </span>
        </div>
    </div>
);

export default Dashboard;
