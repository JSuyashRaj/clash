import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalClashes: 0,
    liveClashes: 0,
    upcomingClashes: 0,
    completedClashes: 0
  });
  
  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin/login');
      return;
    }
    fetchStats();
  }, [navigate]);
  
  const fetchStats = async () => {
    try {
      const [teamsRes, playersRes, clashesRes] = await Promise.all([
        axios.get(`${API}/teams`),
        axios.get(`${API}/players`),
        axios.get(`${API}/clashes`)
      ]);
      
      setStats({
        totalTeams: teamsRes.data.length,
        totalPlayers: playersRes.data.length,
        totalClashes: clashesRes.data.length,
        liveClashes: clashesRes.data.filter(m => m.status === 'live').length,
        upcomingClashes: clashesRes.data.filter(m => m.status === 'upcoming').length,
        completedClashes: clashesRes.data.filter(m => m.status === 'completed').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const statCards = [
    { title: 'Total Teams', value: stats.totalTeams, icon: Users, color: 'text-yellow-500' },
    { title: 'Total Players', value: stats.totalPlayers, icon: Users, color: 'text-blue-500' },
    { title: 'Total Clashes', value: stats.totalClashes, icon: Calendar, color: 'text-purple-500' },
    { title: 'Live Clashes', value: stats.liveClashes, icon: TrendingUp, color: 'text-green-500' },
    { title: 'Upcoming', value: stats.upcomingClashes, icon: Calendar, color: 'text-yellow-500' },
    { title: 'Completed', value: stats.completedClashes, icon: Trophy, color: 'text-gray-500' }
  ];
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
            Main Admin <span className="text-yellow-500">Dashboard</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            Tournament management overview
          </p>
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, '-')}`}
              >
                <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm hover:border-yellow-500/50 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <p className={`font-mono font-black text-4xl ${stat.color}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
