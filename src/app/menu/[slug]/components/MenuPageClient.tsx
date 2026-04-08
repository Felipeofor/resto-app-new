'use client'

import { useState, useEffect } from 'react'
import { EmailGate } from './EmailGate'
import { MenuContent } from './MenuContent'

interface MenuPageClientProps {
  restaurant: any
  categories: any[]
  items: any[]
}

export function MenuPageClient({ restaurant, categories, items }: MenuPageClientProps) {
  const [emailCollected, setEmailCollected] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!restaurant.require_email) {
      setEmailCollected(true)
      setChecking(false)
      return
    }
    const stored = localStorage.getItem(`resto-email-${restaurant.id}`)
    if (stored) {
      setEmailCollected(true)
    }
    setChecking(false)
  }, [restaurant.id, restaurant.require_email])

  if (checking) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-800">Cargando menú...</div>
      </div>
    )
  }

  if (!emailCollected) {
    return (
      <div className="min-h-screen bg-amber-50">
        <EmailGate
          restaurant={restaurant}
          onEmailSubmit={() => setEmailCollected(true)}
          onSkip={() => setEmailCollected(true)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <MenuContent
        restaurant={restaurant}
        categories={categories}
        items={items}
      />
    </div>
  )
}
