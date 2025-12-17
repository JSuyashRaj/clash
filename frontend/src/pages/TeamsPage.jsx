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
      setTeams(teamsRes.data);
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
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
            All <span className="text-primary">Teams</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            Block warriors ready to clash
          </p>
        </motion.div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No teams registered yet</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {teams.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                data-testid={`team-card-${team.id}`}
              >
                <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
                  <CardHeader className="border-b border-border pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-heading font-bold text-2xl tracking-tight uppercase text-foreground mb-2">
                          {team.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Block: {team.block}</p>
                        <p className="text-sm text-muted-foreground">Captain: {team.captain}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-black text-3xl text-primary">{team.points}</p>
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
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
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
        )}
      </div>
    </div>
  );
}
