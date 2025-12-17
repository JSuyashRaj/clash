import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [teams, setTeams] = useState({ team1: null, team2: null });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMatchDetails();
    const interval = setInterval(fetchMatchDetails, 15000);
    return () => clearInterval(interval);
  }, [id]);
  
  const fetchMatchDetails = async () => {
    try {
      const matchRes = await axios.get(`${API}/matches/${id}`);
      setMatch(matchRes.data);
      
      const [team1Res, team2Res] = await Promise.all([
        axios.get(`${API}/teams/${matchRes.data.team1_id}`),
        axios.get(`${API}/teams/${matchRes.data.team2_id}`)
      ]);
      setTeams({ team1: team1Res.data, team2: team2Res.data });
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading match details...</p>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }
  
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
            onClick={() => navigate('/matches')}
            className="mb-6 font-bold uppercase tracking-wider"
            data-testid="back-to-matches"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
          </Button>
          
          <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm mb-6">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                  {match.clash_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {match.status === 'live' && (
                    <span className="px-3 py-1 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase rounded-full animate-pulse">
                      • LIVE
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground uppercase">{match.stage}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
                <div className="text-center">
                  <div className="bg-secondary/50 rounded-xl p-6 mb-4">
                    <Trophy className="h-12 w-12 text-primary mx-auto mb-2" />
                    <h3 className="font-heading font-bold text-2xl tracking-tight uppercase text-foreground">
                      {teams.team1?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{teams.team1?.block}</p>
                  </div>
                  <p className="font-mono font-black text-5xl text-primary">{match.team1_total_points}</p>
                  <p className="text-xs text-muted-foreground mt-2">TOTAL POINTS</p>
                </div>
                
                <div className="text-center">
                  <p className="font-mono text-2xl text-muted-foreground">VS</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-secondary/50 rounded-xl p-6 mb-4">
                    <Trophy className="h-12 w-12 text-primary mx-auto mb-2" />
                    <h3 className="font-heading font-bold text-2xl tracking-tight uppercase text-foreground">
                      {teams.team2?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{teams.team2?.block}</p>
                  </div>
                  <p className="font-mono font-black text-5xl text-primary">{match.team2_total_points}</p>
                  <p className="text-xs text-muted-foreground mt-2">TOTAL POINTS</p>
                </div>
              </div>
              
              {match.status === 'completed' && match.winner_id && (
                <div className="text-center py-4 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="font-heading font-bold text-xl tracking-tight uppercase text-primary">
                    Winner: {match.winner_id === match.team1_id ? teams.team1?.name : teams.team2?.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase">Match Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {match.scores.map((score, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4" data-testid={`match-score-${idx}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm bg-primary text-primary-foreground px-3 py-1 rounded">
                          Match {score.match_number}
                        </span>
                        <span className="text-sm text-muted-foreground uppercase">{score.match_type}</span>
                        <span className="text-xs text-primary font-bold">{score.points_awarded} pts</span>
                      </div>
                      {score.winner && (
                        <span className="text-sm font-bold text-primary">Winner: {score.winner}</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{teams.team1?.name}</p>
                        <div className="flex gap-2">
                          <span className="font-mono font-bold text-lg">{score.team1_set1}</span>
                          {score.team1_set2 > 0 && <span className="font-mono font-bold text-lg">{score.team1_set2}</span>}
                          {score.team1_set3 > 0 && <span className="font-mono font-bold text-lg">{score.team1_set3}</span>}
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-xs text-muted-foreground">{teams.team2?.name}</p>
                        <div className="flex gap-2 justify-end">
                          <span className="font-mono font-bold text-lg">{score.team2_set1}</span>
                          {score.team2_set2 > 0 && <span className="font-mono font-bold text-lg">{score.team2_set2}</span>}
                          {score.team2_set3 > 0 && <span className="font-mono font-bold text-lg">{score.team2_set3}</span>}
                        </div>
                      </div>
                    </div>
                    
                    {score.handicap_applied && (
                      <p className="text-xs text-primary mt-2">* Handicap applied</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {match.photo_url && (
            <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                  Match Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={match.photo_url}
                  alt="Match"
                  className="w-full rounded-lg"
                  data-testid="match-photo"
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
