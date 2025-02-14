"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Send, Receipt } from "lucide-react"
import FinancialHealthCalculator, { FinancialHealthCalculatorProvider } from "./FinancialHealthCalculator"

interface HomeProps {
  setCurrentPage: (page: string) => void
}

export default function Home({ setCurrentPage }: HomeProps) {
  const [showCalculator, setShowCalculator] = useState(false)

  if (showCalculator) {
    return (
      <FinancialHealthCalculatorProvider>
        <FinancialHealthCalculator onBack={() => setShowCalculator(false)} setCurrentPage={setCurrentPage} />
      </FinancialHealthCalculatorProvider>
    )
  }

  return (
    <>
      <div className="h-[750px] overflow-y-auto p-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Your financial summary at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£10,542.67</p>
            <p className="text-sm text-gray-500">Total Balance</p>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <Button
                  variant="outline"
                  className="p-2 h-auto text-sm font-medium hover:bg-[#006a4d] hover:text-white transition-colors"
                  onClick={() => setShowCalculator(true)}
                >
                  Financial Health Score
                </Button>
                <span className="text-sm font-medium">78/100</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Daily Affirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center italic">
              "Your financial choices today shape your tomorrow. You're on the right path!"
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button className="h-20 flex flex-col items-center justify-center bg-white text-[#006a4d] hover:bg-gray-100">
            <Send className="h-6 w-6 mb-2" />
            Transfer
          </Button>
          <Button className="h-20 flex flex-col items-center justify-center bg-white text-[#006a4d] hover:bg-gray-100">
            <Receipt className="h-6 w-6 mb-2" />
            Pay Bills
          </Button>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Tomorrow Tracker</CardTitle>
            <CardDescription>Emergency fund progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Current: £1,500</span>
              <span className="text-sm font-medium">Goal: £3,000</span>
            </div>
            <Progress value={50} className="h-2 mb-2" />
            <p className="text-sm">You're halfway there! Consider saving an extra £50 this month.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <span>Grocery Store</span>
                <span className="font-semibold">-£45.67</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Salary Deposit</span>
                <span className="font-semibold text-green-600">+£2,500.00</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Electric Bill</span>
                <span className="font-semibold">-£78.90</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

