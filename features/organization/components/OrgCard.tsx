import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, MoreHorizontal, ArrowUpRight } from 'lucide-react'
import { Organization, Role } from '../types'
import { ActivityIndicator } from '../../analytics/components/ActivityIndicator'
interface OrgCardProps {
  org: Organization
  onSelect?: (org: Organization) => void
}
const roleColors: Record<Role, string> = {
  ORGANIZER: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  TEACHER: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  STUDENT: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-600',
}
export function OrgCard({ org, onSelect }: OrgCardProps) {
  const navigate = useNavigate()
  const cardColor = org.color || '#4F46E5'
  const activityPoints = org.activity?.points || [40, 50, 60, 55, 65, 70, 75]
  const memberCount = org.memberCount ?? 0

  return (
    <motion.div
      onClick={() => {
        if (onSelect) {
          onSelect(org)
          return
        }
        navigate(`/organizations/${org.id}`)
      }}
      className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer overflow-hidden transition-all duration-200"
      whileHover={{
        y: -4,
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.2)',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Top decoration line */}
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{
          backgroundColor: cardColor,
        }}
      />

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
            style={{
              backgroundColor: cardColor,
            }}
          >
            {org.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {org.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mt-1 ${roleColors[org.role]}`}
            >
              {org.role}
            </span>
          </div>
        </div>

        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-50 dark:border-gray-700">
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            Members
          </div>
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
            <Users size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="font-semibold">{memberCount}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            Activity
            {org.activity?.trend === 'up' && (
              <ArrowUpRight size={12} className="text-teal-500" />
            )}
          </div>
          <ActivityIndicator data={activityPoints} />
        </div>
      </div>
    </motion.div>
  )
}
