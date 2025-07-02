import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { responses, additionalPrompt, originalPrompt } = await req.json()

    const systemPrompt = `You are tasked with creating the best possible response by synthesizing and combining the strengths of multiple AI responses. 

Your goal is to:
1. Identify the best insights, information, and approaches from each response
2. Combine them into a single, coherent, and comprehensive answer
3. Eliminate redundancy while preserving unique valuable content
4. Ensure the final response is better than any individual response

Here are the responses from different AI models:

${responses
  .map(
    (r: any, i: number) => `
**${r.provider} (${r.model}):**
${r.content}
`,
  )
  .join("\n---\n")}

Original user prompt: "${originalPrompt}"
${additionalPrompt ? `\nAdditional guidance: "${additionalPrompt}"` : ""}

Create a synthesized response that takes the best elements from all responses above.`

    const result = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            additionalPrompt ||
            "Please synthesize the best response using the strengths of all the provided responses.",
        },
      ],
    })

    return Response.json({
      provider: "Synthesized",
      model: "GPT-4o (Synthesis)",
      content: result.text,
      usage: result.usage,
    })
  } catch (error) {
    console.error("Synthesis API error:", error)
    return Response.json({
      provider: "Synthesized",
      model: "GPT-4o (Synthesis)",
      content: "Error generating synthesized response",
      error: true,
    })
  }
}
