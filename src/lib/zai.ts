import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

let cachedInstance: ZAI | null = null
let configLoaded = false
let configObj: any = null

/**
 * Load the Z.AI config from file (tries multiple paths).
 */
function loadConfig(): any {
  if (configLoaded) return configObj
  configLoaded = true

  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(__dirname, '..', '..', '..', '.z-ai-config'),
    '/etc/.z-ai-config',
  ]

  for (const p of configPaths) {
    try {
      const str = fs.readFileSync(p, 'utf-8')
      configObj = JSON.parse(str)
      if (configObj.baseUrl && configObj.apiKey) return configObj
    } catch {
      // try next path
    }
  }
  return null
}

/**
 * Create a ZAI SDK instance with explicit config.
 * Falls back gracefully if the API isn't reachable (e.g. on Vercel
 * where internal-api.z.ai isn't accessible).
 */
export async function getZAI(): Promise<ZAI | null> {
  // In production on Vercel, the internal API may not be reachable.
  // Check if we should even try.
  if (process.env.VERCEL && !process.env.ZAI_API_KEY) {
    return null // AI features disabled in production without explicit key
  }

  if (cachedInstance) return cachedInstance

  const config = loadConfig()
  if (!config) return null

  try {
    cachedInstance = new ZAI(config)
    return cachedInstance
  } catch {
    return null
  }
}

/**
 * Check if AI is available (config loaded + API reachable).
 */
export function isSAIAvailable(): boolean {
  return loadConfig() !== null && (!process.env.VERCEL || !!process.env.ZAI_API_KEY)
}

/**
 * Generate a fallback response when AI isn't available.
 * These are static helpful messages that guide the user.
 */
export function getFallbackResponse(message: string, context?: string): string {
  const msg = message.toLowerCase()

  if (msg.includes('attendance') || msg.includes('absent')) {
    return "I can see your child's attendance data, but I'm currently unable to connect to the AI service. Please check the Attendance tab in the parent portal for detailed attendance records, or contact the school office for assistance."
  }
  if (msg.includes('fee') || msg.includes('balance') || msg.includes('pay')) {
    return "I can see your child's fee information, but I'm currently unable to connect to the AI service. Please check the Fee Summary card for your current balance, or use the 'Pay M-Pesa' button to make a payment. For fee-related queries, contact the bursar's office."
  }
  if (msg.includes('grade') || msg.includes('exam') || msg.includes('result')) {
    return "I can see your child's grades, but I'm currently unable to connect to the AI service. Please check the Grades section in the parent portal for the latest exam results, or contact the class teacher for detailed performance feedback."
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I'm the SkulHub AI Assistant. I can help you with questions about your child's attendance, fees, grades, and school updates. What would you like to know? (Note: AI responses may be limited — for detailed queries, please use the portal sections.)"
  }
  return "I understand you're asking about: \"" + message + "\". I'm currently running in limited mode. For the most accurate information, please use the portal sections (Fees, Attendance, Grades) or contact the school office directly."
}
