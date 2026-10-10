import { db } from '@/lib/db'

let indexesApplied = false

/** Apply database indexes on first API call (improves query performance) */
export async function ensureIndexes() {
  if (indexesApplied) return
  indexesApplied = true
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS "idx_student_school" ON "Student" ("schoolId")',
    'CREATE INDEX IF NOT EXISTS "idx_staff_school" ON "Staff" ("schoolId")',
    'CREATE INDEX IF NOT EXISTS "idx_payment_school" ON "Payment" ("schoolId")',
    'CREATE INDEX IF NOT EXISTS "idx_invoice_school" ON "Invoice" ("schoolId")',
    'CREATE INDEX IF NOT EXISTS "idx_attendance_student" ON "Attendance" ("studentId")',
    'CREATE INDEX IF NOT EXISTS "idx_grade_student" ON "Grade" ("studentId")',
    'CREATE INDEX IF NOT EXISTS "idx_grade_exam" ON "Grade" ("examId")',
    'CREATE INDEX IF NOT EXISTS "idx_activitylog_created" ON "ActivityLog" ("createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "idx_homework_classlevel" ON "Homework" ("classLevelId")',
    'CREATE INDEX IF NOT EXISTS "idx_exam_paper_subject" ON "ExamPaper" ("subject", "classLevel")',
  ]
  
  for (const sql of indexes) {
    await db.$executeRawUnsafe(sql).catch(() => {})
  }
}
