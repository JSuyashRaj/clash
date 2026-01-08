import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Users, Clipboard, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const adminRoles = [
  {
    id: 'main',
    name: 'Main Admin',
    description: 'Manage teams & schedule matches',
    icon: Calendar,
    color: 'bg-primary',
    hoverColor: 'hover:border-primary',
    textColor: 'text-primary'
  },
  {
    id: 'umpire',
    name: 'Umpire Admin',
    description: 'Update match scores only',
    icon: Clipboard,
    color: 'bg-cyan-500',
    hoverColor: 'hover:border-cyan-500',
    textColor: 'text-cyan-500'
  },
  {
    id: 'team',
    name: 'Team Admin',
    description: 'Manage team lineups',
    icon: Users,
    color: 'bg-orange-500',
    hoverColor: 'hover:border-orange-500',
    textColor: 'text-orange-500'
  }
];

export default function AdminLoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error('Please select an admin role');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/admin/login`, { 
        password,
        role: selectedRole
      });
      if (response.data.success) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminRole', selectedRole);
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error('Invalid password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        <Card className="rounded-xl border border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary rounded-full p-4 w-fit mb-4 glow-primary">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading font-bold text-3xl tracking-tight uppercase">
              Admin <span className="text-primary">Access</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Select your role and enter password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {adminRoles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <motion.div
                    key={role.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? `${role.color.replace('bg-', 'border-')} bg-opacity-10`
                          : `border-white/10 ${role.hoverColor}`
                      }`}
                      data-testid={`role-${role.id}`}
                    >
                      <Icon className={`h-8 w-8 mb-3 ${role.textColor}`} />
                      <h3 className="font-heading font-bold text-lg tracking-tight uppercase mb-1">
                        {role.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </button>
                  </motion.div>
                );
              })}
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="pl-10 rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                    required
                    data-testid="admin-password-input"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading || !selectedRole}
                className="w-full font-bold uppercase tracking-wider glow-primary"
                data-testid="admin-login-submit"
              >
                {loading ? 'Logging in...' : 'Access Admin Panel'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
