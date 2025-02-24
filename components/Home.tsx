"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { MoreVertical, Utensils, ShoppingCart, TreePalmIcon as PalmTree } from "lucide-react"
import BankCard from "./BankCard"

interface Widget {
  id: string
  type: string
  title: string
}

const bankAccounts = [
  { type: "Classic", accountNumber: "12-34-56 / 12345678", balance: 100.0 },
  { type: "Savings", accountNumber: "12-34-56 / 87654321", balance: 5000.0 },
  { type: "Joint", accountNumber: "12-34-56 / 11223344", balance: 2500.0 },
]

const transactions = [
  { id: 1, name: "McDonald's", date: "20/02/2025", amount: 8.98, icon: Utensils },
  { id: 2, name: "Tesco", date: "11/02/2025", amount: 12.5, icon: ShoppingCart },
]

export default function Home() {
  const [currentBankIndex, setCurrentBankIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "recent-transactions", type: "recent-transactions", title: "Recent Transactions" },
    { id: "daily-affirmation", type: "daily-affirmation", title: "Daily Affirmation" },
    { id: "group-saving-goals", type: "group-saving-goals", title: "Group Saving Goals" },
    { id: "quick-actions", type: "quick-actions", title: "Quick Actions" },
  ])
  const longPressTimer = useRef<NodeJS.Timeout>()
  const [touchStart, setTouchStart] = useState<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchEnd = e.touches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentBankIndex < bankAccounts.length - 1) {
        setCurrentBankIndex(currentBankIndex + 1)
      } else if (diff < 0 && currentBankIndex > 0) {
        setCurrentBankIndex(currentBankIndex - 1)
      }
      setTouchStart(touchEnd)
    }
  }

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      setIsEditMode(true)
    }, 500)
  }

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id))
  }

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "recent-transactions":
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <MoreVertical className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between bg-[#FFF8DC] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#98FB98] p-2 rounded-lg">
                        <transaction.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{transaction.name}</div>
                        <div className="text-sm text-muted-foreground">{transaction.date}</div>
                      </div>
                    </div>
                    <div className="font-semibold">£{transaction.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      case "group-saving-goals":
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Group Saving Goals</CardTitle>
              <MoreVertical className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-[#FFF8DC] p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-[#98FB98] p-2 rounded-lg">
                      <PalmTree className="h-5 w-5" />
                    </div>
                    <div className="font-medium">Traveling</div>
                  </div>
                  <Progress value={68} className="h-2" />
                  <div className="text-right text-sm mt-1">68%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      // Add other widget cases as needed
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm text-muted-foreground">Hello,</div>
            <div className="text-xl font-bold">Chelsea</div>
          </div>
        </div>
      </div>

      <div className="relative h-48" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
        {bankAccounts.map((account, index) => (
          <AnimatePresence key={account.type}>
            {index === currentBankIndex && (
              <BankCard
                type={account.type}
                accountNumber={account.accountNumber}
                balance={account.balance}
                index={index}
                total={bankAccounts.length}
              />
            )}
          </AnimatePresence>
        ))}
      </div>

      <div className="space-y-4">
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            onTouchStart={startLongPress}
            onTouchEnd={endLongPress}
            onTouchCancel={endLongPress}
            animate={isEditMode ? { x: 0, scale: 0.95 } : { x: 0, scale: 1 }}
            className="relative"
          >
            {isEditMode && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 z-10 rounded-full"
                onClick={() => removeWidget(widget.id)}
              >
                -
              </Button>
            )}
            {renderWidget(widget)}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

