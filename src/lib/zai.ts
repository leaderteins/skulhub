import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

let cachedInstance: ZAI | null = null

/**
 * Create a ZAI SDK instance with explicit config.
 * 
 * On Vercel, the SDK's ZAI.create() looks for .z-ai-config relative to
 * process.cwd() which may not match the deployed function's directory.
 * This helper reads the config file explicitly and passes it to the
 * ZAI constructor directly, bypassing the file-search logic.
 */
export async function getZAI(): Promise<ZAI> {
  if (cachedInstance) return cachedInstance

  // Try reading the config file from multiple locations
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(__dirname, '..', '..', '..', '.z-ai-config'),
    '/etc/.z-ai-config',
  ]

  let config: any = null
  for (const p of configPaths) {
    try {
      const str = fs.readFileSync(p, 'utf-8')
      config = JSON.parse(str)
      if (config.baseUrl && config.apiKey) break
    } catch {
      // try next path
    }
  }

  if (!config) {
    throw new Error('Z.AI config not found. Tried: ' + configPaths.join(', '))
  }

  cachedInstance = new ZAI(config)
  return cachedInstance
}
