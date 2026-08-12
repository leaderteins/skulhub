'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CommandPalette } from '@/components/layout/command-palette'
import { LandingPage } from '@/components/landing-page'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ParentPortal } from '@/components/auth/parent-portal'
import { StaffSignup } from '@/components/auth/staff-signup'
import { DashboardModule } from '@/components/modules/dashboard'
import { AdmissionsModule } from '@/components/modules/admissions'
import { StudentsModule } from '@/components/modules/students'
import { StaffModule } from '@/components/modules/staff'
import { StaffApprovalsModule } from '@/components/modules/staff-approvals'
import { AlumniModule } from '@/components/modules/alumni'
import { AcademicsModule } from '@/components/modules/academics'
import { AttendanceModule } from '@/components/modules/attendance'
import { ExamsModule } from '@/components/modules/exams'
import { ReportCardsModule } from '@/components/modules/reportcards'
import { LessonPlansModule } from '@/components/modules/lessonplans'
import { HomeworkModule } from '@/components/modules/homework'
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
import { ProcurementModule } from '@/components/modules/procurement'
import { FacilitiesModule } from '@/components/modules/facilities'
import { VisitorsModule } from '@/components/modules/visitors'
import { StaffRoomModule } from '@/components/modules/staffroom'
import { PayrollModule } from '@/components/modules/payroll'
import { AppraisalsModule } from '@/components/modules/appraisals'
import { FeedbackModule } from '@/components/modules/feedback'
import { IdCardsModule } from '@/components/modules/idcards'
import { DataImportModule } from '@/components/modules/dataimport'
import { InventoryRequestsModule } from '@/components/modules/inventory-requests'
import { ReportsModule } from '@/components/modules/reports'
import { SettingsModule } from '@/components/modules/settings'
import { SuperAdminModule } from '@/components/modules/superadmin'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock } from 'lucide-react'

export default function Home() {
  const { activeModule, setActiveModule } = useAppStore()
  const { user, hasAccess, _hasHydrated, authView, isSuperAdmin } = useAuthStore()

  // Super admins always land on the Super Admin module — they have no school
  // dashboard of their own. Switch automatically if they're still on 'dashboard'.
  useEffect(() => {
    if (isSuperAdmin && activeModule === 'dashboard') {
      setActiveModule('superadmin')
    }
  }, [isSuperAdmin, activeModule, setActiveModule])

  // Show loading skeleton while waiting for hydration from localStorage
  // This prevents the "losing user" flash where the login page appears briefly
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading SkulHub...</p>
        </div>
      </div>
    )
  }

  // Show registration form (or its success screen) while authView is 'register'
  if (authView === 'register') {
    return <RegisterForm />
  }

  // Staff self-signup is shown when authView is 'staff-signup'.
  if (authView === 'staff-signup') {
    return <StaffSignup />
  }

<<<<<<< HEAD
  // Parent portal is shown when authView is 'parent'. It has its own
  // internal login + dashboard flow and never sets a real user.
=======
  // Parent portal is shown when authView is 'parent'.
>>>>>>> origin/main
  if (authView === 'parent') {
    return <ParentPortal />
  }

<<<<<<< HEAD
  // Show login if not authenticated (after hydration)
  if (!user) {
=======
  // Show login form when authView is 'login'
  if (!user && authView === 'login') {
>>>>>>> origin/main
    return <LoginForm />
  }

  // Show landing page for visitors (default view)
  if (!user) {
    return <LandingPage />
  }

  // Check if user has access to the active module
  const canAccess = hasAccess(activeModule)

  // effectiveModule is normally just activeModule. The useEffect above will
  // already switch super_admin to 'superadmin' on first render, so this is
  // just a fallback during the first paint.
  const effectiveModule = activeModule

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
              {effectiveModule === 'dashboard' && <DashboardModule />}
              {effectiveModule === 'admissions' && <AdmissionsModule />}
              {effectiveModule === 'students' && <StudentsModule />}
              {effectiveModule === 'staff' && <StaffModule />}
              {effectiveModule === 'staffapprovals' && <StaffApprovalsModule />}
              {effectiveModule === 'alumni' && <AlumniModule />}
              {effectiveModule === 'academics' && <AcademicsModule />}
              {effectiveModule === 'attendance' && <AttendanceModule />}
              {effectiveModule === 'exams' && <ExamsModule />}
              {effectiveModule === 'reportcards' && <ReportCardsModule />}
              {effectiveModule === 'lessonplans' && <LessonPlansModule />}
              {effectiveModule === 'homework' && <HomeworkModule />}
              {effectiveModule === 'finance' && <FinanceModule />}
              {effectiveModule === 'communications' && <CommunicationsModule />}
              {effectiveModule === 'library' && <LibraryModule />}
              {effectiveModule === 'transport' && <TransportModule />}
              {effectiveModule === 'health' && <HealthModule />}
              {effectiveModule === 'events' && <EventsModule />}
              {effectiveModule === 'discipline' && <DisciplineModule />}
              {effectiveModule === 'hostel' && <HostelModule />}
              {effectiveModule === 'inventory' && <InventoryModule />}
              {effectiveModule === 'cafeteria' && <CafeteriaModule />}
              {effectiveModule === 'procurement' && <ProcurementModule />}
              {effectiveModule === 'facilities' && <FacilitiesModule />}
              {effectiveModule === 'visitors' && <VisitorsModule />}
              {effectiveModule === 'staffroom' && <StaffRoomModule />}
              {effectiveModule === 'payroll' && <PayrollModule />}
              {effectiveModule === 'appraisals' && <AppraisalsModule />}
              {effectiveModule === 'feedback' && <FeedbackModule />}
              {effectiveModule === 'idcards' && <IdCardsModule />}
              {effectiveModule === 'dataimport' && <DataImportModule />}
              {effectiveModule === 'invrequests' && <InventoryRequestsModule />}
              {effectiveModule === 'reports' && <ReportsModule />}
              {effectiveModule === 'superadmin' && <SuperAdminModule />}
              {effectiveModule === 'settings' && <SettingsModule />}
            </>
          )}
        </main>
        <Footer />
      </div>
      <CommandPalette />
    </div>
  )
}
