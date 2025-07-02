import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      messages,
    })

    return Response.json({
      provider: "Anthropic",
      model: "Claude 3.5 Sonnet",
      content: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("Claude API error:", error)
    return Response.json({
      provider: "Anthropic",
      model: "Claude 3.5 Sonnet",
      content: "Error generating response",
      error: true,
    })
  }
}
