import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle2, ExternalLink, FileText, UploadCloud } from 'lucide-react'
import { OrgTopBar } from '../features/organization/components/OrgTopBar'

interface SubmissionState {
    assignment?: {
        id: string
        title: string
        description?: string
        dueDate?: string
        status: string
        maxPoints: number
        submittedDate?: string
        submissionUrl?: string
        attachmentName?: string
        grade?: string
    }
}

export function AssignmentSubmissionPage() {
    const { courseId, assignmentId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const assignment = (location.state as SubmissionState | null)?.assignment

    const fallbackTitle = useMemo(() => {
        if (!assignmentId) return 'Assignment Submission'
        return `Assignment ${assignmentId}`
    }, [assignmentId])

    const submissionUrl = assignment?.submissionUrl || ''
    const isAttachedScheme = submissionUrl.startsWith('attached://')
    const displayAttachment = assignment?.attachmentName || (isAttachedScheme ? decodeURIComponent(submissionUrl.replace('attached://', '')) : undefined)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <OrgTopBar />

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
                <button
                    onClick={() => navigate(`/course/${courseId || 'unknown'}`)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 mb-5"
                >
                    <ArrowLeft size={16} />
                    Back to Course
                </button>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {assignment?.title || fallbackTitle}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Submission details and attached materials
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        <section className="grid sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Status</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-blue-500" />
                                    {assignment?.status || 'Submitted'}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Submitted Date</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
                                    <Calendar size={16} className="text-emerald-500" />
                                    {assignment?.submittedDate || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Points</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {assignment?.grade ? `${assignment.grade} / ${assignment.maxPoints}` : `- / ${assignment?.maxPoints ?? '-'}`}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Due Date</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {assignment?.dueDate || '-'}
                                </p>
                            </div>
                        </section>

                        <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 inline-flex items-center gap-2">
                                <UploadCloud size={16} className="text-indigo-600" />
                                Submitted Material
                            </h2>

                            {displayAttachment ? (
                                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 px-3 py-2 text-sm text-indigo-900 dark:text-indigo-200 inline-flex items-center gap-2">
                                    <FileText size={15} />
                                    {displayAttachment}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No local file metadata available.</p>
                            )}

                            {submissionUrl && !isAttachedScheme && (
                                <div className="mt-3">
                                    <a
                                        href={submissionUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                    >
                                        Open submitted link
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            )}
                        </section>

                        <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Assignment Brief</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                {assignment?.description || 'No description available for this submission.'}
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}

