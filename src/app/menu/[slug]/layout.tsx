'use client'

import { CartProvider } from '@/lib/context/cart-context'

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CartProvider>{children}</CartProvider>
}
