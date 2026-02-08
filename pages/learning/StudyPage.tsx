import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText,
    HelpCircle,
    Layers,
    ChevronLeft,
    CheckCircle,
    Loader2,
    AlertCircle,
    Sparkles
} from 'lucide-react'
import apiClient from '../../lib/axios-client'
import { OrgTopBar } from '../../features/organization/components/OrgTopBar'
import { useAuth } from '../../features/auth/context/AuthContext'
import { InstructorReviewPanel } from '../../features/ai-tutor/components/InstructorReviewPanel'
import { StudentLearningPackPanel } from '../../features/ai-tutor/components/StudentLearningPackPanel'

export function StudyPage() {
    const { materialId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const isInstructor = user?.role === 'TEACHER' || user?.role === 'ORGANIZER'

    const [activeTab, setActiveTab] = useState<'summary' | 'quiz' | 'flashcards' | 'review'>('summary')
    const [studyPack, setStudyPack] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setActiveTab(isInstructor ? 'review' : 'summary')
    }, [isInstructor])

    useEffect(() => {
        const fetchStudyPack = async () => {
            if (!materialId) {
                setError('Invalid material ID')
                setLoading(false)
                return
            }

            try {
                // 1. Fetch backend study pack if exists
                let packData = null;
                try {
                    const response = await apiClient.get(`/ai/studypack/${materialId}`)
                    packData = response.data
                } catch (e) {
                    // Ignore, will use mock
                }

                // 2. Mock/Real Data Strategy
                const videoUrl = 'https://www.youtube.com/watch?v=kqtD5dpn9C8'
                let realTranscript = ''

                try {
                    // Call our new Go backend service
                    const transcriptRes = await apiClient.post('/ai/transcript', {
                        videoUrl: videoUrl
                    })
                    realTranscript = transcriptRes.data.transcript
                } catch (err) {
                    console.error("Failed to fetch real transcript:", err)
                    // Fallback to static detailed transcript
                    realTranscript = `0:00 - Introduction to Python
Welcome to this comprehensive guide on Python programming. We'll start from the very basics and work our way up to more advanced concepts. Python is a versatile language used in web development, data science, AI, and automation.

2:15 - Setting Up Your Environment
First, you'll need to install Python. Go to python.org/downloads. We'll also be using VS Code as our code editor. Make sure to install the Python extension for VS Code to get intellisense and debugging features.

8:45 - Your First Program
Let's print "Hello World". In Python, it's just one line: print("Hello World"). Compare this to Java or C++ where you need a main function and class definition. Python handles the low-level details for you.

15:30 - Variables and Data Types
Python is dynamically typed. 
x = 10 (Integer)
price = 19.99 (Float)
name = "MyWay" (String)
is_published = True (Boolean)
You can check the type of any variable using the type() function.

22:10 - Type Conversion
Sometimes you need to convert types. For example, input() always returns a string. To do math, you wrap it in int() or float(). 
birth_year = input("Birth year: ")
age = 2026 - int(birth_year)

29:00 - Strings and Methods
Strings are powerful in Python. You can use methods like .upper(), .lower(), .find(), and .replace(). 
course = "Python for Beginners"
print("Python" in course) # Returns True

35:45 - Arithmetic Operations
We have the standard +, -, *, /. 
Division (/) returns a float. 
Floor division (//) returns an integer. 
Modulus (%) returns the remainder.
Exponentiation (**) raises to a power.

42:30 - If Statements
Control flow lets us make decisions.
if is_hot:
    print("It's a hot day")
elif is_cold:
    print("It's a cold day")
else:
    print("It's a lovely day")
Indentation is critical in Python!

51:15 - Loops (While and For)
To repeat code, use loops.
i = 1
while i <= 5:
    print('*' * i)
    i += 1

For loops are great for iterating over lists:
for item in ['Python', 'Java', 'Go']:
    print(item)

58:00 - Lists
Lists are mutable sequences.
names = ['John', 'Bob', 'Mosh']
names[0] = 'Jon'
names.append('Sarah')
print(names[0:2]) # Slicing

1:05:00 - Functions
Functions break your code into reusable chunks.
def greet_user(name):
    print(f"Hi {name}!")

Always define functions before calling them.

1:12:00 - Return Values
Functions can return data.
def square(number):
    return number * number

1:15:00 - Conclusion
We've covered the core building blocks of Python. Practice these concepts, and we'll see you in the next module where we build a real project.`
                }

                setStudyPack({
                    id: packData?.id || 'mock-pack',
                    materialId: materialId,
                    material: {
                        title: 'Demo Lesson: Python Basics',
                        videoUrl: videoUrl,
                        transcript: realTranscript
                    },
                    summary: packData?.summary || {
                        content: {
                            bullets: [
                                'Python is a high-level, interpreted programming language.',
                                'It emphasizes code readability with indentation.',
                                'Variables do not need explicit declaration.'
                            ],
                            summary: 'This lesson covers the fundamental concepts of Python programming, starting with installation and setup. We explore how Python handles memory management automatically and why it is a popular choice for beginners and experts alike.'
                        }
                    },
                    quizzes: packData?.quizzes || [{
                        id: 'q1',
                        questions: [
                            {
                                id: 'q1_1',
                                prompt: 'What is the correct file extension for Python files?',
                                options: ['.python', '.pl', '.py', '.p'],
                                answer: '.py'
                            },
                            {
                                id: 'q1_2',
                                prompt: 'Which function is used to output text to the console?',
                                options: ['echo()', 'console.log()', 'print()', 'printf()'],
                                answer: 'print()'
                            }
                        ]
                    }],
                    flashcards: packData?.flashcards || [
                        { front: 'print()', back: 'Outputs text to the console' },
                        { front: 'def', back: 'Keyword to define a function' },
                        { front: '#', back: 'Symbol used for single-line comments' }
                    ]
                })
            } catch (err) {
                console.error('Failed to prepare study pack:', err)
                setError('Failed to load learning pack for this lecture.')
            } finally {
                setLoading(false)
            }
        }

        fetchStudyPack()
    }, [materialId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Preparing your personalized study materials...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
                <div className="max-w-xl w-full rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-800 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-500 mt-0.5" size={20} />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Unable to open lecture</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
                            <button
                                onClick={() => navigate(-1)}
                                className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }


    if (!loading && !error && !studyPack) {
        // ... empty state
    }

    const summaryContent = studyPack?.summary?.content || {}
    const studentSummary = typeof summaryContent?.summary === 'string'
        ? summaryContent.summary
        : 'Summary will be available after AI processing and instructor review.'
    const studentKeyPoints = Array.isArray(summaryContent?.bullets)
        ? summaryContent.bullets.filter((x: unknown) => typeof x === 'string')
        : []

    const tabs = isInstructor
        ? [{ id: 'review', label: 'Review & Publish', icon: Sparkles }]
        : [
            { id: 'summary', label: 'Summary', icon: FileText },
            { id: 'quiz', label: 'Quiz Interaction', icon: HelpCircle },
            { id: 'flashcards', label: 'Flashcards', icon: Layers },
        ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300">
            <OrgTopBar />

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
                {/* Breadcrumb & Title */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {studyPack?.material?.title || 'Study Session'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Powered by AI Analysis</p>
                    </div>
                </div>

                {/* Content Player & Transcript Section */}
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div className="md:col-span-2 space-y-6">
                        {/* Video Player or Content Placeholder */}
                        {studyPack?.material?.videoUrl ? (
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
                                <iframe
                                    src={studyPack.material.videoUrl.replace('watch?v=', 'embed/')}
                                    title="Course Video"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-black rounded-2xl flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80)' }}></div>
                                <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform">
                                    <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-white border-b-[15px] border-b-transparent ml-2"></div>
                                </div>
                            </div>
                        )}

                        {/* Transcript */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-96 overflow-y-auto">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-800 py-2">
                                <FileText size={18} className="text-indigo-600" />
                                Transcript / Text Content
                            </h3>
                            <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300">
                                {studyPack?.material?.transcript ? (
                                    studyPack.material.transcript.split('\n\n').map((paragraph: string, i: number) => (
                                        <p key={i} className="mb-4 whitespace-pre-wrap">{paragraph}</p>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic">No transcript available for this lesson.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                            {isInstructor ? 'AI Governance' : 'AI Study Helper'}
                        </h3>
                        {/* AI Tabs Vertical/Stacked */}
                        <div className="flex flex-col gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Content Area (moved below/alongside) */}

                {/* content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm min-h-[400px] overflow-hidden"
                    >
                        {isInstructor && activeTab === 'review' && materialId && (
                            <div className="p-6">
                                <InstructorReviewPanel
                                    materialId={materialId}
                                    fallbackVideoUrl={studyPack?.material?.videoUrl}
                                />
                            </div>
                        )}

                        {!isInstructor && activeTab === 'summary' && (
                            <div className="p-6">
                                <StudentLearningPackPanel
                                    summary={studentSummary}
                                    keyPoints={studentKeyPoints}
                                    videoUrl={studyPack?.material?.videoUrl}
                                />
                            </div>
                        )}

                        {activeTab === 'quiz' && (
                            <QuizInteraction quiz={studyPack?.quizzes?.[0]} />
                        )}

                        {activeTab === 'flashcards' && (
                            <FlashcardInteraction flashcards={studyPack?.flashcards || []} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}

function QuizInteraction({ quiz }: { quiz: any }) {
    const [currentIdx, setCurrentIdx] = useState(0)
    const [answers, setAnswers] = useState<any>({})
    const [isFinished, setIsFinished] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!quiz || !quiz.questions?.length) return <div className="p-8">No quiz questions found.</div>

    const handleSelect = (choice: string) => {
        setAnswers({ ...answers, [quiz.questions[currentIdx].id]: choice })
    }

    const handleFinish = async () => {
        setIsSubmitting(true)
        try {
            await apiClient.post('/analytics/quiz/attempt', {
                quizId: quiz.id,
                answers
            })
            setIsFinished(true)
        } catch (err) {
            alert('Failed to save score')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isFinished) {
        return (
            <div className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                <p className="text-gray-500 mb-8">Your analytics have been updated. Great work!</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
                >
                    Retake Quiz
                </button>
            </div>
        )
    }

    const q = quiz.questions[currentIdx]

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-12">
                <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Question {currentIdx + 1}/{quiz.questions.length}</span>
                <div className="h-2 w-48 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}></div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-10">{q.prompt}</h3>

            <div className="space-y-4">
                {(q.options as string[]).map((option) => (
                    <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${answers[q.id] === option
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900'
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <div className="mt-12 flex justify-between">
                <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(currentIdx - 1)}
                    className="px-6 py-2.5 text-gray-500 font-medium disabled:opacity-30"
                >
                    Previous
                </button>
                {currentIdx === quiz.questions.length - 1 ? (
                    <button
                        disabled={!answers[q.id] || isSubmitting}
                        onClick={handleFinish}
                        className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-100 dark:shadow-none flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                        Finish & Submit
                    </button>
                ) : (
                    <button
                        disabled={!answers[q.id]}
                        onClick={() => setCurrentIdx(currentIdx + 1)}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none"
                    >
                        Next Question
                    </button>
                )}
            </div>
        </div>
    )
}

function FlashcardInteraction({ flashcards }: { flashcards: any[] }) {
    const [currentIdx, setCurrentIdx] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    if (!flashcards.length) return <div className="p-8">No flashcards found.</div>

    const card = flashcards[currentIdx]

    return (
        <div className="p-12 flex flex-col items-center">
            <div className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest">Card {currentIdx + 1} of {flashcards.length}</div>

            <div
                className="relative w-full max-w-xl h-80 perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-full h-full relative preserve-3d"
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900 rounded-3xl p-12 flex items-center justify-center text-center shadow-sm">
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{card.front}</h4>
                    </div>
                    {/* Back */}
                    <div
                        className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl p-12 flex items-center justify-center text-center text-white"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <p className="text-xl leading-relaxed">{card.back}</p>
                    </div>
                </motion.div>
            </div>

            <p className="mt-8 text-gray-400 text-sm">Click the card to flip</p>

            <div className="mt-12 flex gap-4">
                <button
                    onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setIsFlipped(false) }}
                    className="p-4 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => { setCurrentIdx(Math.min(flashcards.length - 1, currentIdx + 1)); setIsFlipped(false) }}
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                    Next Card
                </button>
            </div>

            <div className="mt-12 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Learning Status:</span>
                <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded">In Progress</span>
            </div>
        </div>
    )
}
