import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  MENU_EXTRACTION_SYSTEM_PROMPT,
  MENU_EXTRACTION_USER_PROMPT,
  MENU_EXTRACTION_USER_PROMPT_PDF,
  MENU_EXTRACTION_USER_PROMPT_URL,
  ParsedMenuItem,
} from './prompts'

interface ParseMenuRequest {
  restaurantId: string
  images?: string[]
  pdfBase64?: string
  menuUrl?: string
}

/* ── helpers ──────────────────────────────────────────────────── */

function parseBase64(dataUrl: string): { mimeType: string; data: string } {
  let mimeType = 'image/jpeg'
  let data = dataUrl

  if (dataUrl.startsWith('data:')) {
    const parts = dataUrl.split(',')
    const header = parts[0]
    data = parts[1]

    const match = header.match(/data:([^;]+)/)
    if (match) mimeType = match[1]
  }

  return { mimeType, data }
}

function extractTextFromHtml(html: string): string {
  let text = html
  // Remove script and style blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
  // Replace block tags with newlines
  text = text.replace(/<\/(p|div|li|tr|h[1-6]|br\s*\/?)>/gi, '\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  // Limit to 50k chars
  return text.slice(0, 50000)
}

async function fetchUrlText(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RestoQR/1.0)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    return extractTextFromHtml(html)
  } finally {
    clearTimeout(timeout)
  }
}

function parseAiResponse(text: string): ParsedMenuItem[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No se encontró un array JSON en la respuesta de la IA.')
  return JSON.parse(jsonMatch[0])
}

/* ── Gemini ───────────────────────────────────────────────────── */

type GeminiPart = { inline_data: { mime_type: string; data: string } } | { text: string }

async function callGeminiAPI(parts: GeminiPart[]): Promise<ParsedMenuItem[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no está configurada.')
  }

  const requestBody = {
    contents: [{ parts }],
    system_instruction: { parts: [{ text: MENU_EXTRACTION_SYSTEM_PROMPT }] },
    generation_config: { temperature: 0.3, top_p: 0.95, max_output_tokens: 8192 },
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  )

  if (!response.ok) {
    const errorMsg = await response.text()
    throw new Error(`Gemini Falló (${response.status}): ${errorMsg}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini devolvió una respuesta vacía.')

  return parseAiResponse(text)
}

/* ── Claude ───────────────────────────────────────────────────── */

async function callClaudeAPI(content: any[]): Promise<ParsedMenuItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured')
  }

  const requestBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{ role: 'user' as const, content }],
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
    throw new Error(`Claude Falló: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('No text in Claude response')

  return parseAiResponse(text)
}

/* ── Build AI payloads per input type ─────────────────────────── */

function buildImageParts(images: string[]) {
  const geminiParts: GeminiPart[] = images.map((img) => {
    const { mimeType, data } = parseBase64(img)
    return { inline_data: { mime_type: mimeType, data } }
  })
  geminiParts.push({ text: MENU_EXTRACTION_USER_PROMPT(images.length) })

  const claudeContent = [
    ...images.map((img) => {
      const { mimeType, data } = parseBase64(img)
      return {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: mimeType, data },
      }
    }),
    { type: 'text' as const, text: MENU_EXTRACTION_USER_PROMPT(images.length) },
  ]

  return { geminiParts, claudeContent }
}

function buildPdfParts(pdfBase64: string) {
  const { data } = parseBase64(pdfBase64)

  const geminiParts: GeminiPart[] = [
    { inline_data: { mime_type: 'application/pdf', data } },
    { text: MENU_EXTRACTION_USER_PROMPT_PDF },
  ]

  const claudeContent = [
    {
      type: 'document' as const,
      source: { type: 'base64' as const, media_type: 'application/pdf', data },
    },
    { type: 'text' as const, text: MENU_EXTRACTION_USER_PROMPT_PDF },
  ]

  return { geminiParts, claudeContent }
}

function buildUrlParts(text: string, url: string) {
  const prompt = MENU_EXTRACTION_USER_PROMPT_URL(url) + '\n\n' + text

  const geminiParts: GeminiPart[] = [{ text: prompt }]
  const claudeContent = [{ type: 'text' as const, text: prompt }]

  return { geminiParts, claudeContent }
}

/* ── POST handler ─────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body: ParseMenuRequest = await request.json()
    const { restaurantId, images, pdfBase64, menuUrl } = body

    // Validate: need restaurantId and at least one input
    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId es requerido' }, { status: 400 })
    }

    const hasImages = images && images.length > 0
    const hasPdf = !!pdfBase64
    const hasUrl = !!menuUrl

    if (!hasImages && !hasPdf && !hasUrl) {
      return NextResponse.json(
        { error: 'Debés enviar imágenes, un PDF o una URL' },
        { status: 400 }
      )
    }

    if (hasImages && images!.length > 10) {
      return NextResponse.json({ error: 'Máximo 10 imágenes por solicitud' }, { status: 400 })
    }

    if (hasUrl && !/^https?:\/\/.+/.test(menuUrl!)) {
      return NextResponse.json({ error: 'La URL debe comenzar con http:// o https://' }, { status: 400 })
    }

    // Usage tracking
    const supabase = await createClient()
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('id, photos_processed')
      .eq('restaurant_id', restaurantId)
      .eq('month', currentMonth)
      .maybeSingle()

    const limit = 30
    const processed = usage?.photos_processed || 0
    const cost = hasImages ? images!.length : 1

    if (processed + cost > limit) {
      return NextResponse.json(
        { error: `Has alcanzado tu límite de ${limit} procesamientos este mes` },
        { status: 429 }
      )
    }

    // Build AI payloads
    let geminiParts: GeminiPart[]
    let claudeContent: any[]

    if (hasImages) {
      ({ geminiParts, claudeContent } = buildImageParts(images!))
    } else if (hasPdf) {
      ({ geminiParts, claudeContent } = buildPdfParts(pdfBase64!))
    } else {
      const text = await fetchUrlText(menuUrl!)
      if (text.length < 50) {
        return NextResponse.json(
          { error: 'No se pudo extraer contenido útil de esa URL. Probá con otra o subí una imagen/PDF.' },
          { status: 400 }
        )
      }
      ;({ geminiParts, claudeContent } = buildUrlParts(text, menuUrl!))
    }

    // Call AI (Gemini first, Claude fallback)
    let parsedItems: ParsedMenuItem[] = []
    let aiProvider = ''

    try {
      parsedItems = await callGeminiAPI(geminiParts)
      aiProvider = 'gemini'
    } catch (geminiError: any) {
      console.log('Gemini failed, trying Claude fallback...', geminiError.message)
      try {
        parsedItems = await callClaudeAPI(claudeContent)
        aiProvider = 'claude'
      } catch (claudeError: any) {
        console.error('Claude API error:', claudeError)
        throw new Error(`Ambas IAs fallaron. Gemini: ${geminiError.message}. Claude: ${claudeError.message}`)
      }
    }

    // Update usage
    const newProcessed = processed + cost
    if (usage) {
      await supabase.from('ai_usage').update({ photos_processed: newProcessed }).eq('id', usage.id)
    } else {
      await supabase.from('ai_usage').insert({
        restaurant_id: restaurantId,
        month: currentMonth,
        photos_processed: cost,
      })
    }

    return NextResponse.json({
      items: parsedItems || [],
      aiProvider,
      itemsCount: parsedItems?.length || 0,
    })
  } catch (error) {
    console.error('Parse menu error:', error)
    return NextResponse.json({ error: 'Error procesando menú' }, { status: 500 })
  }
}
