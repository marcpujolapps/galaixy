import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await generateText({
      model: openai("o1-mini"),
      messages,
    })

    return Response.json({
      provider: "OpenAI",
      model: "o1-mini",
      content: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("OpenAI o1 API error:", error)
    return Response.json({
      provider: "OpenAI",
      model: "o1-mini",
      content: "Error generating response",
      error: true,
    })
  }
}
