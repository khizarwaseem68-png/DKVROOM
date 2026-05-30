'use client'

import dynamic from 'next/dynamic'

const AuthPage = dynamic(() => import('@/components/auth-page'), { ssr: false })

export default function LoginPage() {
  return <AuthPage initialMode="login" />
}
