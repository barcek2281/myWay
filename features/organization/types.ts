export type Role = 'ORGANIZER' | 'TEACHER' | 'STUDENT'

export interface ActivityData {
  points: number[] // Array of values for the sparkline (0-100)
  trend: 'up' | 'down' | 'neutral'
  label: string // e.g., "High activity"
}

export interface Organization {
  id: string
  name: string
  role: Role
  memberCount?: number
  activity?: ActivityData
  color?: string // Hex color for the icon background
  plan?: string
  isMock?: boolean
}

export interface User {
  name: string
  email: string
  avatarUrl?: string
}
