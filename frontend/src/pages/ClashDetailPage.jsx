import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Image as ImageIcon, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClashDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clash, setClash] = useState(null);
  const [teams, setTeams] = useState({ team1: null, team2: null });
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchClashDetails();
    const interval = setInterval(fetchClashDetails, 15000);
    return () => clearInterval(interval);
  }, [id]);
  
  const fetchClashDetails = async () => {
    try {
      const [clashRes, playersRes] = await Promise.all([
        axios.get(`${API}/clashes/${id}`),
        axios.get(`${API}/players`)
      ]);
      setClash(clashRes.data);
      setPlayers(playersRes.data);
      
      const [team1Res, team2Res] = await Promise.all([
        axios.get(`${API}/teams/${clashRes.data.team1_id}`),
        axios.get(`${API}/teams/${clashRes.data.team2_id}`)
      ]);
      setTeams({ team1: team1Res.data, team2: team2Res.data });
    } catch (error) {
      console.error('Error fetching clash details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };
  
  const isKnockout = (stage) => ['knockout', 'semifinal', 'final'].includes(stage);
  
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };
  
  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading clash details...</p>
      </div>
    );
  }
  
  if (!clash) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Clash not found</p>
      </div>
    );
  }
  
  const knockout = isKnockout(clash.stage);
  const theme = knockout ? {
    border: 'border-red-500/50',
    bg: 'bg-gradient-to-br from-red-950/30 to-card/50',
    text: 'text-red-500',
    badge: 'bg-red-500'
  } : {
    border: 'border-primary/50',
    bg: 'bg-card/50',
    text: 'text-primary',
    badge: 'bg-primary'
  };
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/clashes')}
            className="mb-6 font-bold uppercase tracking-wider"
            data-testid="back-to-clashes"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clashes
          </Button>
          
          <Card className={`rounded-xl border backdrop-blur-sm mb-6 ${theme.border} ${theme.bg}`}>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                  {clash.clash_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {clash.status === 'live' && (
                    <span className={`px-3 py-1 font-mono font-bold text-xs uppercase rounded-full animate-pulse ${theme.badge} text-black`}>
                      • LIVE
                    </span>
                  )}
                  {knockout && (
                    <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs font-bold text-red-400 uppercase">
                      Royal
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground uppercase">{clash.stage}</span>
                </div>
              </div>
              {clash.start_time && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(clash.start_time).toLocaleString()}
                  </span>
                  {clash.duration_minutes && (
                    <span>Duration: {formatDuration(clash.duration_minutes)}</span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
                <div className="text-center">
                  <div className="bg-secondary/50 rounded-xl p-6 mb-4">
                    <Trophy className={`h-12 w-12 mx-auto mb-2 ${theme.text}`} />
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <span className="px-2 py-1 bg-primary text-black font-mono font-bold text-xs rounded">
                        {teams.team1?.pool}{teams.team1?.pool_number}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-2xl tracking-tight uppercase text-foreground">
                      {teams.team1?.name}
                    </h3>
                  </div>
                  <p className={`font-mono font-black text-5xl ${theme.text}`}>{clash.team1_games_won}</p>
                  <p className="text-xs text-muted-foreground mt-2">GAMES WON</p>
                </div>
                
                <div className="text-center">
                  <p className="font-mono text-2xl text-muted-foreground">VS</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-secondary/50 rounded-xl p-6 mb-4">
                    <Trophy className={`h-12 w-12 mx-auto mb-2 ${theme.text}`} />
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <span className="px-2 py-1 bg-primary text-black font-mono font-bold text-xs rounded">
                        {teams.team2?.pool}{teams.team2?.pool_number}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-2xl tracking-tight uppercase text-foreground">
                      {teams.team2?.name}
                    </h3>
                  </div>
                  <p className={`font-mono font-black text-5xl ${theme.text}`}>{clash.team2_games_won}</p>
                  <p className="text-xs text-muted-foreground mt-2">GAMES WON</p>
                </div>
              </div>
              
              {clash.status === 'completed' && clash.winner_id && (
                <div className={`text-center py-4 ${knockout ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/10 border-primary/30'} rounded-lg border`}>
                  <p className={`font-heading font-bold text-xl tracking-tight uppercase ${theme.text}`}>
                    Winner: {clash.winner_id === clash.team1_id ? teams.team1?.name : teams.team2?.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className={`rounded-xl border backdrop-blur-sm mb-6 ${theme.border} ${theme.bg}`}>
            <CardHeader>
              <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase">Match Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clash.scores.map((score, idx) => (
                  <div key={idx} className={`border rounded-lg p-4 ${knockout ? 'border-red-500/30 bg-red-950/20' : 'border-primary/30 bg-primary/5'}`} data-testid={`match-score-${idx}`}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold text-sm px-3 py-1 rounded ${theme.badge} text-black`}>
                          Match {score.match_number}
                        </span>
                        {score.completed && (
                          <span className="text-xs text-green-500 font-bold">✓ Completed</span>
                        )}
                      </div>
                      {score.winner && (
                        <span className={`text-sm font-bold ${theme.text}`}>Winner: {score.winner === 'team1' ? teams.team1?.name : teams.team2?.name}</span>
                      )}
                    </div>
                    
                    {score.completed ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{teams.team1?.name}</p>
                            <p className="text-xs text-muted-foreground font-bold">
                              {score.team1_player1_id && score.team1_player2_id && 
                                `${getPlayerName(score.team1_player1_id)} & ${getPlayerName(score.team1_player2_id)}`
                              }
                            </p>
                            <div className="flex gap-2">
                              <span className="font-mono font-bold text-lg">{score.team1_set1}</span>
                              {knockout && score.team1_set2 > 0 && <span className="font-mono font-bold text-lg">{score.team1_set2}</span>}
                              {knockout && score.team1_set3 > 0 && <span className="font-mono font-bold text-lg">{score.team1_set3}</span>}
                            </div>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-xs text-muted-foreground">{teams.team2?.name}</p>
                            <p className="text-xs text-muted-foreground font-bold">
                              {score.team2_player1_id && score.team2_player2_id && 
                                `${getPlayerName(score.team2_player1_id)} & ${getPlayerName(score.team2_player2_id)}`
                              }
                            </p>
                            <div className="flex gap-2 justify-end">
                              <span className="font-mono font-bold text-lg">{score.team2_set1}</span>
                              {knockout && score.team2_set2 > 0 && <span className="font-mono font-bold text-lg">{score.team2_set2}</span>}
                              {knockout && score.team2_set3 > 0 && <span className="font-mono font-bold text-lg">{score.team2_set3}</span>}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {knockout ? 'Best of 3 sets to 11 (deuce to 15)' : '1 game to 21 (deuce to 25)'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Not started yet</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {clash.photo_url && (
            <Card className={`rounded-xl border backdrop-blur-sm ${theme.border} ${theme.bg}`}>
              <CardHeader>
                <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase flex items-center">
                  <ImageIcon className={`mr-2 h-5 w-5 ${theme.text}`} />
                  Clash Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={clash.photo_url}
                  alt="Clash"
                  className="w-full rounded-lg"
                  data-testid="clash-photo"
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
