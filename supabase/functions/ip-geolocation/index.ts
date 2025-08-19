import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeoLocationResponse {
  country?: string
  countryCode?: string
  region?: string
  city?: string
  zip?: string
  lat?: number
  lon?: number
  timezone?: string
  isp?: string
  query: string
  status: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().substring(0, 8)
  console.log(`[${requestId}] IP Geolocation request started`)

  try {
    const { ip } = await req.json()
    
    if (!ip || typeof ip !== 'string') {
      throw new Error('Valid IP address is required')
    }

    console.log(`[${requestId}] Looking up geolocation for IP: ${ip}`)

    // استخدام خدمة IP-API.com المجانية (100 requests per minute)
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,zip,lat,lon,timezone,isp,query`)
    
    if (!geoResponse.ok) {
      throw new Error(`Geolocation API error: ${geoResponse.status}`)
    }

    const geoData: GeoLocationResponse = await geoResponse.json()
    
    if (geoData.status === 'fail') {
      console.log(`[${requestId}] Geolocation failed for IP: ${ip}`)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get location for IP address',
        ip: ip
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400
      })
    }

    const result = {
      success: true,
      ip: ip,
      country: geoData.country || 'Unknown',
      countryCode: geoData.countryCode || 'XX',
      region: geoData.region || '',
      city: geoData.city || '',
      zip: geoData.zip || '',
      lat: geoData.lat || 0,
      lon: geoData.lon || 0,
      timezone: geoData.timezone || '',
      isp: geoData.isp || '',
      timestamp: new Date().toISOString()
    }

    console.log(`[${requestId}] Geolocation successful: ${geoData.country} (${geoData.countryCode})`)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error(`[${requestId}] Error in ip-geolocation:`, error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})