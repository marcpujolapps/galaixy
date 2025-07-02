import { openai } from "@ai-sdk/openai"
import { experimental_generateImage } from "ai"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const result = await experimental_generateImage({
      model: openai.image("gpt-image-1"),
      prompt,
      size: "1024x1024",
    })

    return Response.json({
      provider: "OpenAI",
      model: "DALL-E 3",
      imageUrl: result.image.url,
      prompt,
    })
  } catch (error) {
    console.error("OpenAI image generation error:", error)
    return Response.json({
      provider: "OpenAI",
      model: "DALL-E 3",
      content: "Error generating image",
      error: true,
    })
  }
}
