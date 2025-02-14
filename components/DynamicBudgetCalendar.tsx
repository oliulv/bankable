'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, ArrowRight, PlusCircle } from 'lucide-react'

export default function DynamicBudgetCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {date?.toLocaleString("default", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setDate((prev) => prev && new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setDate((prev) => prev && new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Your spending for {date?.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Daily Budget</span>
                <span className="text-sm font-medium">£50 / £100</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
            {/* Add transaction list here */}
          </div>
        </CardContent>
      </Card>
      <Button className="w-full bg-[#006a4d] hover:bg-[#005a3d]">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New Transaction
      </Button>
    </>
  )
}

