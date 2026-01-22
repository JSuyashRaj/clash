import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Bell, Lock, Clock, Trophy, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminClashesPage() {
  const navigate = useNavigate();
  const [clashes, setClashes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showClashDialog, setShowClashDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [editingClash, setEditingClash] = useState(null);
  const [clashForm, setClashForm] = useState({
    clash_name: '',
    team1_id: '',
    team2_id: '',
    stage: 'league',
    scheduled_time: ''
  });
  const [scoreForm, setScoreForm] = useState({ scores: [], status: 'upcoming', start_time: '', end_time: '' });
  const [notifForm, setNotifForm] = useState({ title: '', message: '', clash_id: '' });
  
  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);
  
  const fetchData = async () => {
    try {
      const [clashesRes, teamsRes, playersRes] = await Promise.all([
        axios.get(`${API}/clashes`),
        axios.get(`${API}/teams`),
        axios.get(`${API}/players`)
      ]);
      setClashes(clashesRes.data);
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  };
  
  const handleCreateClash = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/clashes`, clashForm);
      toast.success('Clash created successfully!');
      setShowClashDialog(false);
      setClashForm({ clash_name: '', team1_id: '', team2_id: '', stage: 'league', scheduled_time: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating clash:', error);
      toast.error('Failed to create clash');
    }
  };
  
  const handleDeleteClash = async (clashId) => {
    if (!window.confirm('Are you sure you want to delete this clash?')) return;
    
    try {
      await axios.delete(`${API}/clashes/${clashId}`);
      toast.success('Clash deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting clash:', error);
      toast.error('Failed to delete clash');
    }
  };
  
  const openScoreDialog = (clash) => {
    setEditingClash(clash);
    setScoreForm({
      scores: clash.scores.map(s => ({ ...s })),
      status: clash.status,
      start_time: clash.start_time || '',
      end_time: clash.end_time || ''
    });
    setShowScoreDialog(true);
  };
  
  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId);
  };
  
  const getTeamName = (teamId) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown';
  };
  
  const getTeamCode = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? `${team.pool}${team.pool_number}` : '';
  };
  
  // Check if a game is won (21 points, or up to 25 in deuce)
  const getGameWinner = (team1Score, team2Score) => {
    const score1 = parseInt(team1Score) || 0;
    const score2 = parseInt(team2Score) || 0;
    
    // Regular win at 21
    if (score1 >= 21 && score1 - score2 >= 2) return 'team1';
    if (score2 >= 21 && score2 - score1 >= 2) return 'team2';
    
    // Deuce win at 25 (cap)
    if (score1 === 25 && score1 > score2) return 'team1';
    if (score2 === 25 && score2 > score1) return 'team2';
    
    return null;
  };
  
  // Calculate clash score from all games
  const calculateClashScore = (scores) => {
    let team1Wins = 0;
    let team2Wins = 0;
    
    scores.forEach(score => {
      const winner = getGameWinner(score.team1_set1, score.team2_set1);
      if (winner === 'team1') team1Wins++;
      if (winner === 'team2') team2Wins++;
    });
    
    return { team1Wins, team2Wins };
  };
  
  // Check if clash is finished (one team has 3 wins)
  const isClashFinished = (scores) => {
    const { team1Wins, team2Wins } = calculateClashScore(scores);
    return team1Wins >= 3 || team2Wins >= 3;
  };
  
  const updateScoreNumber = (matchIdx, field, value) => {
    const updated = [...scoreForm.scores];
    const numValue = parseInt(value) || 0;
    // Cap at 25 for deuce
    updated[matchIdx][field] = Math.min(Math.max(numValue, 0), 25);
    setScoreForm({ ...scoreForm, scores: updated });
  };
  
  const updateScoreField = (matchIdx, field, value) => {
    const updated = [...scoreForm.scores];
    updated[matchIdx][field] = value;
    setScoreForm({ ...scoreForm, scores: updated });
  };
  
  const handleUpdateScore = async (e) => {
    e.preventDefault();
    
    if (editingClash.is_locked) {
      toast.error('This clash is locked and cannot be edited');
      return;
    }
    
    const { team1Wins, team2Wins } = calculateClashScore(scoreForm.scores);
    const clashFinished = team1Wins >= 3 || team2Wins >= 3;
    
    // Mark games as completed if they have a winner
    const updatedScores = scoreForm.scores.map(score => {
      const winner = getGameWinner(score.team1_set1, score.team2_set1);
      return {
        ...score,
        completed: winner !== null,
        winner: winner === 'team1' ? editingClash.team1_id : winner === 'team2' ? editingClash.team2_id : null
      };
    });
    
    try {
      const response = await axios.put(`${API}/clashes/${editingClash.id}/score`, {
        clash_id: editingClash.id,
        scores: updatedScores,
        team1_games_won: team1Wins,
        team2_games_won: team2Wins,
        winner_id: clashFinished ? (team1Wins >= 3 ? editingClash.team1_id : editingClash.team2_id) : null,
        status: clashFinished ? 'completed' : 'live',
        start_time: scoreForm.start_time || null,
        end_time: scoreForm.end_time || null
      });
      
      if (response.data.is_locked) {
        toast.success(`Clash completed! ${team1Wins >= 3 ? getTeamName(editingClash.team1_id) : getTeamName(editingClash.team2_id)} wins and gets 2 points!`);
      } else {
        toast.success('Scores updated!');
      }
      
      setShowScoreDialog(false);
      setEditingClash(null);
      fetchData();
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error(error.response?.data?.detail || 'Failed to update score');
    }
  };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/notifications`, notifForm);
      toast.success('Notification sent successfully!');
      setShowNotifDialog(false);
      setNotifForm({ title: '', message: '', clash_id: '' });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };
  
  const isKnockout = (stage) => {
    return ['knockout', 'semifinal', 'final'].includes(stage);
  };
  
  const getStageTheme = (stage) => {
    if (isKnockout(stage)) {
      return {
        border: 'border-red-500/50',
        bg: 'bg-gradient-to-br from-red-950/30 to-card/50',
        text: 'text-red-500',
        badge: 'bg-red-500',
        glow: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]'
      };
    }
    return {
      border: 'border-primary/50',
      bg: 'bg-card/50',
      text: 'text-primary',
      badge: 'bg-primary',
      glow: 'shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)]'
    };
  };
  
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };
  
  // Get current clash score for display
  const getCurrentClashScore = () => {
    if (!scoreForm.scores) return { team1Wins: 0, team2Wins: 0 };
    return calculateClashScore(scoreForm.scores);
  };
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
                Manage <span className="text-primary">Clashes</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                Score entry & match management
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showNotifDialog} onOpenChange={setShowNotifDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-bold uppercase tracking-wider border-2"
                    data-testid="send-notif-btn"
                  >
                    <Bell className="mr-2 h-4 w-4" /> Notify
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                      Send Notification
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Title</label>
                      <Input
                        value={notifForm.title}
                        onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                        required
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                        data-testid="notif-title-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Message</label>
                      <Textarea
                        value={notifForm.message}
                        onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                        required
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0"
                        data-testid="notif-message-input"
                      />
                    </div>
                    <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400" data-testid="notif-submit-btn">
                      Send Notification
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showClashDialog} onOpenChange={setShowClashDialog}>
                <DialogTrigger asChild>
                  <Button className="font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400" style={{ boxShadow: '0 0 20px -5px rgba(204, 255, 0, 0.5)' }} data-testid="add-clash-btn">
                    <Plus className="mr-2 h-4 w-4" /> Add Clash
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                      Create New Clash
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClash} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Clash Name</label>
                      <Input
                        value={clashForm.clash_name}
                        onChange={(e) => setClashForm({ ...clashForm, clash_name: e.target.value })}
                        placeholder="e.g., X1 vs X2"
                        required
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                        data-testid="clash-name-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Team 1</label>
                        <Select value={clashForm.team1_id} onValueChange={(val) => setClashForm({ ...clashForm, team1_id: val })}>
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="team1-select">
                            <SelectValue placeholder="Select Team 1" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-white/10">
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.pool}{team.pool_number} - {team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Team 2</label>
                        <Select value={clashForm.team2_id} onValueChange={(val) => setClashForm({ ...clashForm, team2_id: val })}>
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="team2-select">
                            <SelectValue placeholder="Select Team 2" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-white/10">
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.pool}{team.pool_number} - {team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Stage</label>
                      <Select value={clashForm.stage} onValueChange={(val) => setClashForm({ ...clashForm, stage: val })}>
                        <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="stage-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-white/10">
                          <SelectItem value="league">League Stage</SelectItem>
                          <SelectItem value="semifinal">Semi Final</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400" data-testid="clash-submit-btn">
                      Create Clash
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>
        
        <div className="space-y-4">
          {clashes.map((clash, idx) => {
            const theme = getStageTheme(clash.stage);
            return (
              <motion.div
                key={clash.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                data-testid={`admin-clash-${clash.id}`}
              >
                <Card className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${theme.border} ${theme.bg}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading font-bold text-xl tracking-tight uppercase text-foreground">
                            {clash.clash_name}
                          </h3>
                          {clash.is_locked && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs font-bold text-green-400 uppercase">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {clash.stage.toUpperCase()} - {clash.status}
                          {clash.duration_minutes && ` • ${formatDuration(clash.duration_minutes)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openScoreDialog(clash)}
                          disabled={clash.is_locked}
                          className="border-2 font-bold uppercase text-xs"
                          data-testid={`update-score-${clash.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" /> {clash.is_locked ? 'Locked' : 'Score'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClash(clash.id)}
                          className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                          data-testid={`delete-clash-${clash.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground mb-1">{getTeamCode(clash.team1_id)}</p>
                        <p className="font-bold text-lg">{getTeamName(clash.team1_id)}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-black text-3xl ${theme.text}`}>{clash.team1_games_won}</span>
                          <span className="font-mono text-sm text-muted-foreground">-</span>
                          <span className={`font-mono font-black text-3xl ${theme.text}`}>{clash.team2_games_won}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Best of 5</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">{getTeamCode(clash.team2_id)}</p>
                        <p className="font-bold text-lg">{getTeamName(clash.team2_id)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {clashes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No clashes yet. Click "Add Clash" to create one.</p>
            </div>
          )}
        </div>
        
        {/* Score Entry Dialog */}
        <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
          <DialogContent className={`border sm:rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto ${
            editingClash && isKnockout(editingClash.stage)
              ? 'bg-gradient-to-br from-red-950/50 to-card border-red-500/30'
              : 'bg-card border-white/10'
          }`}>
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                Score Entry: {editingClash?.clash_name}
              </DialogTitle>
              {editingClash && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {getTeamCode(editingClash.team1_id)} {getTeamName(editingClash.team1_id)} vs {getTeamCode(editingClash.team2_id)} {getTeamName(editingClash.team2_id)}
                  </p>
                </div>
              )}
            </DialogHeader>
            
            {editingClash && (
              <form onSubmit={handleUpdateScore} className="space-y-6">
                {/* Live Clash Score Display */}
                <div className={`rounded-xl p-4 ${
                  isKnockout(editingClash.stage) ? 'bg-red-500/10 border border-red-500/30' : 'bg-primary/10 border border-primary/30'
                }`}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 text-center">Clash Score</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-bold text-muted-foreground">{getTeamName(editingClash.team1_id)}</p>
                      <p className={`font-mono font-black text-4xl ${isKnockout(editingClash.stage) ? 'text-red-500' : 'text-primary'}`}>
                        {getCurrentClashScore().team1Wins}
                      </p>
                    </div>
                    <span className="text-2xl text-muted-foreground">-</span>
                    <div className="text-center">
                      <p className="text-sm font-bold text-muted-foreground">{getTeamName(editingClash.team2_id)}</p>
                      <p className={`font-mono font-black text-4xl ${isKnockout(editingClash.stage) ? 'text-red-500' : 'text-primary'}`}>
                        {getCurrentClashScore().team2Wins}
                      </p>
                    </div>
                  </div>
                  {isClashFinished(scoreForm.scores) && (
                    <p className="text-center mt-2 text-green-400 font-bold text-sm flex items-center justify-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {getCurrentClashScore().team1Wins >= 3 ? getTeamName(editingClash.team1_id) : getTeamName(editingClash.team2_id)} wins the clash!
                    </p>
                  )}
                </div>
                
                {/* All 5 Games */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Games (First to 21, deuce to 25)</p>
                  
                  {scoreForm.scores.map((score, idx) => {
                    const gameWinner = getGameWinner(score.team1_set1, score.team2_set1);
                    const isGameComplete = gameWinner !== null;
                    const { team1Wins, team2Wins } = calculateClashScore(scoreForm.scores.slice(0, idx));
                    const clashAlreadyWon = team1Wins >= 3 || team2Wins >= 3;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-lg p-4 ${
                          isGameComplete 
                            ? 'border-green-500/30 bg-green-950/20' 
                            : clashAlreadyWon
                              ? 'border-muted/30 bg-muted/5 opacity-50'
                              : isKnockout(editingClash.stage)
                                ? 'border-red-500/30 bg-red-950/20'
                                : 'border-primary/30 bg-primary/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-mono font-bold text-sm px-3 py-1 rounded ${
                            isGameComplete
                              ? 'bg-green-500 text-black'
                              : isKnockout(editingClash.stage)
                                ? 'bg-red-500 text-black'
                                : 'bg-primary text-black'
                          }`}>
                            Game {idx + 1}
                          </span>
                          {isGameComplete && (
                            <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {gameWinner === 'team1' ? getTeamName(editingClash.team1_id) : getTeamName(editingClash.team2_id)} wins
                            </span>
                          )}
                          {clashAlreadyWon && !isGameComplete && (
                            <span className="text-xs text-muted-foreground">Clash already decided</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase text-center">
                              {getTeamName(editingClash.team1_id)}
                            </p>
                            <Input
                              type="number"
                              min="0"
                              max="25"
                              value={score.team1_set1 || ''}
                              onChange={(e) => updateScoreNumber(idx, 'team1_set1', e.target.value)}
                              disabled={clashAlreadyWon && !isGameComplete}
                              className={`rounded-lg border-transparent h-14 text-center text-2xl font-mono font-bold ${
                                gameWinner === 'team1' ? 'bg-green-500/20 text-green-400' : 'bg-secondary/50'
                              }`}
                              data-testid={`game-${idx + 1}-team1-score`}
                            />
                          </div>
                          
                          <div className="text-center">
                            <span className="text-2xl text-muted-foreground font-bold">vs</span>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase text-center">
                              {getTeamName(editingClash.team2_id)}
                            </p>
                            <Input
                              type="number"
                              min="0"
                              max="25"
                              value={score.team2_set1 || ''}
                              onChange={(e) => updateScoreNumber(idx, 'team2_set1', e.target.value)}
                              disabled={clashAlreadyWon && !isGameComplete}
                              className={`rounded-lg border-transparent h-14 text-center text-2xl font-mono font-bold ${
                                gameWinner === 'team2' ? 'bg-green-500/20 text-green-400' : 'bg-secondary/50'
                              }`}
                              data-testid={`game-${idx + 1}-team2-score`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground">
                  <p><strong>Scoring Rules:</strong> First to 21 wins the game. In case of 20-20 (deuce), play continues until one team leads by 2 points, max 25.</p>
                  <p className="mt-1"><strong>Clash Win:</strong> First team to win 3 games wins the clash and gets 2 leaderboard points.</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400" 
                  data-testid="score-submit-btn"
                >
                  {isClashFinished(scoreForm.scores) ? 'Save & Complete Clash' : 'Save Scores'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
