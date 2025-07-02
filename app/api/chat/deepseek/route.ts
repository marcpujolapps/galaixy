import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await generateText({
      model: deepseek("deepseek-chat"),
      messages,
    })

    return Response.json({
      provider: "DeepSeek",
      model: "DeepSeek Chat",
      content: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("DeepSeek API error:", error)
    return Response.json({
      provider: "DeepSeek",
      model: "DeepSeek Chat",
      content: "Error generating response",
      error: true,
    })
  }
}
