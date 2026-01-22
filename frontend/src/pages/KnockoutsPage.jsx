import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Clock, CheckCircle, Swords, Crown, Medal } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function KnockoutsPage() {
  const [poolXStatus, setPoolXStatus] = useState({ is_complete: false, total_clashes: 0, completed_clashes: 0 });
  const [poolYStatus, setPoolYStatus] = useState({ is_complete: false, total_clashes: 0, completed_clashes: 0 });
  const [poolXTeams, setPoolXTeams] = useState([]);
  const [poolYTeams, setPoolYTeams] = useState([]);
  const [knockoutClashes, setKnockoutClashes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const bothPoolsComplete = poolXStatus.is_complete && poolYStatus.is_complete;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [poolXStatusRes, poolYStatusRes, poolXTeamsRes, poolYTeamsRes, clashesRes, teamsRes] = await Promise.all([
        axios.get(`${API}/pool-status/X`),
        axios.get(`${API}/pool-status/Y`),
        axios.get(`${API}/leaderboard?pool=X`),
        axios.get(`${API}/leaderboard?pool=Y`),
        axios.get(`${API}/clashes`),
        axios.get(`${API}/teams`)
      ]);
      setPoolXStatus(poolXStatusRes.data);
      setPoolYStatus(poolYStatusRes.data);
      setPoolXTeams(poolXTeamsRes.data);
      setPoolYTeams(poolYTeamsRes.data);
      setTeams(teamsRes.data);
      
      // Filter knockout clashes (semifinal, final, third_place)
      const knockouts = clashesRes.data.filter(c => 
        ['semifinal', 'final', 'third_place'].includes(c.stage)
      );
      setKnockoutClashes(knockouts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId) => {
    return teams.find(t => t.id === teamId)?.name || 'TBD';
  };

  const getTeamCode = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? `${team.pool}${team.pool_number}` : '';
  };

  const getSemiFinalClash = (type) => {
    // type: 'sf1' (X1 vs Y2) or 'sf2' (X2 vs Y1)
    return knockoutClashes.find(c => {
      if (c.stage !== 'semifinal') return false;
      if (type === 'sf1') {
        // X1 vs Y2
        const x1 = poolXTeams[0];
        const y2 = poolYTeams[1];
        if (!x1 || !y2) return false;
        return (c.team1_id === x1.id && c.team2_id === y2.id) || 
               (c.team1_id === y2.id && c.team2_id === x1.id);
      } else {
        // X2 vs Y1
        const x2 = poolXTeams[1];
        const y1 = poolYTeams[0];
        if (!x2 || !y1) return false;
        return (c.team1_id === x2.id && c.team2_id === y1.id) || 
               (c.team1_id === y1.id && c.team2_id === x2.id);
      }
    });
  };

  const getFinalClash = () => knockoutClashes.find(c => c.stage === 'final');
  const getThirdPlaceClash = () => knockoutClashes.find(c => c.stage === 'third_place');

  const renderWaitingState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-16"
    >
      <div className="relative inline-block mb-8">
        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
        <div className="relative bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 rounded-full p-8">
          <Clock className="h-16 w-16 text-red-500 mx-auto animate-pulse" />
        </div>
      </div>
      
      <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter uppercase text-foreground mb-4">
        Awaiting <span className="text-red-500">League Completion</span>
      </h2>
      
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        The knockout stage will begin once all league matches in both pools are completed. 
        Top 2 teams from each pool will battle for the championship!
      </p>
      
      <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto mb-8">
        <Card className={`rounded-xl border ${poolXStatus.is_complete ? 'border-green-500/50 bg-green-950/20' : 'border-red-500/30 bg-red-950/10'}`}>
          <CardContent className="p-6 text-center">
            <p className="font-mono font-bold text-sm text-muted-foreground mb-2">POOL X</p>
            {poolXStatus.is_complete ? (
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="font-bold">Complete</span>
              </div>
            ) : (
              <>
                <p className="font-mono font-black text-2xl text-red-500">
                  {poolXStatus.completed_clashes}/28
                </p>
                <p className="text-xs text-muted-foreground">clashes done</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className={`rounded-xl border ${poolYStatus.is_complete ? 'border-green-500/50 bg-green-950/20' : 'border-red-500/30 bg-red-950/10'}`}>
          <CardContent className="p-6 text-center">
            <p className="font-mono font-bold text-sm text-muted-foreground mb-2">POOL Y</p>
            {poolYStatus.is_complete ? (
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="font-bold">Complete</span>
              </div>
            ) : (
              <>
                <p className="font-mono font-black text-2xl text-red-500">
                  {poolYStatus.completed_clashes}/28
                </p>
                <p className="text-xs text-muted-foreground">clashes done</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-2xl mx-auto">
        <p className="text-sm font-bold text-red-400 uppercase tracking-wide mb-3">Knockout Format Preview</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-sm text-muted-foreground">
          <div>
            <p className="font-bold text-foreground mb-1">Semi-Final 1</p>
            <p>1st Pool X vs 2nd Pool Y</p>
          </div>
          <div>
            <p className="font-bold text-foreground mb-1">Semi-Final 2</p>
            <p>2nd Pool X vs 1st Pool Y</p>
          </div>
          <div>
            <p className="font-bold text-foreground mb-1">Third Place</p>
            <p>Loser SF1 vs Loser SF2</p>
          </div>
          <div>
            <p className="font-bold text-foreground mb-1">Final</p>
            <p>Winner SF1 vs Winner SF2</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderKnockoutBracket = () => {
    const sf1 = getSemiFinalClash('sf1');
    const sf2 = getSemiFinalClash('sf2');
    const final = getFinalClash();
    const thirdPlace = getThirdPlaceClash();

    const x1 = poolXTeams[0];
    const x2 = poolXTeams[1];
    const y1 = poolYTeams[0];
    const y2 = poolYTeams[1];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Qualified Teams */}
        <div className="mb-12">
          <h2 className="font-heading font-bold text-xl tracking-tight uppercase text-foreground mb-6 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Qualified Teams
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <Card className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card/50">
              <CardContent className="p-4">
                <p className="font-mono font-bold text-xs text-primary mb-3">POOL X QUALIFIERS</p>
                <div className="space-y-2">
                  {x1 && (
                    <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                      <span className="font-mono font-bold text-primary">1st</span>
                      <span className="font-bold">{x1.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{x1.points} pts</span>
                    </div>
                  )}
                  {x2 && (
                    <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                      <span className="font-mono font-bold text-muted-foreground">2nd</span>
                      <span className="font-bold">{x2.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{x2.points} pts</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card/50">
              <CardContent className="p-4">
                <p className="font-mono font-bold text-xs text-primary mb-3">POOL Y QUALIFIERS</p>
                <div className="space-y-2">
                  {y1 && (
                    <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                      <span className="font-mono font-bold text-primary">1st</span>
                      <span className="font-bold">{y1.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{y1.points} pts</span>
                    </div>
                  )}
                  {y2 && (
                    <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                      <span className="font-mono font-bold text-muted-foreground">2nd</span>
                      <span className="font-bold">{y2.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{y2.points} pts</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Semi-Finals */}
        <div className="mb-12">
          <h2 className="font-heading font-bold text-xl tracking-tight uppercase text-foreground mb-6 flex items-center gap-2">
            <Swords className="h-5 w-5 text-red-500" />
            Semi-Finals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SF1: X1 vs Y2 */}
            <Card className={`rounded-xl border-2 ${sf1?.is_locked ? 'border-green-500/50' : 'border-red-500/50'} bg-gradient-to-br from-red-950/30 to-card/50`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-red-500 text-white font-mono font-bold text-xs rounded">SEMI-FINAL 1</span>
                  {sf1?.is_locked && (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                      <CheckCircle className="h-3 w-3" /> Complete
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{x1 ? `${x1.pool}${x1.pool_number}` : 'X1'}</p>
                    <p className="font-bold text-lg">{x1?.name || 'TBD'}</p>
                    <p className="font-mono font-black text-3xl text-red-500 mt-2">{sf1?.team1_games_won || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm text-muted-foreground">VS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{y2 ? `${y2.pool}${y2.pool_number}` : 'Y2'}</p>
                    <p className="font-bold text-lg">{y2?.name || 'TBD'}</p>
                    <p className="font-mono font-black text-3xl text-red-500 mt-2">{sf1?.team2_games_won || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SF2: X2 vs Y1 */}
            <Card className={`rounded-xl border-2 ${sf2?.is_locked ? 'border-green-500/50' : 'border-red-500/50'} bg-gradient-to-br from-red-950/30 to-card/50`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-red-500 text-white font-mono font-bold text-xs rounded">SEMI-FINAL 2</span>
                  {sf2?.is_locked && (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                      <CheckCircle className="h-3 w-3" /> Complete
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{x2 ? `${x2.pool}${x2.pool_number}` : 'X2'}</p>
                    <p className="font-bold text-lg">{x2?.name || 'TBD'}</p>
                    <p className="font-mono font-black text-3xl text-red-500 mt-2">{sf2?.team1_games_won || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm text-muted-foreground">VS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{y1 ? `${y1.pool}${y1.pool_number}` : 'Y1'}</p>
                    <p className="font-bold text-lg">{y1?.name || 'TBD'}</p>
                    <p className="font-mono font-black text-3xl text-red-500 mt-2">{sf2?.team2_games_won || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final & Third Place */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Third Place */}
          <Card className={`rounded-xl border-2 ${thirdPlace?.is_locked ? 'border-green-500/50' : 'border-orange-500/50'} bg-gradient-to-br from-orange-950/30 to-card/50`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-orange-600 text-white font-mono font-bold text-xs rounded flex items-center gap-1">
                  <Medal className="h-3 w-3" /> 3RD PLACE
                </span>
                {thirdPlace?.is_locked && (
                  <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                    <CheckCircle className="h-3 w-3" /> Complete
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Loser SF1</p>
                  <p className="font-bold">{thirdPlace ? getTeamName(thirdPlace.team1_id) : 'TBD'}</p>
                  <p className="font-mono font-black text-2xl text-orange-500 mt-2">{thirdPlace?.team1_games_won || 0}</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm text-muted-foreground">VS</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Loser SF2</p>
                  <p className="font-bold">{thirdPlace ? getTeamName(thirdPlace.team2_id) : 'TBD'}</p>
                  <p className="font-mono font-black text-2xl text-orange-500 mt-2">{thirdPlace?.team2_games_won || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final */}
          <Card className={`rounded-xl border-2 ${final?.is_locked ? 'border-green-500/50' : 'border-yellow-500/50'} bg-gradient-to-br from-yellow-950/30 to-card/50`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-yellow-500 text-black font-mono font-bold text-xs rounded flex items-center gap-1">
                  <Crown className="h-3 w-3" /> GRAND FINAL
                </span>
                {final?.is_locked && (
                  <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                    <CheckCircle className="h-3 w-3" /> Complete
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Winner SF1</p>
                  <p className="font-bold">{final ? getTeamName(final.team1_id) : 'TBD'}</p>
                  <p className="font-mono font-black text-2xl text-yellow-500 mt-2">{final?.team1_games_won || 0}</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm text-muted-foreground">VS</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Winner SF2</p>
                  <p className="font-bold">{final ? getTeamName(final.team2_id) : 'TBD'}</p>
                  <p className="font-mono font-black text-2xl text-yellow-500 mt-2">{final?.team2_games_won || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Format Info */}
        <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <p className="text-sm font-bold text-red-400 uppercase tracking-wide mb-3">Knockout Scoring Format</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Each clash = 5 matches (Best of 5)</p>
            <p>• Each match = Best of 3 sets (First to win 2 sets)</p>
            <p>• Each set = 11 points (Deuce to 15)</p>
            <p>• First team to win 3 matches wins the clash</p>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading knockouts...</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
            <span className="text-red-500">Knockout</span> Stage
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {bothPoolsComplete 
              ? "The battle for glory begins. Only the best survive."
              : "Where legends are forged. Coming soon..."}
          </p>
        </motion.div>

        {bothPoolsComplete ? renderKnockoutBracket() : renderWaitingState()}
      </div>
    </div>
  );
}
