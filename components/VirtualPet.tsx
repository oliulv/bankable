"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shirt, Cookie, Heart, Moon, Sun, Star, Music, VolumeX, Trophy, Gamepad2 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface PetStats {
  happiness: number
  hunger: number
  energy: number
  coins: number
  level: number
  xp: number
}

interface Outfit {
  id: string
  name: string
  type: "hat" | "shirt" | "accessory"
  color: string
  price: number
  owned: boolean
}

interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  icon: JSX.Element
}

export default function VirtualPet() {
  const [stats, setStats] = useState<PetStats>({
    happiness: 80,
    hunger: 70,
    energy: 90,
    coins: 100,
    level: 1,
    xp: 0,
  })

  const [isAnimating, setIsAnimating] = useState(false)
  const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null)
  const [showWardrobe, setShowWardrobe] = useState(false)
  const [isSleeping, setIsSleeping] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [reaction, setReaction] = useState<string | null>(null)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [miniGameScore, setMiniGameScore] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const outfits: Outfit[] = [
    { id: "1", name: "Party Hat", type: "hat", color: "bg-pink-500", price: 50, owned: true },
    { id: "2", name: "Cool Shades", type: "accessory", color: "bg-black", price: 100, owned: false },
    { id: "3", name: "Summer Shirt", type: "shirt", color: "bg-yellow-400", price: 75, owned: false },
    { id: "4", name: "Winter Scarf", type: "accessory", color: "bg-blue-400", price: 80, owned: false },
    { id: "5", name: "Crown", type: "hat", color: "bg-yellow-600", price: 200, owned: false },
    { id: "6", name: "Bow Tie", type: "accessory", color: "bg-red-500", price: 60, owned: false },
  ]

  const achievements: Achievement[] = [
    {
      id: "1",
      name: "Best Friend",
      description: "Reach 100% happiness",
      unlocked: false,
      icon: <Heart className="w-4 h-4" />,
    },
    {
      id: "2",
      name: "Fashionista",
      description: "Own 3 outfits",
      unlocked: false,
      icon: <Shirt className="w-4 h-4" />,
    },
    {
      id: "3",
      name: "High Score",
      description: "Score 100 points in mini-game",
      unlocked: false,
      icon: <Trophy className="w-4 h-4" />,
    },
  ]

  const playSound = (type: "feed" | "tickle" | "achievement") => {
    if (!soundEnabled || !audioRef.current) return

    const sounds = {
      feed: "/eat-sound.mp3",
      tickle: "/laugh-sound.mp3",
      achievement: "/achievement-sound.mp3",
    }

    audioRef.current.src = sounds[type]
    audioRef.current.play()
  }

  useEffect(() => {
    if (!isSleeping) {
      const timer = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.1),
          happiness: Math.max(0, prev.happiness - 0.05),
          energy: Math.max(0, prev.energy - 0.08),
        }))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isSleeping])

  const handleFeed = () => {
    if (stats.hunger >= 100) return
    playSound("feed")
    setStats((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 20),
      happiness: Math.min(100, prev.happiness + 5),
      xp: prev.xp + 5,
    }))
    setIsAnimating(true)
    setReaction("Yummy! 😋")
    setTimeout(() => {
      setIsAnimating(false)
      setReaction(null)
    }, 1000)
    checkLevelUp()
  }

  const handleTickle = () => {
    if (stats.happiness >= 100) return
    playSound("tickle")
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
      energy: Math.max(0, prev.energy - 5),
      xp: prev.xp + 3,
    }))
    setIsAnimating(true)
    setReaction("Hehe! 😊")
    setTimeout(() => {
      setIsAnimating(false)
      setReaction(null)
    }, 1000)
    checkLevelUp()
  }

  const handleSleep = () => {
    setIsSleeping(!isSleeping)
    if (!isSleeping) {
      setReaction("ZZZ... 😴")
      setStats((prev) => ({
        ...prev,
        energy: Math.min(100, prev.energy + 50),
      }))
    } else {
      setReaction("Good morning! 🌞")
    }
    setTimeout(() => setReaction(null), 1500)
  }

  const handleBuyOutfit = (outfit: Outfit) => {
    if (stats.coins >= outfit.price) {
      setStats((prev) => ({
        ...prev,
        coins: prev.coins - outfit.price,
        xp: prev.xp + 10,
      }))
      outfit.owned = true
      checkLevelUp()
    }
  }

  const handleDress = (outfit: Outfit) => {
    if (!outfit.owned) return
    setCurrentOutfit(outfit)
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 10),
      xp: prev.xp + 2,
    }))
    checkLevelUp()
  }

  const checkLevelUp = () => {
    const xpNeeded = stats.level * 100
    if (stats.xp >= xpNeeded) {
      setStats((prev) => ({
        ...prev,
        level: prev.level + 1,
        xp: prev.xp - xpNeeded,
        coins: prev.coins + 50,
      }))
      setReaction("Level Up! 🎉")
      setTimeout(() => setReaction(null), 1500)
      //Check achievements after level up
      achievements.forEach((achievement) => {
        if (achievement.id === "1" && stats.happiness === 100) {
          achievement.unlocked = true
          playSound("achievement")
        } else if (achievement.id === "2" && outfits.filter((outfit) => outfit.owned).length >= 3) {
          achievement.unlocked = true
          playSound("achievement")
        } else if (achievement.id === "3" && miniGameScore >= 100) {
          achievement.unlocked = true
          playSound("achievement")
        }
      })
    }
  }

  const playMiniGame = () => {
    setShowMiniGame(true)
    setMiniGameScore(0)
    // Mini-game logic would go here
  }

  return (
    <div className="h-full flex flex-col items-center p-4 space-y-4">
      <audio ref={audioRef} />

      <div className="flex justify-between w-full">
        <Badge variant="outline" className="text-sm">
          Level {stats.level}
        </Badge>
        <Badge variant="outline" className="text-sm">
          🪙 {stats.coins}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? <Music className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <AnimatePresence>
          {reaction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 text-xl font-bold text-[#006a4d]"
            >
              {reaction}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={
            isAnimating
              ? {
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0],
                }
              : isSleeping
                ? {
                    y: [0, 2],
                    transition: {
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      duration: 2,
                    },
                  }
                : {}
          }
          className="relative"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20at%201.55.58%E2%80%AFPM-vXzN5aOAgtQrhdBHIwpQIWKWOunpSJ.png"
            alt="Virtual Pet Turtle"
            className={`w-48 h-48 transition-opacity ${isSleeping ? "opacity-75" : ""}`}
          />
          {currentOutfit && (
            <div
              className={`absolute ${
                currentOutfit.type === "hat"
                  ? "top-[-20px] left-1/2 transform -translate-x-1/2"
                  : currentOutfit.type === "shirt"
                    ? "bottom-0 left-1/2 transform -translate-x-1/2"
                    : "top-1/2 right-[-10px] transform -translate-y-1/2"
              } w-6 h-6 rounded-full ${currentOutfit.color}`}
            />
          )}
        </motion.div>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <Card className="w-full p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Happiness</span>
                <span>{Math.round(stats.happiness)}%</span>
              </div>
              <Progress value={stats.happiness} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hunger</span>
                <span>{Math.round(stats.hunger)}%</span>
              </div>
              <Progress value={stats.hunger} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Energy</span>
                <span>{Math.round(stats.energy)}%</span>
              </div>
              <Progress value={stats.energy} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>XP Progress</span>
                <span>
                  {stats.xp}/{stats.level * 100}
                </span>
              </div>
              <Progress value={(stats.xp / (stats.level * 100)) * 100} className="h-2" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card className="w-full p-4">
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center space-x-2 ${achievement.unlocked ? "text-[#006a4d]" : "text-gray-400"}`}
                >
                  {achievement.icon}
                  <div>
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-sm">{achievement.description}</div>
                  </div>
                  {achievement.unlocked && <Star className="w-4 h-4 ml-auto text-yellow-400" />}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="games">
          <Card className="w-full p-4">
            <Button
              onClick={playMiniGame}
              className="w-full h-20 flex flex-col items-center justify-center bg-[#006a4d] hover:bg-[#005a3d]"
            >
              <Gamepad2 className="h-6 w-6 mb-1" />
              Play Mini-Game
            </Button>
            {showMiniGame && (
              <div className="mt-4 text-center">
                <p>Score: {miniGameScore}</p>
                {/* Mini-game interface would go here */}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-4 gap-4 w-full">
        <Button
          onClick={handleFeed}
          className="flex flex-col items-center justify-center h-20 bg-[#006a4d] hover:bg-[#005a3d]"
          disabled={stats.hunger >= 100}
        >
          <Cookie className="h-6 w-6 mb-1" />
          Feed
        </Button>

        <Button
          onClick={handleTickle}
          className="flex flex-col items-center justify-center h-20 bg-[#006a4d] hover:bg-[#005a3d]"
          disabled={stats.happiness >= 100}
        >
          <Heart className="h-6 w-6 mb-1" />
          Tickle
        </Button>

        <Button
          onClick={handleSleep}
          className="flex flex-col items-center justify-center h-20 bg-[#006a4d] hover:bg-[#005a3d]"
        >
          {isSleeping ? <Sun className="h-6 w-6 mb-1" /> : <Moon className="h-6 w-6 mb-1" />}
          {isSleeping ? "Wake" : "Sleep"}
        </Button>

        <Sheet open={showWardrobe} onOpenChange={setShowWardrobe}>
          <SheetTrigger asChild>
            <Button className="flex flex-col items-center justify-center h-20 bg-[#006a4d] hover:bg-[#005a3d]">
              <Shirt className="h-6 w-6 mb-1" />
              Dress
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Wardrobe</SheetTitle>
              <SheetDescription>Choose an outfit for your turtle friend</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {outfits.map((outfit) => (
                <Button
                  key={outfit.id}
                  onClick={() => (outfit.owned ? handleDress(outfit) : handleBuyOutfit(outfit))}
                  className={`p-4 h-auto ${currentOutfit?.id === outfit.id ? "ring-2 ring-[#006a4d]" : ""}`}
                  variant="outline"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-8 h-8 rounded-full ${outfit.color}`} />
                    <span className="text-sm">{outfit.name}</span>
                    {!outfit.owned && <span className="text-xs">🪙 {outfit.price}</span>}
                  </div>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

