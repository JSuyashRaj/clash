import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LeaderboardPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/leaderboard`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getMedalIcon = (position) => {
    const medals = {
      0: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
      1: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/20' },
      2: { icon: Medal, color: 'text-orange-600', bg: 'bg-orange-600/20' }
    };
    return medals[position] || { icon: TrendingUp, color: 'text-muted-foreground', bg: 'bg-secondary' };
  };
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
            <span className="text-primary">Leaderboard</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            Tournament standings & rankings
          </p>
        </motion.div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No teams yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team, idx) => {
              const medal = getMedalIcon(idx);
              const Icon = medal.icon;
              
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  whileHover={{ x: 4 }}
                  data-testid={`leaderboard-team-${idx}`}
                >
                  <Card className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    idx < 3
                      ? 'border-primary/30 bg-gradient-to-r from-card/80 to-card/50 hover:border-primary/50'
                      : 'border-white/10 bg-card/50 hover:border-primary/30'
                  }`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full ${medal.bg} flex-shrink-0`}>
                          {idx < 3 ? (
                            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${medal.color}`} />
                          ) : (
                            <span className="font-mono font-black text-xl sm:text-2xl text-muted-foreground">#{idx + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-lg sm:text-xl tracking-tight uppercase text-foreground truncate">
                            {team.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{team.block}</p>
                          <p className="text-xs text-muted-foreground mt-1">Captain: {team.captain}</p>
                        </div>
                        
                        <div className="hidden sm:grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="font-mono font-bold text-xl text-foreground">{team.matches_played}</p>
                            <p className="text-xs text-muted-foreground">Played</p>
                          </div>
                          <div>
                            <p className="font-mono font-bold text-xl text-green-500">{team.matches_won}</p>
                            <p className="text-xs text-muted-foreground">Won</p>
                          </div>
                          <div>
                            <p className="font-mono font-bold text-xl text-destructive">{team.matches_lost}</p>
                            <p className="text-xs text-muted-foreground">Lost</p>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono font-black text-3xl sm:text-4xl text-primary">{team.points}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mt-4 pt-4 border-t border-border sm:hidden">
                        <div>
                          <p className="font-mono font-bold text-lg text-foreground">{team.matches_played}</p>
                          <p className="text-xs text-muted-foreground">Played</p>
                        </div>
                        <div>
                          <p className="font-mono font-bold text-lg text-green-500">{team.matches_won}</p>
                          <p className="text-xs text-muted-foreground">Won</p>
                        </div>
                        <div>
                          <p className="font-mono font-bold text-lg text-destructive">{team.matches_lost}</p>
                          <p className="text-xs text-muted-foreground">Lost</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
