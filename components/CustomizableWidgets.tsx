"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plus, Minus, GripVertical } from "lucide-react"

interface Widget {
  id: string
  type: string
  title: string
}

const availableWidgets: Widget[] = [
  { id: "account-overview", type: "account-overview", title: "Account Overview" },
  { id: "daily-affirmation", type: "daily-affirmation", title: "Daily Affirmation" },
  { id: "quick-actions", type: "quick-actions", title: "Quick Actions" },
  { id: "tomorrow-tracker", type: "tomorrow-tracker", title: "Tomorrow Tracker" },
  { id: "recent-transactions", type: "recent-transactions", title: "Recent Transactions" },
]

export default function CustomizableWidgets() {
  const [activeWidgets, setActiveWidgets] = useState<Widget[]>([
    { id: "account-overview", type: "account-overview", title: "Account Overview" },
    { id: "daily-affirmation", type: "daily-affirmation", title: "Daily Affirmation" },
    { id: "quick-actions", type: "quick-actions", title: "Quick Actions" },
  ])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(activeWidgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setActiveWidgets(items)
  }

  const addWidget = (widget: Widget) => {
    if (!activeWidgets.some((w) => w.id === widget.id)) {
      setActiveWidgets([...activeWidgets, widget])
    }
  }

  const removeWidget = (widgetId: string) => {
    setActiveWidgets(activeWidgets.filter((w) => w.id !== widgetId))
  }

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "account-overview":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">£10,542.67</p>
              <p className="text-sm text-gray-500">Total Balance</p>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Financial Health Score</span>
                  <span className="text-sm font-medium">78/100</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )
      case "daily-affirmation":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Daily Affirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center italic">
                "Your financial choices today shape your tomorrow. You're on the right path!"
              </p>
            </CardContent>
          </Card>
        )
      case "quick-actions":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-16 flex flex-col items-center justify-center bg-white text-[#006a4d] hover:bg-gray-100">
                  Transfer
                </Button>
                <Button className="h-16 flex flex-col items-center justify-center bg-white text-[#006a4d] hover:bg-gray-100">
                  Pay Bills
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      case "tomorrow-tracker":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tomorrow Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Emergency fund: £1,500 / £3,000</span>
              </div>
              <Progress value={50} className="h-2 mb-2" />
              <p className="text-sm">You're halfway there! Consider saving an extra £50 this month.</p>
            </CardContent>
          </Card>
        )
      case "recent-transactions":
        return (
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
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="widgets">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {activeWidgets.map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className="relative">
                      <div {...provided.dragHandleProps} className="absolute top-2 right-2 z-10">
                        <GripVertical className="text-gray-400" />
                      </div>
                      <div className="relative">
                        {renderWidget(widget)}
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-8"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Add Widgets</h3>
        <div className="flex flex-wrap gap-2">
          {availableWidgets.map((widget) => (
            <Button
              key={widget.id}
              variant="outline"
              size="sm"
              onClick={() => addWidget(widget)}
              disabled={activeWidgets.some((w) => w.id === widget.id)}
            >
              <Plus className="h-4 w-4 mr-1" /> {widget.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

