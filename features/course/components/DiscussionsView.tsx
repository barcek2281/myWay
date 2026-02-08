import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import {
  MessageSquare,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import apiClient from '../../../lib/axios-client'

interface DiscussionReply {
  id: string
  author: string
  authorRole: string
  avatar: string
  content: string
  timestamp: string
  likes: number
}

interface Discussion {
  id: string
  title: string
  author: string
  authorRole: string
  avatar: string
  content: string
  timestamp: string
  replies: number
  likes: number
  replyList?: DiscussionReply[]
}

export function DiscussionsView() {
  const { courseId } = useParams()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const fetchDiscussions = async () => {
    try {
      // Try backend first
      const response = await apiClient.get(`/discussions/threads/course/${courseId}`)
      const backendThreads = response.data || []

      const mapped = backendThreads.map((thread: any) => ({
        id: String(thread.id),
        title: thread.title || 'Discussion',
        author: thread.creator?.name || 'Unknown',
        authorRole: thread.creator?.role || 'Student',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.creator?.name || 'User')}`,
        content: thread.body || '',
        timestamp: thread.created_at || 'Recently',
        replies: (thread.replies || []).length,
        likes: 0,
        replyList: (thread.replies || []).map((reply: any) => ({
          id: String(reply.id),
          author: reply.creator?.name || 'Unknown',
          authorRole: reply.creator?.role || 'Student',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.creator?.name || 'User')}`,
          content: reply.body || '',
          timestamp: reply.created_at || 'Recently',
          likes: 0,
        })),
      }))

      if (mapped.length > 0) {
        setDiscussions(mapped)
        return
      }

      // Mock discussion data fallback
      const mockDiscussions: Discussion[] = [
        {
          id: 'd1',
          title: 'Question about Binary Search Trees',
          author: 'Alice Chen',
          authorRole: 'Student',
          avatar: 'https://ui-avatars.com/api/?name=Alice+Chen',
          content: 'Can someone explain the difference between balanced and unbalanced BSTs? I\'m having trouble understanding when to use each.',
          timestamp: '2 days ago',
          replies: 3,
          likes: 12,
          replyList: [
            {
              id: 'r1',
              author: 'Prof. John Doe',
              authorRole: 'Instructor',
              avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4f46e5',
              content: 'Great question! A balanced BST maintains a height of O(log n), ensuring efficient operations. An unbalanced BST can degrade to O(n) in worst case. AVL and Red-Black trees are self-balancing variants.',
              timestamp: '1 day ago',
              likes: 8
            },
            {
              id: 'r2',
              author: 'Bob Martinez',
              authorRole: 'Student',
              avatar: 'https://ui-avatars.com/api/?name=Bob+Martinez',
              content: 'To add to that, you typically use balanced BSTs when you need guaranteed performance. Regular BSTs are simpler to implement but can have worst-case scenarios.',
              timestamp: '1 day ago',
              likes: 5
            },
            {
              id: 'r3',
              author: 'Alice Chen',
              authorRole: 'Student',
              avatar: 'https://ui-avatars.com/api/?name=Alice+Chen',
              content: 'Thank you both! That makes much more sense now.',
              timestamp: '20 hours ago',
              likes: 2
            }
          ]
        },
        {
          id: 'd2',
          title: 'Study Group for Midterm',
          author: 'Sarah Johnson',
          authorRole: 'Student',
          avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson',
          content: 'Anyone interested in forming a study group for the upcoming midterm? Planning to meet on weekends at the library.',
          timestamp: '3 days ago',
          replies: 7,
          likes: 18,
          replyList: [
            {
              id: 'r4',
              author: 'Mike Lee',
              authorRole: 'Student',
              avatar: 'https://ui-avatars.com/api/?name=Mike+Lee',
              content: 'I\'m in! What time works best for everyone?',
              timestamp: '3 days ago',
              likes: 4
            },
            {
              id: 'r5',
              author: 'Emma Wilson',
              authorRole: 'Student',
              avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson',
              content: 'Count me in too! Saturday afternoons would be perfect for me.',
              timestamp: '2 days ago',
              likes: 3
            }
          ]
        },
        {
          id: 'd3',
          title: 'Assignment 2 Clarification',
          author: 'David Park',
          authorRole: 'Student',
          avatar: 'https://ui-avatars.com/api/?name=David+Park',
          content: 'For the second assignment, are we supposed to implement the hash table from scratch or can we use built-in libraries?',
          timestamp: '5 hours ago',
          replies: 1,
          likes: 6,
          replyList: [
            {
              id: 'r6',
              author: 'Prof. John Doe',
              authorRole: 'Instructor',
              avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4f46e5',
              content: 'Good question! You should implement it from scratch using arrays. This will help you understand the underlying mechanics better.',
              timestamp: '3 hours ago',
              likes: 8
            }
          ]
        },
        {
          id: 'd4',
          title: 'Recommended Resources',
          author: 'Lisa Anderson',
          authorRole: 'Student',
          avatar: 'https://ui-avatars.com/api/?name=Lisa+Anderson',
          content: 'What are some good resources for learning more about graph algorithms? The textbook is great but I\'d like additional practice problems.',
          timestamp: '1 week ago',
          replies: 5,
          likes: 15,
          replyList: []
        }
      ];
      setDiscussions(mockDiscussions);
    } catch (err) {
      console.error('Failed to fetch discussions, using fallback mock:', err);

      const mockDiscussions: Discussion[] = [
        {
          id: 'd1',
          title: 'Question about Binary Search Trees',
          author: 'Alice Chen',
          authorRole: 'Student',
          avatar: 'https://ui-avatars.com/api/?name=Alice+Chen',
          content: 'Can someone explain the difference between balanced and unbalanced BSTs? I\'m having trouble understanding when to use each.',
          timestamp: '2 days ago',
          replies: 3,
          likes: 12,
          replyList: [],
        },
      ]
      setDiscussions(mockDiscussions)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchDiscussions();
  }, [courseId]);

  const handlePostReply = async (threadId: string) => {
    if (!replyText.trim()) return
    try {
      await apiClient.post('/discussions/replies', {
        threadId,
        body: replyText,
      })
      setReplyText('')
      fetchDiscussions() // Refresh
    } catch (err) {
      alert('Failed to post reply')
    }
  }

  const getRoleBadge = (role: string) => {
    const styles: any = {
      Teacher: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      TA: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
      Student: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    }
    return styles[role] || styles.Student
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Discussions</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          New Discussion
        </button>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.map((discussion: Discussion, index: number) => (
          <motion.div
            key={discussion.id}
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
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors"
          >
            {/* Main Discussion */}
            <div className="p-5">
              <div className="flex gap-4">
                <img
                  src={discussion.avatar}
                  alt={discussion.author}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {discussion.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {discussion.author}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(discussion.authorRole)}`}
                        >
                          {discussion.authorRole}
                        </span>
                        <span className="text-gray-500 dark:text-gray-500">•</span>
                        <span className="text-gray-500 dark:text-gray-500">
                          {discussion.timestamp}
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {discussion.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <ThumbsUp size={16} />
                      <span>{discussion.likes}</span>
                    </button>
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === discussion.id ? null : discussion.id,
                        )
                      }
                      className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <MessageSquare size={16} />
                      <span>{discussion.replies} replies</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Reply size={16} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Replies */}
            <AnimatePresence>
              {expandedId === discussion.id && discussion.replyList && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="p-5 space-y-4">
                    {discussion.replyList.map((reply: DiscussionReply) => (
                      <div key={reply.id} className="flex gap-3">
                        <img
                          src={reply.avatar}
                          alt={reply.author}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {reply.author}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(reply.authorRole)}`}
                            >
                              {reply.authorRole}
                            </span>
                            <span className="text-gray-500 dark:text-gray-500">•</span>
                            <span className="text-gray-500 dark:text-gray-500">
                              {reply.timestamp}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">
                            {reply.content}
                          </p>
                          <button className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <ThumbsUp size={14} />
                            <span>{reply.likes}</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Reply Input */}
                    <div className="flex gap-3 pt-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=You`}
                        alt="You"
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <textarea
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          rows={2}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handlePostReply(discussion.id)}
                            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                            Post Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
