import { HashRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { ThemeConfigurator } from "@/components/theme-configurator";
import { Menu } from "lucide-react";
import { useState } from "react";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Tables from "@/pages/tables";
import Notifications from "@/pages/notifications";
import Subscriptions from "@/pages/subscriptions";
import Documentation from "@/pages/documentation";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import NotFound from "@/pages/not-found";

function Layout({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

  return (
    <div className="flex h-screen bg-stone-50 grain-texture">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-10
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <main className="flex-1 overflow-y-auto p-3 lg:p-6 relative z-10 flex flex-col">
        {/* Mobile header with burger menu */}
        <div className="lg:hidden mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        <Card className="flex-1 border border-stone-200 bg-white relative z-20">
          {title && (
            <div className="pt-6 px-3 lg:px-6 pb-4">
              <h1 className="text-xl font-semibold text-stone-900 mb-1">{title}</h1>
              {description && (
                <p className="text-sm text-stone-600">{description}</p>
              )}
              <div className="border-b border-stone-200 mt-4"></div>
            </div>
          )}
          {children}
        </Card>
        <Footer />
      </main>
      
      {/* Theme Configurator Modal - Outside sidebar for proper z-index */}
      <ThemeConfigurator 
        isOpen={themeConfigOpen} 
        onClose={() => setThemeConfigOpen(false)} 
      />
    </div>
  );
}

function Router() {
  return (
    <Routes>
      <Route path="/" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      <Route path="/profile" element={
        <Layout title="Profile" description="Manage your account settings and personal information">
          <Profile />
        </Layout>
      } />
      <Route path="/tables" element={
        <Layout title="Tables" description="Browse and manage data across different views">
          <Tables />
        </Layout>
      } />
      <Route path="/notifications" element={
        <Layout title="Notifications" description="Stay updated with your latest alerts and messages">
          <Notifications />
        </Layout>
      } />
      <Route path="/subscriptions" element={
        <Layout title="Subscriptions" description="Manage your billing, plans, and subscription settings">
          <Subscriptions />
        </Layout>
      } />
      <Route path="/documentation" element={
        <Layout title="Documentation" description="Installation guide, component examples, and project information">
          <Documentation />
        </Layout>
      } />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HashRouter>
  );
}

export default App;
