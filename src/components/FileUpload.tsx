import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { parseFile, generateSampleCSV } from '../lib/fileParser';
import type { Transaction } from '../lib/types';
import { cn } from '../lib/utils';

interface FileUploadProps {
    onDataLoaded: (transactions: Transaction[]) => void;
    onUseSampleData: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onUseSampleData }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Transaction[] | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setPreview(null);
        setFileName(file.name);
        try {
            const transactions = await parseFile(file);
            if (transactions.length === 0) {
                setError('No valid data rows found in the file. Please check the format.');
                setIsLoading(false);
                return;
            }
            setPreview(transactions);
        } catch (err: any) {
            setError(err.message || 'Failed to parse file.');
        }
        setIsLoading(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setIsDragging(false), []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDownloadTemplate = () => {
        const csv = generateSampleCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ttms_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleConfirm = () => {
        if (preview) {
            onDataLoaded(preview);
        }
    };

    const handleReset = () => {
        setPreview(null);
        setError(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatAmount = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8 font-mono">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Upload Transaction Data</h1>
                    <p className="mt-2 text-muted-foreground">
                        Upload your company's transaction data in CSV or Excel format for TTMS forensic analysis.
                    </p>
                </div>

                {/* Upload Area */}
                {!preview && (
                    <>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200",
                                isDragging
                                    ? "border-primary bg-primary/5 scale-[1.02]"
                                    : "border-border hover:border-primary/50 hover:bg-card"
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleInputChange}
                                className="hidden"
                            />
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="text-lg font-medium text-white">Parsing {fileName}...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-lg font-medium text-white">
                                        Drag & Drop your file here
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        or click to browse • Supports <span className="text-primary">.csv</span>, <span className="text-primary">.xlsx</span>, <span className="text-primary">.xls</span>
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Actions Row */}
                        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-white transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Download Sample Template (.csv)
                            </button>
                            <button
                                onClick={onUseSampleData}
                                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Use Sample Demo Data
                            </button>
                        </div>

                        {/* Expected Format */}
                        <div className="mt-8 rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-3 text-sm font-semibold text-white">Expected Columns (Flexible Mapping)</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-4">
                                {[
                                    { name: 'Transaction ID', req: 'Auto-generated if missing' },
                                    { name: 'Date', req: '(e.g., 2024-01-15)' },
                                    { name: 'Amount', req: '(₹ value)' },
                                    { name: 'Type', req: '(Sale, Purchase, Expense, Loan)' },
                                    { name: 'Party Name', req: '(Customer/Vendor)' },
                                    { name: 'Category', req: '(Revenue, COGS, etc.)' },
                                    { name: 'Related Party', req: '(Yes/No)' },
                                    { name: 'Disclosed', req: '(Yes/No)' },
                                    { name: 'Cash Flow', req: '(Actual cash received)' },
                                    { name: 'Stated Purpose', req: '(For TICC check)' },
                                    { name: 'Actual Usage', req: '(For TICC check)' },
                                ].map(col => (
                                    <div key={col.name} className="rounded-md bg-muted/30 px-3 py-2">
                                        <span className="font-medium text-white">{col.name}</span>
                                        <br />
                                        <span className="text-[10px]">{col.req}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Data Preview */}
                {preview && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <div>
                                    <h3 className="text-sm font-semibold text-white">
                                        {fileName} — {preview.length} transactions parsed
                                    </h3>
                                    <p className="text-xs text-muted-foreground">Review the data below, then proceed to analysis.</p>
                                </div>
                            </div>
                            <button onClick={handleReset} className="text-muted-foreground hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-auto rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-background">
                                    <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                                        <th className="px-3 py-2">ID</th>
                                        <th className="px-3 py-2">Date</th>
                                        <th className="px-3 py-2">Type</th>
                                        <th className="px-3 py-2">Party</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                        <th className="px-3 py-2 text-right">Cash Flow</th>
                                        <th className="px-3 py-2 text-center">Related?</th>
                                        <th className="px-3 py-2 text-center">Disclosed?</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {preview.slice(0, 50).map((tx) => (
                                        <tr key={tx.id} className="hover:bg-muted/30">
                                            <td className="px-3 py-2 font-medium text-white">{tx.id}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{tx.date}</td>
                                            <td className="px-3 py-2">
                                                <span className={cn(
                                                    "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                                    tx.type === 'sale' ? 'bg-green-400/10 text-green-400' :
                                                        tx.type === 'purchase' ? 'bg-blue-400/10 text-blue-400' :
                                                            tx.type === 'expense' ? 'bg-orange-400/10 text-orange-400' :
                                                                'bg-violet-400/10 text-violet-400'
                                                )}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground max-w-[120px] truncate">{tx.partyName}</td>
                                            <td className="px-3 py-2 text-right text-white">{formatAmount(tx.amount)}</td>
                                            <td className={cn("px-3 py-2 text-right", tx.actualCashFlow === 0 && tx.type === 'sale' ? 'text-red-400 font-medium' : 'text-muted-foreground')}>
                                                {formatAmount(tx.actualCashFlow)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {tx.isRelatedParty ? (
                                                    <span className="text-red-400 font-medium">Yes</span>
                                                ) : (
                                                    <span className="text-muted-foreground">No</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {tx.isDisclosed ? (
                                                    <span className="text-green-400">Yes</span>
                                                ) : (
                                                    <span className="text-red-400 font-medium">No</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {preview.length > 50 && (
                            <p className="mt-2 text-xs text-muted-foreground text-center">
                                Showing first 50 of {preview.length} transactions
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={handleReset}
                                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-white transition-colors"
                            >
                                Upload Different File
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Run TTMS Analysis →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
