'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error || 'Failed to sign in.')
      } else {
        localStorage.setItem('xplora_user', JSON.stringify(data.user))
        router.push('/')
      }
    } catch (err) {
      setApiError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F4F1E6' }}>
      {/* Left Side - Travel Image (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80')"
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(38, 61, 50, 0.4)' }} />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>XPLORA</h1>
          <p className="text-xl text-center max-w-md">Discover your next adventure with personalized travel experiences</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 mb-8 transition"
            style={{ color: '#526B57' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Xplora
          </Link>

          {/* Logo for Mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#263D32' }}>XPLORA</h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8" style={{ border: '1px solid #E1DDD1' }}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#292A25' }}>
                Welcome Back
              </h2>
              <p style={{ color: '#526B57' }}>Continue your journey with Xplora.</p>
            </div>

            {apiError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition"
                  style={{ 
                    borderColor: errors.email ? '#ef4444' : '#E1DDD1',
                    color: '#292A25'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#526B57'}
                  onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#E1DDD1'}
                />
                {errors.email && (
                  <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#292A25' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition pr-12"
                    style={{ 
                      borderColor: errors.password ? '#ef4444' : '#E1DDD1',
                      color: '#292A25'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#526B57'}
                    onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : '#E1DDD1'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#526B57' }}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.password}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link 
                  href="#" 
                  className="text-sm transition"
                  style={{ color: '#C6A96B' }}
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full py-3 text-white font-semibold rounded-lg transition"
                style={{ backgroundColor: '#526B57' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#263D32'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#526B57'}
              >
                Sign In
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: '#E1DDD1' }} />
              <span className="text-sm" style={{ color: '#526B57' }}>OR</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#E1DDD1' }} />
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full py-3 border-2 rounded-lg font-medium flex items-center justify-center gap-3 transition"
              style={{ borderColor: '#E1DDD1', color: '#292A25' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F1E6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <p className="text-center mt-6" style={{ color: '#526B57' }}>
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold transition" style={{ color: '#C6A96B' }}>
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
