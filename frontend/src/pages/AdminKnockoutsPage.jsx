import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, Clock, CheckCircle, Swords, Crown, Medal, Edit, Users } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminKnockoutsPage() {
  const navigate = useNavigate();
  const [poolXStatus, setPoolXStatus] = useState({ is_complete: false, total_clashes: 0, completed_clashes: 0 });
  const [poolYStatus, setPoolYStatus] = useState({ is_complete: false, total_clashes: 0, completed_clashes: 0 });
  const [poolXTeams, setPoolXTeams] = useState([]);
  const [poolYTeams, setPoolYTeams] = useState([]);
  const [knockoutClashes, setKnockoutClashes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [editingClash, setEditingClash] = useState(null);
  const [scoreForm, setScoreForm] = useState({ scores: [] });

  const bothPoolsComplete = poolXStatus.is_complete && poolYStatus.is_complete;

  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [poolXStatusRes, poolYStatusRes, poolXTeamsRes, poolYTeamsRes, clashesRes, teamsRes, playersRes] = await Promise.all([
        axios.get(`${API}/pool-status/X`),
        axios.get(`${API}/pool-status/Y`),
        axios.get(`${API}/leaderboard?pool=X`),
        axios.get(`${API}/leaderboard?pool=Y`),
        axios.get(`${API}/clashes`),
        axios.get(`${API}/teams`),
        axios.get(`${API}/players`)
      ]);
      setPoolXStatus(poolXStatusRes.data);
      setPoolYStatus(poolYStatusRes.data);
      setPoolXTeams(poolXTeamsRes.data);
      setPoolYTeams(poolYTeamsRes.data);
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
      
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

  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId);
  };

  const getPlayerName = (playerId) => {
    return players.find(p => p.id === playerId)?.name || '';
  };

  const handleGenerateSemifinals = async () => {
    if (!window.confirm('Generate semi-final fixtures based on current leaderboard standings?')) return;
    
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/knockouts/generate-semifinals`);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate semi-finals');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFinals = async () => {
    if (!window.confirm('Generate final and third-place fixtures based on semi-final results?')) return;
    
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/knockouts/generate-finals`);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate finals');
    } finally {
      setGenerating(false);
    }
  };

  const openScoreDialog = (clash) => {
    setEditingClash(clash);
    setScoreForm({
      scores: clash.scores.map(s => ({ ...s }))
    });
    setShowScoreDialog(true);
  };

  // Knockout scoring: Best of 3 sets, each set to 11 (deuce to 15)
  const getSetWinner = (team1Score, team2Score) => {
    const score1 = parseInt(team1Score) || 0;
    const score2 = parseInt(team2Score) || 0;
    
    if (score1 >= 11 && score1 - score2 >= 2) return 'team1';
    if (score2 >= 11 && score2 - score1 >= 2) return 'team2';
    if (score1 === 15 && score1 > score2) return 'team1';
    if (score2 === 15 && score2 > score1) return 'team2';
    
    return null;
  };

  // Get match winner (best of 3 sets)
  const getMatchWinner = (score) => {
    let team1Sets = 0;
    let team2Sets = 0;
    
    const set1Winner = getSetWinner(score.team1_set1, score.team2_set1);
    const set2Winner = getSetWinner(score.team1_set2, score.team2_set2);
    const set3Winner = getSetWinner(score.team1_set3, score.team2_set3);
    
    if (set1Winner === 'team1') team1Sets++;
    if (set1Winner === 'team2') team2Sets++;
    if (set2Winner === 'team1') team1Sets++;
    if (set2Winner === 'team2') team2Sets++;
    if (set3Winner === 'team1') team1Sets++;
    if (set3Winner === 'team2') team2Sets++;
    
    if (team1Sets >= 2) return 'team1';
    if (team2Sets >= 2) return 'team2';
    return null;
  };

  const calculateClashScore = (scores) => {
    let team1Wins = 0;
    let team2Wins = 0;
    
    scores.forEach(score => {
      const winner = getMatchWinner(score);
      if (winner === 'team1') team1Wins++;
      if (winner === 'team2') team2Wins++;
    });
    
    return { team1Wins, team2Wins };
  };

  const isClashFinished = (scores) => {
    const { team1Wins, team2Wins } = calculateClashScore(scores);
    return team1Wins >= 3 || team2Wins >= 3;
  };

  const updateScoreNumber = (matchIdx, field, value) => {
    const updated = [...scoreForm.scores];
    const numValue = parseInt(value) || 0;
    updated[matchIdx][field] = Math.min(Math.max(numValue, 0), 15);
    setScoreForm({ ...scoreForm, scores: updated });
  };

  const handlePlayerSelect = (gameIdx, field, playerId) => {
    const updated = [...scoreForm.scores];
    updated[gameIdx][field] = playerId === 'none' ? null : playerId;
    setScoreForm({ ...scoreForm, scores: updated });
  };

  const getPlayerGameCount = (playerId, excludeGameIdx = -1) => {
    if (!playerId) return 0;
    let count = 0;
    scoreForm.scores.forEach((score, idx) => {
      if (idx === excludeGameIdx) return;
      if (score.team1_player1_id === playerId || score.team1_player2_id === playerId ||
          score.team2_player1_id === playerId || score.team2_player2_id === playerId) {
        count++;
      }
    });
    return count;
  };

  const getUsedPairs = (excludeGameIdx = -1) => {
    const pairs = new Set();
    scoreForm.scores.forEach((score, idx) => {
      if (idx === excludeGameIdx) return;
      if (score.team1_player1_id && score.team1_player2_id) {
        pairs.add([score.team1_player1_id, score.team1_player2_id].sort().join('-'));
      }
      if (score.team2_player1_id && score.team2_player2_id) {
        pairs.add([score.team2_player1_id, score.team2_player2_id].sort().join('-'));
      }
    });
    return pairs;
  };

  const isPairValid = (player1Id, player2Id, gameIdx) => {
    if (!player1Id || !player2Id) return true;
    const pairKey = [player1Id, player2Id].sort().join('-');
    return !getUsedPairs(gameIdx).has(pairKey);
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    
    if (editingClash.is_locked) {
      toast.error('This clash is locked');
      return;
    }
    
    const { team1Wins, team2Wins } = calculateClashScore(scoreForm.scores);
    const clashFinished = team1Wins >= 3 || team2Wins >= 3;
    
    const updatedScores = scoreForm.scores.map(score => {
      const winner = getMatchWinner(score);
      return {
        ...score,
        completed: winner !== null,
        winner: winner === 'team1' ? editingClash.team1_id : winner === 'team2' ? editingClash.team2_id : null
      };
    });
    
    try {
      await axios.put(`${API}/clashes/${editingClash.id}/score`, {
        clash_id: editingClash.id,
        scores: updatedScores,
        team1_games_won: team1Wins,
        team2_games_won: team2Wins,
        winner_id: clashFinished ? (team1Wins >= 3 ? editingClash.team1_id : editingClash.team2_id) : null,
        status: clashFinished ? 'completed' : 'live'
      });
      
      if (clashFinished) {
        toast.success(`${team1Wins >= 3 ? getTeamName(editingClash.team1_id) : getTeamName(editingClash.team2_id)} wins!`);
      } else {
        toast.success('Scores updated!');
      }
      
      setShowScoreDialog(false);
      setEditingClash(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update score');
    }
  };

  const getCurrentClashScore = () => {
    if (!scoreForm.scores) return { team1Wins: 0, team2Wins: 0 };
    return calculateClashScore(scoreForm.scores);
  };

  const getSetsWon = (score) => {
    let team1Sets = 0;
    let team2Sets = 0;
    
    if (getSetWinner(score.team1_set1, score.team2_set1) === 'team1') team1Sets++;
    if (getSetWinner(score.team1_set1, score.team2_set1) === 'team2') team2Sets++;
    if (getSetWinner(score.team1_set2, score.team2_set2) === 'team1') team1Sets++;
    if (getSetWinner(score.team1_set2, score.team2_set2) === 'team2') team2Sets++;
    if (getSetWinner(score.team1_set3, score.team2_set3) === 'team1') team1Sets++;
    if (getSetWinner(score.team1_set3, score.team2_set3) === 'team2') team2Sets++;
    
    return { team1Sets, team2Sets };
  };

  const semis = knockoutClashes.filter(c => c.stage === 'semifinal');
  const finals = knockoutClashes.filter(c => c.stage === 'final');
  const thirdPlace = knockoutClashes.filter(c => c.stage === 'third_place');

  const semisComplete = semis.length === 2 && semis.every(s => s.is_locked);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
            Manage <span className="text-red-500">Knockouts</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Semi-finals, Third Place & Grand Final
          </p>
        </motion.div>

        {/* Pool Status */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className={`rounded-xl border ${poolXStatus.is_complete ? 'border-green-500/50 bg-green-950/20' : 'border-muted'}`}>
            <CardContent className="p-4 text-center">
              <p className="font-mono font-bold text-sm text-muted-foreground mb-1">POOL X</p>
              {poolXStatus.is_complete ? (
                <span className="text-green-500 font-bold flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Complete
                </span>
              ) : (
                <span className="text-muted-foreground">{poolXStatus.completed_clashes}/{poolXStatus.total_clashes || 28}</span>
              )}
            </CardContent>
          </Card>
          <Card className={`rounded-xl border ${poolYStatus.is_complete ? 'border-green-500/50 bg-green-950/20' : 'border-muted'}`}>
            <CardContent className="p-4 text-center">
              <p className="font-mono font-bold text-sm text-muted-foreground mb-1">POOL Y</p>
              {poolYStatus.is_complete ? (
                <span className="text-green-500 font-bold flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Complete
                </span>
              ) : (
                <span className="text-muted-foreground">{poolYStatus.completed_clashes}/{poolYStatus.total_clashes || 28}</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generate Semi-Finals Button */}
        {bothPoolsComplete && semis.length === 0 && (
          <Card className="rounded-xl border border-red-500/30 bg-red-950/20 mb-8">
            <CardContent className="p-6 text-center">
              <Swords className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Ready to Generate Semi-Finals</h3>
              <p className="text-sm text-muted-foreground mb-4">
                X1 vs Y2 and X2 vs Y1 based on current leaderboard
              </p>
              <Button
                onClick={handleGenerateSemifinals}
                disabled={generating}
                className="bg-red-500 text-white hover:bg-red-600 font-bold uppercase"
              >
                {generating ? 'Generating...' : 'Generate Semi-Finals'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Semi-Finals */}
        {semis.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading font-bold text-xl tracking-tight uppercase text-foreground mb-4 flex items-center gap-2">
              <Swords className="h-5 w-5 text-red-500" /> Semi-Finals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {semis.map((clash, idx) => (
                <Card key={clash.id} className={`rounded-xl border-2 ${clash.is_locked ? 'border-green-500/50' : 'border-red-500/50'} bg-gradient-to-br from-red-950/30 to-card/50`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-red-500 text-white font-mono font-bold text-xs rounded">SF {idx + 1}</span>
                      {clash.is_locked ? (
                        <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Complete
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openScoreDialog(clash)} className="text-xs">
                          <Edit className="h-3 w-3 mr-1" /> Score
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 items-center text-center">
                      <div>
                        <p className="font-bold">{getTeamName(clash.team1_id)}</p>
                        <p className="font-mono font-black text-2xl text-red-500 mt-1">{clash.team1_games_won}</p>
                      </div>
                      <p className="text-muted-foreground">VS</p>
                      <div>
                        <p className="font-bold">{getTeamName(clash.team2_id)}</p>
                        <p className="font-mono font-black text-2xl text-red-500 mt-1">{clash.team2_games_won}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Generate Finals Button */}
        {semisComplete && finals.length === 0 && (
          <Card className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 mb-8">
            <CardContent className="p-6 text-center">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Semi-Finals Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate Final and Third Place matches
              </p>
              <Button
                onClick={handleGenerateFinals}
                disabled={generating}
                className="bg-yellow-500 text-black hover:bg-yellow-600 font-bold uppercase"
              >
                {generating ? 'Generating...' : 'Generate Finals'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Third Place & Final */}
        {(thirdPlace.length > 0 || finals.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thirdPlace.map(clash => (
              <Card key={clash.id} className={`rounded-xl border-2 ${clash.is_locked ? 'border-green-500/50' : 'border-orange-500/50'} bg-gradient-to-br from-orange-950/30 to-card/50`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-orange-600 text-white font-mono font-bold text-xs rounded flex items-center gap-1">
                      <Medal className="h-3 w-3" /> 3RD PLACE
                    </span>
                    {!clash.is_locked && (
                      <Button size="sm" variant="outline" onClick={() => openScoreDialog(clash)} className="text-xs">
                        <Edit className="h-3 w-3 mr-1" /> Score
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center text-center">
                    <div>
                      <p className="font-bold">{getTeamName(clash.team1_id)}</p>
                      <p className="font-mono font-black text-2xl text-orange-500 mt-1">{clash.team1_games_won}</p>
                    </div>
                    <p className="text-muted-foreground">VS</p>
                    <div>
                      <p className="font-bold">{getTeamName(clash.team2_id)}</p>
                      <p className="font-mono font-black text-2xl text-orange-500 mt-1">{clash.team2_games_won}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {finals.map(clash => (
              <Card key={clash.id} className={`rounded-xl border-2 ${clash.is_locked ? 'border-green-500/50' : 'border-yellow-500/50'} bg-gradient-to-br from-yellow-950/30 to-card/50`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-yellow-500 text-black font-mono font-bold text-xs rounded flex items-center gap-1">
                      <Crown className="h-3 w-3" /> GRAND FINAL
                    </span>
                    {!clash.is_locked && (
                      <Button size="sm" variant="outline" onClick={() => openScoreDialog(clash)} className="text-xs">
                        <Edit className="h-3 w-3 mr-1" /> Score
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center text-center">
                    <div>
                      <p className="font-bold">{getTeamName(clash.team1_id)}</p>
                      <p className="font-mono font-black text-2xl text-yellow-500 mt-1">{clash.team1_games_won}</p>
                    </div>
                    <p className="text-muted-foreground">VS</p>
                    <div>
                      <p className="font-bold">{getTeamName(clash.team2_id)}</p>
                      <p className="font-mono font-black text-2xl text-yellow-500 mt-1">{clash.team2_games_won}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Score Dialog for Knockouts */}
        <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
          <DialogContent className="border border-red-500/30 sm:rounded-2xl max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-red-950/50 to-card">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                Score Entry: {editingClash?.clash_name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Knockout Format: Best of 3 sets per match (11 points, deuce to 15)
              </p>
            </DialogHeader>
            
            {editingClash && (
              <form onSubmit={handleUpdateScore} className="space-y-6">
                {/* Clash Score Display */}
                <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 text-center">Clash Score (Best of 5 Matches)</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-bold text-muted-foreground">{getTeamName(editingClash.team1_id)}</p>
                      <p className="font-mono font-black text-4xl text-red-500">{getCurrentClashScore().team1Wins}</p>
                    </div>
                    <span className="text-2xl text-muted-foreground">-</span>
                    <div className="text-center">
                      <p className="text-sm font-bold text-muted-foreground">{getTeamName(editingClash.team2_id)}</p>
                      <p className="font-mono font-black text-4xl text-red-500">{getCurrentClashScore().team2Wins}</p>
                    </div>
                  </div>
                  {isClashFinished(scoreForm.scores) && (
                    <p className="text-center mt-2 text-green-400 font-bold text-sm flex items-center justify-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {getCurrentClashScore().team1Wins >= 3 ? getTeamName(editingClash.team1_id) : getTeamName(editingClash.team2_id)} wins!
                    </p>
                  )}
                </div>

                {/* Matches */}
                <div className="space-y-4">
                  {scoreForm.scores.map((score, idx) => {
                    const matchWinner = getMatchWinner(score);
                    const isMatchComplete = matchWinner !== null;
                    const { team1Wins, team2Wins } = calculateClashScore(scoreForm.scores.slice(0, idx));
                    const clashAlreadyWon = team1Wins >= 3 || team2Wins >= 3;
                    const { team1Sets, team2Sets } = getSetsWon(score);
                    
                    const team1Players = getTeamPlayers(editingClash.team1_id);
                    const team2Players = getTeamPlayers(editingClash.team2_id);
                    
                    const allPlayersSelected = score.team1_player1_id && score.team1_player2_id && 
                                               score.team2_player1_id && score.team2_player2_id;

                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-lg p-4 ${
                          isMatchComplete 
                            ? 'border-green-500/30 bg-green-950/20' 
                            : clashAlreadyWon
                              ? 'border-muted/30 bg-muted/5 opacity-50'
                              : 'border-red-500/30 bg-red-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-mono font-bold text-sm px-3 py-1 rounded ${
                            isMatchComplete ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                          }`}>
                            Match {idx + 1}
                          </span>
                          {isMatchComplete && (
                            <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {matchWinner === 'team1' ? getTeamName(editingClash.team1_id) : getTeamName(editingClash.team2_id)} wins ({team1Sets}-{team2Sets})
                            </span>
                          )}
                        </div>

                        {/* Player Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <Users className="h-3 w-3" /> {getTeamName(editingClash.team1_id)}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Select 
                                value={score.team1_player1_id || 'none'} 
                                onValueChange={(val) => handlePlayerSelect(idx, 'team1_player1_id', val)}
                                disabled={clashAlreadyWon && !isMatchComplete}
                              >
                                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-transparent">
                                  <SelectValue placeholder="Player 1" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-white/10">
                                  <SelectItem value="none">-- Select --</SelectItem>
                                  {team1Players.map(p => (
                                    <SelectItem key={p.id} value={p.id} disabled={getPlayerGameCount(p.id, idx) >= 2}>
                                      {p.name} ({getPlayerGameCount(p.id, idx)}/2)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select 
                                value={score.team1_player2_id || 'none'} 
                                onValueChange={(val) => handlePlayerSelect(idx, 'team1_player2_id', val)}
                                disabled={clashAlreadyWon && !isMatchComplete}
                              >
                                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-transparent">
                                  <SelectValue placeholder="Player 2" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-white/10">
                                  <SelectItem value="none">-- Select --</SelectItem>
                                  {team1Players.map(p => (
                                    <SelectItem key={p.id} value={p.id} disabled={getPlayerGameCount(p.id, idx) >= 2 || !isPairValid(p.id, score.team1_player1_id, idx)}>
                                      {p.name} ({getPlayerGameCount(p.id, idx)}/2)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <Users className="h-3 w-3" /> {getTeamName(editingClash.team2_id)}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Select 
                                value={score.team2_player1_id || 'none'} 
                                onValueChange={(val) => handlePlayerSelect(idx, 'team2_player1_id', val)}
                                disabled={clashAlreadyWon && !isMatchComplete}
                              >
                                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-transparent">
                                  <SelectValue placeholder="Player 1" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-white/10">
                                  <SelectItem value="none">-- Select --</SelectItem>
                                  {team2Players.map(p => (
                                    <SelectItem key={p.id} value={p.id} disabled={getPlayerGameCount(p.id, idx) >= 2}>
                                      {p.name} ({getPlayerGameCount(p.id, idx)}/2)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select 
                                value={score.team2_player2_id || 'none'} 
                                onValueChange={(val) => handlePlayerSelect(idx, 'team2_player2_id', val)}
                                disabled={clashAlreadyWon && !isMatchComplete}
                              >
                                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-transparent">
                                  <SelectValue placeholder="Player 2" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-white/10">
                                  <SelectItem value="none">-- Select --</SelectItem>
                                  {team2Players.map(p => (
                                    <SelectItem key={p.id} value={p.id} disabled={getPlayerGameCount(p.id, idx) >= 2 || !isPairValid(p.id, score.team2_player1_id, idx)}>
                                      {p.name} ({getPlayerGameCount(p.id, idx)}/2)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* 3 Sets Score Entry */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground text-center">Best of 3 Sets (11 points, deuce to 15)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map(setNum => {
                              const t1Field = `team1_set${setNum}`;
                              const t2Field = `team2_set${setNum}`;
                              const setWinner = getSetWinner(score[t1Field], score[t2Field]);
                              const needsThirdSet = setNum === 3 && getSetsWon(score).team1Sets === 1 && getSetsWon(score).team2Sets === 1;
                              const showSet = setNum <= 2 || needsThirdSet || (score.team1_set3 > 0 || score.team2_set3 > 0);
                              
                              if (!showSet && setNum === 3) {
                                return (
                                  <div key={setNum} className="text-center p-2 bg-secondary/20 rounded opacity-50">
                                    <p className="text-xs text-muted-foreground mb-1">Set {setNum}</p>
                                    <p className="text-xs">Not needed</p>
                                  </div>
                                );
                              }
                              
                              return (
                                <div key={setNum} className={`text-center p-2 rounded ${setWinner ? 'bg-green-950/30' : 'bg-secondary/30'}`}>
                                  <p className="text-xs text-muted-foreground mb-1">Set {setNum}</p>
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="15"
                                      value={score[t1Field] || ''}
                                      onChange={(e) => updateScoreNumber(idx, t1Field, e.target.value)}
                                      disabled={(clashAlreadyWon && !isMatchComplete) || !allPlayersSelected}
                                      className={`w-12 h-8 text-center text-sm font-mono font-bold p-1 ${
                                        setWinner === 'team1' ? 'bg-green-500/20 text-green-400' : 'bg-secondary/50'
                                      }`}
                                    />
                                    <span className="text-xs">-</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="15"
                                      value={score[t2Field] || ''}
                                      onChange={(e) => updateScoreNumber(idx, t2Field, e.target.value)}
                                      disabled={(clashAlreadyWon && !isMatchComplete) || !allPlayersSelected}
                                      className={`w-12 h-8 text-center text-sm font-mono font-bold p-1 ${
                                        setWinner === 'team2' ? 'bg-green-500/20 text-green-400' : 'bg-secondary/50'
                                      }`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {!allPlayersSelected && !isMatchComplete && !clashAlreadyWon && (
                          <p className="text-xs text-amber-400 mt-2 text-center">⚠️ Select all 4 players to enable scoring</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button 
                  type="submit" 
                  className="w-full font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600"
                >
                  {isClashFinished(scoreForm.scores) ? 'Save & Complete' : 'Save Scores'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
