import { GoogleGenerativeAI } from '@google/generative-ai'
import { Material, StudyPack, Quiz, QuizQuestion, Flashcard } from '../types'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
    console.error('❌❌❌ GEMINI API KEY IS MISSING! ❌❌❌')
    console.error('Make sure .env file exists in the project root with VITE_GEMINI_API_KEY=your_key')
}

const genAI = new GoogleGenerativeAI(API_KEY)
// Using gemini-3-flash-preview as requested
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

// Helper: Generate a unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Generate a summary from material content using Gemini AI
 */
export const generateSummary = async (content: string): Promise<string> => {
    const prompt = `
You are an expert educational content summarizer. 

Given the following learning material, create a comprehensive but concise summary (2-3 paragraphs) that:
- Captures the main concepts and key points
- Is written in clear, student-friendly language
- Highlights the most important takeaways
- Helps students understand the core ideas quickly

Learning Material:
${content}

Summary:
`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text().trim()
    } catch (error) {
        console.error('Error generating summary:', error)
        return `Summary of the material: This content covers important concepts that are essential for understanding the topic. The material provides foundational knowledge and practical insights.`
    }
}

/**
 * Generate quiz questions from material using Gemini AI
 */
export const generateQuiz = async (content: string): Promise<Quiz> => {
    const prompt = `
You are an expert educator creating quiz questions.

Generate exactly 8 multiple-choice questions based on the following learning material.

For each question, provide:
1. A clear, specific question
2. Four answer options (A, B, C, D)
3. The correct answer (as a letter: A, B, C, or D)
4. A brief explanation of why that answer is correct

Format your response as a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "A",
    "explanation": "Explanation here"
  }
]

Learning Material:
${content}

Generate 8 high-quality quiz questions in JSON format:
`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text().trim()

        // Extract JSON from the response (sometimes it's wrapped in markdown code blocks)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            throw new Error('No JSON array found in response')
        }

        const questionsData = JSON.parse(jsonMatch[0])

        const questions: QuizQuestion[] = questionsData.map((q: any) => ({
            id: generateId(),
            question: q.question,
            options: q.options,
            correctAnswer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer),
            explanation: q.explanation
        }))

        return {
            id: generateId(),
            questions
        }
    } catch (error) {
        console.error('Error generating quiz:', error)

        // Fallback quiz if AI fails
        return {
            id: generateId(),
            questions: [
                {
                    id: generateId(),
                    question: 'What is the main topic covered in this material?',
                    options: [
                        'Core concepts and fundamentals',
                        'Unrelated topics',
                        'Advanced theory only',
                        'None of the above'
                    ],
                    correctAnswer: 0,
                    explanation: 'The material focuses on core concepts and fundamental principles.'
                }
            ]
        }
    }
}

/**
 * Generate flashcards from material using Gemini AI
 */
export const generateFlashcards = async (content: string): Promise<Flashcard[]> => {
    const prompt = `
You are an expert at creating effective study flashcards.

Based on the following learning material, create exactly 12 flashcards that help students memorize and understand key concepts.

Each flashcard should have:
- Front: A clear question or prompt
- Back: A concise, informative answer (2-3 sentences max)

Format your response as a JSON array with this exact structure:
[
  {
    "front": "Question or term to define?",
    "back": "Clear, concise answer or definition."
  }
]

Learning Material:
${content}

Generate 12 high-quality flashcards in JSON format:
`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text().trim()

        // Extract JSON from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            throw new Error('No JSON array found in response')
        }

        const flashcardsData = JSON.parse(jsonMatch[0])

        return flashcardsData.map((f: any) => ({
            id: generateId(),
            front: f.front,
            back: f.back
        }))
    } catch (error) {
        console.error('Error generating flashcards:', error)

        // Fallback flashcards if AI fails
        return [
            {
                id: generateId(),
                front: 'What are the key concepts in this material?',
                back: 'This material covers fundamental concepts that are essential for understanding the topic.'
            }
        ]
    }
}

/**
 * Generate a complete study pack from material using Gemini AI
 */
export const generateStudyPack = async (material: Material): Promise<StudyPack> => {
    console.log('Generating study pack with Gemini AI...')

    try {
        // Generate sequentially to avoid quota issues
        console.log('Step 1/3: Generating summary...')
        const summary = await generateSummary(material.content)

        // Small delay between calls
        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log('Step 2/3: Generating quiz...')
        const quiz = await generateQuiz(material.content)

        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log('Step 3/3: Generating flashcards...')
        const flashcards = await generateFlashcards(material.content)

        console.log('✅ Study pack generation complete!')

        return {
            id: generateId(),
            materialId: material.id,
            summary,
            quiz,
            flashcards,
            createdAt: new Date().toISOString(),
            status: 'ready'
        }
    } catch (error) {
        console.error('Error generating study pack:', error)
        throw new Error('Failed to generate study pack')
    }
}

/**
 * Fetch YouTube transcript using the backend API
 */
const fetchYoutubeTranscript = async (url: string): Promise<string> => {
    try {
        console.log('🎬 Fetching YouTube transcript from backend:', url)

        // Call our backend endpoint instead of trying to fetch directly (CORS issue)
        const response = await fetch(`http://localhost:8081/youtube/transcript?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add auth token if you have one
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
        }

        const data = await response.json()

        console.log('✅ Transcript fetched successfully!')
        console.log('📹 Video title:', data.title)
        console.log('📝 Transcript length:', data.transcript.length, 'characters')

        return data.transcript
    } catch (error) {
        console.error('❌ Error fetching YouTube transcript:', error)

        // Return a helpful error message
        return `Failed to fetch transcript from YouTube video. Error: ${error instanceof Error ? error.message : 'Unknown error'}

This could be because:
1. The video doesn't have captions/subtitles enabled
2. The video has disabled transcript access
3. Network connectivity issues
4. Backend server is not running

Please paste the transcript manually in the text area, or choose a different video with captions enabled.`
    }
}

/**
 * Extract text from document (mock - would need actual file processing)
 */
const extractDocumentText = async (file: File): Promise<string> => {
    // In a real implementation, you would:
    // 1. Use pdf.js for PDFs
    // 2. Use mammoth.js for DOCX
    // 3. Read text files directly

    return new Promise((resolve, reject) => {
        if (file.type === 'text/plain') {
            const reader = new FileReader()
            reader.onload = (e) => {
                resolve(e.target?.result as string)
            }
            reader.onerror = reject
            reader.readAsText(file)
        } else {
            resolve(`Placeholder content from ${file.name}. 

To fully process ${file.type} files, you would need to integrate:
- PDF.js for PDF files
- Mammoth.js for DOCX files

For now, please use .txt files or paste the content manually.`)
        }
    })
}

/**
 * Process imported material
 */
export const processMaterial = async (
    title: string,
    type: 'youtube' | 'document',
    sourceUrlOrFile: string | File,
    moduleId: string,
    courseId: string,
    manualTranscript?: string
): Promise<Material> => {
    let content: string

    if (manualTranscript) {
        // User provided transcript manually
        content = manualTranscript
    } else if (type === 'youtube') {
        // Fetch YouTube transcript
        content = await fetchYoutubeTranscript(sourceUrlOrFile as string)
    } else {
        // Extract document text
        content = await extractDocumentText(sourceUrlOrFile as File)
    }

    return {
        id: generateId(),
        title,
        type,
        sourceUrl: type === 'youtube' ? (sourceUrlOrFile as string) : undefined,
        content,
        status: 'ready',
        createdAt: new Date().toISOString(),
        moduleId,
        courseId
    }
}
