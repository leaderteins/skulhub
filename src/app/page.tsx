'use client'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CommandPalette } from '@/components/layout/command-palette'
import { DashboardModule } from '@/components/modules/dashboard'
import { AdmissionsModule } from '@/components/modules/admissions'
import { StudentsModule } from '@/components/modules/students'
import { StaffModule } from '@/components/modules/staff'
import { AlumniModule } from '@/components/modules/alumni'
import { AcademicsModule } from '@/components/modules/academics'
import { AttendanceModule } from '@/components/modules/attendance'
import { ReportCardsModule } from '@/components/modules/reportcards'
import { FinanceModule } from '@/components/modules/finance'
import { CommunicationsModule } from '@/components/modules/communications'
import { LibraryModule } from '@/components/modules/library'
import { TransportModule } from '@/components/modules/transport'
import { HealthModule } from '@/components/modules/health'
import { ReportsModule } from '@/components/modules/reports'
import { SettingsModule } from '@/components/modules/settings'

export default function Home() {
  const { activeModule } = useAppStore()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          {activeModule === 'dashboard' && <DashboardModule />}
          {activeModule === 'admissions' && <AdmissionsModule />}
          {activeModule === 'students' && <StudentsModule />}
          {activeModule === 'staff' && <StaffModule />}
          {activeModule === 'alumni' && <AlumniModule />}
          {activeModule === 'academics' && <AcademicsModule />}
          {activeModule === 'attendance' && <AttendanceModule />}
          {activeModule === 'reportcards' && <ReportCardsModule />}
          {activeModule === 'finance' && <FinanceModule />}
          {activeModule === 'communications' && <CommunicationsModule />}
          {activeModule === 'library' && <LibraryModule />}
          {activeModule === 'transport' && <TransportModule />}
          {activeModule === 'health' && <HealthModule />}
          {activeModule === 'reports' && <ReportsModule />}
          {activeModule === 'settings' && <SettingsModule />}
        </main>
        <Footer />
      </div>
      <CommandPalette />
    </div>
  )
}
