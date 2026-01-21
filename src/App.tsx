import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Programs from "./pages/Programs";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Register from "./pages/Register";
import RegisterStudentPage from "./pages/dashboard/RegisterStudentPage";
import Vacancies from "./pages/Vacancies";
import Announcements from "./pages/Announcements";
import NotFound from "./pages/NotFound";
import PublicVacanciesPage from "./pages/PublicVacanciesPage";
import DirectApplyPage from "./pages/DirectApplyPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <MainLayout>
                  <Index />
                </MainLayout>
              }
            />
            <Route
              path="/programs"
              element={
                <MainLayout>
                  <Programs />
                </MainLayout>
              }
            />
            <Route
              path="/services"
              element={
                <MainLayout>
                  <Services />
                </MainLayout>
              }
            />
            <Route
              path="/gallery"
              element={
                <MainLayout>
                  <Gallery />
                </MainLayout>
              }
            />
            <Route
              path="/contact"
              element={
                <MainLayout>
                  <Contact />
                </MainLayout>
              }
            />
            <Route
              path="/vacancies"
              element={
                <MainLayout>
                  <Vacancies />
                </MainLayout>
              }
            />
            <Route
              path="/careers"
              element={<PublicVacanciesPage />}
            />
            <Route
              path="/apply/:vacancyId"
              element={<DirectApplyPage />}
            />
            <Route
              path="/announcements"
              element={
                <MainLayout>
                  <Announcements />
                </MainLayout>
              }
            />
            <Route
              path="/register"
              element={
                <MainLayout>
                  <Register />
                </MainLayout>
              }
            />
            <Route
              path="/student-register"
              element={<RegisterStudentPage />}
            />
            <Route
              path="/login"
              element={
                <MainLayout>
                  <Login />
                </MainLayout>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
