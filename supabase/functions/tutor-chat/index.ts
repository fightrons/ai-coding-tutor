import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const TUTOR_NAME = 'Anu'

// System prompt that defines Anu's personality and teaching approach
const SYSTEM_PROMPT = `You are ${TUTOR_NAME}, a friendly and patient JavaScript programming tutor. You're helping a beginner learn JavaScript through an interactive coding platform.

## Your Personality
- Warm, encouraging, and patient
- You celebrate small wins and normalize mistakes as part of learning
- You use simple analogies to explain concepts
- You're concise - students are in a coding environment, not a lecture hall

## Teaching Approach
- Give hints, not answers (unless the student is really stuck after multiple attempts)
- Ask guiding questions to help students discover solutions themselves
- When explaining errors, focus on WHY it happened, not just how to fix it
- Build on what the student already knows
- One concept at a time - don't overwhelm

## Response Guidelines
- Keep responses short (2-4 paragraphs max)
- Use code examples sparingly and keep them minimal
- If showing code, use \`inline code\` for small snippets
- Never give the complete solution unless explicitly asked after struggling
- End with a question or gentle prompt when appropriate

## Context Awareness
- You'll receive the current lesson content, exercise, and the student's code
- Reference specific parts of their code when giving feedback
- If they have a syntax error, help them find it without pointing to the exact character
- If tests are failing, guide them to understand what the test expects

Remember: Your goal is to help them LEARN, not just get the right answer.`

interface TutorContext {
  lessonId: string
  lessonTitle: string
  lessonContent: string
  exerciseDescription: string | null
  availableHints: string[]
  studentName: string
  currentCode: string
  lastError: string | null
  testResults: string | null
  attemptCount: number
  hintLevel: number
  recentMessages: Array<{ role: string; content: string }>
}

interface TutorRequest {
  context: TutorContext
  userMessage: string
}

function buildMessages(request: TutorRequest) {
  const { context, userMessage } = request

  // Build context message
  let contextInfo = `## Current Lesson: ${context.lessonTitle}\n\n`

  if (context.lessonContent) {
    contextInfo += `### Lesson Summary\n${context.lessonContent}\n\n`
  }

  if (context.exerciseDescription) {
    contextInfo += `### Exercise\n${context.exerciseDescription}\n\n`
  }

  if (context.currentCode) {
    contextInfo += `### Student's Current Code\n\`\`\`javascript\n${context.currentCode}\n\`\`\`\n\n`
  }

  if (context.lastError) {
    contextInfo += `### Error\n${context.lastError}\n\n`
  }

  if (context.testResults) {
    contextInfo += `### Test Results\n${context.testResults}\n\n`
  }

  contextInfo += `### Student Info\n- Name: ${context.studentName}\n- Attempts on this exercise: ${context.attemptCount}\n- Hints given so far: ${context.hintLevel}`

  if (context.hintLevel >= 2) {
    contextInfo += `\n\nNote: The student has asked for help multiple times. You can be more direct now.`
  }

  // Build messages array for OpenAI
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: contextInfo },
  ]

  // Add recent conversation history
  for (const msg of context.recentMessages.slice(-6)) {
    messages.push({
      role: msg.role === 'student' ? 'user' : 'assistant',
      content: msg.content,
    })
  }

  // Add current message
  messages.push({ role: 'user', content: userMessage })

  return messages
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const request: TutorRequest = await req.json()
    const messages = buildMessages(request)

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || "I'm having trouble responding right now. Please try again."

    // Determine message type based on content
    let messageType = 'explanation'
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('hint:') || lowerContent.includes('try ')) {
      messageType = 'hint'
    } else if (lowerContent.includes('great') || lowerContent.includes('well done') || lowerContent.includes('nice')) {
      messageType = 'encouragement'
    }

    return new Response(JSON.stringify({ content, messageType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
