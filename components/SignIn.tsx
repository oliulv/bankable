"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignIn({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="absolute top-0 left-0 flex items-center justify-center h-[750px] w-[390px] overflow-hidden bg-[#006a4d]">
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

