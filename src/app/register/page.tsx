'use client'

import dynamic from 'next/dynamic'

const AuthPage = dynamic(() => import('@/components/auth-page'), { ssr: false })

export default function RegisterPage() {
  return <AuthPage initialMode="register" />
}
