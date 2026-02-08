import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../features/auth/context/AuthContext'
import { User, Mail, Shield, Camera, Save } from 'lucide-react'
import { OrgTopBar } from '../features/organization/components/OrgTopBar'
import { OrgSidebar } from '../features/organization/components/OrgSidebar'

export function ProfilePage() {
    const { user } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        bio: 'Student at MyWay University. Passionate about Physics and AI.',
    })

    // Update form data if user changes (e.g. initial load)
    React.useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                email: user.email ?? ''
            }))
        }
    }, [user])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <OrgSidebar />
            <div className="md:pl-64 flex-1 flex flex-col min-h-screen">
                <OrgTopBar />

                <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        {/* Cover Image */}
                        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                        <div className="px-8 pb-8">
                            {/* Profile Header */}
                            <div className="relative flex justify-between items-end -mt-12 mb-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1 shadow-md">
                                        <div className="w-full h-full rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-300 border border-gray-100 dark:border-gray-700">
                                            {user?.firstName?.charAt(0) || 'U'}
                                        </div>
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        <Camera size={16} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                                </button>
                            </div>

                            {/* Profile Details */}
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {user?.firstName} {user?.lastName}
                                    </h1>
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                                        <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                                            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'Student'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* First Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            First Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Last Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                disabled={!isEditing}
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Bio
                                        </label>
                                        <textarea
                                            rows={4}
                                            disabled={!isEditing}
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end pt-4">
                                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                                        <Save size={18} />
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    )
}
