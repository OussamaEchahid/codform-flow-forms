import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shop-domain',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

console.log('Starting API Forms Proxy function')

serve(async (req) => {
  console.log(`${req.method} ${req.url}`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const productId = pathParts[pathParts.length - 1] || 'default'
    
    console.log('Processing request for product ID:', productId)
    
    // Get shop domain from headers
    const shopDomain = req.headers.get('x-shop-domain') || req.headers.get('X-Shop-Domain') || 'unknown'
    console.log('Shop domain:', shopDomain)

    // Define API URLs to try
    const apiUrls = [
      `https://lovable-forms-api.netlify.app/.netlify/functions/api-forms/${productId}`,
      `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-forms/${productId}`,
      `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-default/${productId}`
    ]

    let lastError = null
    
    // Try each API URL
    for (const apiUrl of apiUrls) {
      try {
        console.log('Trying API URL:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shop-Domain': shopDomain
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Successfully fetched data from:', apiUrl)
          
          return new Response(JSON.stringify(data), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          })
        } else {
          console.log(`API ${apiUrl} returned status:`, response.status)
          lastError = `HTTP ${response.status} from ${apiUrl}`
        }
      } catch (error) {
        console.log(`Error with API ${apiUrl}:`, error.message)
        lastError = error.message
      }
    }

    // If no API worked, return default form structure
    console.log('All APIs failed, returning default form')
    
    const defaultForm = {
      id: productId,
      title: 'نموذج افتراضي',
      language: 'ar',
      formStyle: {
        formDirection: 'rtl',
        baseFontSize: '14px',
        fieldBorderRadius: '8px',
        fieldBorderColor: '#D1D5DB'
      },
      steps: [
        {
          id: 'step-1',
          title: 'معلومات الطلب',
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'الاسم الكامل',
              placeholder: 'أدخل اسمك الكامل',
              required: true,
              style: {
                showLabel: true,
                labelColor: '#374151'
              }
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'رقم الهاتف',
              placeholder: 'أدخل رقم هاتفك',
              required: true,
              style: {
                showLabel: true,
                labelColor: '#374151'
              }
            },
            {
              id: 'address',
              type: 'textarea',
              label: 'العنوان',
              placeholder: 'أدخل عنوانك بالتفصيل',
              required: true,
              style: {
                showLabel: true,
                labelColor: '#374151'
              }
            },
            {
              id: 'submit',
              type: 'submit',
              label: 'إرسال الطلب',
              style: {
                backgroundColor: '#059669',
                color: '#FFFFFF'
              }
            }
          ]
        }
      ]
    }

    return new Response(JSON.stringify(defaultForm), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Proxy function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: 'Failed to fetch form data'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})