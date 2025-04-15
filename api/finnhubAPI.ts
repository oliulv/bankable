// Simple Finnhub API client for React Native
const API_KEY = 'cvuvb7pr01qjg13bedjgcvuvb7pr01qjg13bedk0'; // Replace with your actual API key
const BASE_URL = 'https://finnhub.io/api/v1';

export type FinnhubErrorResponse = {
  error: string;
};

export interface ForexRatesResponse {
  base: string;
  quote: {
    [currency: string]: number;
  };
}

export interface CandleResponse {
  c: number[];  // Close prices
  h: number[];  // High prices
  l: number[];  // Low prices
  o: number[];  // Open prices
  s: string;    // Status
  t: number[];  // Timestamps
  v: number[];  // Volumes
}

export interface QuoteResponse {
  c: number;    // Current price
  d: number;    // Change
  dp: number;   // Percent change
  h: number;    // High price of the day
  l: number;    // Low price of the day
  o: number;    // Open price of the day
  pc: number;   // Previous close price
  t: number;    // Timestamp
}

export interface CompanyProfileResponse {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

class FinnhubApi {
  // Basic request method with retry logic and improved error handling
  private async request<T>(endpoint: string, params: Record<string, any> = {}, retries = 2): Promise<T> {
    // Build query string without including the token
    const queryParams = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const url = `${BASE_URL}${endpoint}${queryParams ? '?' + queryParams : ''}`;
    
    try {
      console.log(`Requesting: ${endpoint}`);
      
      const response = await fetch(url, {
        headers: {
          'X-Finnhub-Token': API_KEY
        }
      });
      
      // Handle rate limiting with retries
      if (response.status === 429 && retries > 0) {
        console.log(`Rate limit hit, retrying in ${1000 * (3 - retries)}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
        return this.request(endpoint, params, retries - 1);
      }
      
      if (!response.ok) {
        // Try to get more information about the error
        const errorText = await response.text().catch(() => '');
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText} ${errorText}`);
      }
      
      const data = await response.json() as T;
      return data;
    } catch (error) {
      console.error(`Finnhub API request failed for ${endpoint}:`, error);
      throw error;
    }
  }
  
  // Test connection to verify API key is working
  async testConnection(): Promise<any> {
    return this.request('/stock/symbol', { exchange: 'US' });
  }
  
  // Stock quote
  async quote(symbol: string): Promise<QuoteResponse> {
    return this.request<QuoteResponse>('/quote', { symbol });
  }
  
  // Stock candles
  async stockCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleResponse> {
    return this.request<CandleResponse>('/stock/candle', { 
      symbol, 
      resolution, 
      from, 
      to 
    });
  }
  
  // Crypto candles
  async cryptoCandles(symbol: string, resolution: string, from: number, to: number): Promise<CandleResponse> {
    return this.request<CandleResponse>('/crypto/candle', { 
      symbol, 
      resolution, 
      from, 
      to 
    });
  }
  
  // Company profile
  async companyProfile2(params: { symbol: string }): Promise<CompanyProfileResponse> {
    return this.request<CompanyProfileResponse>('/stock/profile2', params);
  }
  
  // Forex rates
  async forexRates(params: { base: string }): Promise<ForexRatesResponse> {
    return this.request<ForexRatesResponse>('/forex/rates', params);
  }

  // Sequential asset updates to avoid rate limiting
  async updateMultipleAssets<T>(
    assets: any[], 
    updateFn: (asset: any) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (const asset of assets) {
      try {
        // Add delay between requests to avoid rate limiting
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 250)); 
        }
        
        const result = await updateFn(asset);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update asset:`, error);
        throw error;
      }
    }
    
    return results;
  }
}

export const finnhubClient = new FinnhubApi();