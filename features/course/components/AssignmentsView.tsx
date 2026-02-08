import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  FileUp,
  Link as LinkIcon,
  Loader2,
  Plus,
  Upload,
} from 'lucide-react'
import apiClient from '../../../lib/axios-client'
import { useAuth } from '../../auth/context/AuthContext'
import { UserRole } from '../../auth/types'

type AssignmentStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Graded'
type SubmissionStatus = 'SUBMITTED' | 'GRADED'
type FilterType = 'all' | 'pending' | 'submitted' | 'graded'

interface SubmissionItem {
  id: string
  userId: string
  studentName?: string
  status: SubmissionStatus
  submittedAt?: string
  fileUrl?: string
  grade?: string
  feedback?: string
}

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate?: string
  status: AssignmentStatus
  grade?: string
  maxPoints: number
  submittedDate?: string
  submissionUrl?: string
  attachmentName?: string
  submissions?: SubmissionItem[]
}

interface InfoModalState {
  title: string
  message: string
  tone: 'success' | 'error' | 'info'
}

const isUuid = (value?: string) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const mockAssignmentsStorageKey = (courseId?: string) => `myway_mock_assignments_${courseId || 'unknown'}`

const fileNameFromUrl = (fileUrl?: string) => {
  if (!fileUrl) return undefined
  if (fileUrl.startsWith('attached://')) {
    return decodeURIComponent(fileUrl.replace('attached://', ''))
  }
  const parts = fileUrl.split('/')
  return parts[parts.length - 1] || fileUrl
}

const mapSubmissionStatus = (value?: string): SubmissionStatus => {
  if (value?.toUpperCase() === 'GRADED') return 'GRADED'
  return 'SUBMITTED'
}

const mapAssignmentStatus = (value?: string): AssignmentStatus => {
  const upper = (value || '').toUpperCase()
  if (upper === 'GRADED') return 'Graded'
  if (upper === 'SUBMITTED') return 'Submitted'
  if (upper === 'IN_PROGRESS') return 'In Progress'
  return 'Not Started'
}

const buildDefaultMockAssignments = (role: UserRole, userName: string): Assignment[] => {
  const teacherSubmissions: SubmissionItem[] = [
    {
      id: 'sub-m1',
      userId: 'student-001',
      studentName: 'Aruzhan K.',
      status: 'SUBMITTED',
      submittedAt: '2026-02-08',
      fileUrl: 'attached://python-calculator.zip',
    },
    {
      id: 'sub-m2',
      userId: 'student-002',
      studentName: 'Nursultan A.',
      status: 'GRADED',
      submittedAt: '2026-02-07',
      fileUrl: 'https://drive.google.com/example-submission',
      grade: '92',
      feedback: 'Clean solution, improve edge-case handling.',
    },
  ]

  const studentSubmittedFile = `attached://${encodeURIComponent('my-solution-v1.zip')}`

  return [
    {
      id: 'a1',
      title: 'Programming Assignment 1',
      description: 'Create a simple calculator app using module concepts.',
      dueDate: '2026-02-15',
      status: role === 'STUDENT' ? 'Submitted' : 'In Progress',
      grade: role === 'STUDENT' ? '95' : undefined,
      maxPoints: 100,
      submittedDate: role === 'STUDENT' ? '2026-02-10' : undefined,
      submissionUrl: role === 'STUDENT' ? studentSubmittedFile : undefined,
      attachmentName: role === 'STUDENT' ? 'my-solution-v1.zip' : undefined,
      submissions: role === 'STUDENT'
        ? [{ id: 'self-sub', userId: 'self', studentName: userName, status: 'SUBMITTED', submittedAt: '2026-02-10', fileUrl: studentSubmittedFile }]
        : teacherSubmissions,
    },
    {
      id: 'a2',
      title: 'Data Structures Quiz Task',
      description: 'Submit a report comparing arrays, linked lists, and hash maps.',
      dueDate: '2026-02-22',
      status: 'In Progress',
      maxPoints: 50,
      submissions: role === 'STUDENT' ? [] : [
        {
          id: 'sub-m3',
          userId: 'student-003',
          studentName: 'Dana S.',
          status: 'SUBMITTED',
          submittedAt: '2026-02-20',
          fileUrl: 'attached://structures-report.pdf',
        },
      ],
    },
    {
      id: 'a3',
      title: 'Algorithm Analysis Project',
      description: 'Analyze sorting algorithm complexity and submit a report.',
      dueDate: '2026-03-01',
      status: 'Not Started',
      maxPoints: 150,
      submissions: [],
    },
  ]
}

const loadMockAssignments = (courseId: string | undefined, role: UserRole, userName: string): Assignment[] => {
  try {
    const raw = localStorage.getItem(mockAssignmentsStorageKey(courseId))
    if (raw) {
      const parsed = JSON.parse(raw) as Assignment[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore parsing issues
  }
  const defaults = buildDefaultMockAssignments(role, userName)
  localStorage.setItem(mockAssignmentsStorageKey(courseId), JSON.stringify(defaults))
  return defaults
}

const saveMockAssignments = (courseId: string | undefined, assignments: Assignment[]) => {
  try {
    localStorage.setItem(mockAssignmentsStorageKey(courseId), JSON.stringify(assignments))
  } catch {
    // ignore storage failures
  }
}

export function AssignmentsView() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const role = (user?.role || 'STUDENT') as UserRole
  const isTeacherView = role === 'TEACHER' || role === 'ORGANIZER'
  const userName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student'

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isMockMode, setIsMockMode] = useState(false)

  const [submitDialogAssignmentId, setSubmitDialogAssignmentId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submissionLink, setSubmissionLink] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [infoModal, setInfoModal] = useState<InfoModalState | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createInstructions, setCreateInstructions] = useState('')
  const [createPoints, setCreatePoints] = useState('100')
  const [createDueAt, setCreateDueAt] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [manageAssignment, setManageAssignment] = useState<Assignment | null>(null)
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null)
  const [gradeScore, setGradeScore] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [gradeError, setGradeError] = useState<string | null>(null)
  const [isGrading, setIsGrading] = useState(false)

  const openInfoModal = (title: string, message: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setInfoModal({ title, message, tone })
  }

  const fetchAssignments = async () => {
    setLoading(true)

    if (!courseId || !isUuid(courseId)) {
      setIsMockMode(true)
      setAssignments(loadMockAssignments(courseId, role, userName))
      setLoading(false)
      return
    }

    try {
      const res = await apiClient.get(`/assignments/course/${courseId}`)
      const baseAssignments: Assignment[] = (res.data || []).map((a: any) => ({
        id: String(a.id),
        title: a.title || 'Assignment',
        description: a.instructions || '',
        dueDate: a.dueAt ? String(a.dueAt).slice(0, 10) : undefined,
        status: mapAssignmentStatus(a.status),
        grade: a.submission?.grade,
        maxPoints: Number(a.points || 0),
        submittedDate: a.submission?.submittedAt ? String(a.submission.submittedAt).slice(0, 10) : undefined,
        submissionUrl: a.submission?.fileUrl,
        attachmentName: fileNameFromUrl(a.submission?.fileUrl),
        submissions: [],
      }))

      let mergedAssignments = baseAssignments

      if (isTeacherView && baseAssignments.length > 0) {
        const detailed = await Promise.all(
          baseAssignments.map(async (assignment) => {
            try {
              const detailRes = await apiClient.get(`/assignments/${assignment.id}`)
              return detailRes.data
            } catch {
              return null
            }
          }),
        )

        mergedAssignments = baseAssignments.map((assignment, idx) => {
          const details = detailed[idx]
          const rawSubmissions = Array.isArray(details?.submissions) ? details.submissions : []

          const submissions: SubmissionItem[] = rawSubmissions.map((sub: any) => ({
            id: String(sub.id),
            userId: String(sub.userId || sub.user_id || 'unknown-user'),
            studentName: String(sub.userId || sub.user_id || 'Student'),
            status: mapSubmissionStatus(String(sub.status || 'SUBMITTED')),
            submittedAt: sub.submittedAt ? String(sub.submittedAt).slice(0, 10) : undefined,
            fileUrl: sub.fileUrl || sub.file_url || undefined,
            grade: sub.grade || undefined,
            feedback: sub.feedback || undefined,
          }))

          return { ...assignment, submissions }
        })
      }

      if (mergedAssignments.length > 0) {
        setIsMockMode(false)
        setAssignments(mergedAssignments)
      } else {
        setIsMockMode(true)
        setAssignments(loadMockAssignments(courseId, role, userName))
      }
    } catch {
      setIsMockMode(true)
      setAssignments(loadMockAssignments(courseId, role, userName))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, role])

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    if (filter === 'all') return true
    if (filter === 'pending') return assignment.status === 'Not Started' || assignment.status === 'In Progress'
    if (filter === 'submitted') return assignment.status === 'Submitted'
    if (filter === 'graded') return assignment.status === 'Graded'
    return true
  }), [assignments, filter])

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  const openSubmitDialog = (assignmentId: string) => {
    setSubmitDialogAssignmentId(assignmentId)
    setSelectedFile(null)
    setSubmissionLink('')
    setSubmitError(null)
  }

  const closeSubmitDialog = () => {
    setSubmitDialogAssignmentId(null)
    setSelectedFile(null)
    setSubmissionLink('')
    setSubmitError(null)
  }

  const handleSubmitAssignment = async () => {
    if (!submitDialogAssignmentId) return
    if (!selectedFile && !submissionLink.trim()) {
      setSubmitError('Attach a file or provide a submission URL.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const submittedDate = new Date().toISOString().slice(0, 10)
    const generatedFileUrl = submissionLink.trim() || `attached://${encodeURIComponent(selectedFile?.name || 'submission-file')}`
    const attachmentName = selectedFile?.name || fileNameFromUrl(generatedFileUrl)

    if (isMockMode) {
      const next: Assignment[] = assignments.map((assignment): Assignment => {
        if (assignment.id !== submitDialogAssignmentId) return assignment

        const submission: SubmissionItem = {
          id: `sub-${Date.now()}`,
          userId: 'self',
          studentName: userName,
          status: 'SUBMITTED',
          submittedAt: submittedDate,
          fileUrl: generatedFileUrl,
        }

        return {
          ...assignment,
          status: 'Submitted' as AssignmentStatus,
          submittedDate,
          submissionUrl: generatedFileUrl,
          attachmentName,
          submissions: [...(assignment.submissions || []), submission],
        }
      })

      setAssignments(next)
      saveMockAssignments(courseId, next)
      closeSubmitDialog()
      openInfoModal('Submission Saved', 'Your submission was saved in mock mode.', 'success')
      setIsSubmitting(false)
      return
    }

    try {
      await apiClient.post(`/assignments/${submitDialogAssignmentId}/submit`, { fileUrl: generatedFileUrl })
      await fetchAssignments()
      closeSubmitDialog()
      openInfoModal('Assignment Submitted', 'Assignment submitted successfully!', 'success')
    } catch {
      setSubmitError('Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCreateModal = () => {
    setIsCreateModalOpen(true)
    setCreateTitle('')
    setCreateInstructions('')
    setCreatePoints('100')
    setCreateDueAt('')
    setCreateError(null)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setCreateError(null)
  }

  const handleCreateAssignment = async () => {
    if (!createTitle.trim()) {
      setCreateError('Assignment title is required.')
      return
    }
    if (!createDueAt) {
      setCreateError('Due date is required.')
      return
    }

    const points = Number(createPoints)
    if (!Number.isFinite(points) || points <= 0) {
      setCreateError('Points must be a positive number.')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    if (isMockMode || !courseId || !isUuid(courseId)) {
      const newAssignment: Assignment = {
        id: `a-${Date.now()}`,
        title: createTitle.trim(),
        description: createInstructions.trim(),
        dueDate: createDueAt.slice(0, 10),
        status: 'Not Started',
        maxPoints: points,
        submissions: [],
      }
      const next = [newAssignment, ...assignments]
      setAssignments(next)
      saveMockAssignments(courseId, next)
      closeCreateModal()
      openInfoModal('Assignment Created', 'Mock assignment has been created.', 'success')
      setIsCreating(false)
      return
    }

    try {
      await apiClient.post('/assignments', {
        courseId,
        title: createTitle.trim(),
        dueAt: new Date(createDueAt).toISOString(),
        points,
        instructions: createInstructions.trim() || 'Assignment instructions',
      })
      closeCreateModal()
      openInfoModal('Assignment Created', 'Assignment has been published for students.', 'success')
      await fetchAssignments()
    } catch {
      setCreateError('Failed to create assignment. Check permissions and course context.')
    } finally {
      setIsCreating(false)
    }
  }

  const openManageSubmissions = (assignment: Assignment) => {
    setManageAssignment(assignment)
    setGradingSubmissionId(null)
    setGradeScore('')
    setGradeFeedback('')
    setGradeError(null)
  }

  const closeManageSubmissions = () => {
    setManageAssignment(null)
    setGradingSubmissionId(null)
    setGradeError(null)
  }

  const handleGradeSubmission = async () => {
    if (!manageAssignment || !gradingSubmissionId) return

    const score = Number(gradeScore)
    if (!Number.isFinite(score) || score < 0 || score > manageAssignment.maxPoints) {
      setGradeError(`Score must be between 0 and ${manageAssignment.maxPoints}.`)
      return
    }

    setIsGrading(true)
    setGradeError(null)

    if (isMockMode) {
      const next: Assignment[] = assignments.map((assignment): Assignment => {
        if (assignment.id !== manageAssignment.id) return assignment

        const updatedSubmissions: SubmissionItem[] = (assignment.submissions || []).map((sub): SubmissionItem => (
          sub.id === gradingSubmissionId
            ? { ...sub, status: 'GRADED' as SubmissionStatus, grade: String(score), feedback: gradeFeedback.trim() || undefined }
            : sub
        ))

        return {
          ...assignment,
          submissions: updatedSubmissions,
        }
      })

      setAssignments(next)
      saveMockAssignments(courseId, next)
      const updated = next.find((a) => a.id === manageAssignment.id) || null
      setManageAssignment(updated)
      setGradingSubmissionId(null)
      setGradeScore('')
      setGradeFeedback('')
      openInfoModal('Submission Graded', 'Mock submission has been graded.', 'success')
      setIsGrading(false)
      return
    }

    try {
      await apiClient.put(`/submissions/${gradingSubmissionId}/grade`, {
        score,
        feedback: gradeFeedback.trim(),
      })
      await fetchAssignments()
      const refreshed = assignments.find((a) => a.id === manageAssignment.id) || null
      setManageAssignment(refreshed)
      setGradingSubmissionId(null)
      setGradeScore('')
      setGradeFeedback('')
      openInfoModal('Submission Graded', 'Submission graded successfully.', 'success')
    } catch {
      setGradeError('Failed to grade submission.')
    } finally {
      setIsGrading(false)
    }
  }

  const handleStudentAction = (assignment: Assignment) => {
    if (assignment.status === 'Not Started' || assignment.status === 'In Progress') {
      openSubmitDialog(assignment.id)
      return
    }

    if (assignment.status === 'Submitted') {
      navigate(`/course/${courseId || 'unknown'}/assignments/${assignment.id}/submission`, {
        state: { assignment },
      })
      return
    }

    if (assignment.status === 'Graded') {
      openInfoModal('Grade Details', `Grade: ${assignment.grade || '-'} / ${assignment.maxPoints}`, 'info')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assignments</h2>
          <p className="text-gray-600 dark:text-gray-400">Track submissions, create tasks, and manage grading</p>
          {isMockMode && (
            <div className="mt-3 inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1">
              Mock Mode: local data storage is active
            </div>
          )}
        </div>

        {isTeacherView && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            <Plus size={16} />
            Create Assignment
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8">
        {[
          { id: 'all', label: 'All', count: assignments.length },
          { id: 'pending', label: 'Pending', count: assignments.filter((a) => a.status === 'Not Started' || a.status === 'In Progress').length },
          { id: 'submitted', label: 'Submitted', count: assignments.filter((a) => a.status === 'Submitted').length },
          { id: 'graded', label: 'Graded', count: assignments.filter((a) => a.status === 'Graded').length },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.id
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {tab.label}
            <span className={`ml-2 ${filter === tab.id ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>{tab.count}</span>
          </motion.button>
        ))}
      </div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {filteredAssignments.map((assignment, index) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg dark:hover:border-gray-600 transition-all"
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${assignment.status === 'Graded'
                ? 'bg-green-500'
                : assignment.status === 'Submitted'
                  ? 'bg-blue-500'
                  : assignment.status === 'In Progress'
                    ? 'bg-amber-500'
                    : 'bg-gray-300'
                }`}
            />

            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{assignment.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{assignment.description}</p>

                <div className="flex items-center gap-4 text-sm mt-4 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                    <span>Due {assignment.dueDate || '-'}</span>
                  </div>

                  {assignment.submittedDate && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <CheckCircle size={16} className="text-green-500" />
                      <span>Submitted {assignment.submittedDate}</span>
                    </div>
                  )}

                  {assignment.attachmentName && (
                    <div className="text-gray-500 dark:text-gray-400 truncate max-w-[220px]">File: {assignment.attachmentName}</div>
                  )}

                  <div className="text-gray-500 dark:text-gray-500">{assignment.maxPoints} points</div>

                  {isTeacherView && (
                    <div className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {(assignment.submissions || []).length} submission(s)
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-4 min-w-[170px]">
                {assignment.grade ? (
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getGradeColor(parseInt(assignment.grade, 10))}`}>{assignment.grade}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">/ {assignment.maxPoints}</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {assignment.status === 'Not Started' && <><Circle size={14} className="text-gray-400" /><span>Not Started</span></>}
                    {assignment.status === 'In Progress' && <><Clock size={14} className="text-amber-500" /><span className="text-amber-700 dark:text-amber-400">In Progress</span></>}
                    {assignment.status === 'Submitted' && <><CheckCircle size={14} className="text-blue-500" /><span className="text-blue-700 dark:text-blue-400">Submitted</span></>}
                  </div>
                )}

                {isTeacherView ? (
                  <button
                    type="button"
                    onClick={() => openManageSubmissions(assignment)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <span>View Submissions</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStudentAction(assignment)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${assignment.status === 'Graded'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                      }`}
                  >
                    {assignment.status === 'Graded' && <span>View Details</span>}
                    {assignment.status === 'Submitted' && <span>View Submission</span>}
                    {(assignment.status === 'Not Started' || assignment.status === 'In Progress') && (
                      <span>{assignment.status === 'Not Started' ? 'Start Assignment' : 'Continue'}</span>
                    )}
                    <ArrowRight size={16} />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No assignments found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      )}

      {submitDialogAssignmentId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submit Assignment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Attach your file and optionally include a cloud link.</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">File Attachment</label>
                <label className="block cursor-pointer">
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
                  <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-xl px-5 py-8 bg-indigo-50/40 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-center">
                    <div className="w-11 h-11 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center mb-3">
                      <Upload size={20} className="text-indigo-600 dark:text-indigo-300" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to choose another file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Click to attach a file</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Any document, archive, or source file</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Submission URL (optional)</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 pl-9 pr-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">{submitError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeSubmitDialog} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="button" onClick={handleSubmitAssignment} disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-60">
                  <FileUp size={16} />
                  {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Assignment</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title</label>
                <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Instructions</label>
                <textarea value={createInstructions} onChange={(e) => setCreateInstructions(e.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Points</label>
                  <input type="number" min={1} value={createPoints} onChange={(e) => setCreatePoints(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Due Date</label>
                  <input type="datetime-local" value={createDueAt} onChange={(e) => setCreateDueAt(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
                </div>
              </div>

              {createError && <p className="text-sm text-red-600">{createError}</p>}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={closeCreateModal} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
              <button type="button" onClick={handleCreateAssignment} disabled={isCreating} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-60">
                {isCreating ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {manageAssignment && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submissions: {manageAssignment.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review and grade student submissions</p>
              </div>
              <button type="button" onClick={closeManageSubmissions} className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm">Close</button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {(manageAssignment.submissions || []).length === 0 && (
                <p className="text-sm text-gray-500">No submissions yet for this assignment.</p>
              )}

              {(manageAssignment.submissions || []).map((sub) => (
                <div key={sub.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{sub.studentName || sub.userId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Submitted: {sub.submittedAt || '-'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {sub.status}
                    </span>
                  </div>

                  {sub.fileUrl && (
                    <div className="mt-2">
                      {sub.fileUrl.startsWith('attached://') ? (
                        <p className="text-xs text-gray-500">File: {fileNameFromUrl(sub.fileUrl)}</p>
                      ) : (
                        <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                          Open submission link
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}

                  {sub.status === 'GRADED' && (
                    <p className="text-xs text-green-700 mt-2">Grade: {sub.grade || '-'} {sub.feedback ? `• ${sub.feedback}` : ''}</p>
                  )}

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGradingSubmissionId(sub.id)
                        setGradeScore(sub.grade || '')
                        setGradeFeedback(sub.feedback || '')
                        setGradeError(null)
                      }}
                      className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold"
                    >
                      {sub.status === 'GRADED' ? 'Update Grade' : 'Grade Submission'}
                    </button>
                  </div>

                  {gradingSubmissionId === sub.id && (
                    <div className="mt-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">Score (max {manageAssignment.maxPoints})</label>
                          <input
                            type="number"
                            min={0}
                            max={manageAssignment.maxPoints}
                            value={gradeScore}
                            onChange={(e) => setGradeScore(e.target.value)}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">Feedback</label>
                          <input
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                          />
                        </div>
                      </div>

                      {gradeError && <p className="text-xs text-red-600">{gradeError}</p>}

                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setGradingSubmissionId(null)} className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-xs">Cancel</button>
                        <button type="button" onClick={handleGradeSubmission} disabled={isGrading} className="px-3 py-1.5 rounded bg-green-600 text-white text-xs font-semibold disabled:opacity-60">
                          {isGrading ? 'Saving...' : 'Save Grade'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {infoModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3
              className={`text-lg font-bold mb-3 ${infoModal.tone === 'success'
                ? 'text-green-700 dark:text-green-300'
                : infoModal.tone === 'error'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-gray-900 dark:text-white'
                }`}
            >
              {infoModal.title}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{infoModal.message}</p>
            <div className="flex justify-end mt-5">
              <button type="button" onClick={() => setInfoModal(null)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

