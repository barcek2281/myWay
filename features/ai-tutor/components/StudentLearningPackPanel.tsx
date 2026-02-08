import { useMemo, useState } from 'react'
import { MessageSquareText, Sparkles, HelpCircle } from 'lucide-react'

interface StudentLearningPackPanelProps {
    summary: string
    keyPoints: string[]
    videoUrl?: string
}

export function StudentLearningPackPanel({ summary, keyPoints, videoUrl }: StudentLearningPackPanelProps) {
    const [activeView, setActiveView] = useState<'summary' | 'qa'>('summary')
    const [showPractice, setShowPractice] = useState(false)

    const points = keyPoints.length > 0 ? keyPoints : [
        'Foundational concept introduced',
        'Core mechanism explained',
        'Practical example and follow-up activity',
    ]

    const embedVideoUrl = useMemo(() => {
        if (!videoUrl) return ''
        return videoUrl.includes('watch?v=') ? videoUrl.replace('watch?v=', 'embed/') : videoUrl
    }, [videoUrl])

    const jumpToTimestamp = (line: string) => {
        const match = line.match(/(\d{1,2}):(\d{2})/)
        if (!match || !embedVideoUrl) return
        const mins = Number(match[1])
        const secs = Number(match[2])
        const start = mins * 60 + secs
        const withStart = embedVideoUrl.includes('?')
            ? `${embedVideoUrl}&start=${start}`
            : `${embedVideoUrl}?start=${start}`
        window.open(withStart, '_blank', 'noopener,noreferrer')
    }

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600" />
                        Processed Learning Pack
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Read-only learning reinforcement content
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveView('summary')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeView === 'summary'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                    >
                        Summary View
                    </button>
                    <button
                        onClick={() => setActiveView('qa')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1 ${activeView === 'qa'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                    >
                        <MessageSquareText size={14} />
                        Q&A View
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {embedVideoUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe
                            src={embedVideoUrl}
                            title="Lecture video"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}

                {activeView === 'summary' ? (
                    <>
                        <section className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-900/15 p-4">
                            <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Executive Summary</h4>
                            <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-200">
                                {summary || 'Summary will appear once the content is approved by the instructor.'}
                            </p>
                        </section>

                        <section>
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Key Points</h4>
                            <ul className="space-y-2">
                                {points.map((point, idx) => (
                                    <li key={`${point}-${idx}`} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-start justify-between gap-2">
                                        <span>• {point}</span>
                                        <button
                                            onClick={() => jumpToTimestamp(point)}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                                        >
                                            Jump
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="pt-2">
                            <button
                                onClick={() => setShowPractice((v) => !v)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                            >
                                <HelpCircle size={16} />
                                {showPractice ? 'Hide Practice Learning Activities' : 'Practice Learning Activities'}
                            </button>
                            {showPractice && (
                                <div className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-4 text-sm text-emerald-900 dark:text-emerald-200">
                                    <p className="font-semibold mb-2">Practice Set</p>
                                    <ul className="list-disc ml-5 space-y-1">
                                        <li>Create 3 flashcards from the key points above.</li>
                                        <li>Answer one reflective question for each module concept.</li>
                                        <li>Attempt the mini-quiz in the Quiz tab for retention.</li>
                                    </ul>
                                </div>
                            )}
                        </section>
                    </>
                ) : (
                    <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Student Question Answering</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Ask focused questions about this lecture. This placeholder aligns with the Q&A BPMN flow.
                        </p>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-500">
                            Q&A assistant will use the processed transcript and approved summary context.
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

