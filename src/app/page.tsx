'use client'

import { useState } from 'react'

interface VoteItem {
  id: string
  name: string
  category: 'model' | 'tool'
  upvotes: number
  downvotes: number
}

const initialItems: VoteItem[] = [
  // AI Models
  { id: '1', name: 'Claude Sonnet 4', category: 'model', upvotes: 0, downvotes: 0 },
  { id: '2', name: 'GPT-5', category: 'model', upvotes: 0, downvotes: 0 },
  { id: '3', name: 'GPT-4o', category: 'model', upvotes: 0, downvotes: 0 },
  { id: '4', name: 'Claude Opus', category: 'model', upvotes: 0, downvotes: 0 },
  { id: '5', name: 'Gemini Pro', category: 'model', upvotes: 0, downvotes: 0 },
  
  // Coding Tools
  { id: '6', name: 'Claude Code', category: 'tool', upvotes: 0, downvotes: 0 },
  { id: '7', name: 'GitHub Copilot', category: 'tool', upvotes: 0, downvotes: 0 },
  { id: '8', name: 'Cursor', category: 'tool', upvotes: 0, downvotes: 0 },
  { id: '9', name: 'Windsurf', category: 'tool', upvotes: 0, downvotes: 0 },
  { id: '10', name: 'Replit Agent', category: 'tool', upvotes: 0, downvotes: 0 },
  { id: '11', name: 'Codium', category: 'tool', upvotes: 0, downvotes: 0 },
]

export default function Home() {
  const [items, setItems] = useState<VoteItem[]>(initialItems)

  const handleVote = (id: string, type: 'upvote' | 'downvote') => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, [type === 'upvote' ? 'upvotes' : 'downvotes']: item[type === 'upvote' ? 'upvotes' : 'downvotes'] + 1 }
        : item
    ))
  }

  const getScore = (item: VoteItem) => item.upvotes - item.downvotes

  const models = items.filter(item => item.category === 'model').sort((a, b) => getScore(b) - getScore(a))
  const tools = items.filter(item => item.category === 'tool').sort((a, b) => getScore(b) - getScore(a))

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Does It Suck?</h1>
          <p className="text-gray-600">Vote on AI models and coding tools</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              🤖 AI Models
            </h2>
            <div className="space-y-3">
              {models.map((item) => (
                <VoteCard key={item.id} item={item} onVote={handleVote} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              🛠️ Coding Tools
            </h2>
            <div className="space-y-3">
              {tools.map((item) => (
                <VoteCard key={item.id} item={item} onVote={handleVote} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function VoteCard({ item, onVote }: { item: VoteItem; onVote: (id: string, type: 'upvote' | 'downvote') => void }) {
  const score = item.upvotes - item.downvotes

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              ↑ {item.upvotes}
            </span>
            <span className="flex items-center gap-1">
              ↓ {item.downvotes}
            </span>
            <span className={`font-medium ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              Score: {score > 0 ? '+' : ''}{score}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onVote(item.id, 'upvote')}
            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            title="Upvote"
          >
            👍
          </button>
          <button
            onClick={() => onVote(item.id, 'downvote')}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Downvote"
          >
            👎
          </button>
        </div>
      </div>
    </div>
  )
}