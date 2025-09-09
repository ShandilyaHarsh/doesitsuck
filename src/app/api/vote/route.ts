import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    // For localhost/development, use a default country or detect from external service
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      // Get actual public IP for development
      const publicIPResponse = await fetch('http://ip-api.com/json/')
      if (publicIPResponse.ok) {
        const publicData = await publicIPResponse.json()
        console.log('Development mode - detected country:', publicData.countryCode)
        return publicData.countryCode || 'US'
      }
      return 'US' // Default fallback for development
    }
    
    // Use ip-api.com free service for production IPs
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    if (!response.ok) return null
    
    const data = await response.json()
    console.log('Country lookup for IP', ip, ':', data.countryCode)
    return data.countryCode || null
  } catch (error) {
    console.error('Error looking up country:', error)
    return 'Unknown'
  }
}

function getClientIP(request: NextRequest): string | null {
  // Try various headers for getting real client IP
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP.trim()
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }
  
  // Fallback for development
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {
  try {
    const { itemId, voteType, userAgent, fingerprint } = await request.json()
    
    // Get client IP and country
    const clientIP = getClientIP(request)
    console.log('Client IP detected:', clientIP)
    
    const country = clientIP ? await getCountryFromIP(clientIP) : null
    console.log('Country detected:', country)
    
    // Insert vote into database
    const { data, error } = await supabase
      .from('votes')
      .insert({
        item_id: itemId,
        vote_type: voteType,
        ip_address: clientIP,
        user_agent: userAgent,
        fingerprint: fingerprint,
        country: country
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting vote:', error)
      return NextResponse.json({ error: 'Failed to insert vote' }, { status: 500 })
    }

    console.log('Vote inserted successfully with country:', data.country)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in vote API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}