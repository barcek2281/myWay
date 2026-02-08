import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen,
    Plus,
    Search,
    Loader2,
    ArrowRight,
    Users,
    Clock3,
    Star,
    SlidersHorizontal,
    BookMarked,
} from 'lucide-react'
import { OrgSidebar } from '../features/organization/components/OrgSidebar'
import { OrgTopBar } from '../features/organization/components/OrgTopBar'
import apiClient from '../lib/axios-client'
import { useAuth } from '../features/auth/context/AuthContext'
import { UserRole } from '../features/auth/types'

type CourseStatus = 'active' | 'draft' | 'archived'

interface CourseCard {
    id: string
    title: string
    code: string
    description: string
    instructor: string
    studentCount: number
    category: string
    level: 'Beginner' | 'Intermediate' | 'Advanced'
    status: CourseStatus
    lessons: number
    assignments: number
    duration: string
    nextSession: string
    isEnrolled: boolean
    isOwnedByUser: boolean
    progress: number
    syllabusHighlights: string[]
}

const studentMockCourses: CourseCard[] = [
    {
        id: 'mock-student-cs101',
        title: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Programming basics, algorithms, problem-solving labs, and weekly coding challenges.',
        instructor: 'Prof. John Doe',
        studentCount: 245,
        category: 'Engineering',
        level: 'Beginner',
        status: 'active',
        lessons: 24,
        assignments: 10,
        duration: '12 weeks',
        nextSession: 'Mon 10:00',
        isEnrolled: true,
        isOwnedByUser: false,
        progress: 62,
        syllabusHighlights: ['Variables & Data Types', 'Control Flow', 'Functions', 'Data Structures', 'Final Mini Project'],
    },
    {
        id: 'mock-student-math221',
        title: 'Linear Algebra',
        code: 'MATH221',
        description: 'Vectors, eigenvalues, matrix transformations, and applied machine learning intuition.',
        instructor: 'Prof. Jane Smith',
        studentCount: 189,
        category: 'Mathematics',
        level: 'Intermediate',
        status: 'active',
        lessons: 18,
        assignments: 8,
        duration: '10 weeks',
        nextSession: 'Wed 14:30',
        isEnrolled: true,
        isOwnedByUser: false,
        progress: 41,
        syllabusHighlights: ['Matrix Operations', 'Determinants', 'Vector Spaces', 'Eigen Decomposition', 'PCA Intuition'],
    },
    {
        id: 'mock-student-stat110',
        title: 'Probability for AI',
        code: 'STAT110',
        description: 'Probability distributions, Bayes theorem, random variables, and uncertainty modeling.',
        instructor: 'Prof. Joe Blitzstein',
        studentCount: 378,
        category: 'Data Science',
        level: 'Intermediate',
        status: 'active',
        lessons: 20,
        assignments: 9,
        duration: '11 weeks',
        nextSession: 'Tue 09:00',
        isEnrolled: false,
        isOwnedByUser: false,
        progress: 0,
        syllabusHighlights: ['Combinatorics', 'Conditional Probability', 'Continuous Distributions', 'Expectation & Variance', 'Bayesian Reasoning'],
    },
    {
        id: 'mock-student-ml101',
        title: 'Machine Learning Crash Course',
        code: 'ML101',
        description: 'Supervised learning, model evaluation, feature engineering, and practical mini-labs.',
        instructor: 'Google AI Team',
        studentCount: 1250,
        category: 'AI',
        level: 'Beginner',
        status: 'active',
        lessons: 30,
        assignments: 12,
        duration: '14 weeks',
        nextSession: 'Thu 16:00',
        isEnrolled: false,
        isOwnedByUser: false,
        progress: 0,
        syllabusHighlights: ['Linear Regression', 'Classification', 'Regularization', 'Model Metrics', 'Deployment Basics'],
    },
    {
        id: 'mock-student-cloud101',
        title: 'Cloud Computing Fundamentals',
        code: 'CLOUD101',
        description: 'Core cloud patterns, managed services, CI/CD, and infrastructure fundamentals.',
        instructor: 'Google Cloud Team',
        studentCount: 892,
        category: 'Cloud',
        level: 'Beginner',
        status: 'active',
        lessons: 16,
        assignments: 7,
        duration: '8 weeks',
        nextSession: 'Fri 11:30',
        isEnrolled: true,
        isOwnedByUser: false,
        progress: 78,
        syllabusHighlights: ['Cloud Concepts', 'Networking Basics', 'Container Intro', 'CI/CD Pipeline', 'Monitoring'],
    },
]

const teacherMockCourses: CourseCard[] = [
    {
        id: 'mock-teacher-go-advanced',
        title: 'Advanced Go Backend Engineering',
        code: 'GO401',
        description: 'Concurrency patterns, profiling, API design, and production-grade backend architecture.',
        instructor: 'You',
        studentCount: 96,
        category: 'Engineering',
        level: 'Advanced',
        status: 'active',
        lessons: 22,
        assignments: 11,
        duration: '12 weeks',
        nextSession: 'Tue 18:00',
        isEnrolled: false,
        isOwnedByUser: true,
        progress: 0,
        syllabusHighlights: ['Goroutines & Channels', 'Context & Cancellation', 'DB Optimization', 'Clean Architecture', 'Capstone API'],
    },
    {
        id: 'mock-teacher-system-design',
        title: 'System Design Studio',
        code: 'ARCH330',
        description: 'Scalable systems, reliability, observability, and architecture tradeoffs by case study.',
        instructor: 'You',
        studentCount: 74,
        category: 'Architecture',
        level: 'Advanced',
        status: 'active',
        lessons: 14,
        assignments: 6,
        duration: '8 weeks',
        nextSession: 'Wed 19:30',
        isEnrolled: false,
        isOwnedByUser: true,
        progress: 0,
        syllabusHighlights: ['Load Balancing', 'Caching', 'Event-Driven Systems', 'Data Consistency', 'Incident Response'],
    },
    {
        id: 'mock-teacher-ai-tutor-lab',
        title: 'AI Tutor Prompting Lab',
        code: 'AI250',
        description: 'Prompt engineering, evaluation rubrics, and safe educational AI interactions.',
        instructor: 'You',
        studentCount: 128,
        category: 'AI',
        level: 'Intermediate',
        status: 'draft',
        lessons: 12,
        assignments: 5,
        duration: '6 weeks',
        nextSession: 'Not scheduled',
        isEnrolled: false,
        isOwnedByUser: true,
        progress: 0,
        syllabusHighlights: ['Prompt Templates', 'Socratic Responses', 'Quality Review', 'Cost Optimization', 'Academic Integrity'],
    },
    {
        id: 'mock-teacher-web-security',
        title: 'Web API Security Essentials',
        code: 'SEC210',
        description: 'OWASP API Top 10, auth hardening, input validation, and secure coding workflows.',
        instructor: 'You',
        studentCount: 111,
        category: 'Security',
        level: 'Intermediate',
        status: 'active',
        lessons: 20,
        assignments: 9,
        duration: '10 weeks',
        nextSession: 'Mon 17:00',
        isEnrolled: false,
        isOwnedByUser: true,
        progress: 0,
        syllabusHighlights: ['Threat Modeling', 'JWT Security', 'Access Control', 'Upload Security', 'Security Testing'],
    },
    {
        id: 'mock-teacher-archive-legacy',
        title: 'Legacy Systems Migration Workshop',
        code: 'MIG180',
        description: 'Practical migration plans from monolith systems to modular architecture.',
        instructor: 'You',
        studentCount: 58,
        category: 'Architecture',
        level: 'Intermediate',
        status: 'archived',
        lessons: 10,
        assignments: 4,
        duration: '5 weeks',
        nextSession: 'Archived',
        isEnrolled: false,
        isOwnedByUser: true,
        progress: 0,
        syllabusHighlights: ['Audit & Scope', 'Strangler Pattern', 'Data Migration', 'Cutover Strategy', 'Post-Migration QA'],
    },
]

const STANFORD_ORG_ID = 'dbb3b2a0-42c2-40f4-b209-1736e655977a'
const GOOGLE_ORG_ID = 'e155d5d3-75f5-43a7-e532-40691988200d'

const studentMockCoursesByOrg: Record<string, CourseCard[]> = {
    [STANFORD_ORG_ID]: studentMockCourses.map((course, idx) => ({
        ...course,
        id: `stanford-${idx}-${course.id}`,
        title: course.title.startsWith('Stanford') ? course.title : `Stanford • ${course.title}`,
        category: 'Stanford',
    })),
    [GOOGLE_ORG_ID]: studentMockCourses.map((course, idx) => ({
        ...course,
        id: `google-${idx}-${course.id}`,
        title: course.title.startsWith('Google') ? course.title : `Google • ${course.title}`,
        category: 'Google',
    })),
}

const teacherMockCoursesByOrg: Record<string, CourseCard[]> = {
    [STANFORD_ORG_ID]: teacherMockCourses.map((course, idx) => ({
        ...course,
        id: `stanford-teacher-${idx}-${course.id}`,
        title: course.title.startsWith('Stanford') ? course.title : `Stanford • ${course.title}`,
        category: 'Stanford',
    })),
    [GOOGLE_ORG_ID]: teacherMockCourses.map((course, idx) => ({
        ...course,
        id: `google-teacher-${idx}-${course.id}`,
        title: course.title.startsWith('Google') ? course.title : `Google • ${course.title}`,
        category: 'Google',
    })),
}

function getMockCoursesForRole(role: UserRole, orgId?: string): CourseCard[] {
    if (role === 'TEACHER') {
        if (orgId && teacherMockCoursesByOrg[orgId]) return teacherMockCoursesByOrg[orgId]
        return teacherMockCourses
    }

    if (role === 'STUDENT') {
        if (orgId && studentMockCoursesByOrg[orgId]) return studentMockCoursesByOrg[orgId]
        return studentMockCourses
    }

    // Organizer should primarily see real backend courses they manage.
    return []
}

export function OrgCoursesPage() {
    const { orgId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const effectiveRole: UserRole = user?.role || 'STUDENT'

    const [courses, setCourses] = useState<CourseCard[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all')
    const [focusFilter, setFocusFilter] = useState<'all' | 'enrolled' | 'recommended' | 'teaching' | 'drafts'>('all')
    const [sortBy, setSortBy] = useState<'title' | 'students' | 'progress'>('title')
    const [selectedCourse, setSelectedCourse] = useState<CourseCard | null>(null)
    const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true)

            const mockCourses = getMockCoursesForRole(effectiveRole, orgId)

            let realCourses: CourseCard[] = []
            try {
                const res = await apiClient.get(`/courses/org/${orgId}`)
                realCourses = (res.data || []).map((course: any) => ({
                    id: String(course.id),
                    title: String(course.title ?? 'Untitled Course'),
                    code: String(course.code ?? 'N/A'),
                    description: String(course.description ?? 'No description provided.'),
                    instructor: String(course.instructor ?? 'TBA'),
                    studentCount: Number(course.studentCount ?? 0),
                    category: String(course.category ?? 'General'),
                    level: (course.level || 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
                    status: (course.status || 'active') as CourseStatus,
                    lessons: Number(course.lessons ?? 12),
                    assignments: Number(course.assignments ?? 6),
                    duration: String(course.duration ?? '8 weeks'),
                    nextSession: String(course.nextSession ?? 'TBA'),
                    isEnrolled: Boolean(course.isEnrolled ?? effectiveRole === 'STUDENT'),
                    isOwnedByUser: Boolean(course.isOwnedByUser ?? effectiveRole === 'TEACHER'),
                    progress: Number(course.progress ?? 0),
                    syllabusHighlights: Array.isArray(course.syllabusHighlights) && course.syllabusHighlights.length > 0
                        ? course.syllabusHighlights
                        : ['Introduction', 'Core Concepts', 'Practice', 'Assessment'],
                }))
            } catch {
                // Keep mock content visible and functional even when backend responds 403/empty.
            }

            const dedup = new Map<string, CourseCard>()
            mockCourses.forEach((c) => dedup.set(c.id, c))
            realCourses.forEach((c) => dedup.set(c.id, c))
            setCourses(Array.from(dedup.values()))
        } finally {
            setLoading(false)
        }
    }, [effectiveRole, orgId])

    useEffect(() => {
        if (orgId) fetchCourses()
    }, [orgId, fetchCourses])

    const handleCreateCourse = async () => {
        if (effectiveRole !== 'ORGANIZER') {
            alert('Only Organization Admins can create courses.')
            return
        }

        const title = prompt('Enter Course Title:')
        if (!title) return
        const code = prompt('Enter Course Code (e.g. CS101):')
        if (!code) return

        try {
            await apiClient.post('/courses', {
                orgId,
                title,
                code,
                description: 'New course created via MyWay platform.',
            })
            fetchCourses()
        } catch {
            alert('Failed to create course. Ensure you have ORGANIZER permissions.')
        }
    }

    const toggleBookmark = (courseId: string) => {
        setBookmarks((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
    }

    const filteredCourses = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()

        let next = courses.filter((c) => {
            const title = String(c.title).toLowerCase()
            const code = String(c.code).toLowerCase()
            const category = String(c.category).toLowerCase()
            return title.includes(query) || code.includes(query) || category.includes(query)
        })

        if (statusFilter !== 'all') {
            next = next.filter((c) => c.status === statusFilter)
        }

        if (effectiveRole === 'STUDENT') {
            if (focusFilter === 'enrolled') next = next.filter((c) => c.isEnrolled)
            if (focusFilter === 'recommended') next = next.filter((c) => !c.isEnrolled)
        }

        if (effectiveRole === 'TEACHER') {
            if (focusFilter === 'teaching') next = next.filter((c) => c.isOwnedByUser)
            if (focusFilter === 'drafts') next = next.filter((c) => c.status === 'draft')
        }

        if (sortBy === 'students') {
            next = [...next].sort((a, b) => b.studentCount - a.studentCount)
        } else if (sortBy === 'progress') {
            next = [...next].sort((a, b) => b.progress - a.progress)
        } else {
            next = [...next].sort((a, b) => a.title.localeCompare(b.title))
        }

        return next
    }, [courses, effectiveRole, focusFilter, searchQuery, sortBy, statusFilter])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <OrgSidebar />

            <div className="md:pl-64 flex flex-col min-h-screen">
                <OrgTopBar />

                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institution Courses</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    {effectiveRole === 'STUDENT' && 'Browse enrolled and recommended courses with rich mock content.'}
                                    {effectiveRole === 'TEACHER' && 'Manage your teaching catalog with draft/active/archived mock courses.'}
                                    {effectiveRole === 'ORGANIZER' && 'Create and manage courses across your organization.'}
                                </p>
                            </div>

                            {effectiveRole === 'ORGANIZER' && (
                                <button
                                    onClick={handleCreateCourse}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 dark:shadow-none"
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">New Course</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                            <div className="relative lg:col-span-2">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title, code, category..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3">
                                <SlidersHorizontal size={16} className="text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | CourseStatus)}
                                    className="w-full py-2 bg-transparent outline-none text-sm"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3">
                                <BookOpen size={16} className="text-gray-400" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'title' | 'students' | 'progress')}
                                    className="w-full py-2 bg-transparent outline-none text-sm"
                                >
                                    <option value="title">Sort: Title</option>
                                    <option value="students">Sort: Students</option>
                                    <option value="progress">Sort: Progress</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFocusFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium ${focusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                            >
                                All
                            </button>

                            {effectiveRole === 'STUDENT' && (
                                <>
                                    <button
                                        onClick={() => setFocusFilter('enrolled')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${focusFilter === 'enrolled' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                                    >
                                        Enrolled
                                    </button>
                                    <button
                                        onClick={() => setFocusFilter('recommended')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${focusFilter === 'recommended' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                                    >
                                        Recommended
                                    </button>
                                </>
                            )}

                            {effectiveRole === 'TEACHER' && (
                                <>
                                    <button
                                        onClick={() => setFocusFilter('teaching')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${focusFilter === 'teaching' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                                    >
                                        Teaching
                                    </button>
                                    <button
                                        onClick={() => setFocusFilter('drafts')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${focusFilter === 'drafts' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                                    >
                                        Drafts
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen size={40} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Courses Found</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">Try changing filters or search keywords.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCourses.map((course) => (
                                <motion.div
                                    key={course.id}
                                    whileHover={{ y: -4 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="h-2 bg-indigo-600" />
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded text-xs font-bold uppercase tracking-wider">
                                                {course.code || 'N/A'}
                                            </span>
                                            <button
                                                onClick={() => toggleBookmark(course.id)}
                                                className="text-gray-400 hover:text-amber-500 transition-colors"
                                                title="Bookmark"
                                            >
                                                {bookmarks[course.id] ? <Star size={16} className="fill-amber-400 text-amber-400" /> : <BookMarked size={16} />}
                                            </button>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                {course.title || 'Untitled Course'}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{course.description}</p>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">{course.category}</span>
                                            <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">{course.level}</span>
                                            <span className={`px-2 py-1 rounded-full ${course.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : course.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {course.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5"><Users size={14} /> {course.studentCount} students</div>
                                            <div className="flex items-center gap-1.5"><Clock3 size={14} /> {course.duration}</div>
                                            <div>{course.lessons} lessons</div>
                                            <div>{course.assignments} assignments</div>
                                        </div>

                                        {effectiveRole === 'STUDENT' && course.isEnrolled && (
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-gray-500">Progress</span>
                                                    <span className="font-semibold text-indigo-600">{course.progress}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, course.progress))}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setSelectedCourse(course)}
                                                className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => navigate(`/course/${course.id}`)}
                                                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:gap-3 transition-all"
                                            >
                                                {effectiveRole === 'STUDENT' ? (course.isEnrolled ? 'Continue' : 'Explore') : effectiveRole === 'TEACHER' ? 'Manage' : 'Open'}
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4"
                        onClick={() => setSelectedCourse(null)}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-xl font-bold">{selectedCourse.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{selectedCourse.code} • {selectedCourse.instructor}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
                                >
                                    Close
                                </button>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedCourse.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-sm">
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="text-xs text-gray-500">Students</div><div className="font-semibold">{selectedCourse.studentCount}</div></div>
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="text-xs text-gray-500">Lessons</div><div className="font-semibold">{selectedCourse.lessons}</div></div>
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="text-xs text-gray-500">Assignments</div><div className="font-semibold">{selectedCourse.assignments}</div></div>
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="text-xs text-gray-500">Next Session</div><div className="font-semibold">{selectedCourse.nextSession}</div></div>
                            </div>

                            <h4 className="font-semibold mb-2">Syllabus Highlights</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-6">
                                {selectedCourse.syllabusHighlights.map((point) => (
                                    <li key={point}>{point}</li>
                                ))}
                            </ul>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => toggleBookmark(selectedCourse.id)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
                                >
                                    {bookmarks[selectedCourse.id] ? 'Remove Bookmark' : 'Bookmark'}
                                </button>
                                <button
                                    onClick={() => navigate(`/course/${selectedCourse.id}`)}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
                                >
                                    Open Course
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
