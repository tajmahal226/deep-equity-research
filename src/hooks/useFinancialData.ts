/**
 * Financial Data Hook
 * 
 * Custom hook for fetching financial data through the API
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface StockPrice {
  ticker: string;
  price: string;
  change: string;
  changePercent: string;
  volume: number;
  marketCap: string;
  pe_ratio: string;
  high_52w: string;
  low_52w: string;
  dividend_yield: string;
  beta: string;
  lastUpdated: string;
}

export interface CompanyFinancials {
  ticker: string;
  period: 'annual' | 'quarterly';
  currency: string;
  statements: {
    income?: {
      revenue: number;
      revenueGrowth: string;
      costOfRevenue: number;
      grossProfit: number;
      grossProfitMargin: string;
      operatingExpenses: number;
      operatingIncome: number;
      operatingMargin: string;
      netIncome: number;
      netMargin: string;
      eps: string;
      epsGrowth: string;
    };
    balance?: {
      totalAssets: number;
      currentAssets: number;
      cashAndEquivalents: number;
      totalLiabilities: number;
      currentLiabilities: number;
      totalDebt: number;
      shareholdersEquity: number;
      bookValuePerShare: string;
      debtToEquity: string;
      currentRatio: string;
    };
    cash_flow?: {
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      freeCashFlow: number;
      capex: number;
      cashFlowPerShare: string;
      fcfYield: string;
    };
  };
  lastUpdated: string;
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  employees: number;
  headquarters: string;
  founded: number;
  ceo: string;
  website: string;
  exchange: string;
  fiscalYearEnd: string;
}

export interface CompanySearchResult {
  ticker: string;
  name: string;
  sector: string;
  marketCap: string;
  price: string;
  change: string;
  changePercent: string;
}

export interface CompanySearchResponse {
  query: string;
  results: CompanySearchResult[];
  total: number;
  limit: number;
}

/**
 * Optional configuration for financial data requests.
 * Allows overriding the provider or supplying API keys
 * for specific financial data services.
 */
export interface FinancialDataOptions {
  /** Alpha Vantage API key for real stock data */
  alphaVantageApiKey?: string;
  /** Yahoo Finance API key */
  yahooFinanceApiKey?: string;
  /** Financial Datasets API key */
  financialDatasetsApiKey?: string;
  /** Explicit financial data provider to use */
  financialProvider?: string;
  /** Use deterministic values for mock provider */
  deterministic?: boolean;
}

interface UseFinancialDataState {
  loading: boolean;
  error: string | null;
}

interface UseFinancialDataReturn extends UseFinancialDataState {
  /**
   * Fetch current stock price information.
   * @param ticker Stock ticker symbol
   * @param options Optional provider configuration and API keys
   */
  getStockPrice: (ticker: string, options?: FinancialDataOptions) => Promise<StockPrice | null>;
  /**
   * Fetch detailed company financial statements.
   * @param ticker Stock ticker symbol
   * @param period Reporting period (annual or quarterly)
   * @param statements Statements to include in the response
   * @param options Optional provider configuration and API keys
   */
  getCompanyFinancials: (
    ticker: string,
    period?: 'annual' | 'quarterly',
    statements?: ('income' | 'balance' | 'cash_flow')[],
    options?: FinancialDataOptions
  ) => Promise<CompanyFinancials | null>;
  /**
   * Fetch company profile information.
   * @param ticker Stock ticker symbol
   * @param options Optional provider configuration and API keys
   */
  getCompanyProfile: (ticker: string, options?: FinancialDataOptions) => Promise<CompanyProfile | null>;
  /**
   * Search for companies by name or ticker.
   * @param query Search query
   * @param limit Maximum number of results
   * @param options Optional provider configuration and API keys
   */
  searchCompanies: (
    query: string,
    limit?: number,
    options?: FinancialDataOptions
  ) => Promise<CompanySearchResponse | null>;
}

export function useFinancialData(): UseFinancialDataReturn {
  const [state, setState] = useState<UseFinancialDataState>({
    loading: false,
    error: null,
  });

  const makeRequest = useCallback(
    async (action: string, params: Record<string, any> & FinancialDataOptions) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch('/api/financial-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, ...params }),
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }

      setState(prev => ({ ...prev, loading: false }));
      return data.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(`Financial data error: ${errorMessage}`);
      return null;
    }
    }, []);

  const getStockPrice = useCallback(
    async (
      ticker: string,
      options?: FinancialDataOptions
    ): Promise<StockPrice | null> => {
      return makeRequest('stock-price', { ticker, ...options });
    },
    [makeRequest]
  );

  const getCompanyFinancials = useCallback(
    async (
      ticker: string,
      period: 'annual' | 'quarterly' = 'annual',
      statements: ('income' | 'balance' | 'cash_flow')[] = ['income', 'balance', 'cash_flow'],
      options?: FinancialDataOptions
    ): Promise<CompanyFinancials | null> => {
      return makeRequest('company-financials', { ticker, period, statements, ...options });
    },
    [makeRequest]
  );

  const getCompanyProfile = useCallback(
    async (ticker: string, options?: FinancialDataOptions): Promise<CompanyProfile | null> => {
      return makeRequest('company-profile', { ticker, ...options });
    },
    [makeRequest]
  );

  const searchCompanies = useCallback(
    async (
      query: string,
      limit: number = 10,
      options?: FinancialDataOptions
    ): Promise<CompanySearchResponse | null> => {
      return makeRequest('search-companies', { query, limit, ...options });
    },
    [makeRequest]
  );

  return {
    loading: state.loading,
    error: state.error,
    getStockPrice,
    getCompanyFinancials,
    getCompanyProfile,
    searchCompanies,
  };
}