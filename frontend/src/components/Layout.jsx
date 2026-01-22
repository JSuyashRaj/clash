import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Award, Shield, Zap } from 'lucide-react';
import { Button } from './ui/button';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  
  const publicLinks = [
    { to: '/', label: 'Home', icon: Trophy },
    { to: '/teams', label: 'Teams', icon: Users },
    { to: '/clashes', label: 'Clashes', icon: Calendar },
    { to: '/leaderboard', label: 'Leaderboard', icon: Award },
    { to: '/knockouts', label: 'Knockouts', icon: Zap },
  ];
  
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: Trophy },
    { to: '/admin/teams', label: 'Teams', icon: Users },
    { to: '/admin/clashes', label: 'Clashes', icon: Calendar },
  ];
  
  const links = isAdmin ? adminLinks : publicLinks;
  
  const handleAdminAccess = () => {
    if (isAdmin) {
      localStorage.removeItem('adminAuth');
      navigate('/');
    } else {
      navigate('/admin/login');
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={isAdmin ? '/admin/dashboard' : '/'} className="flex items-center space-x-3 group" data-testid="logo-link">
              <div className="bg-primary rounded-lg p-2 group-hover:shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)] transition-all duration-300">
                <Trophy className="h-6 w-6 text-black" />
              </div>
              <span className="font-heading font-black text-xl tracking-tighter uppercase text-foreground">Clash of Shuttles</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to} data-testid={`nav-${link.label.toLowerCase()}`}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`font-bold uppercase tracking-wider ${
                        isActive ? 'bg-primary text-black hover:bg-primary/80' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
            
            <Button
              onClick={handleAdminAccess}
              variant="outline"
              className="font-bold uppercase tracking-wider border-2"
              data-testid="admin-button"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isAdmin ? 'Exit Admin' : 'Admin'}
            </Button>
          </div>
          
          <div className="md:hidden flex items-center justify-around pb-3 space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} data-testid={`mobile-nav-${link.label.toLowerCase()}`}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`font-bold text-xs ${
                      isActive ? 'bg-primary text-black' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-muted-foreground text-sm">
            <p className="font-mono">© 2026 Clash of Shuttles Tournament</p>
            <p className="mt-1">14 Teams • 2 Pools • 56 League Clashes</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
