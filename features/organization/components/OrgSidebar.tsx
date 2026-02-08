import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Home, Settings, PieChart, Users, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'

export function OrgSidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const location = useLocation()

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
    },
    {
      icon: Building2,
      label: 'Organizations',
      path: '/organizations',
    },
    {
      icon: PieChart,
      label: 'Analytics',
      path: '/analytics',
    },
    {
      icon: Users,
      label: 'Team',
      path: '/team',
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/notifications',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
    },
  ]
  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen w-64 bg-indigo-950 text-indigo-100 flex flex-col border-r border-indigo-900 z-50 hidden md:flex"
      initial={{
        x: -256,
      }}
      animate={{
        x: 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
      }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-indigo-900/50 bg-indigo-950">
        <div className="flex items-center gap-2 text-white">
          <div className="bg-teal-500 p-1.5 rounded-md">
            <Building2 size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">MyWay</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          Platform
        </div>
        {navItems.filter(item => {
          // Hide Team tab for Students
          if (item.label === 'Team' && user?.role === 'STUDENT') return false
          return true
        }).map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)

          return (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-indigo-800/50 text-white border-l-2 border-teal-500' : 'text-indigo-300/80 hover:bg-indigo-900/50 hover:text-white border-l-2 border-transparent cursor-pointer'}`}
            >
              <item.icon
                size={18}
                className={isActive ? 'text-teal-400' : 'text-indigo-400'}
              />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-indigo-900/50 bg-indigo-950">
        <div className="bg-indigo-900/50 rounded-lg p-3 flex items-center justify-between group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white border border-indigo-600 flex-shrink-0">
              {user?.name?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name || `${user?.firstName} ${user?.lastName}`}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-indigo-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
