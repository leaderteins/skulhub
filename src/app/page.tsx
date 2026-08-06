'use client'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CommandPalette } from '@/components/layout/command-palette'
import { LoginForm } from '@/components/auth/login-form'
import { DashboardModule } from '@/components/modules/dashboard'
import { AdmissionsModule } from '@/components/modules/admissions'
import { StudentsModule } from '@/components/modules/students'
import { StaffModule } from '@/components/modules/staff'
import { AlumniModule } from '@/components/modules/alumni'
import { AcademicsModule } from '@/components/modules/academics'
import { AttendanceModule } from '@/components/modules/attendance'
import { ExamsModule } from '@/components/modules/exams'
import { ReportCardsModule } from '@/components/modules/reportcards'
import { FinanceModule } from '@/components/modules/finance'
import { CommunicationsModule } from '@/components/modules/communications'
import { LibraryModule } from '@/components/modules/library'
import { TransportModule } from '@/components/modules/transport'
import { HealthModule } from '@/components/modules/health'
import { EventsModule } from '@/components/modules/events'
import { DisciplineModule } from '@/components/modules/discipline'
import { HostelModule } from '@/components/modules/hostel'
import { InventoryModule } from '@/components/modules/inventory'
import { CafeteriaModule } from '@/components/modules/cafeteria'
import { VisitorsModule } from '@/components/modules/visitors'
import { StaffRoomModule } from '@/components/modules/staffroom'
import { ReportsModule } from '@/components/modules/reports'
import { SettingsModule } from '@/components/modules/settings'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock } from 'lucide-react'

export default function Home() {
  const { activeModule } = useAppStore()
  const { user, hasAccess, _hasHydrated } = useAuthStore()

  // Show loading skeleton while waiting for hydration from localStorage
  // This prevents the "losing user" flash where the login page appears briefly
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading EduManage Pro...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated (after hydration)
  if (!user) {
    return <LoginForm />
  }

  // Check if user has access to the active module
  const canAccess = hasAccess(activeModule)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          {!canAccess ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                  <Lock className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Access Restricted</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your role does not have permission to access this module.
                    Contact your administrator if you need access.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeModule === 'dashboard' && <DashboardModule />}
              {activeModule === 'admissions' && <AdmissionsModule />}
              {activeModule === 'students' && <StudentsModule />}
              {activeModule === 'staff' && <StaffModule />}
              {activeModule === 'alumni' && <AlumniModule />}
              {activeModule === 'academics' && <AcademicsModule />}
              {activeModule === 'attendance' && <AttendanceModule />}
              {activeModule === 'exams' && <ExamsModule />}
              {activeModule === 'reportcards' && <ReportCardsModule />}
              {activeModule === 'finance' && <FinanceModule />}
              {activeModule === 'communications' && <CommunicationsModule />}
              {activeModule === 'library' && <LibraryModule />}
              {activeModule === 'transport' && <TransportModule />}
              {activeModule === 'health' && <HealthModule />}
              {activeModule === 'events' && <EventsModule />}
              {activeModule === 'discipline' && <DisciplineModule />}
              {activeModule === 'hostel' && <HostelModule />}
              {activeModule === 'inventory' && <InventoryModule />}
              {activeModule === 'cafeteria' && <CafeteriaModule />}
              {activeModule === 'visitors' && <VisitorsModule />}
              {activeModule === 'staffroom' && <StaffRoomModule />}
              {activeModule === 'reports' && <ReportsModule />}
              {activeModule === 'settings' && <SettingsModule />}
            </>
          )}
        </main>
        <Footer />
      </div>
      <CommandPalette />
    </div>
  )
}
