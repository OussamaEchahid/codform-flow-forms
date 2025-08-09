import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl, shop, fileName = 'uploaded-image' } = await req.json()

    if (!imageUrl || !shop) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: imageUrl, shop' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get store access token from database
    const { data: storeData, error: storeError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .eq('is_active', true)
      .single()

    if (storeError || !storeData?.access_token) {
      console.error('Store not found or no access token:', storeError)
      return new Response(
        JSON.stringify({ error: 'Store not found or not authorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Download the image from Supabase Storage
    let imageBlob: Blob
    
    if (imageUrl.startsWith('http')) {
      // External URL
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error('Failed to download image')
      }
      imageBlob = await imageResponse.blob()
    } else {
      // Supabase storage URL - extract the file path
      const urlParts = imageUrl.split('/storage/v1/object/public/')
      if (urlParts.length !== 2) {
        throw new Error('Invalid Supabase storage URL')
      }
      
      const [bucketName, ...pathParts] = urlParts[1].split('/')
      const filePath = pathParts.join('/')
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(filePath)
      
      if (downloadError || !fileData) {
        throw new Error('Failed to download image from storage')
      }
      
      imageBlob = fileData
    }

    // Convert blob to base64
    const arrayBuffer = await imageBlob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    // Determine file extension from blob type or filename
    const fileExtension = imageBlob.type.split('/')[1] || 'png'
    const finalFileName = fileName.includes('.') ? fileName : `${fileName}.${fileExtension}`

    // Upload to Shopify Files using GraphQL
    const shopifyGraphQLUrl = `https://${shop}/admin/api/2025-04/graphql.json`
    
    const mutation = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            preview {
              image {
                url
              }
            }
            ... on MediaImage {
              image {
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const variables = {
      files: [{
        alt: finalFileName,
        contentType: imageBlob.type,
        originalSource: `data:${imageBlob.type};base64,${base64}`
      }]
    }

    const shopifyResponse = await fetch(shopifyGraphQLUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': storeData.access_token,
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    })

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text()
      console.error('Shopify API error:', errorText)
      throw new Error(`Shopify API error: ${shopifyResponse.status}`)
    }

    const shopifyData = await shopifyResponse.json()
    
    if (shopifyData.errors) {
      console.error('Shopify GraphQL errors:', shopifyData.errors)
      throw new Error('Shopify GraphQL errors')
    }

    if (shopifyData.data.fileCreate.userErrors.length > 0) {
      console.error('Shopify user errors:', shopifyData.data.fileCreate.userErrors)
      throw new Error('Shopify user errors: ' + shopifyData.data.fileCreate.userErrors.map((e: any) => e.message).join(', '))
    }

    const uploadedFile = shopifyData.data.fileCreate.files[0]
    const shopifyImageUrl = uploadedFile.preview?.image?.url || uploadedFile.image?.url

    if (!shopifyImageUrl) {
      throw new Error('No image URL returned from Shopify')
    }

    console.log('Successfully uploaded to Shopify Files:', shopifyImageUrl)

    return new Response(
      JSON.stringify({ 
        success: true, 
        shopifyUrl: shopifyImageUrl,
        fileId: uploadedFile.id,
        originalUrl: imageUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error uploading to Shopify Files:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to upload to Shopify Files', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})