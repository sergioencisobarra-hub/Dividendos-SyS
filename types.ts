
export interface Stock {
  name: string;
  ticker: string;
  shares: number;
}

export interface DividendResult {
  company: string;
  ticker: string;
  exDividendDate: string;
  paymentDate: string;
  grossDivOriginal: number;
  currency: string;
  exchangeRate: number;
  grossDivEur: number;
  totalGrossEur: number;
  originTaxRate: number;
  spanishTaxRate: number;
  netAmountEur: number;
}

export interface AnalysisSummary {
  totalCompanies: number;
  totalGrossEur: number;
  totalNetEur: number;
  results: DividendResult[];
}
