'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, Baby, Home, GraduationCap, Heart } from 'lucide-react'

const events = {
  newJob: {
    icon: Briefcase,
    color: 'text-blue-500',
    progress: 30,
    tasks: [
      "Review and adjust your budget",
      "Set up direct deposit for your new paycheck",
      "Evaluate new retirement plan options"
    ]
  },
  newBaby: {
    icon: Baby,
    color: 'text-pink-500',
    progress: 0,
    tasks: [
      "Create a baby expenses budget",
      "Research parental leave benefits",
      "Start a college savings fund"
    ]
  },
  buyingHome: {
    icon: Home,
    color: 'text-green-500',
    progress: 60,
    tasks: [
      "Save for down payment",
      "Check your credit score",
      "Research mortgage options"
    ]
  },
  graduation: {
    icon: GraduationCap,
    color: 'text-purple-500',
    progress: 80,
    tasks: [
      "Create a student loan repayment plan",
      "Build an emergency fund",
      "Start retirement savings"
    ]
  },
  marriage: {
    icon: Heart,
    color: 'text-red-500',
    progress: 45,
    tasks: [
      "Create a joint budget",
      "Discuss financial goals",
      "Plan wedding expenses"
    ]
  }
}

export default function LifeEventSupport() {
  const [selectedEvent, setSelectedEvent] = useState('newJob')

  const EventIcon = events[selectedEvent].icon

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Life Event</CardTitle>
          <CardDescription>Get personalized financial guidance</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a life event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newJob">Starting a New Job</SelectItem>
              <SelectItem value="newBaby">Having a Baby</SelectItem>
              <SelectItem value="buyingHome">Buying a Home</SelectItem>
              <SelectItem value="graduation">Graduation</SelectItem>
              <SelectItem value="marriage">Getting Married</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <EventIcon className={`h-6 w-6 ${events[selectedEvent].color}`} />
            <CardTitle>
              {selectedEvent === 'newJob' ? 'Starting a New Job' :
               selectedEvent === 'newBaby' ? 'Having a Baby' :
               selectedEvent === 'buyingHome' ? 'Buying a Home' :
               selectedEvent === 'graduation' ? 'Graduation' :
               'Getting Married'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Preparation Progress</span>
                <span className="text-sm font-medium">{events[selectedEvent].progress}%</span>
              </div>
              <Progress value={events[selectedEvent].progress} className="h-2" />
            </div>
            <p className="text-sm">
              {selectedEvent === 'newJob' ? "Congratulations on your new job! Let's ensure your finances are ready for this transition." :
               selectedEvent === 'newBaby' ? "Preparing for a new addition to your family is exciting. We're here to help you plan financially." :
               selectedEvent === 'buyingHome' ? "Buying a home is a big step. We'll guide you through the financial aspects of homeownership." :
               selectedEvent === 'graduation' ? "As you embark on your post-graduation journey, we'll help you start your financial life on the right foot." :
               "Planning a wedding is joyous but can be costly. We'll help you budget for your big day and beyond."}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Financial To-Do List</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {events[selectedEvent].tasks.map((task, index) => (
              <li key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`task${index}`}
                  className="rounded text-[#006a4d] focus:ring-[#006a4d]"
                />
                <label htmlFor={`task${index}`} className="text-sm">{task}</label>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Button className="w-full bg-[#006a4d] hover:bg-[#005a3d]">Get Personalized Advice</Button>
    </>
  )
}

