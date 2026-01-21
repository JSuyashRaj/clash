import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClashesPage() {
  const [clashes, setClashes] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchData = async () => {
    try {
      const clashesRes = await axios.get(`${API}/clashes`);
      const teamsRes = await axios.get(`${API}/teams`);
      
      setClashes(clashesRes.data);
      const teamsMap = {};
      teamsRes.data.forEach(team => {
        teamsMap[team.id] = team;
      });
      setTeams(teamsMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterClashes = (status) => {
    if (status === 'all') return clashes;
    return clashes.filter(m => m.status === status);
  };
  
  const isKnockout = (stage) => ['knockout', 'semifinal', 'final'].includes(stage);
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
            All <span className="text-primary">Clashes</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            Track every clash in the tournament
          </p>
        </motion.div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-8 h-auto p-1 bg-card/50 border border-border" data-testid="clash-tabs">
            <TabsTrigger value="all" className="font-bold uppercase text-xs" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="live" className="font-bold uppercase text-xs" data-testid="tab-live">Live</TabsTrigger>
            <TabsTrigger value="upcoming" className="font-bold uppercase text-xs" data-testid="tab-upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="font-bold uppercase text-xs" data-testid="tab-completed">Completed</TabsTrigger>
          </TabsList>
          
          {['all', 'live', 'upcoming', 'completed'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading clashes...</p>
                </div>
              ) : filterClashes(tab).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No {tab} clashes</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filterClashes(tab).map((clash, idx) => {
                    const team1 = teams[clash.team1_id];
                    const team2 = teams[clash.team2_id];
                    const knockout = isKnockout(clash.stage);
                    
                    return (
                      <motion.div
                        key={clash.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        whileHover={{ y: -2 }}
                        data-testid={`clash-card-${clash.id}`}
                      >
                        <Link to={`/clashes/${clash.id}`}>
                          <Card className={`rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer ${
                            clash.status === 'live' 
                              ? knockout 
                                ? 'border-red-500/50 bg-gradient-to-br from-red-950/30 to-card/50' 
                                : 'border-primary/50 bg-card/50' 
                              : 'border-white/10 bg-card/50 hover:border-primary/50'
                          }`} style={clash.status === 'live' ? { boxShadow: knockout ? '0 0 20px -5px rgba(239, 68, 68, 0.5)' : '0 0 20px -5px rgba(234, 179, 8, 0.5)' } : {}}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  {clash.status === 'live' && <span className={`w-3 h-3 rounded-full animate-pulse ${knockout ? 'bg-red-500' : 'bg-primary'}`} />}
                                  {clash.status === 'upcoming' && <Clock className="h-4 w-4 text-muted-foreground" />}
                                  {clash.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs uppercase ${
                                    clash.status === 'live' 
                                      ? knockout ? 'bg-red-500 text-black' : 'bg-primary text-black'
                                      : clash.status === 'upcoming' ? 'bg-secondary text-foreground' : 'bg-green-500/20 text-green-500'
                                  }`}>
                                    {clash.status}
                                  </span>
                                  {knockout && (
                                    <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs font-bold text-red-400 uppercase">
                                      Royal
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-xs text-muted-foreground uppercase">{clash.stage}</span>
                              </div>
                              
                              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                <div className="text-left">
                                  <p className="text-xs text-muted-foreground mb-1">{team1?.pool}{team1?.pool_number}</p>
                                  <p className="font-bold text-lg text-foreground">{team1?.name || 'Team 1'}</p>
                                </div>
                                
                                <div className="text-center px-4">
                                  {clash.status === 'completed' || clash.status === 'live' ? (
                                    <div className="flex items-center gap-3">
                                      <span className={`font-mono font-black text-3xl ${knockout ? 'text-red-500' : 'text-primary'}`}>{clash.team1_games_won}</span>
                                      <span className="font-mono text-sm text-muted-foreground">-</span>
                                      <span className={`font-mono font-black text-3xl ${knockout ? 'text-red-500' : 'text-primary'}`}>{clash.team2_games_won}</span>
                                    </div>
                                  ) : (
                                    <span className="font-mono text-sm text-muted-foreground">VS</span>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground mb-1">{team2?.pool}{team2?.pool_number}</p>
                                  <p className="font-bold text-lg text-foreground">{team2?.name || 'Team 2'}</p>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                <p className="text-sm text-muted-foreground font-mono">{clash.clash_name}</p>
                                {clash.scheduled_time && clash.status === 'upcoming' && (
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(clash.scheduled_time).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                )}
                                {clash.status === 'completed' && clash.winner_id && (
                                  <p className={`text-sm font-bold ${knockout ? 'text-red-500' : 'text-primary'}`}>
                                    Winner: {teams[clash.winner_id]?.name}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
