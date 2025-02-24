"use client"

import { useEffect, useRef } from "react"

interface VideoIntroProps {
  onIntroEnd: () => void
}

export default function VideoIntro({ onIntroEnd }: VideoIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.addEventListener("ended", onIntroEnd)
      return () => {
        video.removeEventListener("ended", onIntroEnd)
      }
    }
  }, [onIntroEnd])

  return (
    <div className="absolute top-0 left-0 w-[390px] h-[750px] overflow-hidden z-10">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Timeline%20221-yEABIAhJRnj1skCcQry8jYaGiIEp7K.mp4"
        autoPlay
        muted
        playsInline
      />
    </div>
  )
}

