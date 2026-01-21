import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        axios.get(`${API}/teams`),
        axios.get(`${API}/players`)
      ]);
      setTeams(teamsRes.data.sort((a, b) => {
        if (a.pool !== b.pool) return a.pool.localeCompare(b.pool);
        return a.pool_number - b.pool_number;
      }));
      setPlayers(playersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId);
  };
  
  const getPoolTeams = (pool) => {
    return teams.filter(t => t.pool === pool);
  };
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
            All <span className="text-yellow-500">Teams</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            14 teams across 2 pools
          </p>
        </motion.div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading teams...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {['X', 'Y'].map(pool => (
              <div key={pool}>
                <h2 className="font-heading font-bold text-2xl tracking-tight uppercase text-yellow-500 mb-6">
                  Pool {pool}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getPoolTeams(pool).map((team, idx) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                      data-testid={`team-card-${team.id}`}
                    >
                      <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm hover:border-yellow-500/50 transition-all duration-300 h-full">
                        <CardHeader className="border-b border-border pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-yellow-500 text-black font-mono font-bold text-xs rounded">
                                  {team.pool}{team.pool_number}
                                </span>
                              </div>
                              <CardTitle className="font-heading font-bold text-2xl tracking-tight uppercase text-foreground">
                                {team.name}
                              </CardTitle>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-black text-3xl text-yellow-500">{team.points}</p>
                              <p className="text-xs text-muted-foreground">points</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
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
                          
                          <div className="border-t border-border pt-4">
                            <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">
                              Squad ({getTeamPlayers(team.id).length} players)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {getTeamPlayers(team.id).map((player) => (
                                <div
                                  key={player.id}
                                  className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 hover:bg-secondary transition-colors"
                                  data-testid={`player-${player.id}`}
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-yellow-500 text-black text-xs font-bold">
                                      {player.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-foreground">{player.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
