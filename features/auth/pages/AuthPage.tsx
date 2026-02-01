import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Github, Facebook, Linkedin, Chrome } from 'lucide-react'
import './AuthPage.css'

export function AuthPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, register, isLoading } = useAuth()
    const [isActive, setIsActive] = useState(false)
    const [error, setError] = useState('')

    // Login State
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    // Register State
    const [regName, setRegName] = useState('') // Will split into first/last
    const [regEmail, setRegEmail] = useState('')
    const [regPassword, setRegPassword] = useState('')
    const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'ORGANIZER'>('STUDENT')

    useEffect(() => {
        // More robust check for signup path
        if (location.pathname.toLowerCase().includes('/signup')) {
            setIsActive(true)
        } else {
            setIsActive(false)
        }
    }, [location.pathname])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            await login(loginEmail, loginPassword)
            navigate('/organizations')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid email or password')
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Simple name splitting logic
        const nameParts = regName.trim().split(' ')
        const firstName = nameParts[0] || 'User'
        const lastName = nameParts.slice(1).join(' ') || ''

        try {
            await register({
                email: regEmail,
                password: regPassword,
                firstName,
                lastName,
                role
            })
            navigate('/organizations')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed')
        }
    }

    return (
        <div className="auth-container-body">
            <div className={`container ${isActive ? 'active' : ''}`} id="container">

                {/* Sign Up Form */}
                <div className="form-container sign-up">
                    <form onSubmit={handleRegister}>
                        <h1 className="font-bold text-3xl mb-4">Create Account</h1>
                        <div className="social-icons">
                            <a href="#" className="icon"><Chrome size={20} /></a>
                            <a href="#" className="icon"><Facebook size={20} /></a>
                            <a href="#" className="icon"><Github size={20} /></a>
                            <a href="#" className="icon"><Linkedin size={20} /></a>
                        </div>
                        <span className="mb-4">or use your email for registration</span>

                        <input
                            type="text"
                            placeholder="Full Name"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                        />

                        {/* Role Selection */}
                        <div className="role-selection">
                            {['STUDENT', 'TEACHER', 'ORGANIZER'].map((r) => (
                                <div
                                    key={r}
                                    className={`role-btn ${role === r ? 'active' : ''}`}
                                    onClick={() => setRole(r as any)}
                                >
                                    {r.charAt(0) + r.slice(1).toLowerCase()}
                                </div>
                            ))}
                        </div>

                        {error && isActive && <p style={{ color: 'red', margin: '5px 0', fontSize: '12px' }}>{error}</p>}

                        <button type="submit" disabled={isLoading} className="mt-4">
                            {isLoading ? 'Creating...' : 'Sign Up'}
                        </button>

                        {/* Mobile/Fallback Toggle */}
                        <p className="mt-4 text-sm text-gray-600 md:hidden cursor-pointer underline" onClick={() => setIsActive(false)}>
                            Already have an account? Sign In
                        </p>
                    </form>
                </div>

                {/* Sign In Form */}
                <div className="form-container sign-in">
                    <form onSubmit={handleLogin}>
                        <h1 className="font-bold text-3xl mb-4">Sign In</h1>
                        <div className="social-icons">
                            <a href="#" className="icon"><Chrome size={20} /></a>
                            <a href="#" className="icon"><Facebook size={20} /></a>
                            <a href="#" className="icon"><Github size={20} /></a>
                            <a href="#" className="icon"><Linkedin size={20} /></a>
                        </div>
                        <span className="mb-4">or use your email password</span>
                        <input
                            type="email"
                            placeholder="Email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                        />
                        <a href="#">Forget Your Password?</a>

                        {error && !isActive && <p style={{ color: 'red', margin: '5px 0', fontSize: '12px' }}>{error}</p>}

                        <button type="submit" disabled={isLoading} className="mt-4">
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>

                        {/* Mobile/Fallback Toggle */}
                        <p className="mt-4 text-sm text-gray-600 md:hidden cursor-pointer underline" onClick={() => setIsActive(true)}>
                            Don't have an account? Sign Up
                        </p>
                    </form>
                </div>

                {/* Toggle Panel */}
                <div className="toggle-container">
                    <div className="toggle">
                        <div className="toggle-panel toggle-left">
                            <h1 className="font-bold text-3xl mb-4">Welcome Back!</h1>
                            <p className="mb-8">Enter your personal details to use all of site features</p>
                            <button className="btn-transparent" id="login" onClick={() => { setIsActive(false); navigate('/signin') }}>
                                Sign In
                            </button>
                        </div>
                        <div className="toggle-panel toggle-right">
                            <h1 className="font-bold text-3xl mb-4">Hello, Friend!</h1>
                            <p className="mb-8">Register with your personal details to use all of site features</p>
                            <button className="btn-transparent" id="register" onClick={() => { setIsActive(true); navigate('/signup') }}>
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
