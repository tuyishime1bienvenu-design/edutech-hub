import { Routes, Route } from 'react-router-dom';
import { Users, GraduationCap, CreditCard, ClipboardList, TrendingUp, Award, AlertCircle, BookOpen, Briefcase, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useSalary } from '@/hooks/useSalary';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { RoleInsights } from '@/components/dashboard/RoleInsights';
import { motion } from 'framer-motion';

// Import all dashboard pages
import StudentsPage from './dashboard/StudentsPage';
import UsersPage from './dashboard/UsersPage';
import ClassesPage from './dashboard/ClassesPage';
import ProgramsPage from './dashboard/ProgramsPage';
import AttendancePage from './dashboard/AttendancePage';
import FinancesPage from './dashboard/FinancesPage';
import NoticesPage from './dashboard/NoticesPage';
import MaterialsPage from './dashboard/MaterialsPage';
import LeaveRequestsPage from './dashboard/LeaveRequestsPage';
import ReportsPage from './dashboard/ReportsPage';
import ActivityLogsPage from './dashboard/ActivityLogsPage';
import RegisterStudentPage from './dashboard/RegisterStudentPage';
import FeeStructuresPage from './dashboard/FeeStructuresPage';
import CertificateTemplatesPage from './dashboard/CertificateTemplatesPage';
import CertificatesPage from './dashboard/CertificatesPage';
import ServicesPage from './dashboard/ServicesPage';
import VacanciesPage from './dashboard/VacanciesPage';
import GalleryPage from './dashboard/GalleryPage';
import ContactMessagesPage from './dashboard/ContactMessagesPage';
import RequestAdvancePage from './dashboard/RequestAdvancePage';
import RecordVisitorPage from './dashboard/RecordVisitorPage';
import VisitorsPage from './dashboard/VisitorsPage';
import ITPage from './dashboard/ITPage';

// Role-specific home components
const AdminDashboard = ({ stats, isLoading }: any) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `RWF ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `RWF ${(amount / 1000).toFixed(0)}K`;
    return `RWF ${amount}`;
  };

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Role-specific insights */}
      <RoleInsights />

      {/* Admin Stats Grid - 4 columns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Students"
          value={isLoading ? '...' : String(stats?.totalStudents || 0)}
          icon={Users}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Active Classes"
          value={isLoading ? '...' : String(stats?.activeClasses || 0)}
          icon={GraduationCap}
          delay={0.1}
        />
        <StatCard
          title="Total Users"
          value={isLoading ? '...' : String(stats?.totalUsers || 0)}
          icon={Users}
          variant="secondary"
          delay={0.2}
        />
        <StatCard
          title="Payments Collected"
          value={isLoading ? '...' : formatCurrency(stats?.totalPayments || 0)}
          icon={CreditCard}
          delay={0.3}
        />
      </motion.div>

      <QuickActions role="admin" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <RecentActivityCard />
      </div>
    </div>
  );
};

const SecretaryDashboard = ({ stats, isLoading }: any) => {
  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Role-specific insights */}
      <RoleInsights />

      {/* Secretary Stats - Focus on students and attendance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Students"
          value={isLoading ? '...' : String(stats?.totalStudents || 0)}
          icon={Users}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Active Classes"
          value={isLoading ? '...' : String(stats?.activeClasses || 0)}
          icon={GraduationCap}
          delay={0.1}
        />
        <StatCard
          title="Attendance Rate"
          value={isLoading ? '...' : `${stats?.attendanceRate || 0}%`}
          icon={ClipboardList}
          variant="success"
          delay={0.2}
        />
        <StatCard
          title="Active Programs"
          value={isLoading ? '...' : String(stats?.activePrograms || 0)}
          icon={BookOpen}
          variant="info"
          delay={0.3}
        />
      </motion.div>

      <QuickActions role="secretary" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <RecentActivityCard />
      </div>
    </div>
  );
};

const TrainerDashboard = ({ stats, isLoading }: any) => {
  const { data: salary, isLoading: salaryLoading } = useSalary();

  const formatSalary = (amount: number) => {
    return `RWF ${amount.toLocaleString()}/month`;
  };

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Role-specific insights */}
      <RoleInsights />

      {/* Trainer Stats - Focus on classes and attendance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="My Classes"
          value={isLoading ? '...' : String(stats?.activeClasses || 0)}
          icon={GraduationCap}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Students in Class"
          value={isLoading ? '...' : String(stats?.totalStudents || 0)}
          icon={Users}
          delay={0.1}
        />
        <StatCard
          title="Attendance Rate"
          value={isLoading ? '...' : `${stats?.attendanceRate || 0}%`}
          icon={ClipboardList}
          variant="success"
          delay={0.2}
        />
        <StatCard
          title="My Salary"
          value={salaryLoading ? '...' : salary ? formatSalary(salary.amount) : 'Not set'}
          icon={CreditCard}
          variant="info"
          delay={0.3}
        />
      </motion.div>

      <QuickActions role="trainer" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <RecentActivityCard />
      </div>
    </div>
  );
};

const FinanceDashboard = ({ stats, isLoading }: any) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `RWF ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `RWF ${(amount / 1000).toFixed(0)}K`;
    return `RWF ${amount}`;
  };

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Role-specific insights */}
      <RoleInsights />

      {/* Finance Stats - Focus on payments and finances */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <StatCard
          title="Total Students"
          value={isLoading ? '...' : String(stats?.totalStudents || 0)}
          icon={Users}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Payments Collected"
          value={isLoading ? '...' : formatCurrency(stats?.totalPayments || 0)}
          icon={CreditCard}
          variant="success"
          delay={0.1}
        />
        <StatCard
          title="Pending Payments"
          value={isLoading ? '...' : formatCurrency(stats?.pendingPayments || 0)}
          icon={AlertCircle}
          delay={0.2}
        />
      </motion.div>

      <QuickActions role="finance" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <RecentActivityCard />
      </div>
    </div>
  );
};

const StudentDashboard = ({ stats, isLoading }: any) => {
  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Role-specific insights */}
      <RoleInsights />

      {/* Student Stats - Focus on personal metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <StatCard
          title="My Attendance"
          value={isLoading ? '...' : `${stats?.myAttendance || 0}%`}
          icon={ClipboardList}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Courses Enrolled"
          value={isLoading ? '...' : String(stats?.enrolledCourses || 0)}
          icon={BookOpen}
          delay={0.1}
        />
        <StatCard
          title="Certificates Earned"
          value={isLoading ? '...' : String(stats?.certificates || 0)}
          icon={Award}
          variant="success"
          delay={0.2}
        />
      </motion.div>

      <QuickActions role="student" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <RecentActivityCard />
      </div>
    </div>
  );
};

const CombinedDashboard = ({ stats, isLoading, roles }: any) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `RWF ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `RWF ${(amount / 1000).toFixed(0)}K`;
    return `RWF ${amount}`;
  };

  // Show stats relevant to all roles the user has
  const getRelevantStats = () => {
    const allStats = [];

    if (roles.includes('admin')) {
      allStats.push(
        <StatCard
          key="admin-students"
          title="Total Students"
          value={isLoading ? '...' : String(stats?.totalStudents || 0)}
          icon={Users}
          variant="primary"
          delay={0}
        />,
        <StatCard
          key="admin-users"
          title="Total Users"
          value={isLoading ? '...' : String(stats?.totalUsers || 0)}
          icon={Users}
          variant="secondary"
          delay={0.1}
        />
      );
    }

    if (roles.includes('finance')) {
      allStats.push(
        <StatCard
          key="finance-payments"
          title="Payments Collected"
          value={isLoading ? '...' : formatCurrency(stats?.totalPayments || 0)}
          icon={CreditCard}
          variant="success"
          delay={0.2}
        />
      );
    }

    if (roles.includes('trainer')) {
      allStats.push(
        <StatCard
          key="trainer-classes"
          title="Active Classes"
          value={isLoading ? '...' : String(stats?.activeClasses || 0)}
          icon={GraduationCap}
          variant="warning"
          delay={0.3}
        />
      );
    }

    return allStats.slice(0, 4); // Limit to 4 stats
  };

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Role-specific insights */}
      <RoleInsights />

      {/* Combined Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {getRelevantStats()}
      </motion.div>

      {/* Show quick actions for all roles */}
      {roles.map((role: string) => (
        <div key={role} className="space-y-2">
          <h3 className="text-lg font-semibold capitalize">{role} Actions</h3>
          <QuickActions role={role} />
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <RecentActivityCard />
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const { roles } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  // Handle multiple roles - show combined dashboard
  if (roles.length > 1) {
    return <CombinedDashboard stats={stats} isLoading={isLoading} roles={roles} />;
  }

  // Single role dashboards
  const primaryRole = roles[0] || 'student';

  switch (primaryRole) {
    case 'admin':
      return <AdminDashboard stats={stats} isLoading={isLoading} />;
    case 'secretary':
      return <SecretaryDashboard stats={stats} isLoading={isLoading} />;
    case 'trainer':
      return <TrainerDashboard stats={stats} isLoading={isLoading} />;
    case 'finance':
      return <FinanceDashboard stats={stats} isLoading={isLoading} />;
    case 'student':
      return <StudentDashboard stats={stats} isLoading={isLoading} />;
    default:
      return <StudentDashboard stats={stats} isLoading={isLoading} />;
  }
};

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/register-student" element={<RegisterStudentPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/fee-structures" element={<FeeStructuresPage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/leave-requests" element={<LeaveRequestsPage />} />
        <Route path="/request-advance" element={<RequestAdvancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/certificate-templates" element={<CertificateTemplatesPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/contact-messages" element={<ContactMessagesPage />} />
        <Route path="/record-visitor" element={<RecordVisitorPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/it" element={<ITPage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
