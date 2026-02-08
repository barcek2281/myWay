import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  CheckCircle,
  Circle,
  Lock,
  Plus
} from 'lucide-react'
import { Module, Lesson, UserRole } from '../types'
import { MaterialImportModal } from './MaterialImportModal'
import { useStudyPacks } from '../../ai-tutor/context/StudyPackContext'

interface ModuleAccordionProps {
  module: Module
  courseId: string
  index: number
  role: UserRole
  onRefresh: () => void
}

export function ModuleAccordion({ module, courseId, index, role, onRefresh }: ModuleAccordionProps) {
  const navigate = useNavigate()
  const { getStudyPacksByModuleId } = useStudyPacks()
  const [isOpen, setIsOpen] = useState(index === 0)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const studyPacks = getStudyPacksByModuleId(module.id)

  const completedLessons = module.lessons.filter((l) => l.completed).length
  const totalLessons = module.lessons.length
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  const getTypeColor = (type: Lesson['type']) => {
    switch (type) {
      case 'video':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
      case 'reading':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      case 'quiz':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white dark:bg-gray-800 border rounded-xl overflow-hidden mb-4 transition-all ${isOpen ? 'border-indigo-200 dark:border-indigo-900/50 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
      {/* Module Header */}
      <div className="relative">
        <div
          onClick={() => !module.isLocked && setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !module.isLocked && setIsOpen(!isOpen)}
          className={`w-full p-6 text-left transition-colors ${module.isLocked ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${module.isLocked ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500' : completedLessons === totalLessons && totalLessons > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'}`}
            >
              {completedLessons === totalLessons && totalLessons > 0 && !module.isLocked ? <CheckCircle size={24} /> : index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-1 ${module.isLocked ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>{module.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{module.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {(role === 'TEACHER' || role === 'ORGANIZER') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsImportModalOpen(true)
                      }}
                      className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <Plus size={14} />
                      Add Material
                    </button>
                  )}

                  {module.isLocked ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-500">
                      <Lock size={14} />
                      <span>Locked</span>
                    </div>
                  ) : (
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-gray-400">
                      <ChevronDown size={20} />
                    </motion.div>
                  )}
                </div>
              </div>

              {!module.isLocked && totalLessons > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progressPercent}%` }}
                      className={`h-full rounded-full ${completedLessons === totalLessons ? 'bg-green-500' : 'bg-indigo-600'}`}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{completedLessons}/{totalLessons} done</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MaterialImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleId={module.id}
        courseId={courseId}
        onSuccess={onRefresh}
      />

      {/* Module Content */}
      <AnimatePresence>
        {isOpen && !module.isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-700"
          >
            <div className="p-6 space-y-6">


              {/* Study Packs - REMOVED as per new architecture (moved to StudyPage) */}
              {/* {studyPacks.length > 0 && ( ... )} */}

              {/* Lessons */}
              {module.lessons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    Course Materials
                  </h4>
                  {module.lessons.map((lesson) => (
                    <motion.button
                      key={lesson.id}
                      onClick={() => navigate(`/study/${lesson.id}`)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${lesson.completed ? 'bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900/30' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900/50'}`}
                    >
                      <div className="flex-shrink-0">
                        {lesson.completed ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <Circle size={20} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTypeColor(lesson.type)}`}>
                            {lesson.type}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                        Study Lesson
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {module.lessons.length === 0 && studyPacks.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No materials in this module yet.</p>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Plus size={20} />
                    Import Your First Material
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
