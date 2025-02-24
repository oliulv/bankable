'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from 'lucide-react'
import { FinancialHealthCalculatorProvider, useFinancialContext } from './FinancialHealthCalculator'

function FinancialHealthCoachContent() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI Financial Health Coach. How can I assist you with your finances today? For example, you can ask, "Can I afford a car worth $20,000?"' }
  ]);
  const [input, setInput] = useState('');
  const { monthlyNetIncome, monthlyEssentialExpenses } = useFinancialContext();

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);

      // Match affordability-related questions
      const purchaseMatch = input.match(/afford (.+) worth \$?(\d+)/i);

      setTimeout(() => {
        if (purchaseMatch) {
          const item = purchaseMatch[1];
          const cost = parseFloat(purchaseMatch[2]);
          const disposableIncome = monthlyNetIncome - monthlyEssentialExpenses;

          if (disposableIncome > cost) {
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `Yes, you can afford the ${item} worth $${cost} because you have $${disposableIncome.toFixed(2)} disposable income after expenses each month.` }
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `No, you cannot afford the ${item} worth $${cost} because you only have $${disposableIncome.toFixed(2)} disposable income after expenses each month.` }
            ]);
          }
        } else {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: `I'm not sure how to help with that. Please ask if you can afford something or provide more details.` }
          ]);
        }
      }, 1000);

      setInput('');
    }
  };

  return (
    <Card className="flex-1 w-full max-w-3xl mx-auto dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-black dark:text-white">Chat with Your AI Coach</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">Get personalized financial advice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[500px] w-full pr-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              {message.role === 'assistant' && (
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png"
                  alt="Assistant Profile Picture"
                  className="h-8 w-8 rounded-full mr-2 dark:invert"
                />
              )}
              <div className={`rounded-lg p-2 max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-[#006a4d] text-white dark:bg-[#00a86b]' 
                  : 'bg-gray-200 text-black dark:bg-gray-700 dark:text-white'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex space-x-2">
          <Input
            placeholder="Ask your financial question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <Button onClick={handleSend} className="dark:bg-[#006a4d] dark:text-white">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinancialHealthCoach() {
  return (
    <FinancialHealthCalculatorProvider>
      <FinancialHealthCoachContent />
    </FinancialHealthCalculatorProvider>
  );
}

