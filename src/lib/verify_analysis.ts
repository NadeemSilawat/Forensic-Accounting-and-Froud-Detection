// verify_analysis.ts — run via ts-node for manual testing
// Usage: npx ts-node src/lib/verify_analysis.ts

import { analyzeUserData } from './analysis_engine';
import { formDataToUserData, emptyFormData } from './user_data';

const sampleFormData = emptyFormData();
const userData = formDataToUserData(sampleFormData);
const result = analyzeUserData(userData);

console.log("Starting Analysis Verification...");

console.log("\n--- Vendor Analysis ---");
if (result.duplicateVendors.length > 0) {
    console.log(`PASS: Detected ${result.duplicateVendors.length} duplicate pairs.`);
    result.duplicateVendors.forEach(p => {
        console.log(`   Match: ${p.original.Vendor_Name} == ${p.duplicate.Vendor_Name}`);
    });
} else {
    console.log("No duplicate vendors (expected with empty data).");
}

console.log("\n--- Cash Flow Analysis ---");
if (result.cashFlowAnomalies.length > 0) {
    console.log(`PASS: Detected ${result.cashFlowAnomalies.length} cash flow anomalies.`);
    result.cashFlowAnomalies.forEach(a => console.log(`   Date: ${a.date}, Diff: ${a.difference}`));
} else {
    console.log("No cash flow anomalies (expected with empty data).");
}

console.log("\n--- Circular Trading Analysis ---");
if (result.circularTrading.length > 0) {
    console.log(`PASS: Detected ${result.circularTrading.length} circular trading cycles.`);
    result.circularTrading.forEach(c => console.log(`   Cycle: ${c.cycle.join(' -> ')} Amount: ${c.amount}`));
} else {
    console.log("No circular trading (expected with empty data).");
}

console.log("\nVerification Complete.");
