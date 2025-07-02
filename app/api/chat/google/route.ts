import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await generateText({
      model: google("gemini-1.5-pro"),
      messages,
    })

    return Response.json({
      provider: "Google",
      model: "Gemini 1.5 Pro",
      content: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("Google API error:", error)
    return Response.json({
      provider: "Google",
      model: "Gemini 1.5 Pro",
      content: "Error generating response",
      error: true,
    })
  }
}
