"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
      default:
        return <div>Page not found</div>
    }
  }

  return (
    <div className="relative w-[390px] h-[750px] mx-auto overflow-hidden bg-white">
      {!isSignedIn && <SignIn onSignIn={handleSignIn} />}
      {showIntro && <VideoIntro onIntroEnd={() => setShowIntro(false)} />}
      {isSignedIn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full flex flex-col"
        >
          <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} setCurrentPage={handleSetCurrentPage} />
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.main
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4"
              >
                {renderPage()}
              </motion.main>
            </AnimatePresence>
          </div>
          <Footer setCurrentPage={handleSetCurrentPage} />
        </motion.div>
      )}
    </div>
  )
}

