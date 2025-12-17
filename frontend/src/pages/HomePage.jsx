import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes, notifsRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/leaderboard`),
        axios.get(`${API}/notifications`)
      ]);
      
      setLiveMatches(matchesRes.data.filter(m => m.status === 'live'));
      setUpcomingMatches(matchesRes.data.filter(m => m.status === 'upcoming').slice(0, 3));
      setTopTeams(teamsRes.data.slice(0, 4));
      setNotifications(notifsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-background">
      <div
        className="relative h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.9)), url('https://images.unsplash.com/photo-1761286753703-570ed91dd90e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxiYWRtaW50b24lMjBwbGF5ZXIlMjBzbWFzaCUyMGFjdGlvbiUyMGRhcmslMjBkcmFtYXRpYyUyMGxpZ2h0aW5nfGVufDB8fHx8MTc2NTk2NjQ0NHww&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(204, 255, 0, 0.15) 0%, rgba(9, 9, 11, 0) 70%)'
        }} />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter uppercase text-foreground mb-4">
              Clash of Shuttles
              <span className="text-primary"> 2026</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed mb-8">
              Where Blocks Collide. Where Legends Rise. <br className="hidden sm:block" />
              Experience the Ultimate Community Badminton Tournament.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/matches" data-testid="view-matches-btn">
                <Button size="lg" className="font-bold uppercase tracking-wider glow-primary">
                  <Zap className="mr-2 h-5 w-5" />
                  View Live Matches
                </Button>
              </Link>
              <Link to="/leaderboard" data-testid="leaderboard-btn">
                <Button size="lg" variant="outline" className="font-bold uppercase tracking-wider border-2">
                  <Trophy className="mr-2 h-5 w-5" />
                  Leaderboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-2xl tracking-tight uppercase flex items-center gap-3">
                <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                Live Matches
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {liveMatches.map((match, idx) => (
                <LiveMatchCard key={match.id} match={match} delay={idx * 0.1} />
              ))}
            </div>
          </motion.div>
        )}
        
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Upcoming Clashes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match) => (
                    <Link key={match.id} to={`/matches/${match.id}`} data-testid={`upcoming-match-${match.id}`}>
                      <div className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-primary/30">
                        <p className="font-mono text-xs text-muted-foreground mb-1">{match.stage.toUpperCase()}</p>
                        <p className="font-bold text-foreground">{match.clash_name}</p>
                        {match.scheduled_time && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(match.scheduled_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No upcoming matches</p>
                )}
                <Link to="/matches" data-testid="view-all-matches-link">
                  <Button variant="ghost" className="w-full font-bold uppercase tracking-wider">
                    View All Matches <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-primary" />
                  Top Teams
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topTeams.length > 0 ? (
                  topTeams.map((team, idx) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg" data-testid={`top-team-${idx}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-2xl text-primary w-8">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-foreground">{team.name}</p>
                          <p className="text-xs text-muted-foreground">{team.block}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-xl text-primary">{team.points}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No teams yet</p>
                )}
                <Link to="/leaderboard" data-testid="view-full-leaderboard-link">
                  <Button variant="ghost" className="w-full font-bold uppercase tracking-wider">
                    View Full Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Latest Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-secondary/30 rounded-lg border-l-4 border-primary" data-testid={`notification-${notif.id}`}>
                    <p className="font-bold text-foreground">{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function LiveMatchCard({ match, delay }) {
  const [teams, setTeams] = useState({ team1: null, team2: null });
  
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const [team1Res, team2Res] = await Promise.all([
          axios.get(`${API}/teams/${match.team1_id}`),
          axios.get(`${API}/teams/${match.team2_id}`)
        ]);
        setTeams({ team1: team1Res.data, team2: team2Res.data });
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, [match]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/matches/${match.id}`} data-testid={`live-match-${match.id}`}>
        <Card className="rounded-xl border-2 border-primary/50 bg-card backdrop-blur-sm hover:border-primary transition-all duration-300 glow-primary cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <span className="px-4 py-1 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase rounded-full animate-pulse">
                • LIVE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <p className="font-bold text-lg text-foreground mb-1">{teams.team1?.name || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground">{teams.team1?.block}</p>
                <p className="font-mono font-black text-3xl text-primary mt-2">{match.team1_total_points}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-xs text-muted-foreground">VS</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-foreground mb-1">{teams.team2?.name || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground">{teams.team2?.block}</p>
                <p className="font-mono font-black text-3xl text-primary mt-2">{match.team2_total_points}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-center text-sm text-muted-foreground font-mono">{match.clash_name}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
