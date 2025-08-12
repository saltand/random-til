'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // On initial load, fetch random TIL and navigate to its URL
    fetch('/api/til')
      .then(response => response.json())
      .then(data => {
        const path = data.path.replace(/\.md$/, '')
        router.push(`/${path}`)
      })
      .catch(error => {
        console.error('Failed to fetch initial TIL:', error)
      })
  }, [router])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center text-muted-foreground">Loading random TIL...</div>
    </div>
  )
}