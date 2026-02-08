import { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, User, GraduationCap } from 'lucide-react'
import { OrgSidebar } from '../features/organization/components/OrgSidebar'
import { OrgTopBar } from '../features/organization/components/OrgTopBar'
import { useAuth } from '../features/auth/context/AuthContext'

export function TeamPage() {
    const { user } = useAuth()
    const canManageTeam = user?.role === 'TEACHER' || user?.role === 'ORGANIZER'

    const [members, setMembers] = useState([
        { id: 1, name: 'John Doe', role: 'TEACHER', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', role: 'STUDENT', email: 'jane@example.com' },
        { id: 3, name: 'Bob Wilson', role: 'STUDENT', email: 'bob@example.com' },
    ])

    const handleDelete = (id: number) => {
        if (!canManageTeam) return
        if (confirm('Are you sure you want to remove this member?')) {
            setMembers(members.filter(m => m.id !== id))
        }
    }

    const handleInvite = () => {
        if (!canManageTeam) return
        const email = prompt('Enter email to invite:')
        if (email) {
            setMembers([...members, {
                id: Date.now(),
                name: 'Pending User',
                role: 'STUDENT',
                email
            }])
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <OrgSidebar />

            <div className="md:pl-64 flex flex-col min-h-screen">
                <OrgTopBar />

                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users and permissions</p>
                        </div>

                        {canManageTeam && (
                            <button
                                onClick={handleInvite}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                            >
                                <Plus size={18} />
                                Invite Member
                            </button>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${member.role === 'TEACHER'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                                }`}>
                                                {member.role === 'TEACHER' ? <Shield size={12} /> : <GraduationCap size={12} />}
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {member.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {canManageTeam && (
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    )
}
