import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  FileText,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import apiClient from '../../../lib/axios-client'

type AssignmentStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Graded'
type FilterType = 'all' | 'pending' | 'submitted' | 'graded'

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate?: string
  status: AssignmentStatus
  grade?: string
  maxPoints: number
  submittedDate?: string
}

export function AssignmentsView() {
  const { courseId } = useParams()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await apiClient.get(`/assignments/course/${courseId}`)
        const backendAssignments = (res.data || []).map((a: any) => {
          const statusMap: Record<string, AssignmentStatus> = {
            NOT_STARTED: 'Not Started',
            IN_PROGRESS: 'In Progress',
            SUBMITTED: 'Submitted',
            GRADED: 'Graded',
          }

          return {
            id: String(a.id),
            title: a.title || 'Assignment',
            description: a.instructions || '',
            dueDate: a.dueAt ? String(a.dueAt).slice(0, 10) : undefined,
            status: statusMap[a.status] || 'Not Started',
            grade: a.submission?.grade,
            maxPoints: a.points || 0,
            submittedDate: a.submission?.submittedAt ? String(a.submission.submittedAt).slice(0, 10) : undefined,
          } as Assignment
        })

        if (backendAssignments.length > 0) {
          setAssignments(backendAssignments)
          return
        }

        // Mock assignment data
        const mockAssignments: Assignment[] = [
          {
            id: 'a1',
            title: 'Programming Assignment 1',
            description: 'Create a simple calculator application using the concepts learned in class.',
            dueDate: '2026-02-15',
            status: 'Submitted',
            grade: '95',
            maxPoints: 100,
            submittedDate: '2026-02-10'
          },
          {
            id: 'a2',
            title: 'Data Structures Quiz',
            description: 'Complete the online quiz covering arrays, linked lists, and hash maps.',
            dueDate: '2026-02-22',
            status: 'In Progress',
            maxPoints: 50
          },
          {
            id: 'a3',
            title: 'Algorithm Analysis Project',
            description: 'Analyze the time complexity of various sorting algorithms and write a report.',
            dueDate: '2026-03-01',
            status: 'Not Started',
            maxPoints: 150
          },
          {
            id: 'a4',
            title: 'Midterm Exam Preparation',
            description: 'Review all material covered in weeks 1-6 and complete practice problems.',
            dueDate: '2026-03-10',
            status: 'Not Started',
            maxPoints: 200
          },
          {
            id: 'a5',
            title: 'Group Project Proposal',
            description: 'Submit a 2-page proposal for your final group project including team members and timeline.',
            dueDate: '2026-02-05',
            status: 'Graded',
            grade: '88',
            maxPoints: 100,
            submittedDate: '2026-02-04'
          }
        ];
        setAssignments(mockAssignments);
      } catch (err) {
        console.error('Fetch assignments failed, using fallback mock:', err);
        const mockAssignments: Assignment[] = [
          {
            id: 'a1',
            title: 'Programming Assignment 1',
            description: 'Create a simple calculator application using the concepts learned in class.',
            dueDate: '2026-02-15',
            status: 'Submitted',
            grade: '95',
            maxPoints: 100,
            submittedDate: '2026-02-10',
          },
        ]
        setAssignments(mockAssignments)
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchAssignments();
  }, [courseId]);

  const handleSubmit = async (assignmentId: string) => {
    const fileUrl = prompt('Enter the URL of your submission (e.g. Google Drive/GitHub):')
    if (!fileUrl) return

    try {
      await apiClient.post(`/assignments/${assignmentId}/submit`, { fileUrl })
      alert('Assignment submitted successfully!')
      window.location.reload() // Refresh to show status
    } catch (err) {
      alert('Submission failed. Please try again.')
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === 'all') return true
    if (filter === 'pending')
      return (
        assignment.status === 'Not Started' ||
        assignment.status === 'In Progress'
      )
    if (filter === 'submitted') return assignment.status === 'Submitted'
    if (filter === 'graded') return assignment.status === 'Graded'
    return true
  })

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 70) return 'text-amber-600'
    return 'text-red-600'
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
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assignments</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and submit your work
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8">
        {[
          {
            id: 'all',
            label: 'All',
            count: assignments.length,
          },
          {
            id: 'pending',
            label: 'Pending',
            count: assignments.filter(
              (a: any) => a.status === 'Not Started' || a.status === 'In Progress',
            ).length,
          },
          {
            id: 'submitted',
            label: 'Submitted',
            count: assignments.filter((a: any) => a.status === 'Submitted')
              .length,
          },
          {
            id: 'graded',
            label: 'Graded',
            count: assignments.filter((a: any) => a.status === 'Graded').length,
          },
        ].map((tab: any) => (
          <motion.button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {tab.label}
            <span
              className={`ml-2 ${filter === tab.id ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {tab.count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Assignments Grid */}
      <motion.div
        className="space-y-4"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 0.3,
        }}
      >
        {filteredAssignments.map((assignment, index) => (
          <motion.div
            key={assignment.id}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.05,
            }}
            className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg dark:hover:border-gray-600 transition-all"
          >
            {/* Status Indicator Bar */}
            <div
              className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${assignment.status === 'Graded' ? 'bg-green-500' : assignment.status === 'Submitted' ? 'bg-blue-500' : assignment.status === 'In Progress' ? 'bg-amber-500' : 'bg-gray-300'}`}
            />

            <div className="flex gap-6">
              {/* Left: Assignment Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {assignment.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                      {assignment.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                    <span>Due {assignment.dueDate}</span>
                  </div>

                  {assignment.submittedDate && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <div className="flex items-center gap-2 text-gray-500">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Submitted {assignment.submittedDate}</span>
                      </div>
                    </>
                  )}

                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <div className="text-gray-500 dark:text-gray-500">
                    {assignment.maxPoints} points
                  </div>
                </div>
              </div>

              {/* Right: Grade & Actions */}
              <div className="flex flex-col items-end justify-between gap-4">
                {assignment.grade ? (
                  <div className="text-right">
                    <div
                      className={`text-4xl font-bold ${getGradeColor(parseInt(assignment.grade))}`}
                    >
                      {assignment.grade}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      / {assignment.maxPoints}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors">
                    {assignment.status === 'Not Started' && (
                      <>
                        <Circle size={14} className="text-gray-400 dark:text-gray-500" />
                        <span>Not Started</span>
                      </>
                    )}
                    {assignment.status === 'In Progress' && (
                      <>
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-amber-700 dark:text-amber-400">In Progress</span>
                      </>
                    )}
                    {assignment.status === 'Submitted' && (
                      <>
                        <CheckCircle size={14} className="text-blue-500" />
                        <span className="text-blue-700 dark:text-blue-400">Submitted</span>
                      </>
                    )}
                  </div>
                )}

                <motion.button
                  whileHover={{
                    scale: 1.05,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  onClick={() => assignment.status === 'Not Started' && handleSubmit(assignment.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${assignment.status === 'Graded' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}
                >
                  {assignment.status === 'Graded' ? (
                    <>
                      <span>View Details</span>
                      <ArrowRight size={16} />
                    </>
                  ) : assignment.status === 'Submitted' ? (
                    <>
                      <span>View Submission</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <span>
                        {assignment.status === 'Not Started'
                          ? 'Start Assignment'
                          : 'Continue'}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
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
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters
          </p>
        </div>
      )}
    </div>
  )
}
