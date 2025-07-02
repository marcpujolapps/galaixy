"use client"

import type React from "react"
import type SpeechRecognition from "speech-recognition"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Check, Sparkles, X, ImageIcon, MessageSquare, Mic, MicOff, Zap } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  provider?: string
  model?: string
  type?: "text" | "image"
  imageUrl?: string
  image?: string
}

interface AIResponse {
  provider: string
  model: string
  image: string
  content?: string
  imageUrl?: string
  usage?: any
  error?: boolean
  type?: "text" | "image"
}

interface Provider {
  name: string
  endpoint: string
  image: string
  displayName: string
  category: string
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function MultiAIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [responses, setResponses] = useState<AIResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSynthesisPrompt, setShowSynthesisPrompt] = useState(false)
  const [synthesisPrompt, setSynthesisPrompt] = useState("")
  const [synthesisMode, setSynthesisMode] = useState<"best" | "custom">("best")
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [mode, setMode] = useState<"text" | "image">("text")
  const [selectedModel, setSelectedModel] = useState<string>("compare")
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const textProviders: Provider[] = [
    {
      name: "openai",
      endpoint: "/api/chat/openai",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png",
      displayName: "GPT-4o",
      category: "OpenAI",
    },
    {
      name: "openai-mini",
      endpoint: "/api/chat/openai-mini",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png",
      displayName: "GPT-4o Mini",
      category: "OpenAI",
    },
    {
      name: "openai-o1",
      endpoint: "/api/chat/openai-o1",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png",
      displayName: "o1-mini",
      category: "OpenAI",
    },
    {
      name: "openai-turbo",
      endpoint: "/api/chat/openai-turbo",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png",
      displayName: "GPT-4 Turbo",
      category: "OpenAI",
    },
    {
      name: "google",
      endpoint: "/api/chat/google",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/2560px-Google_Gemini_logo.svg.png",
      displayName: "Gemini 1.5 Pro",
      category: "Google",
    },
    {
      name: "claude",
      endpoint: "/api/chat/claude",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Claude_AI_logo.svg/2560px-Claude_AI_logo.svg.png",
      displayName: "Claude 3.5 Sonnet",
      category: "Anthropic",
    },
    {
      name: "deepseek",
      endpoint: "/api/chat/deepseek",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnV3xGC0Jgb85ykER4er5NtmLJsKuv_1fakw&s",
      displayName: "DeepSeek Chat",
      category: "DeepSeek",
    },
  ]

  const imageProviders: Provider[] = [
    {
      name: "openai",
      endpoint: "/api/image/openai",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png",
      displayName: "DALL-E 3",
      category: "OpenAI",
    },
    // {
    //   name: "fal",
    //   endpoint: "/api/image/fal",
    //   image: "https://fal.ai/favicon.ico",
    //   displayName: "Flux Pro",
    //   category: "Fal AI",
    // },
  ]

  // Define which models to use in Compare mode - easily configurable
  const compareTextModels = ["openai", "google", "claude", "deepseek"] // Change this array to modify compare selection
  const compareImageModels = ["openai"] // Add more image models here when available

  const currentProviders = mode === "text" ? textProviders : imageProviders
  const currentCompareModels = mode === "text" ? compareTextModels : compareImageModels
  const isCompareMode = selectedModel === "compare"

  // Get providers for compare mode
  const compareProviders = currentProviders.filter((p) => currentCompareModels.includes(p.name))

  // Reset to compare mode when switching between text/image if current model doesn't exist
  useEffect(() => {
    if (selectedModel !== "compare") {
      const modelExists = currentProviders.some((p) => p.name === selectedModel)
      if (!modelExists) {
        setSelectedModel("compare")
      }
    }
  }, [mode, selectedModel, currentProviders])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = "es-ES"

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onresult = (event) => {
          let transcript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          setInput(transcript)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      type: mode,
    }
    const conversationHistory = [...messages, userMessage]

    setMessages(conversationHistory)
    setInput("")
    setIsLoading(true)
    setResponses([])

    if (isCompareMode) {
      // Compare mode - query only the models defined in compareModels array
      if (mode === "text") {
        const promises = compareProviders.map(async (provider) => {
          try {
            const response = await fetch(provider.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: conversationHistory }),
            })
            const result = await response.json()
            return { ...result, type: "text" }
          } catch (error) {
            return {
              provider: provider.name,
              image: provider.image,
              model: "Unknown",
              content: "Failed to get response",
              error: true,
              type: "text",
            }
          }
        })

        const results = await Promise.all(promises)
        setResponses(results)
      } else {
        // Image generation
        const promises = compareProviders.map(async (provider) => {
          try {
            const response = await fetch(provider.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: input }),
            })
            const result = await response.json()
            return { ...result, type: "image" }
          } catch (error) {
            return {
              provider: provider.name,
              image: provider.image,
              model: "Unknown",
              content: "Failed to generate image",
              error: true,
              type: "image",
            }
          }
        })

        const results = await Promise.all(promises)
        setResponses(results)
      }
    } else {
      // Single model mode - query only selected provider
      const selectedProvider = currentProviders.find((p) => p.name === selectedModel)
      if (selectedProvider) {
        try {
          let result
          if (mode === "text") {
            const response = await fetch(selectedProvider.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: conversationHistory }),
            })
            result = await response.json()
          } else {
            const response = await fetch(selectedProvider.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: input }),
            })
            result = await response.json()
          }

          // Directly add to conversation without selection step
          const assistantMessage: Message = {
            role: "assistant",
            content: result.content || `Generated image: ${result.imageUrl}`,
            provider: result.provider,
            image: selectedProvider.image,
            model: result.model,
            type: mode,
            imageUrl: result.imageUrl,
          }

          setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
          console.error("Single model error:", error)
        }
      }
    }

    setIsLoading(false)
  }

  const selectResponse = (response: AIResponse) => {
    const assistantMessage: Message = {
      role: "assistant",
      content: response.content || `Generated image: ${response.imageUrl}`,
      provider: response.provider,
      image: response.image,
      model: response.model,
      type: response.type,
      imageUrl: response.imageUrl,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setResponses([])
  }

  const handleSynthesis = async () => {
    if (isSynthesizing || mode === "image") return

    setIsSynthesizing(true)
    setShowSynthesisPrompt(false)

    try {
      const validResponses = responses.filter((r) => !r.error)
      const originalPrompt = messages[messages.length - 1]?.content || ""

      const response = await fetch("/api/chat/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: validResponses,
          additionalPrompt: synthesisMode === "custom" ? synthesisPrompt.trim() : null,
          originalPrompt,
        }),
      })

      const synthesizedResponse = await response.json()

      if (!synthesizedResponse.error) {
        selectResponse({ ...synthesizedResponse, type: "text" })
      }
    } catch (error) {
      console.error("Synthesis error:", error)
    } finally {
      setIsSynthesizing(false)
      setSynthesisPrompt("")
      setSynthesisMode("best")
    }
  }

  // Show conversation history (or single model loading)
  if ((messages.length > 0 && responses.length === 0 && !isLoading) || (!isCompareMode && isLoading)) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          <div className="space-y-8">
            {messages.map((message, index) => (
              <div key={index}>
                {message.role === "user" ? (
                  <div className="text-gray-600 mb-2 flex items-center gap-2">
                    You
                    {message.type === "image" && <ImageIcon className="w-4 h-4" />}
                  </div>
                ) : (
                  <div className="text-gray-600 mb-2 capitalize flex items-center gap-2">
                    {message.image ? (
                      <img src={message.image || "/placeholder.svg"} alt={message.provider} className="h-4 w-auto" />
                    ) : (
                      message.provider
                    )}
                    {message.type === "image" && <ImageIcon className="w-4 h-4" />}
                  </div>
                )}
                <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {message.type === "image" && message.imageUrl ? (
                    <div className="space-y-2">
                      <img
                        src={message.imageUrl || "/placeholder.svg"}
                        alt={message.content}
                        className="max-w-md rounded-lg border border-gray-200"
                      />
                      <p className="text-sm text-gray-600">{message.content}</p>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}

            {/* Show loading for single model mode */}
            {!isCompareMode && isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="text-gray-600">
                    {currentProviders.find((p) => p.name === selectedModel)?.displayName} is thinking...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t bg-white p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
              {/* Text/Image selector on the left */}
              <div className="flex gap-2">
                <Button
                  variant={mode === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("text")}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Text
                </Button>
                <Button
                  variant={mode === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("image")}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Image
                </Button>
              </div>

              {/* Model selector on the right */}
              <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compare" className="font-medium">
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                          <Zap className="w-3 h-3 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
                          Compare AIs
                        </span>
                      </div>
                    </SelectItem>
                    {currentProviders.map((provider) => (
                      <SelectItem key={provider.name} value={provider.name}>
                        <div className="flex items-center gap-2 py-1">
                          <img
                            src={provider.image || "/placeholder.svg"}
                            alt={provider.displayName}
                            className="w-5 h-5 object-contain"
                          />
                          <span>{provider.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isListening && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Listening...
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === "text" ? "Ask something..." : "Describe an image to generate..."}
                  className="border-gray-200 focus:border-gray-300 focus:ring-0 pr-12 rounded-full py-3 px-4 shadow-sm"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                {speechSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full transition-colors ${
                      isListening
                        ? "text-red-500 bg-red-50 hover:bg-red-100"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Show responses for selection (only in compare mode)
  if (responses.length > 0 || (isCompareMode && isLoading)) {
    const validResponses = responses.filter((r) => !r.error)
    const hasValidResponses = validResponses.length > 1 && mode === "text"

    // Generate proper grid classes based on provider count
    const getGridCols = () => {
      if (mode === "image") return "lg:grid-cols-2"
      
      const count = compareProviders.length
      switch (count) {
        case 1: return "lg:grid-cols-1"
        case 2: return "lg:grid-cols-2"
        case 3: return "lg:grid-cols-3"
        case 4: return "lg:grid-cols-4"
        case 5: return "lg:grid-cols-5"
        case 6: return "lg:grid-cols-6"
        default: return "lg:grid-cols-4" // fallback
      }
    }

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className={`flex-1 grid grid-cols-1 ${getGridCols()}`}>
          {compareProviders.map((provider, index) => {
            const response = responses[index]
            const isLoadingThis = isLoading && !response

            return (
              <div key={provider.name} className="border-r border-gray-100 last:border-r-0">
                <div className="p-6 border-b border-gray-100 flex justify-around">
                  <img src={provider.image || "/placeholder.svg"} className="h-8" />
                </div>

                <div className="p-6 h-[calc(100vh-200px)] flex flex-col">
                  {isLoadingThis ? (
                    <div className="flex items-center justify-center flex-1">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : response ? (
                    <>
                      <div className="flex-1 overflow-y-auto">
                        {response.type === "image" && response.imageUrl ? (
                          <div className="space-y-4">
                            <img
                              src={response.imageUrl || "/placeholder.svg"}
                              alt="Generated image"
                              className="w-full rounded-lg border border-gray-200"
                            />
                          </div>
                        ) : (
                          <div
                            className={`whitespace-pre-wrap leading-relaxed text-sm ${response.error ? "text-red-500" : "text-gray-900"}`}
                          >
                            {response.content}
                          </div>
                        )}
                      </div>
                      {!response.error && (
                        <div className="pt-4 border-t border-gray-100 mt-4">
                          <Button
                            onClick={() => selectResponse(response)}
                            className="w-full bg-gray-900 hover:bg-gray-800"
                            variant="default"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Select
                          </Button>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* Synthesis Controls - Only for text mode */}
        {hasValidResponses && !isLoading && mode === "text" && (
          <div className="border-t bg-white p-6">
            <div className="max-w-4xl mx-auto">
              {showSynthesisPrompt ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Mix answers</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSynthesisPrompt(false)
                        setSynthesisPrompt("")
                        setSynthesisMode("best")
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        variant={synthesisMode === "best" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSynthesisMode("best")}
                        className="flex-1"
                      >
                        1. Take best of each answer
                      </Button>
                      <Button
                        variant={synthesisMode === "custom" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSynthesisMode("custom")}
                        className="flex-1"
                      >
                        2. Follow your instructions
                      </Button>
                    </div>

                    {synthesisMode === "custom" && (
                      <Input
                        value={synthesisPrompt}
                        onChange={(e) => setSynthesisPrompt(e.target.value)}
                        placeholder="Enter your instructions (e.g., Focus on practical examples, Be more concise, etc.)"
                        className="border-gray-200 focus:border-gray-400 focus:ring-0"
                      />
                    )}

                    <Button
                      onClick={handleSynthesis}
                      disabled={isSynthesizing || (synthesisMode === "custom" && !synthesisPrompt.trim())}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isSynthesizing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mix Answers
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={() => setShowSynthesisPrompt(true)}
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    disabled={isSynthesizing}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Mix answers
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Initial clean screen with just input
  return (
    <div className="min-h-screen bg-white flex items-end">
      <div className="w-full p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            {/* Text/Image selector on the left */}
            <div className="flex gap-2">
              <Button
                variant={mode === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("text")}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Text
              </Button>
              <Button
                variant={mode === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("image")}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Image
              </Button>
            </div>

            {/* Model selector on the right */}
            <div className="flex items-center gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compare" className="font-medium">
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
                        Compare AIs
                      </span>
                    </div>
                  </SelectItem>
                  {currentProviders.map((provider) => (
                    <SelectItem key={provider.name} value={provider.name}>
                      <div className="flex items-center gap-2 py-1">
                        <img
                          src={provider.image || "/placeholder.svg"}
                          alt={provider.displayName}
                          className="w-5 h-5 object-contain"
                        />
                        <span>{provider.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isListening && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Listening...
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === "text" ? "Ask something..." : "Describe an image to generate..."}
                className="border-gray-200 focus:border-gray-300 focus:ring-0 text-lg py-4 px-6 pr-14 rounded-full shadow-sm transition-all duration-200 focus:shadow-md"
                disabled={isLoading}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              {speechSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full transition-all duration-200 ${
                    isListening
                      ? "text-red-500 bg-red-50 hover:bg-red-100 shadow-sm"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              )}
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
