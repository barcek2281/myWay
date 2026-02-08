import React from 'react'
import { FileText, Download, Calendar, Clock, BookOpen } from 'lucide-react'

// Interface for the component props
interface SyllabusViewProps {
    syllabus?: SyllabusItem[]
}

export function SyllabusView({ syllabus = [] }: SyllabusViewProps) {
    const syllabusData = [
        {
            week: 1,
            title: 'Course Introduction & Fundamentals',
            description: 'Overview of the course structure, tools, and basic concepts.',
            readings: ['Chapter 1: Getting Started', 'Appendix A: Tools Setup'],
        },
        {
            week: 2,
            title: 'Core Concepts Deep Dive',
            description: 'Exploring the theoretical underpinnings and core algorithms.',
            readings: ['Chapter 2: Algorithms', 'Paper: "The Art of Code"'],
        },
        {
            week: 3,
            title: 'Practical Applications I',
            description: 'Hands-on workshops and building the first major project component.',
            readings: ['Chapter 3: Design Patterns'],
        },
        {
            week: 4,
            title: 'Midterm Review & Assessment',
            description: 'Review of Weeks 1-3 material and midterm examination.',
            readings: [],
        },
        {
            week: 5,
            title: 'Advanced Topics',
            description: 'Introduction to advanced techniques and optimization strategies.',
            readings: ['Chapter 4: Optimization'],
        },
        {
            week: 6,
            title: 'Final Project Kickoff',
            description: 'Ideation, team formation, and proposal submission for final projects.',
            readings: ['Project Guidelines PDF'],
        },
    ]

    return (
        <div className="max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Course Syllabus
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Academic Plan & Schedule
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    <Download size={18} />
                    <span>Download PDF</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Duration</p>
                            <p className="font-semibold text-gray-900 dark:text-white">12 Weeks</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Workload</p>
                            <p className="font-semibold text-gray-900 dark:text-white">8-10 hours/week</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Credits</p>
                            <p className="font-semibold text-gray-900 dark:text-white">3 Units</p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {syllabusData.map((item) => (
                        <div key={item.week} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                                <div className="flex-shrink-0">
                                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-semibold">
                                        Week {item.week}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>

                                    {item.readings.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {item.readings.map((reading) => (
                                                <span key={reading} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-900">
                                                    <FileText size={10} />
                                                    {reading}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
