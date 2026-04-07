import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  MENU_EXTRACTION_SYSTEM_PROMPT,
  MENU_EXTRACTION_USER_PROMPT,
  ParsedMenuItem,
} from './prompts'

interface ParseMenuRequest {
  restaurantId: string
  images: string[] // base64 or URLs
}

/**
 * Calls Gemini API to parse menu items from images
 * Falls back to Anthropic Claude if Gemini fails or quota exceeded
 */
async function callGeminiAPI(
  images: string[]
): Promise<ParsedMenuItem[] | null> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API key not configured, skipping Gemini')
      return null
    }

    const imageContents = images.map((image) => {
      // TODO: Handle both base64 and URLs
      // For now, assume base64 or proper image format
      return {
        inline_data: {
          mime_type: 'image/jpeg',
          data: image.startsWith('data:')
            ? image.split(',')[1]
            : image,
        },
      }
    })

    const requestBody = {
      contents: [
        {
          parts: [
            ...imageContents,
            {
              text: MENU_EXTRACTION_USER_PROMPT(images.length),
            },
          ],
        },
      ],
      system_instruction: {
        parts: [
          {
            text: MENU_EXTRACTION_SYSTEM_PROMPT,
          },
        ],
      },
      generation_config: {
        temperature: 0.3,
        top_p: 0.95,
        max_output_tokens: 4096,
      },
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Gemini API error:', error)

      // Check if it's a quota exceeded error
      if (error.error?.code === 429) {
        console.log('Gemini quota exceeded, will fallback to Claude')
      }
      return null
    }

    const data = await response.json()
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('No text in Gemini response')
      return null
    }

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON array found in Gemini response')
      return null
    }

    const items: ParsedMenuItem[] = JSON.parse(jsonMatch[0])
    return items
  } catch (error) {
    console.error('Gemini API call failed:', error)
    return null
  }
}

/**
 * Calls Anthropic Claude API to parse menu items from images
 */
async function callClaudeAPI(
  images: string[]
): Promise<ParsedMenuItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured')
  }

  const imageContents = images.map((image) => {
    // TODO: Handle both base64 and URLs
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: image.startsWith('data:')
          ? image.split(',')[1]
          : image,
      },
    }
  })

  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user' as const,
        content: [
          ...imageContents,
          {
            type: 'text' as const,
            text: MENU_EXTRACTION_USER_PROMPT(images.length),
          },
        ],
      },
    ],
    system: MENU_EXTRACTION_SYSTEM_PROMPT,
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Claude API error: ${error.error?.message || 'Unknown error'}`
    )
  }

  const data = await response.json()
  const text = data.content?.[0]?.text

  if (!text) {
    throw new Error('No text in Claude response')
  }

  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('No JSON array found in Claude response')
  }

  const items: ParsedMenuItem[] = JSON.parse(jsonMatch[0])
  return items
}

export async function POST(request: NextRequest) {
  try {
    const body: ParseMenuRequest = await request.json()
    const { restaurantId, images } = body

    // Validate input
    if (!restaurantId || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'restaurantId y images son requeridos' },
        { status: 400 }
      )
    }

    if (images.length > 10) {
      return NextResponse.json(
        { error: 'Máximo 10 imágenes por solicitud' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // TODO: Check monthly usage limit
    // const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    // const { data: usage } = await supabase
    //   .from('ai_usage')
    //   .select('photos_processed')
    //   .eq('restaurant_id', restaurantId)
    //   .eq('month', currentMonth)
    //   .single()

    // TODO: Fetch restaurant plan to determine limit
    // const { data: restaurant } = await supabase
    //   .from('restaurants')
    //   .select('plan')
    //   .eq('id', restaurantId)
    //   .single()

    // const limit = restaurant?.plan === 'pro' ? 100 : 30
    // const processed = usage?.photos_processed || 0

    // if (processed + images.length > limit) {
    //   return NextResponse.json(
    //     { error: `Has alcanzado tu límite de ${limit} fotos procesadas este mes` },
    //     { status: 429 }
    //   )
    // }

    let parsedItems: ParsedMenuItem[] | null = null
    let aiProvider: string = ''

    // Try Gemini first (free tier)
    parsedItems = await callGeminiAPI(images)

    if (parsedItems) {
      aiProvider = 'gemini'
    } else {
      // Fall back to Claude
      try {
        parsedItems = await callClaudeAPI(images)
        aiProvider = 'claude'
      } catch (error) {
        console.error('Claude API error:', error)
        return NextResponse.json(
          { error: 'Error procesando imágenes con IA. Intenta de nuevo.' },
          { status: 500 }
        )
      }
    }

    // TODO: Update usage count in Supabase
    // const newProcessed = processed + images.length
    // if (usage) {
    //   await supabase
    //     .from('ai_usage')
    //     .update({ photos_processed: newProcessed })
    //     .eq('id', usage.id)
    // } else {
    //   await supabase.from('ai_usage').insert({
    //     restaurant_id: restaurantId,
    //     month: currentMonth,
    //     photos_processed: images.length,
    //   })
    // }

    return NextResponse.json({
      items: parsedItems || [],
      aiProvider,
      itemsCount: parsedItems?.length || 0,
    })
  } catch (error) {
    console.error('Parse menu error:', error)
    return NextResponse.json(
      { error: 'Error procesando menú' },
      { status: 500 }
    )
  }
}
