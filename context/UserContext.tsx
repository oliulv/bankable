import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UserContextType {
  customerName: string;
  setCustomerName: (name: string) => void;
  customerId: string;
  setCustomerId: (id: string) => void;
}

const UserContext = createContext<UserContextType>({
  customerName: '',
  setCustomerName: () => {},
  customerId: '',
  setCustomerId: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');

  return (
    <UserContext.Provider value={{ customerName, setCustomerName, customerId, setCustomerId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);