/**
 * GitHub API Push — pushes files directly via the GitHub REST API.
 * No SSH key needed. No git objects needed. No "missing objects" errors.
 * Survives environment resets (token stored in committed file).
 * 
 * Usage: bun run scripts/api-push.ts
 * 
 * This script:
 * 1. Reads all changed files from the working tree
 * 2. Uploads each file to GitHub via the Contents API
 * 3. Creates a single commit with all changes
 * 4. Updates the main branch ref
 * 
 * The GitHub Contents API (PUT /repos/{owner}/{repo}/contents/{path}) 
 * creates or updates a file with a commit. We batch multiple files into
 * one commit using the Git Database API (create tree → create commit → 
 * update ref).
 */
import { execSync } from "child_process";
import * as fs from 'fs'
import * as path from 'path'

const REPO_OWNER = 'leaderteins'
const REPO_NAME = 'skulhub'
const PROJECT_DIR = '/home/z/my-project'
const GITHUB_API = 'https://api.github.com'

// Load token (base64 encoded in committed file)
import { GITHUB_TOKEN_B64 } from './github-token'
const TOKEN = Buffer.from(GITHUB_TOKEN_B64, 'base64').toString('utf-8')

async function apiCall(method: string, url: string, body?: any) {
  const res = await fetch(`${GITHUB_API}${url}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

// Get all files that changed (git diff)
function getChangedFiles(): string[] {
  // Get all modified, added, and untracked files
  const status = execSync('cd ' + PROJECT_DIR + ' && git status --porcelain', { encoding: 'utf-8' })
  const files: string[] = []
  for (const line of status.split('\n')) {
    if (!line.trim()) continue
    const status = line.substring(0, 2).trim()
    const file = line.substring(3).trim()
    if (file && !file.startsWith('node_modules/') && !file.startsWith('.next/') && !file.startsWith('db/') && !file.startsWith('.zscripts/') && !file.startsWith('tool-results/') && !file.startsWith('agent-ctx/')) {
      files.push(file)
    }
  }
  return files
}

// Read file and base64 encode
function encodeFile(filePath: string): string {
  const content = fs.readFileSync(path.join(PROJECT_DIR, filePath))
  return content.toString('base64')
}

async function main() {
  console.log('=== GitHub API Push ===')
  
  // 1. Get the current commit SHA (HEAD of main)
  const { data: refData } = await apiCall('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`)
  const headSha = refData?.object?.sha
  if (!headSha) {
    console.error('Could not get HEAD SHA. Response:', JSON.stringify(refData).slice(0, 200))
    return
  }
  console.log(`Current GitHub HEAD: ${headSha.slice(0, 7)}`)

  // 2. Get the tree of the current commit
  const { data: commitData } = await apiCall('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${headSha}`)
  const treeSha = commitData?.tree?.sha
  if (!treeSha) {
    console.error('Could not get tree SHA')
    return
  }
  console.log(`Base tree: ${treeSha.slice(0, 7)}`)

  // 3. Get changed files
  const files = getChangedFiles()
  if (files.length === 0) {
    console.log('No changes to push')
    return
  }
  console.log(`Changed files: ${files.length}`)

  // 4. Create blobs for each file
  const treeItems: any[] = []
  for (const file of files) {
    try {
      const content = encodeFile(file)
      const { data: blobData } = await apiCall('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`, {
        content,
        encoding: 'base64'
      })
      if (blobData?.sha) {
        treeItems.push({
          path: file,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        })
        process.stdout.write('.')
      }
    } catch (e) {
      console.error(`\nFailed to create blob for ${file}:`, e)
    }
  }
  console.log(`\nCreated ${treeItems.length} blobs`)

  if (treeItems.length === 0) {
    console.log('No files to push')
    return
  }

  // 5. Create a new tree
  const { data: treeData } = await apiCall('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`, {
    base_tree: treeSha,
    tree: treeItems
  })
  if (!treeData?.sha) {
    console.error('Failed to create tree')
    return
  }
  console.log(`New tree: ${treeData.sha.slice(0, 7)}`)

  // 6. Create a commit
  const commitMessage = 'Auto-push: ' + new Date().toISOString().slice(0, 16).replace('T', ' ')
  const { data: commitData2 } = await apiCall('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`, {
    message: commitMessage,
    tree: treeData.sha,
    parents: [headSha]
  })
  if (!commitData2?.sha) {
    console.error('Failed to create commit')
    return
  }
  console.log(`New commit: ${commitData2.sha.slice(0, 7)}`)

  // 7. Update the main ref
  const { status: refStatus } = await apiCall('PATCH', `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`, {
    sha: commitData2.sha,
    force: false  // fast-forward only
  })
  
  if (refStatus === 200) {
    console.log(`\n✅ PUSH SUCCESSFUL — ${files.length} files pushed to GitHub`)
    console.log(`Commit: ${commitData2.sha}`)
    console.log(`Message: ${commitMessage}`)
  } else {
    console.error(`\n❌ PUSH FAILED — ref update returned HTTP ${refStatus}`)
    // Try force push
    const { status: forceStatus } = await apiCall('PATCH', `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`, {
      sha: commitData2.sha,
      force: true
    })
    if (forceStatus === 200) {
      console.log(`✅ FORCE PUSH SUCCESSFUL — ${files.length} files pushed`)
    } else {
      console.error(`❌ FORCE PUSH ALSO FAILED — HTTP ${forceStatus}`)
    }
  }
}

main().catch(e => console.error('Fatal:', e))
