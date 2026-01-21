import { Routes, Route } from 'react-router-dom';
import { Users, GraduationCap, CreditCard, ClipboardList, TrendingUp, Award, AlertCircle, BookOpen, Briefcase, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useSalary } from '@/hooks/useSalary';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { RoleInsights } from '@/components/dashboard/RoleInsights';
import { motion } from 'framer-motion';
import ProfileEdit from '@/components/profile/ProfileEdit';
import ProfileView from '@/components/profile/ProfileView';
import TrainerSalaryDetails from '@/pages/dashboard/TrainerSalaryDetails';

// Import all dashboard pages
import StudentsPage from './dashboard/StudentsPage';
import UsersPage from './dashboard/UsersPage';
import ClassesPage from './dashboard/ClassesPage';
import ProgramsPage from './dashboard/ProgramsPage';
import AttendancePage from './dashboard/AttendancePage';
import FinanceDashboardPage from './dashboard/FinanceDashboardPage';
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
import ITDashboardPage from './dashboard/ITDashboardPage';
import ITManagementPage from './dashboard/ITManagementPage';
import WiFiNetworksPage from './dashboard/WiFiNetworksPage';
import MaterialTransactionsPage from './dashboard/MaterialTransactionsPage';
import MaterialsInventoryPage from './dashboard/MaterialsInventoryPage';
import EquipmentPage from './dashboard/EquipmentPage';
import SettingsPage from './dashboard/SettingsPage';
import SalaryAdvancesPage from './dashboard/SalaryAdvancesPage';
import TrainerSalaryPage from './dashboard/TrainerSalaryPage';
import JobPostingsPage from './dashboard/JobPostingsPage';
import JobApplicationsPage from './dashboard/JobApplicationsPage';
import DocumentsPage from './dashboard/DocumentsPage';
import Careers from './Careers';

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
          title="Active Programs"
          value={isLoading ? '...' : String(stats?.activePrograms || 0)}
          icon={BookOpen}
          variant="info"
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
    <div className="space-y-8">
      {/* Header Section with Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Trainer!</h1>
            <p className="text-blue-100 text-lg">Here's your teaching dashboard overview</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <p className="text-sm text-blue-100 mb-1">Current Period</p>
            <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid with Enhanced Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <GraduationCap className="w-8 h-8 text-blue-100" />
            <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">Active</span>
          </div>
          <h3 className="text-blue-100 text-sm font-medium mb-1">My Classes</h3>
          <p className="text-3xl font-bold">{isLoading ? '...' : String(stats?.activeClasses || 0)}</p>
          <div className="mt-4 pt-4 border-t border-blue-400/30">
            <div className="flex items-center text-blue-100 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              All running smoothly
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-100" />
            <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">Total</span>
          </div>
          <h3 className="text-purple-100 text-sm font-medium mb-1">Students in Class</h3>
          <p className="text-3xl font-bold">{isLoading ? '...' : String(stats?.totalStudents || 0)}</p>
          <div className="mt-4 pt-4 border-t border-purple-400/30">
            <div className="flex items-center text-purple-100 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Engaged learners
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <ClipboardList className="w-8 h-8 text-green-100" />
            <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">Rate</span>
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Attendance Rate</h3>
          <p className="text-3xl font-bold">{isLoading ? '...' : `${stats?.attendanceRate || 0}%`}</p>
          <div className="mt-4 pt-4 border-t border-green-400/30">
            <div className="flex items-center text-green-100 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Excellent performance
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-orange-100" />
            <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">Monthly</span>
          </div>
          <h3 className="text-orange-100 text-sm font-medium mb-1">My Salary</h3>
          <p className="text-3xl font-bold">{salaryLoading ? '...' : salary ? formatSalary(salary.amount) : 'Not set'}</p>
          <div className="mt-4 pt-4 border-t border-orange-400/30">
            <div className="flex items-center text-orange-100 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              On time payment
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
            Quick Actions
          </h2>
          <QuickActions role="trainer" />
        </div>
      </motion.div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
            Attendance Overview
          </h2>
          <AttendanceChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
            Recent Activity
          </h2>
          <RecentActivityCard />
        </motion.div>
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
        <Route path="/finance" element={<FinanceDashboardPage />} />
        <Route path="/fee-structures" element={<FeeStructuresPage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/leave-requests" element={<LeaveRequestsPage />} />
        <Route path="/request-advance" element={<RequestAdvancePage />} />
        <Route path="/salary-advances" element={<SalaryAdvancesPage />} />
        <Route path="/trainer-salary" element={<TrainerSalaryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/certificate-templates" element={<CertificateTemplatesPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/job-postings" element={<JobPostingsPage />} />
        <Route path="/job-applications" element={<JobApplicationsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact-messages" element={<ContactMessagesPage />} />
        <Route path="/record-visitor" element={<RecordVisitorPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/it" element={<ITManagementPage />} />
        <Route path="/it-dashboard" element={<ITDashboardPage />} />
        <Route path="/wifi-networks" element={<WiFiNetworksPage />} />
        <Route path="/material-transactions" element={<MaterialTransactionsPage />} />
        <Route path="/materials-inventory" element={<MaterialsInventoryPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/trainer-salary-details" element={<TrainerSalaryDetails />} />
        <Route path="/profile" element={<ProfileEdit />} />
        <Route path="/profiles" element={<ProfileView />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
