/**
 * Utility functions to fix investment data issues
 * These can be run in the browser console or called from components
 */

import { InvestmentService } from '../services/investmentService';

/**
 * Fix a specific investment by providing the correct total investment amount
 */
export const fixSpecificInvestment = (
  userId: string, 
  symbol: string, 
  totalAmountInvested: number
): boolean => {
  try {
    const investment = InvestmentService.getInvestmentBySymbol(userId, symbol);
    if (!investment) {
      console.error(`Investment with symbol ${symbol} not found`);
      return false;
    }

    const success = InvestmentService.fixInvestmentPricing(investment.id, totalAmountInvested);
    if (success) {
      console.log(`✅ Fixed ${symbol} investment:`);
      console.log(`   Quantity: ${investment.quantity} shares`);
      console.log(`   Total Investment: $${totalAmountInvested}`);
      console.log(`   Corrected Price Per Share: $${(totalAmountInvested / investment.quantity).toFixed(4)}`);
    }
    return success;
  } catch (error) {
    console.error('Error fixing investment:', error);
    return false;
  }
};

/**
 * Detect and report potential pricing issues
 */
export const detectInvestmentIssues = (userId: string): void => {
  try {
    const issues = InvestmentService.detectPotentialPricingIssues(userId);
    
    if (issues.length === 0) {
      console.log('✅ No investment pricing issues detected!');
      return;
    }

    console.log(`⚠️  Found ${issues.length} potential pricing issues:`);
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.investment.symbol} (${issue.investment.name})`);
      console.log(`   Current calculated value: $${issue.currentCalculatedValue.toFixed(2)}`);
      console.log(`   Suspected total amount: $${issue.suspectedTotalAmount}`);
      console.log(`   Quantity: ${issue.investment.quantity}`);
      console.log(`   Current "price per share": $${issue.investment.purchasePrice}`);
      console.log(`   → Should probably be: $${(issue.suspectedTotalAmount / issue.investment.quantity).toFixed(4)} per share`);
    });

    console.log('\n💡 To fix an investment, run:');
    console.log('fixSpecificInvestment("your-user-id", "SYMBOL", totalAmountInvested)');
  } catch (error) {
    console.error('Error detecting issues:', error);
  }
};

/**
 * Quick fix for the VOO example mentioned by the user
 */
export const fixVOOExample = (userId: string): boolean => {
  return fixSpecificInvestment(userId, 'VOO', 130.18);
};

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).fixSpecificInvestment = fixSpecificInvestment;
  (window as any).detectInvestmentIssues = detectInvestmentIssues;
  (window as any).fixVOOExample = fixVOOExample;
}
