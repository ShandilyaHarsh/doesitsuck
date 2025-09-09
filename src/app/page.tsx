'use client'

import { useState, useEffect, useRef } from 'react'
import { getItems, insertVote, getRecentVotes, getCountryVotes, type ItemWithVotes, type VoteWithItem, type CountryVote } from '@/lib/supabase'

export default function Home() {
  const [items, setItems] = useState<ItemWithVotes[]>([])
  const [recentVotes, setRecentVotes] = useState<VoteWithItem[]>([])
  const [countryVotes, setCountryVotes] = useState<CountryVote[]>([])
  const [activeTab, setActiveTab] = useState<'voting' | 'countries'>('voting')
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [itemsData, votesData, countryVotesData] = await Promise.all([
        getItems(),
        getRecentVotes(),
        getCountryVotes()
      ])
      setItems(itemsData)
      setRecentVotes(votesData)
      setCountryVotes(countryVotesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (itemId: number, type: 'upvote' | 'downvote') => {
    if (voting) return
    
    setVoting(true)
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          voteType: type,
          userAgent: navigator.userAgent,
          fingerprint: undefined // can be added later
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit vote')
      }
      
      // Refresh data after voting
      await loadData()
    } catch (error) {
      console.error('Error submitting vote:', error)
      alert('Error submitting vote. Please try again.')
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const getScore = (item: ItemWithVotes) => item.upvotes - item.downvotes

  const models = items.filter(item => item.category === 'model').sort((a, b) => getScore(a) - getScore(b))
  const tools = items.filter(item => item.category === 'tool').sort((a, b) => getScore(a) - getScore(b))

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Does It Suck?</h1>
          <p className="text-gray-600">Vote on AI models and coding tools</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('voting')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'voting'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🗳️ Voting
            </button>
            <button
              onClick={() => setActiveTab('countries')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'countries'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🌍 Countries
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'voting' && (
          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                🤖 AI Models
              </h2>
              <div className="space-y-3">
                {models.map((item) => (
                  <VoteCard key={item.id} item={item} onVote={handleVote} voting={voting} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                🛠️ Coding Tools
              </h2>
              <div className="space-y-3">
                {tools.map((item) => (
                  <VoteCard key={item.id} item={item} onVote={handleVote} voting={voting} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'countries' && <CountryVotesTab countryVotes={countryVotes} />}
      </div>
    </div>
  )
}

function VoteCard({ 
  item, 
  onVote, 
  voting 
}: { 
  item: ItemWithVotes; 
  onVote: (id: number, type: 'upvote' | 'downvote') => void;
  voting: boolean;
}) {
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
            disabled={voting}
            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
            title="Upvote"
          >
            👍
          </button>
          <button
            onClick={() => onVote(item.id, 'downvote')}
            disabled={voting}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
            title="Downvote"
          >
            👎
          </button>
        </div>
      </div>
    </div>
  )
}


function CountryVotesTab({ countryVotes }: { countryVotes: CountryVote[] }) {
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<'1h' | '6h' | '24h' | 'all'>('all')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Country code to name mapping (add more as needed)
  const countryNames: Record<string, string> = {
    'US': '🇺🇸 United States',
    'IN': '🇮🇳 India',
    'GB': '🇬🇧 United Kingdom',
    'CA': '🇨🇦 Canada',
    'AU': '🇦🇺 Australia',
    'DE': '🇩🇪 Germany',
    'FR': '🇫🇷 France',
    'JP': '🇯🇵 Japan',
    'CN': '🇨🇳 China',
    'BR': '🇧🇷 Brazil',
    'RU': '🇷🇺 Russia',
    'IT': '🇮🇹 Italy',
    'ES': '🇪🇸 Spain',
    'MX': '🇲🇽 Mexico',
    'ZA': '🇿🇦 South Africa',
    'KR': '🇰🇷 South Korea',
    'SG': '🇸🇬 Singapore',
    'AE': '🇦🇪 United Arab Emirates',
    'SA': '🇸🇦 Saudi Arabia',
    'AR': '🇦🇷 Argentina',
    'CH': '🇨🇭 Switzerland',
    'SE': '🇸🇪 Sweden',
    'NL': '🇳🇱 Netherlands',
    'NO': '🇳🇴 Norway',
    'FI': '🇫🇮 Finland',
    'DK': '🇩🇰 Denmark',
    'NZ': '🇳🇿 New Zealand',
    'IE': '🇮🇪 Ireland',
    'TH': '🇹🇭 Thailand',
    'PH': '🇵🇭 Philippines',
    'TR': '🇹🇷 Turkey',
    'EG': '🇪🇬 Egypt',
    'KE': '🇰🇪 Kenya',
    'NG': '🇳🇬 Nigeria',
    'PK': '🇵🇰 Pakistan',
    'BD': '🇧🇩 Bangladesh',
    'VN': '🇻🇳 Vietnam',
    'MY': '🇲🇾 Malaysia',
    'HK': '🇭🇰 Hong Kong',
    'IL': '🇮🇱 Israel',
    'PL': '🇵🇱 Poland',
    'PT': '🇵🇹 Portugal',
    'GR': '🇬🇷 Greece',
    'UA': '🇺🇦 Ukraine',
    'CL': '🇨🇱 Chile',
    'CO': '🇨🇴 Colombia',
    'PE': '🇵🇪 Peru',
    'CZ': '🇨🇿 Czech Republic',
    'HU': '🇭🇺 Hungary',
    'AT': '🇦🇹 Austria',
    'BE': '🇧🇪 Belgium',
    'Unknown': '🌍 Unknown'
  };
  

  const getCountryDisplay = (code: string) => {
    return countryNames[code] || `🌍 ${code}`
  }

  // Filter votes by time
  const getFilteredByTime = () => {
    if (timeFilter === 'all') return countryVotes

    const now = new Date()
    const hoursAgo = {
      '1h': 1,
      '6h': 6,
      '24h': 24
    }[timeFilter]

    const cutoffTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
    return countryVotes.filter(vote => new Date(vote.created_at) >= cutoffTime)
  }

  const timeFilteredVotes = getFilteredByTime()

  // Get unique countries from filtered votes
  const countries = ['all', ...Array.from(new Set(timeFilteredVotes.map(vote => vote.country))).sort()]

  // Filter by selected country
  const filteredVotes = selectedCountry === 'all' 
    ? timeFilteredVotes 
    : timeFilteredVotes.filter(vote => vote.country === selectedCountry)

  // Aggregate votes by country and item
  const aggregatedData = filteredVotes.reduce((acc, vote) => {
    const key = `${vote.country}-${vote.item.name}`
    if (!acc[key]) {
      acc[key] = {
        country: vote.country,
        item_name: vote.item.name,
        category: vote.item.category,
        upvotes: 0,
        downvotes: 0,
        score: 0
      }
    }
    if (vote.vote_type === 'upvote') {
      acc[key].upvotes++
      acc[key].score++
    } else {
      acc[key].downvotes++
      acc[key].score--
    }
    return acc
  }, {} as Record<string, any>)

  // Group by country for display
  const groupedData = Object.values(aggregatedData).reduce((acc: any, item: any) => {
    if (!acc[item.country]) {
      acc[item.country] = []
    }
    acc[item.country].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Time Period</h3>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: '1h', label: '1 Hour' },
                { key: '6h', label: '6 Hours' },
                { key: '24h', label: '24 Hours' },
                { key: 'all', label: 'All Time' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeFilter(key as any)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    timeFilter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Country</h3>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-3 py-2 text-sm text-left bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedCountry === 'all' ? '🌍 All Countries' : getCountryDisplay(selectedCountry)}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  <button
                    onClick={() => {
                      setSelectedCountry('all')
                      setDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                      selectedCountry === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    🌍 All Countries
                  </button>
                  {countries.filter(c => c !== 'all').map(country => (
                    <button
                      key={country}
                      onClick={() => {
                        setSelectedCountry(country)
                        setDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                        selectedCountry === country ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {getCountryDisplay(country)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-3">
          Showing {filteredVotes.length} votes from {Object.keys(groupedData).length} countries
        </p>
      </div>

      {/* Country Vote Data */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Country-wise Voting Results</h3>
          <p className="text-sm text-gray-500 mt-1">Shows net score (upvotes - downvotes) per item by country</p>
        </div>
        
        {Object.keys(groupedData).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No country data available yet
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(groupedData).map(([country, items]) => (
              <div key={country} className="mb-6 last:mb-0">
                <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  {getCountryDisplay(country)}
                </h4>
                <div className="space-y-2">
                  {(items as any[])
                    .sort((a: any, b: any) => a.score - b.score) // Sort by score ascending (worst first)
                    .map((item: any) => (
                      <div 
                        key={`${country}-${item.item_name}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm px-2 py-1 rounded ${
                            item.category === 'model' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {item.category === 'model' ? '🤖' : '🛠️'}
                          </span>
                          <span className="font-medium text-gray-900">{item.item_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-500">
                            <span className="text-green-600">↑{item.upvotes}</span>
                            {' '}
                            <span className="text-red-600">↓{item.downvotes}</span>
                          </div>
                          <div className={`font-bold text-lg ${
                            item.score > 0 ? 'text-green-600' : item.score < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {item.score > 0 ? '+' : ''}{item.score}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}