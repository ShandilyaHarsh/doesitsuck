import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type VoteType = 'upvote' | 'downvote'
export type ItemCategory = 'model' | 'tool'

export interface Item {
  id: number
  name: string
  category: ItemCategory
  created_at: string
}

export interface Vote {
  id: number
  item_id: number
  vote_type: VoteType
  created_at: string
  ip_address: string | null
  user_agent: string | null
  fingerprint: string | null
  country: string | null
}

export interface ItemWithVotes extends Item {
  upvotes: number
  downvotes: number
}

export interface VoteWithItem extends Vote {
  item: Item
}

export interface CountryVoteSummary {
  country: string
  item_name: string
  category: ItemCategory
  upvotes: number
  downvotes: number
  score: number
  last_vote_at?: string
}

export interface CountryVote {
  id: number
  country: string
  item_id: number
  vote_type: VoteType
  created_at: string
  item: Item
}

export async function getItems(): Promise<ItemWithVotes[]> {
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .order('name')

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    throw itemsError
  }

  // Get vote counts for each item
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('item_id, vote_type')

  if (votesError) {
    console.error('Error fetching votes:', votesError)
    throw votesError
  }

  // Count votes for each item
  const voteCounts: Record<number, { upvotes: number; downvotes: number }> = {}
  
  votes?.forEach(vote => {
    if (!voteCounts[vote.item_id]) {
      voteCounts[vote.item_id] = { upvotes: 0, downvotes: 0 }
    }
    if (vote.vote_type === 'upvote') {
      voteCounts[vote.item_id].upvotes++
    } else {
      voteCounts[vote.item_id].downvotes++
    }
  })

  // Combine items with vote counts
  return items.map(item => ({
    ...item,
    upvotes: voteCounts[item.id]?.upvotes || 0,
    downvotes: voteCounts[item.id]?.downvotes || 0
  }))
}

export async function insertVote(
  itemId: number,
  voteType: VoteType,
  userAgent?: string,
  fingerprint?: string
): Promise<Vote> {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      item_id: itemId,
      vote_type: voteType,
      user_agent: userAgent,
      fingerprint: fingerprint
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting vote:', error)
    throw error
  }

  return data as Vote
}

export async function getRecentVotes(limit: number = 50): Promise<VoteWithItem[]> {
  const { data, error } = await supabase
    .from('votes')
    .select(`
      *,
      item:items(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent votes:', error)
    throw error
  }

  return data as VoteWithItem[]
}

export async function getCountryVoteSummary(): Promise<CountryVoteSummary[]> {
  const { data, error } = await supabase
    .from('country_vote_summary')
    .select('*')
    .order('country')
    .order('score')

  if (error) {
    console.error('Error fetching country vote summary:', error)
    throw error
  }

  return data as CountryVoteSummary[]
}

export async function getCountryVotes(): Promise<CountryVote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select(`
      id,
      country,
      item_id,
      vote_type,
      created_at,
      item:items!inner(*)
    `)
    .not('country', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching country votes:', error)
    throw error
  }

  return (data || []) as unknown as CountryVote[]
}