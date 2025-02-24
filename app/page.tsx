"use client"

import { useState } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Home from "@/components/Home"
import FinancialHealthCoach from "@/components/FinancialHealthCoach"
import Investments from "@/components/Investments"
import EcoFinancialImpact from "@/components/EcoFinancialImpact"
import LifeEventSupport from "@/components/LifeEventSupport"
import GroupSavingGoals from "@/components/GroupSavingGoals"
import MentalHealthAssistant from "@/components/MentalHealthAssistant"
import DynamicBudgetCalendar from "@/components/DynamicBudgetCalendar"
import Settings from "@/components/Settings"
import SignIn from "@/components/SignIn"
import VideoIntro from "@/components/VideoIntro"
import VirtualPet from "@/components/VirtualPet"
import BookBankerMeeting from "@/components/BookBankerMeeting"

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState("Home")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const handleSignIn = () => {
    setIsSignedIn(true)
    setCurrentPage("Home")
  }

  const handleSetCurrentPage = (page: string) => {
    setCurrentPage(page)
    if (page === "Home") {
      setCurrentPage("")
      setTimeout(() => setCurrentPage("Home"), 0)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case "Home":
        return <Home setCurrentPage={handleSetCurrentPage} />
      case "FinancialHealthCoach":
        return <FinancialHealthCoach />
      case "Investments":
        return <Investments />
      case "EcoFinancialImpact":
        return <EcoFinancialImpact />
      case "LifeEventSupport":
        return <LifeEventSupport />
      case "GroupSavingGoals":
        return <GroupSavingGoals />
      case "MentalHealthAssistant":
        return <MentalHealthAssistant />
      case "DynamicBudgetCalendar":
        return <DynamicBudgetCalendar />
      case "Settings":
        return <Settings />
      case "VirtualPet":
        return <VirtualPet />
      case "BookBankerMeeting":
        return <BookBankerMeeting />
      default:
        return <div>Page not found</div>
    }
  }

  return (
    <div className="relative w-[390px] h-[750px] mx-auto overflow-hidden bg-white">
      {showIntro ? (
        <VideoIntro onIntroEnd={() => setShowIntro(false)} />
      ) : !isSignedIn ? (
        <SignIn onSignIn={handleSignIn} />
      ) : (
        <div className="h-full flex flex-col">
          <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} setCurrentPage={handleSetCurrentPage} />
          <div className="flex-1 overflow-y-auto">
            <main className="p-4">{renderPage()}</main>
          </div>
          <Footer setCurrentPage={handleSetCurrentPage} />
        </div>
      )}
    </div>
  )
}

