import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { getCustomerAccounts } from "../api/userData";

interface ProductInfo {
  product_id: string;
  product_name: string;
  product_type: string;
  product_benefits?: string;
}

export interface AccountInfo {
  account_id: string;
  customer_id: string;
  product_id: string;
  starting_balance: number;
  since: string;
  product: ProductInfo;
}

export interface CustomerData {
  customer_id: string;
  name: string;
  surname: string;
  title?: string;
  nationality?: string;
  dob?: string;
  address?: string;
  city?: string;
  postcode?: string;
  monthly_income?: number;
  marital_status?: string;
}

interface UserContextType {
  customerName: string;
  setCustomerName: (name: string) => void;
  customerId: string;
  setCustomerId: (id: string) => void;
  customerData: CustomerData | null;
  setCustomerData: (data: CustomerData | null) => void;
  accounts: AccountInfo[];
  isLoading: boolean;
  error: string | null;
  fetchCustomerData: (customerId: string) => Promise<void>;
  fetchAccountsData: (customerId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  customerName: '',
  setCustomerName: () => {},
  customerId: '',
  setCustomerId: () => {},
  customerData: null,
  setCustomerData: () => {},
  accounts: [],
  isLoading: false,
  error: null,
  fetchCustomerData: async () => {},
  fetchAccountsData: async () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = async (id: string) => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // This would usually need a separate API call, but we're assuming
      // we already have the customer data from sign-in
      if (!customerData || customerData.customer_id !== id) {
        // If we don't have the data, we would fetch it here
        // For now, we'll use the placeholder if needed
      }
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError('Failed to load customer information');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountsData = async (id: string) => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const accountsData = await getCustomerAccounts(id);
      setAccounts(accountsData);
    } catch (err) {
      console.error('Error fetching accounts data:', err);
      setError('Failed to load accounts information');
    } finally {
      setIsLoading(false);
    }
  };

  // When customerId changes, fetch both customer and accounts data
  useEffect(() => {
    if (customerId) {
      fetchCustomerData(customerId);
      fetchAccountsData(customerId);
    } else {
      // Reset data when user logs out
      setCustomerData(null);
      setAccounts([]);
    }
  }, [customerId]);

  return (
    <UserContext.Provider value={{ 
      customerName, 
      setCustomerName, 
      customerId, 
      setCustomerId,
      customerData,
      setCustomerData,
      accounts,
      isLoading,
      error,
      fetchCustomerData,
      fetchAccountsData
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);