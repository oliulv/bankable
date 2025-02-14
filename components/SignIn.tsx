"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

export default function SignIn({ onSignIn }: { onSignIn: () => void }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  const backgroundStyle = {
    backgroundImage: `url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png")`,
    backgroundColor: "#006a4d",
    backgroundSize: "100px 100px",
    backgroundRepeat: "repeat",
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }

  const overlayStyle = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 106, 77, 0.9)",
  }

  if (isLoading) {
    return (
      <div
        className="absolute top-0 left-0 flex flex-col items-center justify-center h-[750px] w-[390px] overflow-hidden"
        style={backgroundStyle}
      >
        <div style={overlayStyle} />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 20 }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              duration: 0.5,
              ease: "easeInOut",
            }}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png"
              alt="Bankable Logo"
              className="h-32 w-32 mb-6"
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Bankable</h1>
          <p className="text-sm text-white opacity-80">Take Control of Tomorrow, Today</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="absolute top-0 left-0 flex items-center justify-center h-[750px] w-[390px] overflow-hidden"
      style={backgroundStyle}
    >
      <div style={overlayStyle} />
      <Card className="w-[90%] max-w-[350px] relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-[#006a4d] hover:bg-[#005a3d]" onClick={onSignIn}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

