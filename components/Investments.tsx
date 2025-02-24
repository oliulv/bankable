'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts'
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, PieChartIcon, BarChartIcon } from 'lucide-react'

const lineChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
]

const barChartData = [
  { name: 'Stocks', value: 4000 },
  { name: 'Bonds', value: 3000 },
  { name: 'Real Estate', value: 2000 },
  { name: 'Commodities', value: 1000 },
  { name: 'Crypto', value: 500 },
]

const pieChartData = [
  { name: 'Technology', value: 400 },
  { name: 'Healthcare', value: 300 },
  { name: 'Finance', value: 200 },
  { name: 'Consumer Goods', value: 100 },
]

const stockData = [
  { date: '2023-01-01', price: 50, volume: 1000000 },
  { date: '2023-01-02', price: 52, volume: 1200000 },
  { date: '2023-01-03', price: 55, volume: 1500000 },
  { date: '2023-01-04', price: 53, volume: 1100000 },
  { date: '2023-01-05', price: 54, volume: 1300000 },
  { date: '2023-01-06', price: 57, volume: 1600000 },
  { date: '2023-01-07', price: 56, volume: 1400000 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Investments() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedStock, setSelectedStock] = useState('AAPL')

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-black dark:text-white">Investment Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$127,892.63</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                7.2%
              </span>
              {' '}vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$12,345.67</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-red-500 inline-flex items-center">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                2.5%
              </span>
              {' '}vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-2 bg-muted p-1 rounded-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="mr-2" />
                Portfolio Overview
              </CardTitle>
              <CardDescription>Your investment portfolio at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2" />
                Performance Trends
              </CardTitle>
              <CardDescription>Your investment performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2" />
                Asset Allocation
              </CardTitle>
              <CardDescription>Your current investment allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Top Performing Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Technology ETF</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                12.8%
              </span>
              {' '}YTD Return
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Dividend Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">3.2%</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                0.5%
              </span>
              {' '}vs last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              { type: 'Buy', asset: 'AAPL', amount: 500, shares: 3 },
              { type: 'Sell', asset: 'GOOGL', amount: 750, shares: 1 },
              { type: 'Dividend', asset: 'VTI', amount: 25, shares: null },
            ].map((transaction, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span className={`inline-flex items-center ${transaction.type === 'Buy' ? 'text-green-500' : transaction.type === 'Sell' ? 'text-red-500' : 'text-blue-500'}`}>
                  <DollarSign className="h-4 w-4 mr-1" />
                  {transaction.type} {transaction.asset}
                </span>
                <span>
                  ${transaction.amount.toFixed(2)}
                  {transaction.shares && ` (${transaction.shares} shares)`}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Performance</CardTitle>
          <CardDescription>Click on a stock to view its performance chart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {['AAPL', 'GOOGL', 'MSFT', 'AMZN'].map((stock) => (
              <Button
                key={stock}
                variant={selectedStock === stock ? 'default' : 'outline'}
                onClick={() => setSelectedStock(stock)}
              >
                {stock}
              </Button>
            ))}
          </div>
          {selectedStock && (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stockData}>
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Area type="monotone" dataKey="price" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={stockData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

