// One-time fix: sync LibraryBook.copiesAvailable with active loans.
// The seed created BookLoan records but did not decrement copiesAvailable,
// causing inconsistent stats (available + borrowed != total).
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const books = await db.libraryBook.findMany({
    include: { loans: { where: { status: { in: ['Borrowed', 'Overdue'] } } } },
  })
  let fixed = 0
  for (const b of books) {
    const correct = b.copiesTotal - b.loans.length
    if (correct !== b.copiesAvailable) {
      await db.libraryBook.update({
        where: { id: b.id },
        data: {
          copiesAvailable: correct,
          status: correct <= 0 ? 'Out of Stock' : 'Available',
        },
      })
      fixed++
      console.log(`  Fixed "${b.title}": ${b.copiesAvailable} → ${correct}`)
    }
  }
  console.log(`✓ Synced ${fixed} of ${books.length} books`)
}
main().catch(console.error).finally(() => db.$disconnect())
