import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCcw, CheckCircle2, Sparkles } from 'lucide-react'
import apiClient from '../../../lib/axios-client'

interface InstructorReviewPanelProps {
    materialId: string
    fallbackVideoUrl?: string
}

interface ReviewDraft {
    materialId: string
    studyPackId: string
    status: string
    videoUrl?: string | null
    summary: string
    keyPoints: string[]
}

const defaultKeyPoints = [
    'Problem framing and expected outcomes',
    'Core concept and explanation',
    'Practical application in context',
    'Next actionable step for learners',
]

export function InstructorReviewPanel({ materialId, fallbackVideoUrl }: InstructorReviewPanelProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [regenerating, setRegenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [draft, setDraft] = useState<ReviewDraft | null>(null)
    const [summary, setSummary] = useState('')
    const [keyPointsText, setKeyPointsText] = useState('')

    const fetchDraft = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await apiClient.get(`/ai/review/${materialId}`)
            const nextDraft = res.data?.draft as ReviewDraft
            setDraft(nextDraft)
            setSummary(nextDraft?.summary || '')
            const kp = (nextDraft?.keyPoints?.length ? nextDraft.keyPoints : defaultKeyPoints).join('\n')
            setKeyPointsText(kp)
        } catch {
            setError('Failed to load AI draft. You can regenerate to create a new draft.')
            setDraft({
                materialId,
                studyPackId: 'new-draft',
                status: 'PENDING_REVIEW',
                videoUrl: fallbackVideoUrl || null,
                summary: '',
                keyPoints: defaultKeyPoints,
            })
            setSummary('')
            setKeyPointsText(defaultKeyPoints.join('\n'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDraft()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [materialId])

    const embedVideoUrl = useMemo(() => {
        const raw = draft?.videoUrl || fallbackVideoUrl || ''
        if (!raw) return ''
        return raw.includes('watch?v=') ? raw.replace('watch?v=', 'embed/') : raw
    }, [draft?.videoUrl, fallbackVideoUrl])

    const handleApprove = async () => {
        setSaving(true)
        setError(null)
        setSuccessMessage(null)
        try {
            const keyPoints = keyPointsText
                .split('\n')
                .map((x) => x.replace(/^[-•*]\s*/, '').trim())
                .filter(Boolean)

            await apiClient.post(`/ai/review/${materialId}/approve`, {
                summary,
                keyPoints,
                keyPointsText,
            })

            setSuccessMessage('Draft approved and published.')
            await fetchDraft()
        } catch {
            setError('Failed to approve this draft.')
        } finally {
            setSaving(false)
        }
    }

    const handleRegenerate = async () => {
        setRegenerating(true)
        setError(null)
        setSuccessMessage(null)
        try {
            await apiClient.post(`/ai/review/${materialId}/regenerate`, {
                notes: 'Please improve clarity and make key points more actionable.',
            })
            setSuccessMessage('Regeneration requested. Draft refreshed.')
            await fetchDraft()
        } catch {
            setError('Failed to regenerate draft.')
        } finally {
            setRegenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600" />
                        Review & Edit AI Output
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Status: {draft?.status || 'PENDING_REVIEW'}
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2">
                <div className="bg-black min-h-[320px] lg:min-h-[520px]">
                    {embedVideoUrl ? (
                        <iframe
                            src={embedVideoUrl}
                            title="Lecture Video"
                            className="w-full h-full min-h-[320px] lg:min-h-[520px]"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="w-full h-full min-h-[320px] lg:min-h-[520px] flex items-center justify-center text-gray-300 text-sm">
                            Video source unavailable
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            {successMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Executive Summary
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            rows={7}
                            placeholder="Edit AI-generated summary here..."
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Key Points (one per line)
                            </label>
                            <div className="flex items-center gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setKeyPointsText((prev) => prev ? `- ${prev.split('\n').join('\n- ')}` : '- ')}
                                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                >
                                    • Bullet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const selected = window.getSelection()?.toString() || ''
                                        if (!selected) return
                                        setKeyPointsText((prev) => prev.replace(selected, `**${selected}**`))
                                    }}
                                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold"
                                >
                                    B
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={keyPointsText}
                            onChange={(e) => setKeyPointsText(e.target.value)}
                            rows={8}
                            placeholder="Write key points..."
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                            onClick={handleApprove}
                            disabled={saving || regenerating || !summary.trim()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                            {saving && <Loader2 size={16} className="animate-spin" />}
                            Approve
                        </button>
                        <button
                            onClick={handleRegenerate}
                            disabled={saving || regenerating}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {regenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                            Request Regeneration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

