'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Bar, BarChart, Line, LineChart } from 'recharts'

export default function EcoFinancialImpact() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Eco-Score</CardTitle>
          <CardDescription>Environmental impact of your spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-4xl font-bold text-[#006a4d]">72</span>
            <span className="text-sm text-gray-500">out of 100</span>
          </div>
          <Progress value={72} className="h-2 mb-2" />
          <p className="text-sm">Your spending habits are more eco-friendly than 65% of our users.</p>
        </CardContent>
      </Card>
      <Tabs defaultValue="impact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Footprint</CardTitle>
              <CardDescription>Based on your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={[
                  { category: 'Transport', amount: 250 },
                  { category: 'Food', amount: 180 },
                  { category: 'Energy', amount: 120 },
                  { category: 'Shopping', amount: 90 },
                  { category: 'Services', amount: 60 },
                ]}
                width={300}
                height={200}
              >
                <Bar dataKey="amount" fill="#006a4d" />
              </BarChart>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Transport</span>
                  <span className="text-sm font-medium text-red-500 flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    15% above average
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Food</span>
                  <span className="text-sm font-medium text-green-500 flex items-center">
                    <ArrowRight className="w-4 h-4 mr-1" />
                    10% below average
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Eco-Impact Over Time</CardTitle>
              <CardDescription>See how your choices affect the environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                {['1W', '1M', '3M', '6M', '1Y'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
              <LineChart
                data={[
                  { month: 'Jan', score: 65 },
                  { month: 'Feb', score: 68 },
                  { month: 'Mar', score: 70 },
                  { month: 'Apr', score: 69 },
                  { month: 'May', score: 72 },
                  { month: 'Jun', score: 72 },
                ]}
                width={300}
                height={200}
              >
                <Line type="monotone" dataKey="score" stroke="#006a4d" />
              </LineChart>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Eco-Friendly Tips</CardTitle>
          <CardDescription>Improve your impact and save money</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Switch to a renewable energy provider to reduce your carbon footprint and potentially save on bills.</li>
            <li>Consider using public transport or cycling for short trips to cut down on transport emissions.</li>
            <li>Opt for locally sourced food to reduce the carbon footprint of your meals.</li>
            <li>Invest in energy-efficient appliances to lower your energy consumption and bills.</li>
          </ul>
          <Button className="mt-4 w-full bg-[#006a4d] hover:bg-[#005a3d]">Get More Eco-Tips</Button>
        </CardContent>
      </Card>
    </>
  )
}

