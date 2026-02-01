export type UserRole = 'STUDENT' | 'TEACHER' | 'ORGANIZER'

export interface User {
    id: string
    email: string
    name: string
    firstName?: string
    lastName?: string
    role: UserRole
    avatar?: string
}

export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
}
