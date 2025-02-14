'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smile, Meh, Frown, Heart } from 'lucide-react'

export default function MentalHealthAssistant() {
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('neutral')

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Financial Well-being</CardTitle>
          <CardDescription>How your finances affect your mental health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Stress Level</span>
                <span className="text-sm font-medium">Moderate</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <p className="text-sm">Your financial stress level is moderate. Let's work on reducing it.</p>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={mood === 'happy' ? 'default' : 'outline'}
              className="flex flex-col items-center justify-center h-24 p-2"
              onClick={() => setMood('happy')}
            >
              <Smile className="h-8 w-8 mb-1" />
              <span className="text-sm">Happy</span>
            </Button>
            <Button
              variant={mood === 'neutral' ? 'default' : 'outline'}
              className="flex flex-col items-center justify-center h-24 p-2"
              onClick={() => setMood('neutral')}
            >
              <Meh className="h-8 w-8 mb-1" />
              <span className="text-sm">Neutral</span>
            </Button>
            <Button
              variant={mood === 'sad' ? 'default' : 'outline'}
              className="flex flex-col items-center justify-center h-24 p-2"
              onClick={() => setMood('sad')}
            >
              <Frown className="h-8 w-8 mb-1" />
              <span className="text-sm">Worried</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="tips" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tips">Wellness Tips</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="tips">
          <Card>
            <CardHeader>
              <CardTitle>Financial Wellness Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Practice mindful spending to reduce impulse purchases</li>
                <li>Set aside time each week to review your finances</li>
                <li>Celebrate small financial wins to boost motivation</li>
                <li>Try deep breathing exercises when feeling financially stressed</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Helpful Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  <Button variant="link" className="p-0 h-auto">Financial Stress Management Guide</Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto">Meditation for Financial Anxiety</Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto">Contact a Financial Counselor</Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Button className="w-full mt-6 bg-[#006a4d] hover:bg-[#005a3d]">
        <Heart className="mr-2 h-4 w-4" />
        Get Personalized Support
      </Button>
    </>
  )
}

