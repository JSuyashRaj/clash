import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
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
      const matchesRes = await axios.get(`${API}/matches`);
      const teamsRes = await axios.get(`${API}/teams`);
      
      setMatches(matchesRes.data);
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
  
  const filterMatches = (status) => {
    if (status === 'all') return matches;
    return matches.filter(m => m.status === status);
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
            All <span className="text-primary">Matches</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium mb-8">
            Track every clash in the tournament
          </p>
        </motion.div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-8 h-auto p-1 bg-card/50 border border-border" data-testid="match-tabs">
            <TabsTrigger value="all" className="font-bold uppercase text-xs" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="live" className="font-bold uppercase text-xs" data-testid="tab-live">Live</TabsTrigger>
            <TabsTrigger value="upcoming" className="font-bold uppercase text-xs" data-testid="tab-upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="font-bold uppercase text-xs" data-testid="tab-completed">Completed</TabsTrigger>
          </TabsList>
          
          {['all', 'live', 'upcoming', 'completed'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading matches...</p>
                </div>
              ) : filterMatches(tab).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No {tab} matches</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filterMatches(tab).map((match, idx) => (
                    <MatchCard key={match.id} match={match} teams={teams} delay={idx * 0.05} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function MatchCard({ match, teams, delay }) {
  const team1 = teams[match.team1_id];
  const team2 = teams[match.team2_id];
  
  const getStatusIcon = () => {
    switch (match.status) {
      case 'live':
        return <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />;
      case 'upcoming':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = () => {
    const badges = {
      live: 'bg-primary text-primary-foreground',
      upcoming: 'bg-secondary text-foreground',
      completed: 'bg-green-500/20 text-green-500'
    };
    return badges[match.status] || badges.upcoming;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      data-testid={`match-card-${match.id}`}
    >
      <Link to={`/matches/${match.id}`}>
        <Card className={`rounded-xl border backdrop-blur-sm hover:border-primary/50 transition-all duration-300 cursor-pointer ${
          match.status === 'live' ? 'border-primary/50 glow-primary' : 'border-white/10 bg-card/50'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs uppercase ${getStatusBadge()}`}>
                  {match.status}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground uppercase">{match.stage}</span>
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="text-left">
                <p className="font-bold text-lg text-foreground mb-1">{team1?.name || 'Team 1'}</p>
                <p className="text-xs text-muted-foreground">{team1?.block}</p>
              </div>
              
              <div className="text-center px-4">
                {match.status === 'completed' || match.status === 'live' ? (
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-3xl text-primary">{match.team1_total_points}</span>
                    <span className="font-mono text-sm text-muted-foreground">-</span>
                    <span className="font-mono font-black text-3xl text-primary">{match.team2_total_points}</span>
                  </div>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground">VS</span>
                )}
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg text-foreground mb-1">{team2?.name || 'Team 2'}</p>
                <p className="text-xs text-muted-foreground">{team2?.block}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono">{match.clash_name}</p>
              {match.scheduled_time && match.status === 'upcoming' && (
                <p className="text-xs text-muted-foreground">
                  {new Date(match.scheduled_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {match.status === 'completed' && match.winner_id && (
                <p className="text-sm font-bold text-primary">
                  Winner: {teams[match.winner_id]?.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
