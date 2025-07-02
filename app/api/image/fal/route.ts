import { fal } from "@ai-sdk/fal"
import { experimental_generateImage } from "ai"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const result = await experimental_generateImage({
      model: fal("fal-ai/flux-pro"),
      prompt,
    })

    return Response.json({
      provider: "Fal AI",
      model: "Flux Pro",
      imageUrl: result.image.url,
      prompt,
    })
  } catch (error) {
    console.error("Fal AI image generation error:", error)
    return Response.json({
      provider: "Fal AI",
      model: "Flux Pro",
      content: "Error generating image",
      error: true,
    })
  }
}
