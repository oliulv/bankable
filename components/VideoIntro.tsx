"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface VideoIntroProps {
  onIntroEnd: () => void
}

export default function VideoIntro({ onIntroEnd }: VideoIntroProps) {
  const [videoEnded, setVideoEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.addEventListener("ended", () => setVideoEnded(true))
      return () => {
        video.removeEventListener("ended", () => setVideoEnded(true))
      }
    }
  }, [])

  return (
    <motion.div
      className="absolute top-0 left-0 w-[390px] h-[750px] overflow-hidden z-10"
      animate={{ opacity: videoEnded ? 0 : 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (videoEnded) {
          onIntroEnd()
        }
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Timeline%202-53gu7WGjLkq2JqETzyZMaRCZ6GOKsM.mp4"
        autoPlay
        muted
        playsInline
      />
    </motion.div>
  )
}

