import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types'
import apiClient from '../../../lib/axios-client'

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (userDetails: Omit<User, 'id' | 'avatar'> & { password: string }) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            setIsLoading(false)
            return
        }

        try {
            const response = await apiClient.get('/auth/me')
            setUser(response.data)
        } catch (error) {
            console.error('Auth check failed:', error)
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        checkAuth()
    }, [])

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const response = await apiClient.post('/auth/signin', { email, password })
            const { accessToken, refreshToken, user } = response.data

            localStorage.setItem('access_token', accessToken)
            localStorage.setItem('refresh_token', refreshToken)
            setUser(user)
        } catch (error) {
            console.error('Login failed:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (userDetails: Omit<User, 'id' | 'avatar' | 'name'> & { password: string }) => {
        setIsLoading(true)
        try {
            const response = await apiClient.post('/auth/signup', {
                email: userDetails.email,
                password: userDetails.password,
                name: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
                role: userDetails.role
            })
            const { accessToken, refreshToken, user } = response.data

            localStorage.setItem('access_token', accessToken)
            localStorage.setItem('refresh_token', refreshToken)
            setUser(user)
        } catch (error) {
            console.error('Registration failed:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        window.location.href = '/signin'
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
