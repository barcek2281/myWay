import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { CourseSidebar } from '../features/course/components/CourseSidebar'
import { CourseTopBar } from '../features/course/components/CourseTopBar'
import { CourseHeader } from '../features/course/components/CourseHeader'
import { CourseOverview } from '../features/course/components/CourseOverview'
import { ModuleAccordion } from '../features/course/components/ModuleAccordion'
import { AssignmentsView } from '../features/course/components/AssignmentsView'
import { DiscussionsView } from '../features/course/components/DiscussionsView'
import { SyllabusView } from '../features/course/components/SyllabusView'
import { CourseChatWidget } from '../features/ai-tutor/components/CourseChatWidget'
import { Course, UserRole } from '../features/course/types'
import { useAuth } from '../features/auth/context/AuthContext'

const buildFallbackCourse = (id: string, role: UserRole): Course => {
  const lowerId = id.toLowerCase()

  const preset = (() => {
    if (lowerId.includes('cs101')) return { code: 'CS101', title: 'Introduction to Computer Science', instructor: 'Prof. John Doe' }
    if (lowerId.includes('math221')) return { code: 'MATH221', title: 'Linear Algebra', instructor: 'Prof. Jane Smith' }
    if (lowerId.includes('stat110')) return { code: 'STAT110', title: 'Probability', instructor: 'Prof. Joe Blitzstein' }
    if (lowerId.includes('ml101')) return { code: 'ML101', title: 'Machine Learning Crash Course', instructor: 'Google AI Team' }
    if (lowerId.includes('cloud101') || lowerId.includes('cloud')) return { code: 'CLOUD101', title: 'Cloud Computing Fundamentals', instructor: 'Google Cloud Team' }
    if (lowerId.includes('arch330')) return { code: 'ARCH330', title: 'System Design Studio', instructor: 'You' }
    if (lowerId.includes('sec210')) return { code: 'SEC210', title: 'Web API Security Essentials', instructor: 'You' }
    if (lowerId.includes('ai250')) return { code: 'AI250', title: 'AI Tutor Prompting Lab', instructor: 'You' }
    if (lowerId.includes('go401')) return { code: 'GO401', title: 'Advanced Go Backend Engineering', instructor: 'You' }

    return {
      code: 'COURSE',
      title: id
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase()),
      instructor: role === 'TEACHER' ? 'You' : 'Course Team',
    }
  })()

  return {
    id,
    title: preset.title,
    code: preset.code,
    instructor: preset.instructor,
    duration: '12 weeks',
    description: `${preset.title} course workspace with overview, modules, assignments, discussions, and syllabus content ready for interaction.`,
    objectives: [
      'Understand core concepts and practical workflows',
      'Complete module activities and assignments',
      'Use discussions and AI tutor support for faster learning',
    ],
    progress: role === 'STUDENT' ? 48 : 0,
    syllabus: [
      { week: 1, title: 'Foundations', description: 'Core concepts and orientation', readings: ['Week 1 Reading Pack'] },
      { week: 2, title: 'Practice & Labs', description: 'Hands-on guided activities', readings: ['Lab Guide'] },
      { week: 3, title: 'Assessment', description: 'Assignment and review', readings: ['Assessment Rubric'] },
      { week: 4, title: 'Project Sprint', description: 'Apply concepts in a mini-project', readings: ['Project Brief'] },
    ],
    modules: [
      {
        id: `${id}-m1`,
        title: 'Module 1: Introduction',
        description: 'Get started and understand the course flow',
        lessons: [
          { id: `${id}-l1`, title: 'Welcome & Orientation', type: 'video', duration: '12:00', completed: true },
          { id: `${id}-l2`, title: 'Core Concepts', type: 'reading', duration: '18:00', completed: role === 'STUDENT' },
        ],
      },
      {
        id: `${id}-m2`,
        title: 'Module 2: Applied Practice',
        description: 'Hands-on implementation and examples',
        lessons: [
          { id: `${id}-l3`, title: 'Guided Walkthrough', type: 'video', duration: '20:00', completed: false },
          { id: `${id}-l4`, title: 'Checkpoint Quiz', type: 'quiz', duration: '10:00', completed: false },
        ],
      },
      {
        id: `${id}-m3`,
        title: 'Module 3: Final Integration',
        description: 'Synthesize learning and prepare submission',
        lessons: [
          { id: `${id}-l5`, title: 'Project Briefing', type: 'reading', duration: '15:00', completed: false },
          { id: `${id}-l6`, title: 'Submission Checklist', type: 'video', duration: '08:00', completed: false },
        ],
      },
    ],
    assignments: [
      { id: `${id}-a1`, title: 'Assignment 1: Practical Task', dueDate: '2026-03-01', status: 'In Progress' },
      { id: `${id}-a2`, title: 'Assignment 2: Reflection', dueDate: '2026-03-10', status: 'Not Started' },
    ],
  }
}

export function CoursePage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [role] = useState<UserRole>((user?.role as UserRole) || 'STUDENT')

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return
    try {
      // Mock comprehensive course data
      const mockCourses: Record<string, Course> = {
        'course-cs101': {
          id: 'course-cs101',
          title: 'Introduction to Computer Science',
          code: 'CS101',
          instructor: 'Prof. John Doe',
          duration: '12 weeks',
          description: 'Learn the fundamentals of programming and computer science using Python.',
          objectives: ['Master programming fundamentals', 'Understand data structures', 'Build real-world applications'],
          progress: 35,
          syllabus: [
            { week: 1, title: 'Introduction to Programming', description: 'Setup, Variables, and Types', readings: ['Ch 1: Intro'] },
            { week: 2, title: 'Control Flow', description: 'Loops and Conditionals', readings: ['Ch 2: Logic'] },
            { week: 3, title: 'Functions', description: 'Modular programming', readings: ['Ch 3: Functions'] },
            { week: 4, title: 'Data Structures', description: 'Lists, Dictionaries, Sets', readings: ['Ch 4: Data'] }
          ],
          modules: [
            {
              id: 'm1', title: 'Week 1: Basics', description: 'Getting Started with Python',
              lessons: [
                { id: 'l1', title: 'Python Setup', type: 'video', duration: '10:00', completed: true },
                { id: 'l2', title: 'Variables', type: 'reading', duration: '15:00', completed: true }
              ]
            },
            {
              id: 'm2', title: 'Week 2: Logic', description: 'Control Flow',
              lessons: [
                { id: 'l3', title: 'If Statements', type: 'video', duration: '20:00', completed: false },
                { id: 'l4', title: 'Loops', type: 'video', duration: '25:00', completed: false }
              ]
            }
          ],
          assignments: [
            { id: 'A1', title: 'Python Calculator', dueDate: '2026-02-15', status: 'Submitted', grade: '95' }
          ],
        },
        'course-math221': {
          id: 'course-math221',
          title: 'Linear Algebra',
          code: 'MATH221',
          instructor: 'Prof. Jane Smith',
          duration: '10 weeks',
          description: 'Master vectors, matrices, and linear transformations.',
          objectives: ['Understand vector spaces', 'Master matrix operations', 'Apply linear transformations'],
          progress: 20,
          syllabus: [
            { week: 1, title: 'Vectors', description: 'Vector arithmetic and dot products', readings: ['Ch 1: Vectors'] },
            { week: 2, title: 'Matrices', description: 'Matrix multiplication and properties', readings: ['Ch 2: Matrices'] },
            { week: 3, title: 'Systems of Equations', description: 'Gaussian elimination', readings: ['Ch 3: Systems'] }
          ],
          modules: [
            {
              id: 'm1', title: 'Week 1: Vectors', description: 'Introduction to Vectors',
              lessons: [
                { id: 'l1', title: 'What is a Vector?', type: 'video', duration: '15:00', completed: true },
                { id: 'l2', title: 'Dot Product', type: 'reading', duration: '20:00', completed: false }
              ]
            },
            {
              id: 'm2', title: 'Week 2: Matrices', description: 'Matrix Operations',
              lessons: [
                { id: 'l3', title: 'Matrix Multiplication', type: 'video', duration: '30:00', completed: false }
              ]
            }
          ],
          assignments: []
        },
        'course-phys121': {
          id: 'course-phys121',
          title: 'Mechanics',
          code: 'PHYS121',
          instructor: 'Prof. Robert Johnson',
          duration: '14 weeks',
          description: 'Classical mechanics and Newton\'s laws.',
          objectives: ['Master Newton\'s laws', 'Understand kinematics', 'Explore energy conservation'],
          progress: 10,
          syllabus: [
            { week: 1, title: 'Kinematics 1D', description: 'Position, Velocity, Acceleration', readings: ['Ch 2: Motion'] },
            { week: 2, title: 'Vectors & 2D Motion', description: 'Projectile Motion', readings: ['Ch 3: Vectors'] },
            { week: 3, title: 'Newton\'s Laws', description: 'Forces and Mass', readings: ['Ch 4: Laws'] }
          ],
          modules: [
            {
              id: 'm1', title: 'Week 1: Kinematics', description: 'Motion in 1D',
              lessons: [{ id: 'l1', title: 'Velocity vs Speed', type: 'video', duration: '12:00', completed: true }]
            },
            {
              id: 'm2', title: 'Week 2: 2D Motion', description: 'Vectors in Physics',
              lessons: [{ id: 'l2', title: 'Projectile Motion', type: 'video', duration: '25:00', completed: false }]
            }
          ],
          assignments: []
        },
        'course-6001': {
          id: 'course-6001',
          title: 'Introduction to EECS',
          code: '6.001',
          instructor: 'Prof. AI Researcher',
          duration: '16 weeks',
          description: 'Fundamentals of electrical engineering and computer science.',
          objectives: ['Circuit design', 'Digital logic', 'Basic algorithms'],
          progress: 5,
          syllabus: [
            { week: 1, title: 'PCBs & Circuits', description: 'Voltage, Current, Resistance', readings: ['Lab 1 Manual'] },
            { week: 2, title: 'KCL & KVL', description: 'Circuit Analysis Laws', readings: ['Ch 2: Circuits'] }
          ],
          modules: [
            {
              id: 'm1', title: 'Week 1: Circuits', description: 'Basic Circuit Theory',
              lessons: [{ id: 'l1', title: 'Ohm\'s Law', type: 'video', duration: '18:00', completed: false }]
            }
          ],
          assignments: []
        },
        'course-8041': {
          id: 'course-8041',
          title: 'Quantum Physics',
          code: '8.04',
          instructor: 'Prof. Quantum Expert',
          duration: '14 weeks',
          description: 'Introduction to quantum mechanics.',
          objectives: ['Wave functions', 'Schrodinger equation', 'Quantum states'],
          progress: 0,
          syllabus: [
            { week: 1, title: 'Experimental Basis', description: 'Photoelectric effect, wave-particle duality', readings: ['Ch 1: Quantum Origins'] },
            { week: 2, title: 'The Wave Function', description: 'Interpretation and properties', readings: ['Ch 2: Waves'] }
          ],
          modules: [
            {
              id: 'm1', title: 'Week 1: Origins', description: 'Why Quantum?',
              lessons: [{ id: 'l1', title: 'Photoelectric Effect', type: 'video', duration: '22:00', completed: false }]
            }
          ],
          assignments: []
        },
        'course-stat110': {
          id: 'course-stat110',
          title: 'Probability',
          code: 'STAT110',
          instructor: 'Prof. Joe Blitzstein',
          duration: '12 weeks',
          description: 'Introduction to probability theory.',
          objectives: ['Random variables', 'Distributions', 'Bayes Theorem'],
          progress: 0,
          syllabus: [
            { week: 1, title: 'Counting', description: 'Permutations and Combinations', readings: ['Ch 1: Counting'] },
            { week: 2, title: 'Conditional Probability', description: 'Bayes Rule', readings: ['Ch 2: Conditionals'] }
          ],
          modules: [
            {
              id: 'm1', title: 'Week 1: Counting', description: 'The Basics of Counting',
              lessons: [{ id: 'l1', title: 'Multiplication Rule', type: 'video', duration: '15:00', completed: false }]
            }
          ],
          assignments: []
        },
        'course-cloud': {
          id: 'course-cloud',
          title: 'Cloud Computing',
          code: 'CLOUD101',
          instructor: 'Google Cloud Team',
          duration: '6 weeks',
          description: 'Master Google Cloud Platform basics.',
          objectives: ['Understand Cloud concepts', 'Navigate GCP', 'Deploy simple apps'],
          progress: 0,
          syllabus: [
            { week: 1, title: 'Cloud Concepts', description: 'IaaS, PaaS, SaaS', readings: ['GCP Whitepaper'] },
            { week: 2, title: 'GCP Core Services', description: 'Compute, Storage, Network', readings: ['GCP Docs'] }
          ],
          modules: [
            {
              id: 'm1', title: 'Week 1: Intro', description: 'Welcome to Cloud',
              lessons: [{ id: 'l1', title: 'What is Cloud?', type: 'video', duration: '08:00', completed: false }]
            }
          ],
          assignments: []
        },
        'course-cs50': {
          id: 'course-cs50',
          title: 'CS50: Intro to CS',
          code: 'CS50',
          instructor: 'Prof. David Malan',
          duration: '12 weeks',
          description: 'Harvard\'s introduction to the intellectual enterprises of computer science.',
          objectives: ['Learn C, Python, SQL', 'Web Development', 'Algorithms'],
          progress: 45,
          syllabus: [
            { week: 0, title: 'Scratch', description: 'Computational Thinking', readings: ['Notes Week 0'] },
            { week: 1, title: 'C', description: 'Syntax, Compilers, Loops', readings: ['Notes Week 1'] },
            { week: 2, title: 'Arrays', description: 'Compiling, Debugging, Memory', readings: ['Notes Week 2'] }
          ],
          modules: [
            {
              id: 'mod1', title: 'Week 0: Scratch', description: 'Visual Programming',
              lessons: [
                { id: 'L1', title: 'Lecture 0', type: 'video', duration: '90:00', completed: true },
              ],
            },
            {
              id: 'mod2', title: 'Week 1: C', description: 'Low level programming',
              lessons: [
                { id: 'L2', title: 'Lecture 1', type: 'video', duration: '120:00', completed: false },
              ],
            },
          ],
          assignments: [
            { id: 'A1', title: 'Problem Set 0', dueDate: '2026-02-05', status: 'Submitted', grade: '100' },
          ],
        },
        'course-ml': {
          id: 'course-ml',
          title: 'Machine Learning Crash Course',
          code: 'ML101',
          instructor: 'Google AI Team',
          duration: '8 weeks',
          description: 'Fast-paced, practical introduction to machine learning.',
          objectives: ['Framing ML problems', 'Building neural nets', 'Real-world ML'],
          progress: 60,
          syllabus: [
            { week: 1, title: 'ML Concepts', description: 'Label, Feature, Model', readings: ['Framing'] },
            { week: 2, title: 'Descending into ML', description: 'Linear Regression', readings: ['Descent'] }
          ],
          modules: [
            {
              id: 'mod1', title: 'Module 1: Intro', description: 'What is ML?',
              lessons: [
                { id: 'L1', title: 'Introduction', type: 'video', duration: '05:00', completed: true },
                { id: 'L2', title: 'Framing', type: 'reading', duration: '15:00', completed: true },
              ],
            },
            {
              id: 'mod2', title: 'Module 2: Regression', description: 'Predicting values',
              lessons: [
                { id: 'L3', title: 'Linear Regression', type: 'video', duration: '20:00', completed: false },
              ],
            },
          ],
          assignments: [
            { id: 'A1', title: 'Model Training Lab', dueDate: '2026-02-20', status: 'Submitted', grade: '92' },
          ],
        },
      };

      const mockCourse = mockCourses[courseId]
      if (mockCourse) {
        setCourse(mockCourse)
      } else {
        setCourse(buildFallbackCourse(courseId, role))
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, role]);

  useEffect(() => {
    fetchCourseData()
  }, [fetchCourseData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-medium text-gray-500">Course not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <CourseSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
      />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <CourseTopBar
          courseName={course.title}
          orgName="Astana IT University"
        />

        <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
          <CourseHeader course={course} role={role} />

          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <CourseOverview course={course} />}

            {activeTab === 'modules' && (
              <div className="max-w-5xl">
                <div className="mb-8">

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Course Modules
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Access your learning materials and track progress
                  </p>
                </div>

                {course.modules.map((module: any, index: number) => (
                  <ModuleAccordion
                    key={module.id}
                    module={module}
                    courseId={course.id}
                    index={index}
                    role={role}
                    onRefresh={fetchCourseData}
                  />
                ))}
              </div>
            )}

            {activeTab === 'assignments' && <AssignmentsView />}
            {activeTab === 'discussions' && <DiscussionsView />}
            {activeTab === 'syllabus' && <SyllabusView syllabus={course.syllabus || []} />}
          </motion.div>
        </main>
      </div>
      <CourseChatWidget courseTitle={course.title} />
    </div>
  )
}
