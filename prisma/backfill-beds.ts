// One-off backfill: create Bed records for existing Rooms and link active allocations.
// Run once after adding the Bed model.
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const BED_LABELS = ['Bed A', 'Bed B', 'Bed C', 'Bed D', 'Bed E', 'Bed F', 'Bed G', 'Bed H']

async function main() {
  console.log('🛏️  Backfilling Bed records...')
  const rooms = await db.room.findMany({ include: { allocations: true } })
  console.log(`Found ${rooms.length} rooms`)

  let bedCount = 0, linkCount = 0, occupyCount = 0

  for (const room of rooms) {
    // Ensure beds exist for this room — one per slot up to capacity
    const capacity = Math.max(room.capacity || 0, 1)
    const existingBeds = await db.bed.findMany({ where: { roomId: room.id } })
    const existingLabels = new Set(existingBeds.map(b => b.bedNumber))
    const labelsToCreate: string[] = []
    for (let i = 0; i < capacity; i++) {
      const label = BED_LABELS[i] || `Bed ${i + 1}`
      if (!existingLabels.has(label)) labelsToCreate.push(label)
    }
    if (labelsToCreate.length > 0) {
      await db.bed.createMany({
        data: labelsToCreate.map(label => ({ roomId: room.id, bedNumber: label, status: 'Available' })),
      })
      bedCount += labelsToCreate.length
    }

    // Reload beds for this room (in correct order)
    const beds = await db.bed.findMany({ where: { roomId: room.id } })
    const bedByLabel = new Map(beds.map(b => [b.bedNumber, b]))

    // Link each BedAllocation to the corresponding bed, and mark active ones as Occupied
    for (const alloc of room.allocations) {
      const bed = bedByLabel.get(alloc.bedNumber)
      if (!bed) continue
      if (!alloc.bedId) {
        await db.bedAllocation.update({ where: { id: alloc.id }, data: { bedId: bed.id } })
        linkCount++
      }
      if (alloc.status === 'Active' && !bed.studentId) {
        await db.bed.update({ where: { id: bed.id }, data: { studentId: alloc.studentId, status: 'Occupied' } })
        occupyCount++
      }
    }

    // Recompute room.occupied + status
    const activeBeds = await db.bed.count({ where: { roomId: room.id, status: 'Occupied' } })
    const maintBeds = await db.bed.count({ where: { roomId: room.id, status: 'Maintenance' } })
    const newStatus = maintBeds > 0 ? 'Maintenance' : activeBeds >= capacity ? 'Full' : 'Available'
    await db.room.update({ where: { id: room.id }, data: { occupied: activeBeds, status: newStatus } })
  }

  console.log(`✓ Created ${bedCount} new beds, linked ${linkCount} allocations, occupied ${occupyCount} beds`)
}

main().catch(console.error).finally(() => db.$disconnect())
