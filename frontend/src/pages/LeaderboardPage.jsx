import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Medal, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LeaderboardPage() {
  const [poolXTeams, setPoolXTeams] = useState([]);
  const [poolYTeams, setPoolYTeams] = useState([]);
  const [poolXStatus, setPoolXStatus] = useState({ is_complete: false, total_clashes: 0, completed_clashes: 0 });
  const [poolYStatus, setPoolYStatus] = useState({ is_complete: false, total_clashes: 0, completed_clashes: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('X');
  
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchLeaderboard = async () => {
    try {
      const [poolXRes, poolYRes, poolXStatusRes, poolYStatusRes] = await Promise.all([
        axios.get(`${API}/leaderboard?pool=X`),
        axios.get(`${API}/leaderboard?pool=Y`),
        axios.get(`${API}/pool-status/X`),
        axios.get(`${API}/pool-status/Y`)
      ]);
      setPoolXTeams(poolXRes.data);
      setPoolYTeams(poolYRes.data);
      setPoolXStatus(poolXStatusRes.data);
      setPoolYStatus(poolYStatusRes.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getMedalIcon = (position) => {
    const medals = {
      0: { icon: Trophy, color: 'text-primary', bg: 'bg-primary/20' },
      1: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/20' },
      2: { icon: Medal, color: 'text-orange-600', bg: 'bg-orange-600/20' },
      3: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' }
    };
    return medals[position] || { icon: TrendingUp, color: 'text-muted-foreground', bg: 'bg-secondary' };
  };
  
  const renderTeams = (teams, poolStatus) => {
    if (teams.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No teams in this pool yet</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {teams.map((team, idx) => {
          const medal = getMedalIcon(idx);
          const Icon = medal.icon;
          // Only show qualified if pool is complete AND team is in top 2
          const isQualified = poolStatus.is_complete && idx < 2;
          // Highlight top 2 positions
          const isTopTwo = idx < 2;
          
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
                isQualified
                  ? 'border-green-500/50 bg-gradient-to-r from-green-950/30 to-card/50 hover:border-green-500/70'
                  : isTopTwo
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-primary text-black font-mono font-bold text-xs rounded">
                          {team.pool}{team.pool_number}
                        </span>
                        {isQualified && (
                          <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs font-bold text-green-500 uppercase flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Qualified
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-lg sm:text-xl tracking-tight uppercase text-foreground truncate">
                        {team.name}
                      </h3>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Diff: {team.point_difference > 0 ? '+' : ''}{team.point_difference}
                      </p>
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
    );
  };
  
  const renderPoolStatus = (poolStatus, poolName) => {
    if (poolStatus.total_clashes === 0) {
      return (
        <div className="mt-6 p-4 bg-secondary/30 border border-border rounded-lg">
          <p className="text-xs font-bold text-muted-foreground">No clashes scheduled yet</p>
        </div>
      );
    }
    
    if (poolStatus.is_complete) {
      return (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-xs font-bold text-green-500 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Pool {poolName} complete! Top 2 teams qualified for knockouts.
          </p>
        </div>
      );
    }
    
    return (
      <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-xs font-bold text-primary">
          Pool {poolName}: {poolStatus.completed_clashes}/28 clashes completed
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Top 2 teams will qualify for knockouts after all matches are completed
        </p>
      </div>
    );
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
            Rankings: Points → Fewer Losses → Point Difference
          </p>
        </motion.div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-auto p-1 bg-card/50 border border-border">
              <TabsTrigger value="X" className="font-bold uppercase tracking-wider">Pool X</TabsTrigger>
              <TabsTrigger value="Y" className="font-bold uppercase tracking-wider">Pool Y</TabsTrigger>
            </TabsList>
            
            <TabsContent value="X">
              {renderTeams(poolXTeams, poolXStatus)}
              {renderPoolStatus(poolXStatus, 'X')}
            </TabsContent>
            
            <TabsContent value="Y">
              {renderTeams(poolYTeams, poolYStatus)}
              {renderPoolStatus(poolYStatus, 'Y')}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
