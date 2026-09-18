import { Customer, CustomerTransaction } from '../types';

export interface CustomerUdhaarStats {
  totalCreditEver: number;
  totalPaymentsEver: number;
  repaidPercent: number;
  pendingBalance: number;
}

/**
 * Calculates collection/repayment stats for a single customer.
 *
 * Formula:
 * (total payments received from customer ÷ total credit ever given to that customer) × 100
 */
export function getCustomerUdhaarStats(
  customer: Customer,
  txns: CustomerTransaction[] = []
): CustomerUdhaarStats {
  const creditTxns = txns.filter((t) => t.type === 'credit');
  const paymentTxns = txns.filter((t) => t.type === 'payment');

  const creditFromTxns = creditTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPaymentsEver = paymentTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // If customer was initialized with an existing balance not captured in txns,
  // ensure totalCreditEver accounts for current balance + all payments made.
  const totalCreditEver = Math.max(
    creditFromTxns,
    Math.max(0, Number(customer.balance) || 0) + totalPaymentsEver
  );

  const repaidPercent =
    totalCreditEver > 0
      ? Math.min(100, Math.round((totalPaymentsEver / totalCreditEver) * 100))
      : 100;

  return {
    totalCreditEver,
    totalPaymentsEver,
    repaidPercent,
    pendingBalance: Math.max(0, Number(customer.balance) || 0),
  };
}

export interface AggregateUdhaarStats {
  totalMarketCreditEver: number;
  totalMarketPaymentsEver: number;
  aggregateRepaidPercent: number;
  totalPendingBalance: number;
}

/**
 * Calculates aggregate collection/repayment stats across ALL customers.
 *
 * Formula:
 * (total payments received across all customers ÷ total credit ever given across all customers) × 100
 */
export function getAggregateUdhaarStats(
  customers: Customer[],
  transactions: Record<string, CustomerTransaction[]> = {}
): AggregateUdhaarStats {
  let totalMarketCreditEver = 0;
  let totalMarketPaymentsEver = 0;
  let totalPendingBalance = 0;

  customers.forEach((c) => {
    const custStats = getCustomerUdhaarStats(c, transactions[c.id] || []);
    totalMarketCreditEver += custStats.totalCreditEver;
    totalMarketPaymentsEver += custStats.totalPaymentsEver;
    totalPendingBalance += custStats.pendingBalance;
  });

  const aggregateRepaidPercent =
    totalMarketCreditEver > 0
      ? Math.min(100, Math.round((totalMarketPaymentsEver / totalMarketCreditEver) * 100))
      : 100;

  return {
    totalMarketCreditEver,
    totalMarketPaymentsEver,
    aggregateRepaidPercent,
    totalPendingBalance,
  };
}
