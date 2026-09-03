import * as fs from 'fs'
import * as path from 'path'
import { Client } from 'ssh2'
import { execSync } from 'child_process'

const PROJECT_DIR = '/home/z/my-project'
const privateKey = fs.readFileSync(process.env.HOME + '/.ssh/id_ed25519', 'utf-8')
const headSha = fs.readFileSync(path.join(PROJECT_DIR, '.git/refs/heads/main'), 'utf-8').trim()

// Force push: old = zeros (tells server to accept any change)
const oldSha = '8cf222d23447780245cb81a1280a3f83c97e2bec'

console.log(`Local HEAD: ${headSha}`)
console.log('Force pushing...')

const refLine = `+${oldSha} ${headSha} refs/heads/main\x00 report-status side-band-64k object-format=sha1 agent=git/2.0`

// Build pack of ALL objects in HEAD (for force push, we send everything)
let pack: Buffer
try {
  pack = execSync(
    `cd ${PROJECT_DIR} && git rev-list ${headSha} --not ${oldSha} | git pack-objects --stdout --revs --thin`,
    { maxBuffer: 500 * 1024 * 1024 }
  )
  console.log(`Pack size: ${(pack.length / 1024 / 1024).toFixed(1)} MB`)
} catch (e: any) {
  console.error('Failed to build pack:', e.message)
  process.exit(1)
}

const pktRef = `${(refLine.length + 4).toString(16).padStart(4, '0')}${refLine}`
const flushPkt = '0000'
const request = Buffer.concat([
  Buffer.from(pktRef, 'utf-8'),
  Buffer.from(flushPkt, 'utf-8'),
  pack,
])

const conn = new Client()
conn.on('ready', () => {
  console.log('SSH authenticated ✓')
  conn.exec(`git-receive-pack '/leaderteins/skulhub.git'`, (err, stream) => {
    if (err) { console.error('Exec error:', err.message); conn.end(); return }
    let stdout: Buffer[] = []
    let stderr: Buffer[] = []
    stream.stdin.write(request)
    stream.stdin.end()
    stream.stdout.on('data', (d: Buffer) => stdout.push(d))
    stream.stderr.on('data', (d: Buffer) => stderr.push(d))
    stream.on('close', (code: number) => {
      const out = Buffer.concat(stdout).toString('utf-8')
      const errOut = Buffer.concat(stderr).toString('utf-8')
      console.log(`Exit code: ${code}`)
      if (code === 0) {
        console.log('✅ FORCE PUSH SUCCESSFUL!')
        fs.writeFileSync(path.join(PROJECT_DIR, '.git/refs/remotes/origin/main'), headSha + '\n')
        console.log(`Updated remote tracking → ${headSha}`)
      } else {
        console.log('Output:', out.slice(0, 500))
        if (errOut) console.log('Stderr:', errOut.slice(0, 500))
      }
      conn.end()
    })
  })
})
conn.on('error', (err: any) => console.error('SSH error:', err.message))
conn.connect({ host: 'github.com', port: 22, username: 'git', privateKey })
