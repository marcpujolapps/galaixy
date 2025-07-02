import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await generateText({
      model: openai("gpt-4-turbo"),
      messages,
    })

    return Response.json({
      provider: "OpenAI",
      model: "GPT-4 Turbo",
      content: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("OpenAI Turbo API error:", error)
    return Response.json({
      provider: "OpenAI",
      model: "GPT-4 Turbo",
      content: "Error generating response",
      error: true,
    })
  }
}
