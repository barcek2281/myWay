import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, AlertCircle } from 'lucide-react'
import { OrgSidebar } from '../features/organization/components/OrgSidebar'
import { OrgTopBar } from '../features/organization/components/OrgTopBar'
import { OrgCard } from '../features/organization/components/OrgCard'
import { Organization } from '../features/organization/types'
import apiClient from '../lib/axios-client'
import { useNavigate } from 'react-router-dom'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 50, damping: 15 },
  },
}

export function OrgSelectorPage() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildRoleMockOrganizations = (): Organization[] => {
    const role = (localStorage.getItem('mock_role') || 'STUDENT').toUpperCase()

    const base: Organization[] = [
      {
        id: 'dbb3b2a0-42c2-40f4-b209-1736e655977a',
        name: 'Stanford University',
        role: role === 'TEACHER' ? 'TEACHER' : role === 'ORGANIZER' ? 'ORGANIZER' : 'STUDENT',
        memberCount: 15420,
        activity: { points: [20, 45, 60, 55, 80, 75, 90], trend: 'up', label: 'Growing' },
        color: '#8C1515',
        isMock: true,
      },
      {
        id: 'e155d5d3-75f5-43a7-e532-40691988200d',
        name: 'Google Learning',
        role: role === 'TEACHER' ? 'TEACHER' : role === 'ORGANIZER' ? 'ORGANIZER' : 'STUDENT',
        memberCount: 8500,
        activity: { points: [25, 40, 55, 60, 75, 80, 92], trend: 'up', label: 'Trending' },
        color: '#4285F4',
        isMock: true,
      },
    ]

    if (role === 'TEACHER') {
      base.push({
        id: 'c144c4c2-64e4-42f6-d421-39580877199c',
        name: 'Harvard Faculty Hub',
        role: 'TEACHER',
        memberCount: 2200,
        activity: { points: [40, 55, 50, 75, 70, 82, 85], trend: 'neutral', label: 'Stable' },
        color: '#A41034',
        isMock: true,
      })
    }

    return base
  }

  const fetchOrgs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 1) Try real backend organizations first
      try {
        const res = await apiClient.get('/organizations')
        const realOrgs = (res.data || []).map((org: any) => ({
          id: String(org.id),
          name: String(org.name),
          role: (org.role || 'STUDENT') as Organization['role'],
          plan: org.plan,
          memberCount: 0,
          color: '#4F46E5',
          activity: {
            points: [40, 48, 52, 49, 61, 66, 72],
            trend: 'up' as const,
            label: 'Live',
          },
        }))

        // If no real organizations, provide role-based mock orgs so student/teacher can still enter catalogs.
        if (realOrgs.length === 0) {
          setOrganizations(buildRoleMockOrganizations())
          return
        }

        setOrganizations(realOrgs)
        return
      } catch (backendErr) {
        console.warn('Backend organizations fetch failed, falling back to mock data', backendErr)
      }

      // 2) Fallback mock organizations
      setOrganizations(buildRoleMockOrganizations())

      // In a real scenario with mixed mode, we might want to also fetch real ones 
      // and append them, but for now we stick to the requested mocks.
    } catch (err) {
      console.error('Failed to fetch orgs:', err);
      setError('Could not load organizations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs()
  }, [fetchOrgs])

  const handleCreateOrg = async () => {
    const name = prompt('Enter Organization Name:')
    if (!name) return
    try {
      await apiClient.post('/organizations', { name })
      fetchOrgs()
    } catch (err) {
      alert('Failed to create organization')
    }
  }

  const handleSelectOrganization = async (org: Organization) => {
    if (org.isMock) {
      localStorage.setItem('active_org_id', org.id)
      localStorage.setItem('mock_role', org.role)
      navigate(`/organizations/${org.id}`)
      return
    }

    try {
      await apiClient.post(`/organizations/${org.id}/switch`)
      localStorage.setItem('active_org_id', org.id)
      navigate(`/organizations/${org.id}`)
    } catch (err: any) {
      // If user is not yet a member, try joining then switch again.
      if (err?.response?.status === 403) {
        try {
          await apiClient.post(`/organizations/${org.id}/join`)
          await apiClient.post(`/organizations/${org.id}/switch`)
          localStorage.setItem('active_org_id', org.id)
          navigate(`/organizations/${org.id}`)
          return
        } catch (joinErr) {
          console.error('Join organization failed:', joinErr)
        }
      }

      alert('Failed to switch organization')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <OrgSidebar />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <OrgTopBar />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team and projects</p>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium text-lg">Finding your organizations...</p>
              </div>
            ) : error ? (
              <div className="col-span-full flex items-center justify-center py-12 px-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-800 dark:text-red-400 font-bold text-lg mb-2">Error Loading Data</p>
                  <p className="text-red-600 dark:text-red-500 max-w-sm mb-6">{error}</p>
                  <button onClick={() => fetchOrgs()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Try Again</button>
                </div>
              </div>
            ) : (
              <>
                {organizations.map((org) => (
                  <motion.div key={org.id} variants={itemVariants}>
                    <OrgCard org={org} onSelect={handleSelectOrganization} />
                  </motion.div>
                ))}

                <motion.button
                  onClick={handleCreateOrg}
                  variants={itemVariants}
                  className="group flex flex-col items-center justify-center h-full min-h-[180px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center text-gray-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3">
                    <Plus size={24} />
                  </div>
                  <span className="font-medium text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    Create another organization
                  </span>
                </motion.button>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div >
  )
}
