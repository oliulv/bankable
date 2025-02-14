'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, PlusCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Goal {
  id: number
  name: string
  target: number
  current: number
  members: string[]
}

const initialGoals: Goal[] = [
  { id: 1, name: 'Summer Holiday', target: 2000, current: 1500, members: ['JD', 'AS', 'MT'] },
  { id: 2, name: 'New Gaming Console', target: 500, current: 350, members: ['JD', 'RK'] },
]

export default function GroupSavingGoals() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (newGoalName && newGoalTarget) {
      const newGoal: Goal = {
        id: goals.length + 1,
        name: newGoalName,
        target: parseFloat(newGoalTarget),
        current: 0,
        members: ['You']
      }
      setGoals([...goals, newGoal])
      setNewGoalName('')
      setNewGoalTarget('')
    }
  }

  const handleContribute = () => {
    if (selectedGoalId !== null && contributionAmount) {
      const amount = parseFloat(contributionAmount)
      setGoals(goals.map(goal => 
        goal.id === selectedGoalId 
          ? { ...goal, current: goal.current + amount }
          : goal
      ))
      setContributionAmount('')
      setSelectedGoalId(null)
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      {goals.map((goal) => (
        <Card key={goal.id} className="mb-6">
          <CardHeader>
            <CardTitle>{goal.name}</CardTitle>
            <CardDescription>Group savings progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">£{goal.current} / £{goal.target}</span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-2" />
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <div className="flex -space-x-2">
                  {goal.members.map((member, index) => (
                    <Avatar key={index} className="border-2 border-white">
                      <AvatarFallback>{member}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-[#006a4d] hover:bg-[#005a3d]"
                    onClick={() => {
                      setSelectedGoalId(goal.id)
                      setIsDialogOpen(true)
                    }}
                  >
                    Contribute
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contribute to {goal.name}</DialogTitle>
                    <DialogDescription>
                      Enter the amount you'd like to contribute to this goal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="contribution" className="text-right">
                        Amount
                      </Label>
                      <Input
                        id="contribution"
                        type="number"
                        className="col-span-3"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleContribute}>Contribute</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle>Create New Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <Input 
              placeholder="Goal Name" 
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
            />
            <Input 
              type="number" 
              placeholder="Target Amount (£)" 
              value={newGoalTarget}
              onChange={(e) => setNewGoalTarget(e.target.value)}
            />
            <Button type="submit" className="w-full bg-[#006a4d] hover:bg-[#005a3d]">Create Group Goal</Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

