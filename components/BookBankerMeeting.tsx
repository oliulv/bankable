"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"

export default function BookBankerMeeting() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [topic, setTopic] = useState("")

  const handleBookMeeting = () => {
    // Here you would typically send this data to your backend
    console.log("Booking meeting with:", { name, email, topic, date: selectedDate, time: selectedTime })
    // For now, we'll just show an alert
    alert("Meeting booked successfully!")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Book a Meeting with a Banker</CardTitle>
        <CardDescription>Schedule an in-person appointment with one of our financial experts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Meeting Topic</Label>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger id="topic">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Financial Advice</SelectItem>
              <SelectItem value="investments">Investment Planning</SelectItem>
              <SelectItem value="mortgage">Mortgage Consultation</SelectItem>
              <SelectItem value="savings">Savings and Budgeting</SelectItem>
              <SelectItem value="business">Business Banking</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger id="time">
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="09:00">09:00 AM</SelectItem>
              <SelectItem value="10:00">10:00 AM</SelectItem>
              <SelectItem value="11:00">11:00 AM</SelectItem>
              <SelectItem value="13:00">01:00 PM</SelectItem>
              <SelectItem value="14:00">02:00 PM</SelectItem>
              <SelectItem value="15:00">03:00 PM</SelectItem>
              <SelectItem value="16:00">04:00 PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleBookMeeting}
          className="w-full bg-[#006a4d] hover:bg-[#005a3d]"
          disabled={!name || !email || !topic || !selectedDate || !selectedTime}
        >
          Book Meeting
        </Button>
      </CardContent>
    </Card>
  )
}

