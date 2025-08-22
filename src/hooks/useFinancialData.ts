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

interface UseFinancialDataState {
  loading: boolean;
  error: string | null;
}

interface UseFinancialDataReturn extends UseFinancialDataState {
  getStockPrice: (ticker: string) => Promise<StockPrice | null>;
  getCompanyFinancials: (
    ticker: string,
    period?: 'annual' | 'quarterly',
    statements?: ('income' | 'balance' | 'cash_flow')[]
  ) => Promise<CompanyFinancials | null>;
  getCompanyProfile: (ticker: string) => Promise<CompanyProfile | null>;
  searchCompanies: (query: string, limit?: number) => Promise<CompanySearchResponse | null>;
}

export function useFinancialData(): UseFinancialDataReturn {
  const [state, setState] = useState<UseFinancialDataState>({
    loading: false,
    error: null,
  });

  const makeRequest = useCallback(async (action: string, params: Record<string, any>) => {
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

  const getStockPrice = useCallback(async (ticker: string): Promise<StockPrice | null> => {
    return makeRequest('stock-price', { ticker });
  }, [makeRequest]);

  const getCompanyFinancials = useCallback(async (
    ticker: string,
    period: 'annual' | 'quarterly' = 'annual',
    statements: ('income' | 'balance' | 'cash_flow')[] = ['income', 'balance', 'cash_flow']
  ): Promise<CompanyFinancials | null> => {
    return makeRequest('company-financials', { ticker, period, statements });
  }, [makeRequest]);

  const getCompanyProfile = useCallback(async (ticker: string): Promise<CompanyProfile | null> => {
    return makeRequest('company-profile', { ticker });
  }, [makeRequest]);

  const searchCompanies = useCallback(async (
    query: string,
    limit: number = 10
  ): Promise<CompanySearchResponse | null> => {
    return makeRequest('search-companies', { query, limit });
  }, [makeRequest]);

  return {
    loading: state.loading,
    error: state.error,
    getStockPrice,
    getCompanyFinancials,
    getCompanyProfile,
    searchCompanies,
  };
}