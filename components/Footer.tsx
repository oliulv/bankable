import { Button } from "@/components/ui/button"
import { Home, Zap, Settings, Turtle, Calendar } from "lucide-react"

interface FooterProps {
  setCurrentPage: (page: string) => void
}

export default function Footer({ setCurrentPage }: FooterProps) {
  return (
    <footer className="sticky bottom-0 z-50 bg-white dark:bg-gray-800 py-1 flex justify-around border-t dark:border-gray-700 h-12">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPage("Home")}
        className="text-gray-600 dark:text-gray-300"
      >
        <Home className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPage("FinancialHealthCoach")}
        className="text-gray-600 dark:text-gray-300"
      >
        <Zap className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPage("VirtualPet")}
        className="text-gray-600 dark:text-gray-300"
      >
        <Turtle className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPage("BookBankerMeeting")}
        className="text-gray-600 dark:text-gray-300"
      >
        <Calendar className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPage("Settings")}
        className="text-gray-600 dark:text-gray-300"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </footer>
  )
}

