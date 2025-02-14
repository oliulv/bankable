'use client'

import React, { createContext, useState, useContext } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface FinancialContextType {
  monthlyNetIncome: number;
  monthlyEssentialExpenses: number;
  setMonthlyNetIncome: (value: number) => void;
  setMonthlyEssentialExpenses: (value: number) => void;
}

const FinancialContext = createContext<FinancialContextType>({
  monthlyNetIncome: 0,
  monthlyEssentialExpenses: 0,
  setMonthlyNetIncome: () => {},
  setMonthlyEssentialExpenses: () => {}
});

export const useFinancialContext = () => useContext(FinancialContext);

export function FinancialHealthCalculatorProvider({ children }: { children: React.ReactNode }) {
  const [monthlyNetIncome, setMonthlyNetIncome] = useState(0);
  const [monthlyEssentialExpenses, setMonthlyEssentialExpenses] = useState(0);

  return (
    <FinancialContext.Provider value={{ monthlyNetIncome, monthlyEssentialExpenses, setMonthlyNetIncome, setMonthlyEssentialExpenses }}>
      {children}
    </FinancialContext.Provider>
  );
}

interface FormData {
  income: {
    monthlyGrossIncome: number;
    monthlyNetIncome: number;
    employmentType: string;
    jobStability: number;
  };
  debt: {
    totalDebt: number;
    monthlyDebtPayment: number;
    creditUtilization: number;
    creditScore: number;
  };
  expenses: {
    monthlyEssentialExpenses: number;
    monthlyDiscretionary: number;
    monthlySubscriptions: number;
  };
  savings: {
    totalSavings: number;
    monthlySavings: number;
    liquidAssets: number;
    investmentValue: number;
  };
  risk: {
    overdraftFrequency: number;
    debtToIncome: number;
    financialCushion: number;
  };
  goals: {
    financialGoals: string;
    riskTolerance: string;
  };
}

const initialFormData: FormData = {
  income: { monthlyGrossIncome: 0, monthlyNetIncome: 0, employmentType: '', jobStability: 0 },
  debt: { totalDebt: 0, monthlyDebtPayment: 0, creditUtilization: 0, creditScore: 0 },
  expenses: { monthlyEssentialExpenses: 0, monthlyDiscretionary: 0, monthlySubscriptions: 0 },
  savings: { totalSavings: 0, monthlySavings: 0, liquidAssets: 0, investmentValue: 0 },
  risk: { overdraftFrequency: 0, debtToIncome: 0, financialCushion: 0 },
  goals: { financialGoals: '', riskTolerance: 'medium' }
};

interface FinancialHealthCalculatorProps {
  onBack: () => void;
  setCurrentPage: (page: string) => void;
}

export default function FinancialHealthCalculator({ onBack, setCurrentPage }: FinancialHealthCalculatorProps) {
  const { setMonthlyNetIncome, setMonthlyEssentialExpenses } = useFinancialContext();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeCategory, setActiveCategory] = useState<keyof FormData>('income');
  const [result, setResult] = useState<null | {
    financialScore: string;
    category: string;
    recommendations: string[];
  }>(null);

  const handleInputChange = (category: keyof FormData, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const calculateScores = () => {
    setMonthlyNetIncome(formData.income.monthlyNetIncome);
    setMonthlyEssentialExpenses(formData.expenses.monthlyEssentialExpenses);

    const financialScore = Math.random() * 100;
    const category = financialScore > 50 ? "Healthy" : "Needs Improvement";

    setResult({
      financialScore: financialScore.toFixed(2),
      category,
      recommendations: financialScore > 50 ? ["Keep up the good work!"] : ["Consider budgeting improvements."]
    });
  };

  const renderInputFields = (category: keyof FormData) => {
    return Object.entries(formData[category]).map(([field, value]) => (
      <div key={field} className="space-y-2">
        <Label htmlFor={field} className="block text-sm font-medium">
          {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </Label>
        {field === 'employmentType' || field === 'riskTolerance' ? (
          <Select
            value={value as string}
            onValueChange={(newValue) => handleInputChange(category, field, newValue)}
          >
            <SelectTrigger id={field} className="w-full">
              <SelectValue placeholder={`Select ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field === 'employmentType' ? (
                <>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={field}
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(category, field, e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full"
          />
        )}
      </div>
    ));
  };

  const categories = Object.keys(formData) as Array<keyof FormData>;
  const currentIndex = categories.indexOf(activeCategory);

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="hover:bg-[#006a4d] hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h2 className="text-3xl font-bold text-center">Financial Health Calculator</h2>
      </div>

      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-center">{activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}</CardTitle>
          <CardDescription className="text-center">Provide your {activeCategory} details below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderInputFields(activeCategory)}
        </CardContent>
      </Card>

      <div className="flex justify-center mt-8 gap-4">
        <Button
          variant="outline"
          onClick={() => {
            if (currentIndex > 0) {
              setActiveCategory(categories[currentIndex - 1]);
            }
          }}
          disabled={currentIndex === 0}
          className="py-4 px-6 text-base font-medium disabled:opacity-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        
        {currentIndex < categories.length - 1 ? (
          <Button
            onClick={() => {
              setActiveCategory(categories[currentIndex + 1]);
            }}
            className="bg-[#006a4d] hover:bg-[#005a3d] text-white py-4 px-6 text-base font-medium"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={calculateScores}
            className="bg-[#006a4d] hover:bg-[#005a3d] text-white py-4 px-6 text-base font-medium"
          >
            Calculate FHS
          </Button>
        )}
      </div>

      {result && (
        <div className="mt-12 space-y-6">
          <h3 className="text-2xl font-bold text-center">Financial Health Results</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Financial Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={parseFloat(result.financialScore)} className="h-4 rounded" />
              <p className="mt-2 text-sm text-center">{result.financialScore} out of 100</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Category: {result.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">{result.category === "Healthy" ? "Your financial health is in good shape!" : "There's room for improvement in your financial health."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="text-center list-none">{rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setResult(null)}>
              Back to Calculator
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

