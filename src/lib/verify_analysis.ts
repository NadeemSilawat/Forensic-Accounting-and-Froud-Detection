
import { analyzeUserData } from './analysis_engine';
import { USER_DATA } from './user_data';

console.log("Starting Analysis Verification...");

const result = analyzeUserData();

// 1. Verify Duplicate Vendors
console.log("\n--- Vendor Analysis ---");
if (result.duplicateVendors.length > 0) {
    console.log(`PASS: Detected ${result.duplicateVendors.length} duplicate pairs.`);
    result.duplicateVendors.forEach(p => {
        console.log(`   Match: ${p.original.Vendor_Name} (${p.original.Vendor_ID}) == ${p.duplicate.Vendor_Name} (${p.duplicate.Vendor_ID})`);
    });
} else {
    console.error("FAIL: No duplicate vendors detected (Expected 1 pair).");
}

// 2. Verify Cash Flow
console.log("\n--- Cash Flow Analysis ---");
const missingCashDays = result.cashFlowAnomalies.filter(a => a.difference !== 0);
if (missingCashDays.length === 3) { // Jan 6, 7, 9
    console.log(`PASS: Detected ${missingCashDays.length} cash flow anomalies.`);
    missingCashDays.forEach(a => console.log(`   Date: ${a.date}, Diff: ${a.difference}`));
} else {
    console.error(`FAIL: Expected 3 cash flow anomalies, found ${missingCashDays.length}.`);
}

// 3. Verify Circular Trading
console.log("\n--- Circular Trading Analysis ---");
if (result.circularTrading.length > 0) {
    console.log(`PASS: Detected ${result.circularTrading.length} circular trading cycles.`);
    result.circularTrading.forEach(c => console.log(`   Cycle: ${c.cycle.join(' -> ')} Amount: ${c.amount}`));
} else {
    console.error("FAIL: No circular trading detected.");
}

console.log("\nVerification Complete.");
