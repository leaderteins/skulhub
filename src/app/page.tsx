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
import { SuperAdminLoginForm } from '@/components/auth/super-admin-login'
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
import { TimetableModule } from '@/components/modules/timetable'
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
import { IdCardsModule } from '@/components/modules/idcards-enhanced'
import { DataImportModule } from '@/components/modules/dataimport'
import { InventoryRequestsModule } from '@/components/modules/inventory-requests'
import { ReportsModule } from '@/components/modules/reports'
import { BiometricModule } from '@/components/modules/biometric'
import { BusTrackingModule } from '@/components/modules/bus-tracking'
import { NotificationsModule } from '@/components/modules/notifications'
import { ExamAnalyticsModule } from '@/components/modules/exam-analytics'
import { AIAssistantModule } from '@/components/modules/ai-assistant'
import { SettingsModule } from '@/components/modules/settings'
import { SuperAdminModule } from '@/components/modules/superadmin'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock } from 'lucide-react'

export default function Home() {
  const { activeModule, setActiveModule, fetchAcademicFromServer } = useAppStore()
  const { user, hasAccess, _hasHydrated, authView, isSuperAdmin } = useAuthStore()

  // Boot-time: fetch the authoritative academic calendar from the server.
  // The server uses its own clock (not the client's) so even if a user's
  // device has the wrong date, the term/year badge is always accurate.
  // Respects manual overrides saved in Settings (auto: false).
  useEffect(() => {
    fetchAcademicFromServer()
    // Re-fetch every 10 minutes (in case the tab stays open across a term boundary)
    const id = setInterval(fetchAcademicFromServer, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchAcademicFromServer])

  // Auto-scroll to top whenever the active module changes.
  // Without this, switching modules keeps the previous scroll position,
  // so the user sees a "blank" page and has to scroll up to find content.
  // Uses requestAnimationFrame to ensure the new module has rendered.
  useEffect(() => {
    const scrollTarget = document.querySelector('main')
    const id = requestAnimationFrame(() => {
      if (scrollTarget) {
        scrollTarget.scrollTop = 0
      }
      // Also scroll the window itself (some layouts use body scroll)
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
    return () => cancelAnimationFrame(id)
  }, [activeModule])

  // Super admins always land on the Super Admin module — they have no school
  // dashboard of their own. Switch automatically if they're still on 'dashboard'
  // or any module they don't have access to.
  useEffect(() => {
    // Check both isSuperAdmin flag AND user.role === 'super_admin' for robustness
    const isActuallySuperAdmin = isSuperAdmin || user?.role === 'super_admin'
    if (isActuallySuperAdmin) {
      // If super admin is on 'dashboard' (the default), switch to 'superadmin'
      if (activeModule === 'dashboard') {
        setActiveModule('superadmin')
      }
      // If super admin is on a module they don't have access to, switch to 'superadmin'
      else if (activeModule !== 'superadmin' && activeModule !== 'settings' && !hasAccess(activeModule)) {
        setActiveModule('superadmin')
      }
    }
  }, [isSuperAdmin, user, activeModule, setActiveModule, hasAccess])

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

  // Parent portal is shown when authView is 'parent'.
  if (authView === 'parent') {
    return <ParentPortal />
  }

  // Super admin login form — shown when authView is 'superadmin'
  // (triggered by the hidden Ctrl+Shift+A shortcut on the login form).
  // Only shown when the user is NOT logged in; after successful login it
  // falls through to the dashboard render below.
  if (!user && authView === 'superadmin') {
    return <SuperAdminLoginForm />
  }

  // Show login form when authView is 'login'
  if (!user && authView === 'login') {
    return <LoginForm />
  }

  // Show landing page for visitors (default view)
  if (!user) {
    return <LandingPage />
  }

  // For super admins, force the effective module to 'superadmin' if they're
  // on 'dashboard' (the default). This prevents the school dashboard from
  // flashing before the useEffect switches them.
  const effectiveModule = isSuperAdmin && activeModule === 'dashboard' ? 'superadmin' : activeModule

  // Check if user has access to the effective module
  const canAccess = isSuperAdmin
    ? ['superadmin', 'settings'].includes(effectiveModule)
    : hasAccess(effectiveModule)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
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
              {effectiveModule === 'timetable' && <TimetableModule />}
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
              {effectiveModule === 'biometric' && <BiometricModule />}
              {effectiveModule === 'bustracking' && <BusTrackingModule />}
              {effectiveModule === 'notifications' && <NotificationsModule />}
              {effectiveModule === 'examanalytics' && <ExamAnalyticsModule />}
              {effectiveModule === 'aiassistant' && <AIAssistantModule />}
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
// Trigger rebuild
// Trigger rebuild Fri Aug 28 13:33:05 UTC 2026
