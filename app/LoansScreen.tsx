import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  FlatList,
  Platform,
  Keyboard,
  NativeSyntheticEvent,
  NativeScrollEvent,
  KeyboardAvoidingView // Add this import
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useThemeColors } from '../styles/useThemeColors'; // Import the hook

const screenWidth = Dimensions.get('window').width;

// API Constants
const API_BASE_URL = 'https://your-banking-api.com'; // Replace with your actual API

// Types
interface Loan {
  id: string;
  name: string;
  type: LoanType;
  amount: number;
  interestRate: number;
  term: number; // in months
  monthlyPayment: number;
  remainingBalance: number;
  nextPaymentDate: Date;
  startDate: Date;
  status: LoanStatus;
  progress: number; // 0-1 representing percentage paid
  description?: string;
  paymentHistory?: Payment[];
}

interface LoanOffer {
  id: string;
  type: LoanType;
  name: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number; // in months
  maxTerm: number; // in months
  baseInterestRate: number;
  description: string;
  requirements: string[];
  featured: boolean;
}

interface Payment {
  id: string;
  loanId: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  type: 'scheduled' | 'extra';
}

interface UserCreditProfile {
  creditScore: number;
  totalDebt: number;
  availableCredit: number;
  utilizationRate: number;
  monthlyIncome: number;
  debtToIncomeRatio: number;
}

type LoanType = 'Personal' | 'Mortgage' | 'Auto' | 'Student' | 'Business' | 'Credit Line';
type LoanStatus = 'Active' | 'Pending Approval' | 'Paid Off' | 'Rejected' | 'Draft';

// Initial dummy data for active loans
const initialLoans: Loan[] = [
  {
    id: '1',
    name: 'Home Mortgage',
    type: 'Mortgage',
    amount: 250000,
    interestRate: 3.25,
    term: 360, // 30 years in months
    monthlyPayment: 1088.02,
    remainingBalance: 235750.45,
    nextPaymentDate: new Date(2025, 4, 15), // May 15, 2025
    startDate: new Date(2023, 6, 10), // July 10, 2023
    status: 'Active',
    progress: 0.057, // About 5.7% paid off
    description: 'Fixed-rate 30-year mortgage for primary residence purchase',
    paymentHistory: [
      {
        id: 'p1',
        loanId: '1',
        amount: 1088.02,
        date: new Date(2025, 3, 15), // April 15, 2025
        status: 'completed',
        type: 'scheduled'
      },
      {
        id: 'p2',
        loanId: '1',
        amount: 1088.02,
        date: new Date(2025, 2, 15), // March 15, 2025
        status: 'completed',
        type: 'scheduled'
      },
      {
        id: 'p3',
        loanId: '1',
        amount: 1088.02,
        date: new Date(2025, 1, 15), // Feb 15, 2025
        status: 'completed',
        type: 'scheduled'
      }
    ]
  },
  {
    id: '2',
    name: 'Car Loan',
    type: 'Auto',
    amount: 28500,
    interestRate: 4.5,
    term: 60, // 5 years in months
    monthlyPayment: 532.06,
    remainingBalance: 15436.18,
    nextPaymentDate: new Date(2025, 4, 20), // May 20, 2025
    startDate: new Date(2022, 4, 20), // May 20, 2022
    status: 'Active',
    progress: 0.46, // About 46% paid off
    paymentHistory: [
      {
        id: 'p4',
        loanId: '2',
        amount: 532.06,
        date: new Date(2025, 3, 20), // April 20, 2025
        status: 'completed',
        type: 'scheduled'
      },
      {
        id: 'p5',
        loanId: '2',
        amount: 532.06,
        date: new Date(2025, 2, 20), // March 20, 2025
        status: 'completed',
        type: 'scheduled'
      }
    ]
  },
  {
    id: '3',
    name: 'Personal Loan',
    type: 'Personal',
    amount: 15000,
    interestRate: 7.25,
    term: 36, // 3 years in months
    monthlyPayment: 465.74,
    remainingBalance: 8256.42,
    nextPaymentDate: new Date(2025, 4, 5), // May 5, 2025
    startDate: new Date(2023, 10, 5), // Nov 5, 2023
    status: 'Active',
    progress: 0.45, // About 45% paid off
    paymentHistory: [
      {
        id: 'p7',
        loanId: '3',
        amount: 465.74,
        date: new Date(2025, 3, 5), // April 5, 2025
        status: 'completed',
        type: 'scheduled'
      },
      {
        id: 'p8',
        loanId: '3',
        amount: 1000.00,
        date: new Date(2025, 2, 20), // March 20, 2025
        status: 'completed',
        type: 'extra'
      }
    ]
  },
  {
    id: '4',
    name: 'Business Expansion',
    type: 'Business',
    amount: 75000,
    interestRate: 6.5,
    term: 84, // 7 years in months
    monthlyPayment: 1124.98,
    remainingBalance: 69542.37,
    nextPaymentDate: new Date(2025, 4, 22), // May 22, 2025
    startDate: new Date(2024, 9, 22), // Oct 22, 2024
    status: 'Active',
    progress: 0.073, // About 7.3% paid off
    description: 'Loan for expanding business operations and equipment purchase'
  },
  {
    id: '5',
    name: 'Home Renovation Line',
    type: 'Credit Line',
    amount: 25000, // Credit limit
    interestRate: 5.75,
    term: 120, // 10 years in months
    monthlyPayment: 274.89,
    remainingBalance: 18750.65,
    nextPaymentDate: new Date(2025, 4, 10), // May 10, 2025
    startDate: new Date(2023, 2, 10), // March 10, 2023
    status: 'Active',
    progress: 0.25, // About 25% paid off
    description: 'Revolving line of credit for home improvements'
  },
  {
    id: '6',
    name: 'Student Loan Refinance',
    type: 'Student',
    amount: 42000,
    interestRate: 4.25,
    term: 120, // 10 years in months
    monthlyPayment: 430.87,
    remainingBalance: 38452.12,
    nextPaymentDate: new Date(2025, 4, 25), // May 25, 2025
    startDate: new Date(2024, 6, 25), // July 25, 2024
    status: 'Active',
    progress: 0.084, // About 8.4% paid off
    description: 'Refinanced federal and private student loans'
  },
  {
    id: '7',
    name: 'New Kitchen Loan',
    type: 'Personal',
    amount: 18500,
    interestRate: 6.75,
    term: 48, // 4 years in months
    monthlyPayment: 436.58,
    remainingBalance: 12896.32,
    nextPaymentDate: new Date(2025, 4, 18), // May 18, 2025
    startDate: new Date(2023, 8, 18), // Sept 18, 2023
    status: 'Active',
    progress: 0.30, // About 30% paid off
  },
  {
    id: '8',
    name: 'Emergency Loan',
    type: 'Personal',
    amount: 5000,
    interestRate: 8.5,
    term: 24, // 2 years in months
    monthlyPayment: 227.53,
    remainingBalance: 2251.78,
    nextPaymentDate: new Date(2025, 4, 3), // May 3, 2025
    startDate: new Date(2023, 4, 3), // May 3, 2023
    status: 'Active',
    progress: 0.55, // About 55% paid off
  },
];

// Initial loan offers
const initialLoanOffers: LoanOffer[] = [
  {
    id: 'offer1',
    type: 'Personal',
    name: 'Flexible Personal Loan',
    minAmount: 1000,
    maxAmount: 50000,
    minTerm: 12,
    maxTerm: 60,
    baseInterestRate: 6.75,
    description: 'Flexible personal loans for any purpose with competitive rates and quick approval.',
    requirements: [
      'Minimum credit score of 650',
      'Stable income verification',
      'Maximum debt-to-income ratio of 45%'
    ],
    featured: true
  },
  {
    id: 'offer2',
    type: 'Mortgage',
    name: 'First-Time Homebuyer Mortgage',
    minAmount: 100000,
    maxAmount: 500000,
    minTerm: 180,
    maxTerm: 360,
    baseInterestRate: 3.25,
    description: 'Special mortgage program for first-time homebuyers with favorable terms and lower down payment requirements.',
    requirements: [
      'First-time homebuyer status',
      'Minimum credit score of 680',
      'Down payment of at least 3.5%',
      'Maximum debt-to-income ratio of 43%'
    ],
    featured: true
  },
  {
    id: 'offer3',
    type: 'Auto',
    name: 'New Car Loan',
    minAmount: 5000,
    maxAmount: 100000,
    minTerm: 24,
    maxTerm: 72,
    baseInterestRate: 4.25,
    description: 'Competitive rates on new car purchases with flexible terms and no prepayment penalties.',
    requirements: [
      'Minimum credit score of 660',
      'Vehicle not older than current model year',
      'Proof of insurance',
      'Maximum loan-to-value ratio of 110%'
    ],
    featured: true
  },
  {
    id: 'offer4',
    type: 'Auto',
    name: 'Used Car Loan',
    minAmount: 3000,
    maxAmount: 50000,
    minTerm: 24,
    maxTerm: 60,
    baseInterestRate: 4.75,
    description: 'Affordable financing for pre-owned vehicles with quick approval and competitive rates.',
    requirements: [
      'Minimum credit score of 640',
      'Vehicle not older than 7 years',
      'Proof of insurance',
      'Maximum loan-to-value ratio of 100%'
    ],
    featured: false
  },
  {
    id: 'offer5',
    type: 'Business',
    name: 'Small Business Growth Loan',
    minAmount: 25000,
    maxAmount: 250000,
    minTerm: 24,
    maxTerm: 120,
    baseInterestRate: 6.5,
    description: 'Financing designed for small business expansion, equipment purchase, or working capital needs.',
    requirements: [
      'Business operating for at least 2 years',
      'Minimum annual revenue of £100,000',
      'Business and personal credit check',
      'Detailed business plan for loans over £50,000'
    ],
    featured: false
  },
  {
    id: 'offer6',
    type: 'Student',
    name: 'Education Refinance Loan',
    minAmount: 5000,
    maxAmount: 150000,
    minTerm: 60,
    maxTerm: 180,
    baseInterestRate: 4.25,
    description: 'Refinance existing student loans at a lower rate and save on interest over the life of your loan.',
    requirements: [
      'Graduation with at least an undergraduate degree',
      'Minimum credit score of 680',
      'Stable employment history',
      'Minimum income of £30,000 annually'
    ],
    featured: false
  },
  {
    id: 'offer7',
    type: 'Credit Line',
    name: 'Home Equity Line of Credit',
    minAmount: 10000,
    maxAmount: 250000,
    minTerm: 120,
    maxTerm: 240,
    baseInterestRate: 5.75,
    description: 'Access the equity in your home for renovations, major expenses, or debt consolidation.',
    requirements: [
      'At least 20% equity in your home',
      'Minimum credit score of 700',
      'Maximum combined loan-to-value ratio of 80%',
      'Stable income verification'
    ],
    featured: false
  },
  {
    id: 'offer8',
    type: 'Mortgage',
    name: 'Refinance Mortgage',
    minAmount: 100000,
    maxAmount: 1000000,
    minTerm: 120,
    maxTerm: 360,
    baseInterestRate: 3.5,
    description: 'Refinance your existing mortgage to lower your interest rate or change your loan term.',
    requirements: [
      'Current mortgage in good standing',
      'Minimum credit score of 660',
      'Maximum loan-to-value ratio of 80% (90% with PMI)',
      'Proof of consistent income'
    ],
    featured: false
  },
];

// Initial credit profile
const initialCreditProfile: UserCreditProfile = {
  creditScore: 745,
  totalDebt: 282395.77, // Sum of all loan balances
  availableCredit: 50000, // Credit lines available
  utilizationRate: 0.38, // 38% utilization
  monthlyIncome: 5800,
  debtToIncomeRatio: 0.31 // 31% DTI
};

const LoansScreen: React.FC = () => {
  const theme = useThemeColors(); // Get theme colors
  // States
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>(initialLoans);
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>(initialLoanOffers);
  const [filteredOffers, setFilteredOffers] = useState<LoanOffer[]>(initialLoanOffers);
  const [creditProfile, setCreditProfile] = useState<UserCreditProfile>(initialCreditProfile);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<LoanOffer | null>(null);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [showLoanApplicationModal, setShowLoanApplicationModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'loans' | 'offers'>('loans');
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | 'All'>('All');
  const [sortOption, setSortOption] = useState<'name' | 'balance' | 'date'>('balance');
  const loanTypeScrollViewRef = React.useRef<ScrollView>(null);
  const [showTypeIndicator, setShowTypeIndicator] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Loan application state
  const [applicationLoanAmount, setApplicationLoanAmount] = useState<string>('');
  const [applicationLoanTerm, setApplicationLoanTerm] = useState<string>('');
  const [applicationPurpose, setApplicationPurpose] = useState<string>('');
  const [calculatedMonthlyPayment, setCalculatedMonthlyPayment] = useState<number>(0);
  const [calculatedInterestRate, setCalculatedInterestRate] = useState<number>(0);
  const [calculatedTotalInterest, setCalculatedTotalInterest] = useState<number>(0);

  // Charts data state
  const [chartData, setChartData] = useState({
    isLoading: false,
    debtComposition: [] as any[],
    paymentTimeline: {
      labels: [] as string[],
      datasets: [{ data: [] as number[] }]
    }
  });

  // Chart configuration using theme
  const chartConfig = {
    backgroundGradient: theme.background,
    backgroundGradientFrom: theme.background,
    backgroundGradientTo: theme.background,
    color: (opacity = 1) => theme.primary || `rgba(1, 95, 69, ${opacity})`, // Fallback if theme.primary is undefined
    labelColor: (opacity = 1) => theme.text || `rgba(0, 0, 0, ${opacity})`, // Fallback if theme.text is undefined
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16
    },
  };

  // Initialization of data on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Start loading data
        setLoading(true);
        
        // Load stored data
        await loadLoans();
        
        // Load credit profile
        await loadCreditProfile();
        
        // Update loan data
        await updateLoanData();
        
        // Done loading
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    };
    
    initialize();
    
    // Set up refresh interval - 60 seconds
    const refreshInterval = setInterval(updateLoanData, 60000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Animation for loan type scrolling
  useEffect(() => {
    // Bounce animation on first render for loan type scrolling
    setTimeout(() => {
      if (loanTypeScrollViewRef.current) {
        loanTypeScrollViewRef.current.scrollTo({ x: 50, animated: true });
        setTimeout(() => {
          loanTypeScrollViewRef.current?.scrollTo({ x: 0, animated: true });
        }, 800);
      }
    }, 500);
  }, []);

  // Filter loans based on type and search query
  useEffect(() => {
    let result = [...loans];
    
    // Apply loan type filter
    if (selectedLoanType !== 'All') {
      result = result.filter(loan => loan.type === selectedLoanType);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(loan => 
        loan.name.toLowerCase().includes(query) || 
        loan.type.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'balance':
        result.sort((a, b) => b.remainingBalance - a.remainingBalance);
        break;
      case 'date':
        result.sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime());
        break;
    }
    
    setFilteredLoans(result);
  }, [loans, selectedLoanType, searchQuery, sortOption]);

  // Filter loan offers when loan type changes
  useEffect(() => {
    let offerResults = [...loanOffers];
    
    // Apply loan type filter to offers
    if (selectedLoanType !== 'All') {
      offerResults = offerResults.filter(offer => offer.type === selectedLoanType);
    }
    
    // Always show featured offers first
    offerResults.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
    
    setFilteredOffers(offerResults);
  }, [loanOffers, selectedLoanType]);

  // Calculate loan application details when amount or term changes
  useEffect(() => {
    if (!selectedOffer) return;
    
    const amount = parseFloat(applicationLoanAmount || '0');
    const term = parseInt(applicationLoanTerm || '0');
    
    if (amount > 0 && term > 0) {
      // Add risk-based pricing - this is simplified
      // In a real app, this would be calculated by the backend
      let riskAdjustment = 0;
      
      // Credit score adjustment
      if (creditProfile.creditScore >= 800) riskAdjustment -= 0.5;
      else if (creditProfile.creditScore >= 740) riskAdjustment -= 0.25;
      else if (creditProfile.creditScore >= 670) riskAdjustment += 0;
      else if (creditProfile.creditScore >= 580) riskAdjustment += 1;
      else riskAdjustment += 2.5;
      
      // Debt-to-income adjustment
      if (creditProfile.debtToIncomeRatio <= 0.2) riskAdjustment -= 0.25;
      else if (creditProfile.debtToIncomeRatio <= 0.36) riskAdjustment += 0;
      else if (creditProfile.debtToIncomeRatio <= 0.43) riskAdjustment += 0.25;
      else riskAdjustment += 0.75;
      
      // Term adjustment (longer terms have higher rates)
      const termRatio = (term - selectedOffer.minTerm) / (selectedOffer.maxTerm - selectedOffer.minTerm);
      riskAdjustment += termRatio * 0.5;
      
      // Calculate interest rate
      const interestRate = Math.max(selectedOffer.baseInterestRate + riskAdjustment, selectedOffer.baseInterestRate);
      setCalculatedInterestRate(interestRate);
      
      // Calculate monthly payment using amortization formula
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
      setCalculatedMonthlyPayment(monthlyPayment);
      
      // Calculate total interest
      const totalPayments = monthlyPayment * term;
      const totalInterest = totalPayments - amount;
      setCalculatedTotalInterest(totalInterest);
    } else {
      setCalculatedMonthlyPayment(0);
      setCalculatedInterestRate(selectedOffer.baseInterestRate);
      setCalculatedTotalInterest(0);
    }
  }, [applicationLoanAmount, applicationLoanTerm, selectedOffer, creditProfile]);

  // Load loans data from AsyncStorage
  const loadLoans = async () => {
    try {
      const loansData = await AsyncStorage.getItem('loans');
      if (loansData) {
        const parsedData = JSON.parse(loansData);
        
        // Convert string dates back to Date objects
        const processedLoans = parsedData.map((loan: any) => ({
          ...loan,
          nextPaymentDate: new Date(loan.nextPaymentDate),
          startDate: new Date(loan.startDate),
          paymentHistory: loan.paymentHistory ? loan.paymentHistory.map((payment: any) => ({
            ...payment,
            date: new Date(payment.date)
          })) : undefined
        }));
        
        setLoans(processedLoans);
      }
    } catch (error) {
      console.error('Failed to load loans:', error);
    }
  };

  // Save loans data to AsyncStorage
  const saveLoans = async (newLoans: Loan[]) => {
    try {
      await AsyncStorage.setItem('loans', JSON.stringify(newLoans));
    } catch (error) {
      console.error('Failed to save loans:', error);
    }
  };
  
  // Load credit profile from AsyncStorage
  const loadCreditProfile = async () => {
    try {
      const profileData = await AsyncStorage.getItem('creditProfile');
      if (profileData) {
        setCreditProfile(JSON.parse(profileData));
      }
    } catch (error) {
      console.error('Failed to load credit profile:', error);
    }
  };

  // Save credit profile to AsyncStorage
  const saveCreditProfile = async (newProfile: UserCreditProfile) => {
    try {
      await AsyncStorage.setItem('creditProfile', JSON.stringify(newProfile));
    } catch (error) {
      console.error('Failed to save credit profile:', error);
    }
  };

  // Update loan data periodically
  const updateLoanData = async () => {
    try {
      setRefreshing(true);
      
      // In a real app, you'd fetch updated loan data from your API
      // For this demo, we'll simulate it using the current data
      
      // Update loan balances to simulate payments/interest
      const currentDate = new Date();
      const updatedLoans = loans.map(loan => {
        // Simple interest calculation (in reality this would be more complex)
        const daysSinceLastUpdate = Math.floor(Math.random() * 30); // Simulate random days
        const dailyInterestRate = loan.interestRate / 100 / 365;
        const interestAccrued = loan.remainingBalance * dailyInterestRate * daysSinceLastUpdate;
        
        // Check if next payment date is past due
        let newRemainingBalance = loan.remainingBalance;
        let newNextPaymentDate = new Date(loan.nextPaymentDate);
        
        if (loan.nextPaymentDate < currentDate && loan.status === 'Active') {
          // Simulate payment being made
          newRemainingBalance -= (loan.monthlyPayment - (loan.remainingBalance * loan.interestRate / 100 / 12));
          
          // Set next payment date to next month
          newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + 1);
          
          // Add the payment to history
          const newPayment: Payment = {
            id: `p${Date.now()}`,
            loanId: loan.id,
            amount: loan.monthlyPayment,
            date: new Date(loan.nextPaymentDate),
            status: 'completed',
            type: 'scheduled'
          };
          
          const paymentHistory = loan.paymentHistory ? [...loan.paymentHistory, newPayment] : [newPayment];
          
          return {
            ...loan,
            remainingBalance: Math.max(newRemainingBalance, 0),
            nextPaymentDate: newNextPaymentDate,
            progress: Math.min(1 - (newRemainingBalance / loan.amount), 1),
            paymentHistory: paymentHistory
          };
        } else {
          // Just add accrued interest
          return {
            ...loan,
            remainingBalance: loan.remainingBalance + interestAccrued
          };
        }
      });
      
      // Check if any loans are paid off
      const finalLoans = updatedLoans.map(loan => {
        if (loan.remainingBalance <= 0 && loan.status === 'Active') {
          return {
            ...loan,
            status: 'Paid Off' as LoanStatus,
            remainingBalance: 0,
            progress: 1
          };
        }
        return loan;
      });
      
      // Update loans state
      setLoans(finalLoans);
      
      // Apply filters
      const filtered = finalLoans.filter(loan => {
        const matchesType = selectedLoanType === 'All' || loan.type === selectedLoanType;
        const matchesQuery = !searchQuery || loan.name.toLowerCase().includes(searchQuery.toLowerCase()) || loan.type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesQuery;
      });
      
      setFilteredLoans(filtered);
      
      // Update credit profile
      const totalDebt = finalLoans
        .filter(loan => loan.status === 'Active')
        .reduce((sum, loan) => sum + loan.remainingBalance, 0);
      
      const newCreditProfile = {
        ...creditProfile,
        totalDebt: totalDebt,
        debtToIncomeRatio: Math.min(totalDebt / (creditProfile.monthlyIncome * 12), 1)
      };
      
      setCreditProfile(newCreditProfile);
      
      // Save updated data
      saveLoans(finalLoans);
      saveCreditProfile(newCreditProfile);
      
      // Update charts
      updateChartData(finalLoans);
      
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to update loan data:', error);
      setRefreshing(false);
    }
  };

  // Update chart data
  const updateChartData = (currentLoans: Loan[]) => {
    try {
      // Debt composition chart data
      const activeLoans = currentLoans.filter(loan => loan.status === 'Active');

      // Group by loan type and calculate total debt
      const loanTypeMap: Record<string, number> = {};
      let totalDebt = 0;

      activeLoans.forEach(loan => {
        totalDebt += loan.remainingBalance;
        if (loanTypeMap[loan.type]) {
          loanTypeMap[loan.type] += loan.remainingBalance;
        } else {
          loanTypeMap[loan.type] = loan.remainingBalance;
        }
      });

      // Convert to chart data format
      const colors = [theme.primary, theme.success, theme.secondary, theme.warning, theme.secondary, theme.secondary]; // Use theme colors, replaced accent and info with secondary
      const debtComposition = Object.entries(loanTypeMap).map(([type, balance], index) => {
        const percentage = (balance / totalDebt) * 100;
        const roundedPercentage = percentage.toFixed(1);
        return {
          name: `% ${type}`,
          value: parseFloat(roundedPercentage),
          legend: `${type}: ${roundedPercentage}%`,
          color: colors[index % colors.length],
          legendFontColor: theme.text, // Use theme text color
          legendFontSize: 12
        };
      });
      
      // Payment timeline data - future payments for next 6 months
      const months = [];
      const payments = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const month = new Date(currentDate);
        month.setMonth(currentDate.getMonth() + i);
        months.push(month.toLocaleDateString('en-US', { month: 'short' }));
        
        // Calculate total payments for this month
        const totalPayment = activeLoans.reduce((sum, loan) => {
          // Check if payment is due this month
          const paymentDate = new Date(loan.nextPaymentDate);
          const paymentMonth = new Date(paymentDate);
          paymentMonth.setMonth(paymentDate.getMonth() + i);
          if (paymentMonth.getMonth() === month.getMonth() && paymentMonth.getFullYear() === month.getFullYear()) {
            return sum + loan.monthlyPayment;
          }
          return sum;
        }, 0);
        
        payments.push(Math.round(totalPayment));
      }
      
      setChartData({
        isLoading: false,
        debtComposition,
        paymentTimeline: {
          labels: months,
          datasets: [{ data: payments }]
        }
      });
    } catch (error) {
      console.error('Failed to update chart data:', error);
    }
  };

  // Handle loan selection
  const handleLoanSelect = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowLoanModal(true);
  };

  // Handle offer selection
  const handleOfferSelect = (offer: LoanOffer) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!selectedLoan) return;
    
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
        return;
      }
      
      setLoading(true);
      
      // In a real app, you would send this to your API
      // For this demo, we'll update the local state
      
      // Create new payment record
      const newPayment: Payment = {
        id: `payment-${Date.now()}`,
        loanId: selectedLoan.id,
        amount: amount,
        date: new Date(),
        status: 'completed',
        type: 'extra'
      };
      
      // Update loan balance
      const updatedLoans = loans.map(loan => {
        if (loan.id === selectedLoan.id) {
          const newBalance = Math.max(loan.remainingBalance - amount, 0);
          const paymentHistory = loan.paymentHistory ? [...loan.paymentHistory, newPayment] : [newPayment];
          const progress = 1 - (newBalance / loan.amount);
          
          return {
            ...loan,
            remainingBalance: newBalance,
            progress: progress,
            status: newBalance <= 0 ? 'Paid Off' : loan.status,
            paymentHistory
          };
        }
        return loan;
      });
      
      // Update credit profile
      const totalDebt = updatedLoans
        .filter(loan => loan.status === 'Active')
        .reduce((sum, loan) => sum + loan.remainingBalance, 0);
      
      const newCreditProfile = {
        ...creditProfile,
        totalDebt,
        debtToIncomeRatio: totalDebt / (creditProfile.monthlyIncome * 12)
      };
      
      // Update state and storage
      setLoans(updatedLoans);
      setCreditProfile(newCreditProfile);
      await saveLoans(updatedLoans);
      await saveCreditProfile(newCreditProfile);
      
      // Update chart data
      updateChartData(updatedLoans);
      
      // Close modal
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedLoan(null);
      setLoading(false);
      
      Alert.alert('Success', 'Your payment has been processed!');
    } catch (error) {
      console.error('Error processing payment:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  // Handle loan application submission
  const handleLoanApplicationSubmit = async () => {
    if (!selectedOffer) return;
    
    try {
      const amount = parseFloat(applicationLoanAmount);
      const term = parseInt(applicationLoanTerm);
      
      if (isNaN(amount) || amount < selectedOffer.minAmount || amount > selectedOffer.maxAmount) {
        Alert.alert('Invalid amount', `Please enter an amount between ${selectedOffer.minAmount} and ${selectedOffer.maxAmount}.`);
        return;
      }
      
      if (isNaN(term) || term < selectedOffer.minTerm || term > selectedOffer.maxTerm) {
        Alert.alert('Invalid term', `Please enter a term between ${selectedOffer.minTerm} and ${selectedOffer.maxTerm} months.`);
        return;
      }
      
      if (!applicationPurpose.trim()) {
        Alert.alert('Missing information', 'Please enter the purpose of the loan.');
        return;
      }
      
      setLoading(true);
      
      // In a real app, you would send this to your API
      // For this demo, we'll simulate application submission
      
      // Create new loan application (in pending status)
      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        name: `${selectedOffer.type} Loan - ${applicationPurpose.substring(0, 20)}`,
        type: selectedOffer.type,
        amount: amount,
        interestRate: calculatedInterestRate,
        term: term,
        monthlyPayment: calculatedMonthlyPayment,
        remainingBalance: amount,
        nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        startDate: new Date(),
        status: 'Pending Approval',
        progress: 0,
        description: applicationPurpose
      };
      
      // Add to loans list
      const updatedLoans = [...loans, newLoan];
      setLoans(updatedLoans);
      await saveLoans(updatedLoans);
      
      // Reset application form
      setApplicationLoanAmount('');
      setApplicationLoanTerm('');
      setApplicationPurpose('');
      setSelectedOffer(null);
      
      // Close modal
      setShowLoanApplicationModal(false);
      setLoading(false);
      
      Alert.alert(
        'Application Submitted', 
        'Your loan application has been submitted and is pending approval. You will be notified when a decision is made.'
      );
    } catch (error) {
      console.error('Error submitting loan application:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to submit loan application. Please try again.');
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    updateLoanData();
  }, [loans]);

  // Handle scroll event for tabs shadow
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollOffset > 5); // Add shadow after scrolling 5px
  };

  // Render individual loan item
  const renderLoanItem = ({ item }: { item: Loan }) => {
    const dueDate = item.nextPaymentDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    const statusColor = item.status === 'Active' ? theme.primary :
                       item.status === 'Paid Off' ? theme.success :
                       item.status === 'Pending Approval' ? theme.warning : theme.error; // Use theme colors
    
    return (
      <TouchableOpacity 
        style={styles(theme).loanCard} // Pass theme to styles
        onPress={() => handleLoanSelect(item)}
        activeOpacity={0.8}
      >
        <View style={styles(theme).loanCardHeader}>
          <View style={styles(theme).loanTypeTag}>
            <Text style={styles(theme).loanTypeText}>{item.type}</Text>
          </View>
          <Text style={[styles(theme).loanStatus, { color: statusColor }]}>{item.status}</Text>
        </View>
        
        <Text style={styles(theme).loanName}>{item.name}</Text>
        
        <View style={styles(theme).loanDetailsRow}>
          <View style={styles(theme).loanDetailItem}>
            <Text style={styles(theme).loanDetailLabel}>Balance</Text>
            <Text style={styles(theme).loanDetailValue}>
              ${item.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={styles(theme).loanDetailItem}>
            <Text style={styles(theme).loanDetailLabel}>Monthly</Text>
            <Text style={styles(theme).loanDetailValue}>
              ${item.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={styles(theme).loanDetailItem}>
            <Text style={styles(theme).loanDetailLabel}>Next Due</Text>
            <Text style={styles(theme).loanDetailValue}>{dueDate}</Text>
          </View>
        </View>
        
        <View style={styles(theme).progressContainer}>
          <ProgressBar 
            progress={item.progress} 
            color={theme.primary} // Use theme color
            style={styles(theme).progressBar} 
          />
          <Text style={styles(theme).progressText}>{Math.round(item.progress * 100)}% Paid</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render individual offer item
  const renderOfferItem = ({ item }: { item: LoanOffer }) => {
    return (
      <TouchableOpacity 
        style={[styles(theme).offerCard, item.featured ? styles(theme).featuredOfferCard : {}]} // Pass theme
        onPress={() => handleOfferSelect(item)}
        activeOpacity={0.8}
      >
        {item.featured && (
          <View style={styles(theme).featuredTag}>
            <Text style={styles(theme).featuredTagText}>Featured</Text>
          </View>
        )}
        
        <View style={styles(theme).offerHeader}>
          <View style={styles(theme).loanTypeTag}>
            <Text style={styles(theme).loanTypeText}>{item.type}</Text>
          </View>
        </View>
        
        <Text style={styles(theme).offerName}>{item.name}</Text>
        <Text style={styles(theme).offerDescription}>{item.description}</Text>
        
        <View style={styles(theme).offerDetailsRow}>
          <View style={styles(theme).offerDetailItem}>
            <Text style={styles(theme).offerListDetailLabel}>Amount</Text>
            <Text style={styles(theme).offerDetailValue}>
              ${item.minAmount.toLocaleString()} - ${item.maxAmount.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles(theme).offerDetailItem}>
            <Text style={styles(theme).offerListDetailLabel}>Term</Text>
            <Text style={styles(theme).offerDetailValue}>
              {item.minTerm}-{item.maxTerm} months
            </Text>
          </View>
          
          <View style={styles(theme).offerDetailItem}>
            <Text style={styles(theme).offerListDetailLabel}>From</Text>
            <Text style={styles(theme).offerDetailValue}>{item.baseInterestRate}% APR</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles(theme).applyButton} // Pass theme
          onPress={() => {
            setSelectedOffer(item);
            setShowLoanApplicationModal(true);
          }}
        >
          <Text style={styles(theme).applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render loan category filter
  const renderLoanTypeFilter = () => (
    <View style={styles(theme).loanTypeFilterContainer}>
      {/* Animated scroll indicator for loan type scrolling */}
      {showTypeIndicator && (
        <View style={styles(theme).scrollIndicator}>
          <MaterialCommunityIcons name="gesture-swipe-horizontal" size={24} color={theme.primary} />
          <Text style={styles(theme).scrollIndicatorText}>Scroll to see all loan types</Text>
        </View>
      )}
      
      {/* Loan type filter scrollview */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        ref={loanTypeScrollViewRef}
        style={styles(theme).loanTypeScroll}
        onScrollBeginDrag={() => setShowTypeIndicator(false)}
      >
        <TouchableOpacity
          style={[
            styles(theme).loanTypeButton, 
            selectedLoanType === 'All' ? styles(theme).loanTypeButtonActive : {}
          ]}
          onPress={() => setSelectedLoanType('All')}
        >
          <Text 
            style={[
              styles(theme).loanTypeButtonText,
              selectedLoanType === 'All' ? styles(theme).loanTypeButtonTextActive : {}
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        {(['Personal', 'Mortgage', 'Auto', 'Student', 'Business', 'Credit Line'] as LoanType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles(theme).loanTypeButton, 
              selectedLoanType === type ? styles(theme).loanTypeButtonActive : {}
            ]}
            onPress={() => setSelectedLoanType(type)}
          >
            <Text 
              style={[
                styles(theme).loanTypeButtonText,
                selectedLoanType === type ? styles(theme).loanTypeButtonTextActive : {}
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render loan detail modal
  const renderLoanDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLoanModal}
      onRequestClose={() => setShowLoanModal(false)}
    >
      <SafeAreaView style={styles(theme).modalContainer}>
        <View style={styles(theme).modalContent}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Loan Details</Text>
            <TouchableOpacity onPress={() => setShowLoanModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {selectedLoan && (
            <ScrollView style={styles(theme).modalScrollContent}>
              <View style={styles(theme).loanHeaderSection}>
                <View style={styles(theme).loanTypeTag}>
                  <Text style={styles(theme).loanTypeText}>{selectedLoan.type}</Text>
                </View>
                <Text style={styles(theme).loanDetailName}>{selectedLoan.name}</Text>
                <Text style={styles(theme).loanDetailDescription}>{selectedLoan.description || 'No description available'}</Text>
              </View>
              
              <View style={styles(theme).loanProgressSection}>
                <Text style={styles(theme).sectionTitle}>Progress</Text>
                <ProgressBar 
                  progress={selectedLoan.progress} 
                  color={theme.primary} // Use theme color
                  style={styles(theme).progressBarLarge} 
                />
                <View style={styles(theme).progressStatsRow}>
                  <Text style={styles(theme).progressStat}>
                    ${selectedLoan.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} remaining
                  </Text>
                  <Text style={styles(theme).progressPercentage}>
                    {Math.round(selectedLoan.progress * 100)}% Complete
                  </Text>
                </View>
              </View>
              
              <View style={styles(theme).loanDetailsGrid}>
                <View style={styles(theme).loanDetailGridItem}>
                  <Text style={styles(theme).detailLabel}>Original Amount</Text>
                  <Text style={styles(theme).detailValue}>
                    ${selectedLoan.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                
                <View style={styles(theme).loanDetailGridItem}>
                  <Text style={styles(theme).detailLabel}>Interest Rate</Text>
                  <Text style={styles(theme).detailValue}>{selectedLoan.interestRate}% APR</Text>
                </View>
                
                <View style={styles(theme).loanDetailGridItem}>
                  <Text style={styles(theme).detailLabel}>Term</Text>
                  <Text style={styles(theme).detailValue}>{selectedLoan.term} months</Text>
                </View>
                
                <View style={styles(theme).loanDetailGridItem}>
                  <Text style={styles(theme).detailLabel}>Monthly Payment</Text>
                  <Text style={styles(theme).detailValue}>
                    ${selectedLoan.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                
                <View style={styles(theme).loanDetailGridItem}>
                  <Text style={styles(theme).detailLabel}>Start Date</Text>
                  <Text style={styles(theme).detailValue}>
                    {selectedLoan.startDate.toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles(theme).loanDetailGridItem}>
                  <Text style={styles(theme).detailLabel}>Next Payment</Text>
                  <Text style={styles(theme).detailValue}>
                    {selectedLoan.nextPaymentDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {selectedLoan.status === 'Active' && (
                <TouchableOpacity 
                  style={styles(theme).makePaymentButton} // Pass theme
                  onPress={() => {
                    setShowLoanModal(false);
                    setPaymentAmount(selectedLoan.monthlyPayment.toFixed(2));
                    setTimeout(() => setShowPaymentModal(true), 300);
                  }}
                >
                  <Text style={styles(theme).makePaymentButtonText}>Make a Payment</Text>
                </TouchableOpacity>
              )}
              
              {selectedLoan.paymentHistory && selectedLoan.paymentHistory.length > 0 && (
                <View style={styles(theme).paymentHistorySection}>
                  <Text style={styles(theme).sectionTitle}>Payment History</Text>
                  
                  {selectedLoan.paymentHistory
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map(payment => (
                      <View key={payment.id} style={styles(theme).paymentHistoryItem}>
                        <View style={styles(theme).paymentInfo}>
                          <Text style={styles(theme).paymentDate}>
                            {payment.date.toLocaleDateString()}
                          </Text>
                          <Text style={[styles(theme).paymentType, { color: payment.type === 'extra' ? theme.success : theme.primary }]}>
                            {payment.type === 'extra' ? 'Extra Payment' : 'Scheduled Payment'}
                          </Text>
                        </View>
                        <Text style={styles(theme).paymentAmount}>
                          ${payment.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Render loan offer detail modal
  const renderOfferDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showOfferModal}
      onRequestClose={() => setShowOfferModal(false)}
    >
      <SafeAreaView style={styles(theme).modalContainer}>
        <View style={styles(theme).modalContent}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Loan Offer Details</Text>
            <TouchableOpacity onPress={() => setShowOfferModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {selectedOffer && (
            <ScrollView style={styles(theme).modalScrollContent}>
              <View style={styles(theme).offerHeaderSection}>
                <View style={styles(theme).loanTypeTag}>
                  <Text style={styles(theme).loanTypeText}>{selectedOffer.type}</Text>
                </View>
                <Text style={styles(theme).offerDetailName}>{selectedOffer.name}</Text>
                <Text style={styles(theme).offerDetailDescription}>{selectedOffer.description}</Text>
              </View>
              
              <View style={styles(theme).offerDetailsSection}>
                <Text style={styles(theme).sectionTitle}>Loan Details</Text>
                
                <View style={styles(theme).offerDetailRow}>
                  <Text style={styles(theme).offerDetailLabel}>Amount Range:</Text>
                  <Text style={styles(theme).offerDetailInfo}>
                    ${selectedOffer.minAmount.toLocaleString()} - ${selectedOffer.maxAmount.toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles(theme).offerDetailRow}>
                  <Text style={styles(theme).offerDetailLabel}>Term Range:</Text>
                  <Text style={styles(theme).offerDetailInfo}>
                    {selectedOffer.minTerm} - {selectedOffer.maxTerm} months
                  </Text>
                </View>
                
                <View style={styles(theme).offerDetailRow}>
                  <Text style={styles(theme).offerDetailLabel}>Interest Rate:</Text>
                  <Text style={styles(theme).offerDetailInfo}>From {selectedOffer.baseInterestRate}% APR</Text>
                </View>
              </View>
              
              <View style={styles(theme).requirementsSection}>
                <Text style={styles(theme).sectionTitle}>Requirements</Text>
                {selectedOffer.requirements.map((req, index) => (
                  <View key={index} style={styles(theme).requirementItem}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary} />
                    <Text style={styles(theme).requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles(theme).applyNowButton} // Pass theme
                onPress={() => {
                  setShowOfferModal(false);
                  // Pre-fill with some reasonable defaults
                  setApplicationLoanAmount(selectedOffer.minAmount.toString());
                  setApplicationLoanTerm(selectedOffer.minTerm.toString());
                  setTimeout(() => setShowLoanApplicationModal(true), 300);
                }}
              >
                <Text style={styles(theme).applyNowButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Render payment modal
  const renderPaymentModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showPaymentModal}
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <SafeAreaView style={styles(theme).modalContainer}>
        <View style={styles(theme).modalContent}>
          <View style={styles(theme).modalHeader}>
            <Text style={styles(theme).modalTitle}>Make a Payment</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {selectedLoan && (
            <View style={styles(theme).paymentModalContent}>
              <Text style={styles(theme).paymentModalLoanName}>{selectedLoan.name}</Text>
              
              <View style={styles(theme).paymentInfoSection}>
                <View style={styles(theme).paymentInfoRow}>
                  <Text style={styles(theme).paymentInfoLabel}>Remaining Balance:</Text>
                  <Text style={styles(theme).paymentInfoValue}>
                    ${selectedLoan.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                
                <View style={styles(theme).paymentInfoRow}>
                  <Text style={styles(theme).paymentInfoLabel}>Monthly Payment:</Text>
                  <Text style={styles(theme).paymentInfoValue}>
                    ${selectedLoan.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                
                <View style={styles(theme).paymentInfoRow}>
                  <Text style={styles(theme).paymentInfoLabel}>Next Due Date:</Text>
                  <Text style={styles(theme).paymentInfoValue}>
                    {selectedLoan.nextPaymentDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles(theme).paymentAmountSection}>
                <Text style={styles(theme).paymentAmountLabel}>Payment Amount</Text>
                <View style={styles(theme).paymentInputContainer}>
                  <Text style={styles(theme).currencySymbol}>$</Text>
                  <TextInput
                    style={styles(theme).paymentInput}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.textSecondary} // Use textSecondary instead of muted
                  />
                </View>
              </View>
              
              <View style={styles(theme).quickAmountButtons}>
                <TouchableOpacity 
                  style={styles(theme).quickAmountButton}
                  onPress={() => setPaymentAmount(selectedLoan.monthlyPayment.toFixed(2))}
                >
                  <Text style={styles(theme).quickAmountButtonText}>Monthly Payment</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles(theme).quickAmountButton}
                  onPress={() => setPaymentAmount((selectedLoan.monthlyPayment * 2).toFixed(2))}
                >
                  <Text style={styles(theme).quickAmountButtonText}>Double Payment</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles(theme).quickAmountButton}
                  onPress={() => setPaymentAmount(selectedLoan.remainingBalance.toFixed(2))}
                >
                  <Text style={styles(theme).quickAmountButtonText}>Full Balance</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles(theme).submitPaymentButton} // Pass theme
                onPress={handlePaymentSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={'#FFFFFF'} /> // Use a fixed contrast color for button text
                ) : (
                  <Text style={styles(theme).submitPaymentButtonText}>Submit Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Render loan application modal
  const renderLoanApplicationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLoanApplicationModal}
      onRequestClose={() => setShowLoanApplicationModal(false)}
    >
      <SafeAreaView style={styles(theme).modalContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <Text style={styles(theme).modalTitle}>Loan Application</Text>
              <TouchableOpacity onPress={() => setShowLoanApplicationModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {selectedOffer && (
              <ScrollView style={styles(theme).modalScrollContent}>
                <View style={styles(theme).loanApplicationContent}>
                  <Text style={styles(theme).loanApplicationTitle}>{selectedOffer.name}</Text>
                  
                  <View style={styles(theme).loanAmountSection}>
                    <Text style={styles(theme).applicationSectionTitle}>Loan Amount</Text>
                    <Text style={styles(theme).applicationSectionSubtitle}>
                      ${selectedOffer.minAmount.toLocaleString()} - ${selectedOffer.maxAmount.toLocaleString()}
                    </Text>
                    
                    <View style={styles(theme).applicationInputContainer}>
                      <Text style={styles(theme).currencySymbol}>$</Text>
                      <TextInput
                        style={styles(theme).applicationInput}
                        value={applicationLoanAmount}
                        onChangeText={setApplicationLoanAmount}
                        placeholder="Enter loan amount"
                        keyboardType="decimal-pad"
                        placeholderTextColor={theme.textSecondary} // Use textSecondary instead of muted
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    </View>
                    
                    <Slider
                      style={styles(theme).slider}
                      minimumValue={selectedOffer.minAmount}
                      maximumValue={selectedOffer.maxAmount}
                      value={parseFloat(applicationLoanAmount) || selectedOffer.minAmount}
                      onValueChange={(value) => setApplicationLoanAmount(Math.round(value).toString())}
                      minimumTrackTintColor={theme.primary}
                      maximumTrackTintColor={theme.divider} // Use divider instead of border
                      thumbTintColor={theme.primary}
                      step={1000}
                    />
                    
                    <View style={styles(theme).sliderLabels}>
                      <Text style={styles(theme).sliderLabel}>${selectedOffer.minAmount.toLocaleString()}</Text>
                      <Text style={styles(theme).sliderLabel}>${selectedOffer.maxAmount.toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles(theme).loanTermSection}>
                    <Text style={styles(theme).applicationSectionTitle}>Loan Term</Text>
                    <Text style={styles(theme).applicationSectionSubtitle}>
                      {selectedOffer.minTerm} - {selectedOffer.maxTerm} months
                    </Text>
                    
                    <View style={styles(theme).applicationInputContainer}>
                      <TextInput
                        style={styles(theme).applicationInput}
                        value={applicationLoanTerm}
                        onChangeText={setApplicationLoanTerm}
                        placeholder="Enter term in months"
                        keyboardType="number-pad"
                        placeholderTextColor={theme.textSecondary} // Use textSecondary instead of muted
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                      <Text style={styles(theme).inputSuffix}>months</Text>
                    </View>
                    
                    <Slider
                      style={styles(theme).slider}
                      minimumValue={selectedOffer.minTerm}
                      maximumValue={selectedOffer.maxTerm}
                      value={parseInt(applicationLoanTerm) || selectedOffer.minTerm}
                      onValueChange={(value) => setApplicationLoanTerm(Math.round(value).toString())}
                      minimumTrackTintColor={theme.primary}
                      maximumTrackTintColor={theme.divider} // Use divider instead of border
                      thumbTintColor={theme.primary}
                      step={selectedOffer.maxTerm > 120 ? 12 : 6}
                    />
                    
                    <View style={styles(theme).sliderLabels}>
                      <Text style={styles(theme).sliderLabel}>{selectedOffer.minTerm} months</Text>
                      <Text style={styles(theme).sliderLabel}>{selectedOffer.maxTerm} months</Text>
                    </View>
                  </View>
                  
                  <View style={styles(theme).loanPurposeSection}>
                    <Text style={styles(theme).applicationSectionTitle}>Loan Purpose</Text>
                    <View>
                      <TextInput
                        style={styles(theme).textAreaInput}
                        value={applicationPurpose}
                        onChangeText={setApplicationPurpose}
                        placeholder="Please describe the purpose of this loan..."
                        placeholderTextColor={theme.textSecondary} // Use textSecondary instead of muted
                        multiline
                        numberOfLines={4}
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                      {Platform.OS === 'ios' && <KeyboardToolbar theme={theme} />} {/* Pass theme */}
                    </View>
                  </View>
                  
                  {parseFloat(applicationLoanAmount) > 0 && parseInt(applicationLoanTerm) > 0 && (
                    <View style={styles(theme).loanCalculationSection}>
                      <Text style={styles(theme).calculationTitle}>Your Personalized Loan</Text>
                      
                      <View style={styles(theme).calculationRow}>
                        <View style={styles(theme).calculationItem}>
                          <Text style={styles(theme).calculationLabel}>Monthly Payment</Text>
                          <Text style={styles(theme).calculationValue}>
                            ${calculatedMonthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                        
                        <View style={styles(theme).calculationItem}>
                          <Text style={styles(theme).calculationLabel}>Interest Rate</Text>
                          <Text style={styles(theme).calculationValue}>{calculatedInterestRate.toFixed(2)}% APR</Text>
                        </View>
                      </View>
                      
                      <View style={styles(theme).calculationRow}>
                        <View style={styles(theme).calculationItem}>
                          <Text style={styles(theme).calculationLabel}>Total Interest</Text>
                          <Text style={styles(theme).calculationValue}>
                            ${calculatedTotalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                        
                        <View style={styles(theme).calculationItem}>
                          <Text style={styles(theme).calculationLabel}>Total Payments</Text>
                          <Text style={styles(theme).calculationValue}>
                            ${(calculatedMonthlyPayment * parseInt(applicationLoanTerm)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Credit impact warning */}
                      <View style={styles(theme).creditImpactContainer}>
                        <MaterialCommunityIcons name="information-outline" size={20} color={theme.warning} />
                        <Text style={styles(theme).creditImpactText}>
                          This loan would increase your debt-to-income ratio to approximately {((creditProfile.totalDebt + parseFloat(applicationLoanAmount)) / (creditProfile.monthlyIncome * 12) * 100).toFixed(1)}%.
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles(theme).submitApplicationButton} // Pass theme
                    onPress={handleLoanApplicationSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={'#FFFFFF'} /> // Use a fixed contrast color for button text
                    ) : (
                      <Text style={styles(theme).submitApplicationButtonText}>Submit Application</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  // Render charts section
  const renderChartsSection = () => (
    <View style={styles(theme).chartsContainer}>
      {/* Debt Composition Chart */}
      {chartData.debtComposition.length > 0 && (
        <View style={styles(theme).chartCard}>
          <Text style={styles(theme).chartTitle}>Debt Composition</Text>
          <PieChart
            data={chartData.debtComposition}
            width={screenWidth - 40}
            height={180}
            chartConfig={chartConfig} // Use updated chartConfig
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}
      
      {/* Payment Timeline Chart */}
      {chartData.paymentTimeline.labels.length > 0 && (
        <View style={styles(theme).chartCard}>
          <Text style={styles(theme).chartTitle}>Upcoming Payments</Text>
          <LineChart
            data={chartData.paymentTimeline}
            width={screenWidth - 40}
            height={180}
            chartConfig={chartConfig} // Use updated chartConfig
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
            fromZero
          />
        </View>
      )}
    </View>
  );

  // Main component render
  return (
    <SafeAreaView style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <Text style={styles(theme).headerTitle}>My Loans</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles(theme).searchContainer}>
        <View style={styles(theme).searchBar}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles(theme).searchIcon} /> {/* Use textSecondary instead of muted */}
          <TextInput
            style={styles(theme).searchInput}
            placeholder="Search loans..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.textSecondary} // Use textSecondary instead of muted
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} /> {/* Use textSecondary instead of muted */}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Loan Type Filter */}
      {renderLoanTypeFilter()}
      
      {/* Tab Switcher */}
      <View style={[styles(theme).tabContainer, isScrolled && styles(theme).tabContainerShadow]}>
        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'loans' ? styles(theme).activeTab : {}]}
          onPress={() => setActiveTab('loans')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'loans' ? styles(theme).activeTabText : {}]}>
            Current Loans ({filteredLoans.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'offers' ? styles(theme).activeTab : {}]}
          onPress={() => setActiveTab('offers')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'offers' ? styles(theme).activeTabText : {}]}>
            Loan Offers ({filteredOffers.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      {loading ? (
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles(theme).loadingText}>Loading your loan information...</Text>
        </View>
      ) : (
        <FlatList<Loan | LoanOffer>
          data={activeTab === 'loans' ? filteredLoans : filteredOffers}
          renderItem={({ item }) => 
            activeTab === 'loans' 
              ? renderLoanItem({ item: item as Loan })
              : renderOfferItem({ item: item as LoanOffer })
          }
          keyExtractor={item => item.id}
          contentContainerStyle={styles(theme).listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={() => (
            <View style={styles(theme).emptyContainer}>
              <MaterialCommunityIcons 
                name={activeTab === 'loans' ? 'cash-remove' : 'text-box-remove'} 
                size={64} 
                color={theme.textSecondary} // Use textSecondary instead of muted
              />
              <Text style={styles(theme).emptyText}>
                {activeTab === 'loans' 
                  ? 'No loans found. Apply for a loan to get started!' 
                  : 'No loan offers available for the selected type.'}
              </Text>
            </View>
          )}
          ListHeaderComponent={activeTab === 'loans' ? renderChartsSection : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}
      
      {/* Quick Action Button */}
      <TouchableOpacity 
        style={styles(theme).actionButton} // Pass theme
        onPress={() => {
          if (loanOffers.length > 0) {
            setSelectedOffer(loanOffers[0]);
            setShowLoanApplicationModal(true);
          }
        }}
      >
        <Ionicons name="add" size={24} color={'#FFFFFF'} /> {/* Use a fixed contrast color for button text */}
        <Text style={styles(theme).actionButtonText}>Apply for a Loan</Text>
      </TouchableOpacity>
      
      {/* Modals */}
      {renderLoanDetailModal()}
      {renderOfferDetailModal()}
      {renderPaymentModal()}
      {renderLoanApplicationModal()}
    </SafeAreaView>
  );
};

// Add this function in your component before the return statement

// Add a keyboard toolbar specifically for iOS multiline text inputs
const KeyboardToolbar = ({ theme }: { theme: any }) => { // Accept theme as prop
  if (Platform.OS !== 'ios') return null;
  
  return (
    <TouchableOpacity 
      style={styles(theme).keyboardToolbar} // Pass theme
      onPress={() => Keyboard.dismiss()}
    >
      <Text style={styles(theme).keyboardToolbarText}>Done</Text>
    </TouchableOpacity>
  );
};

// Styles - Convert to a function that accepts theme
const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, // Use theme color
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 8,
    backgroundColor: theme.background, // Use theme color
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text, // Use theme color
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.background, // Use theme color
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: theme.card, // Use theme color
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text, // Use theme color
    paddingLeft: 4
  },
  loanTypeFilterContainer: {
    backgroundColor: theme.background, // Use theme color
    paddingVertical: 4,
    paddingHorizontal: 0
  },
  loanTypeScroll: {
    paddingHorizontal: 16
  },
  loanTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.card, // Use theme color
  },
  loanTypeButtonActive: {
    backgroundColor: theme.primary, // Use theme color
  },
  loanTypeButtonText: {
    color: theme.primary, // Use theme color
    fontWeight: '500'
  },
  loanTypeButtonTextActive: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: theme.background, // Use theme color with opacity
  },
  scrollIndicatorText: {
    marginLeft: 8,
    color: theme.primary, // Use theme color
    fontWeight: '500'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.background, // Use theme color
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  tabContainerShadow: {
    shadowColor: theme.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4
  },
  activeTab: {
    backgroundColor: theme.primary, // Use theme color
  },
  tabText: {
    fontWeight: '500',
    color: theme.textSecondary, // Use textSecondary instead of muted
  },
  activeTabText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background, // Use theme color
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary, // Use textSecondary instead of muted
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80 // Space for the action button
  },
  loanCard: {
    backgroundColor: theme.card, // Use theme color
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  loanTypeTag: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    borderRadius: 4
  },
  loanTypeText: {
    color: theme.primary, // Use theme color
    fontWeight: '500',
    fontSize: 12
  },
  loanStatus: {
    fontWeight: '500',
    fontSize: 12
    // Color set dynamically
  },
  loanName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.text, // Use theme color
  },
  loanDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  loanDetailItem: {
    flex: 1
  },
  loanDetailLabel: {
    fontSize: 12,
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginBottom: 2
  },
  loanDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text, // Use theme color
  },
  progressContainer: {
    marginTop: 4
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.divider, // Use divider instead of border
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginTop: 4,
    textAlign: 'right'
  },
  offerCard: {
    backgroundColor: theme.card, // Use theme color
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  featuredOfferCard: {
    backgroundColor: theme.card, // Or a slightly different shade if needed
  },
  featuredTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.primary, // Use theme color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  featuredTagText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
    fontWeight: '500',
    fontSize: 10
  },
  offerHeader: {
    marginBottom: 8
  },
  offerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.text, // Use theme color
  },
  offerDescription: {
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
    lineHeight: 20,
    marginBottom: 12
  },
  offerDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  offerDetailItem: {
    width: '48%',
    marginBottom: 8
  },
  offerListDetailLabel: { // Renamed from offerDetailLabel in modal
    fontSize: 12, // Adjusted size
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginBottom: 2, // Added margin
  },
  offerDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text, // Use theme color
  },
  applyButton: {
    backgroundColor: theme.primary, // Use theme color
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  applyButtonText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
    fontWeight: '600',
    fontSize: 16
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary, // Use textSecondary instead of muted
    textAlign: 'center'
  },
  chartsContainer: {
    marginBottom: 16
  },
  chartCard: {
    backgroundColor: theme.background, // Use theme color
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text, // Use theme color
  },
  actionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: theme.primary, // Use theme color
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5
  },
  actionButtonText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
    fontWeight: '600',
    marginLeft: 8
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.overlay, // Use overlay instead of modalBackdrop
  },
  modalContent: {
    flex: 1,
    backgroundColor: theme.background, // Use theme color
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider, // Use divider instead of border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text, // Use theme color
  },
  modalScrollContent: {
    padding: 16
  },
  loanHeaderSection: {
    marginBottom: 20
  },
  loanDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
    color: theme.text, // Use theme color
  },
  loanDetailDescription: {
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
    lineHeight: 20
  },
  loanProgressSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text, // Use theme color
  },
  progressBarLarge: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.divider, // Use divider instead of border
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  progressStat: {
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary, // Use theme color
  },
  loanDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  loanDetailGridItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 12
  },
  detailLabel: {
    fontSize: 12,
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginBottom: 4
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text, // Use theme color
  },
  makePaymentButton: {
    backgroundColor: theme.primary, // Use theme color
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  makePaymentButtonText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
    fontWeight: '600',
    fontSize: 16
  },
  paymentHistorySection: {
    marginBottom: 20
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider, // Use divider instead of border
  },
  paymentInfo: {
    flex: 1
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text, // Use theme color
    marginBottom: 2
  },
  paymentType: {
    fontSize: 12,
    // Color set dynamically
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text, // Use theme color
  },
  offerHeaderSection: {
    marginBottom: 20
  },
  offerDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
    color: theme.text, // Use theme color
  },
  offerDetailDescription: {
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
    lineHeight: 20
  },
  offerDetailsSection: {
    marginBottom: 20
  },
  offerDetailRow: {
    flexDirection: 'row',
    paddingVertical: 8
  },
  offerDetailLabel: { // Used in modal
    width: 120,
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
  },
  offerDetailInfo: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.text, // Use theme color
  },
  requirementsSection: {
    marginBottom: 20
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: theme.text, // Use theme color
    marginLeft: 8,
    lineHeight: 20
  },
  applyNowButton: {
    backgroundColor: theme.primary, // Use theme color
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  applyNowButtonText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
    fontWeight: '600',
    fontSize: 16
  },
  paymentModalContent: {
    padding: 16
  },
  paymentModalLoanName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.text, // Use theme color
    textAlign: 'center'
  },
  paymentInfoSection: {
    backgroundColor: theme.card, // Use theme color
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text, // Use theme color
  },
  paymentAmountSection: {
    marginBottom: 20
  },
  paymentAmountLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text, // Use theme color
  },
  paymentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.divider, // Use divider instead of border
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.background, // Use theme color
  },
  currencySymbol: {
    fontSize: 18,
    color: theme.text, // Use theme color
    marginRight: 4
  },
  paymentInput: {
    flex: 1,
    fontSize: 24,
    paddingVertical: 12,
    color: theme.text, // Use theme color
  },
  quickAmountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: theme.card, // Use theme color
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4
  },
  quickAmountButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text, // Use theme color
  },
  submitPaymentButton: {
    backgroundColor: theme.primary, // Use theme color
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.shadow, // Use theme color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  submitPaymentButtonText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
    fontWeight: '600',
    fontSize: 16
  },
  loanApplicationContent: {
    padding: 16
  },
  loanApplicationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.text, // Use theme color
    textAlign: 'center'
  },
  applicationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.text, // Use theme color
  },
  applicationSectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginBottom: 12
  },
  loanAmountSection: {
    marginBottom: 24
  },
  loanTermSection: {
    marginBottom: 24
  },
  loanPurposeSection: {
    marginBottom: 24
  },
  applicationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card, // Use theme color
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  applicationInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: theme.text, // Use theme color
  },
  inputSuffix: {
    fontSize: 16,
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginLeft: 4
  },
  textAreaInput: {
    backgroundColor: theme.card, // Use theme color
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text, // Use theme color
    textAlignVertical: 'top',
    minHeight: 100,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sliderLabel: {
    fontSize: 12,
    color: theme.textSecondary, // Use textSecondary instead of muted
  },
  loanCalculationSection: {
    backgroundColor: theme.card, // Use theme color
    padding: 16,
    borderRadius: 8,
    marginBottom: 24
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text, // Use theme color
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  calculationItem: {
    width: '48%'
  },
  calculationLabel: {
    fontSize: 12,
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginBottom: 4
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text, // Use theme color
  },
  creditImpactContainer: {
    flexDirection: 'row',
    backgroundColor: theme.warningBackground, // Use theme color
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'flex-start'
  },
  creditImpactText: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary, // Use textSecondary instead of muted
    marginLeft: 8,
    lineHeight: 20
  },
  submitApplicationButton: {
    backgroundColor: theme.primary, // Use theme color
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  submitApplicationButtonText: {
    color: '#FFFFFF', // Use a fixed contrast color for button text
    fontWeight: '600',
    fontSize: 16
  },
  keyboardToolbar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: theme.card, // Use theme color
    borderRadius: 8,
    margin: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  keyboardToolbarText: {
    color: theme.primary, // Use theme color
    fontWeight: '600',
  },
});

export default LoansScreen;