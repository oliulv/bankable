import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Home,
  LogOut,
  Heart,
  Leaf,
  Zap,
  Users,
  Brain,
  CalendarIcon,
  Settings,
  TrendingUp,
  Turtle,
  Calendar,
} from "lucide-react"

interface HeaderProps {
  isMenuOpen: boolean
  setIsMenuOpen: (isOpen: boolean) => void
  setCurrentPage: (page: string) => void
}

export default function Header({ isMenuOpen, setIsMenuOpen, setCurrentPage }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#006a4d] text-white p-2 flex items-center justify-between h-14">
      <div className="flex items-center w-1/3">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png"
          alt="Bankable Logo"
          className="h-8 w-8 invert ml-2"
        />
      </div>
      <div className="text-center flex-1">
        <h1 className="text-xl font-bold">Bankable</h1>
        <p className="text-xs opacity-90 whitespace-nowrap">Take Control of Tomorrow, Today</p>
      </div>
      <div className="w-1/3 flex justify-end">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-white dark:bg-gray-800">
            <nav className="flex flex-col gap-4">
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("Home")
                  setIsMenuOpen(false)
                }}
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("VirtualPet")
                  setIsMenuOpen(false)
                }}
              >
                <Turtle className="mr-2 h-4 w-4" />
                Virtual Pet
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("FinancialHealthCoach")
                  setIsMenuOpen(false)
                }}
              >
                <Heart className="mr-2 h-4 w-4" />
                Financial Health Coach
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("Investments")
                  setIsMenuOpen(false)
                }}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Investments
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("EcoFinancialImpact")
                  setIsMenuOpen(false)
                }}
              >
                <Leaf className="mr-2 h-4 w-4" />
                Eco-Financial Impact
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("LifeEventSupport")
                  setIsMenuOpen(false)
                }}
              >
                <Zap className="mr-2 h-4 w-4" />
                Life-event Support
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("GroupSavingGoals")
                  setIsMenuOpen(false)
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Group Saving Goals
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("MentalHealthAssistant")
                  setIsMenuOpen(false)
                }}
              >
                <Brain className="mr-2 h-4 w-4" />
                Mental Health Assistant
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("DynamicBudgetCalendar")
                  setIsMenuOpen(false)
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Dynamic Budget Calendar
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("Settings")
                  setIsMenuOpen(false)
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => {
                  setCurrentPage("BookBankerMeeting")
                  setIsMenuOpen(false)
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Banker Meeting
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-black dark:text-white"
                onClick={() => console.log("Logout")}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

