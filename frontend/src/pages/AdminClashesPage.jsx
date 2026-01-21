import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, Bell, Lock, Clock } from 'lucide-react';
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
    stage: 'knockout',
    scheduled_time: ''
  });
  const [scoreForm, setScoreForm] = useState({ scores: [], status: 'upcoming', start_time: '', end_time: '' });
  const [photoFile, setPhotoFile] = useState(null);
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
      setClashForm({ clash_name: '', team1_id: '', team2_id: '', stage: 'knockout', scheduled_time: '' });
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
  
  const isPlayerEligible = (playerId, currentMatchIdx, teamId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    
    if (player.matches_played >= 2) return false;
    
    let usedInCurrentClash = 0;
    scoreForm.scores.forEach((score, idx) => {
      if (idx !== currentMatchIdx && score.completed) {
        if (score.team1_player1_id === playerId || score.team1_player2_id === playerId ||
            score.team2_player1_id === playerId || score.team2_player2_id === playerId) {
          usedInCurrentClash++;
        }
      }
    });
    
    return usedInCurrentClash === 0;
  };
  
  const isPairValid = (player1Id, player2Id) => {
    if (!player1Id || !player2Id) return true;
    
    const player1 = players.find(p => p.id === player1Id);
    const player2 = players.find(p => p.id === player2Id);
    
    if (!player1 || !player2) return true;
    
    const pairKey = [player1Id, player2Id].sort().join('-');
    
    return !player1.pairs_history.includes(pairKey) && !player2.pairs_history.includes(pairKey);
  };
  
  const handleUpdateScore = async (e) => {
    e.preventDefault();
    
    if (editingClash.is_locked) {
      toast.error('This clash is locked and cannot be edited');
      return;
    }
    
    for (let i = 0; i < scoreForm.scores.length; i++) {
      const score = scoreForm.scores[i];
      if (score.completed) {
        if (!score.team1_player1_id || !score.team1_player2_id || !score.team2_player1_id || !score.team2_player2_id) {
          toast.error(`Match ${i + 1}: All players must be selected`);
          return;
        }
        
        if (!isPairValid(score.team1_player1_id, score.team1_player2_id)) {
          toast.error(`Match ${i + 1}: Team 1 pair has played together before`);
          return;
        }
        
        if (!isPairValid(score.team2_player1_id, score.team2_player2_id)) {
          toast.error(`Match ${i + 1}: Team 2 pair has played together before`);
          return;
        }
      }
    }
    
    try {
      const response = await axios.put(`${API}/clashes/${editingClash.id}/score`, {
        clash_id: editingClash.id,
        scores: scoreForm.scores,
        team1_games_won: 0,
        team2_games_won: 0,
        winner_id: null,
        status: scoreForm.status,
        start_time: scoreForm.start_time || null,
        end_time: scoreForm.end_time || null
      });
      
      if (response.data.is_locked) {
        toast.success('Clash completed and locked!');
      } else {
        toast.success('Scores updated successfully!');
      }
      
      setShowScoreDialog(false);
      setEditingClash(null);
      fetchData();
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error(error.response?.data?.detail || 'Failed to update score');
    }
  };
  
  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile || !editingClash) return;
    
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    try {
      await axios.put(`${API}/clashes/${editingClash.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo uploaded successfully!');
      setPhotoFile(null);
      fetchData();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
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
  
  const getTeamName = (teamId) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown';
  };
  
  const getTeamCode = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? `${team.pool}${team.pool_number}` : '';
  };
  
  const updateScoreField = (matchIdx, field, value) => {
    const updated = [...scoreForm.scores];
    updated[matchIdx][field] = value;
    setScoreForm({ ...scoreForm, scores: updated });
  };
  
  const updateScoreNumber = (matchIdx, field, value) => {
    const updated = [...scoreForm.scores];
    updated[matchIdx][field] = parseInt(value) || 0;
    setScoreForm({ ...scoreForm, scores: updated });
  };
  
  const toggleMatchCompleted = (matchIdx) => {
    const updated = [...scoreForm.scores];
    updated[matchIdx].completed = !updated[matchIdx].completed;
    setScoreForm({ ...scoreForm, scores: updated });
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
      border: 'border-yellow-500/50',
      bg: 'bg-card/50',
      text: 'text-yellow-500',
      badge: 'bg-yellow-500',
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
  
  const getMaxScore = (stage) => {
    return isKnockout(stage) ? 11 : 21;
  };
  
  const getDeuceMax = (stage) => {
    return isKnockout(stage) ? 15 : 25;
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
                Manage <span className="text-yellow-500">Clashes</span>
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
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12"
                        data-testid="notif-title-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Message</label>
                      <Textarea
                        value={notifForm.message}
                        onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                        required
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0"
                        data-testid="notif-message-input"
                      />
                    </div>
                    <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400" data-testid="notif-submit-btn">
                      Send Notification
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showClashDialog} onOpenChange={setShowClashDialog}>
                <DialogTrigger asChild>
                  <Button className="font-bold uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400" style={{ boxShadow: '0 0 20px -5px rgba(234, 179, 8, 0.5)' }} data-testid="add-clash-btn">
                    <Plus className="mr-2 h-4 w-4" /> Add Clash
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                      Create Knockout Clash
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClash} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Clash Name</label>
                      <Input
                        value={clashForm.clash_name}
                        onChange={(e) => setClashForm({ ...clashForm, clash_name: e.target.value })}
                        placeholder="e.g., Semi Final 1"
                        required
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12"
                        data-testid="clash-name-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Team 1</label>
                        <Select value={clashForm.team1_id} onValueChange={(val) => setClashForm({ ...clashForm, team1_id: val })}>
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12" data-testid="team1-select">
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
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12" data-testid="team2-select">
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
                        <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12" data-testid="stage-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-white/10">
                          <SelectItem value="knockout">Knockout</SelectItem>
                          <SelectItem value="semifinal">Semi Final</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Scheduled Time (Optional)</label>
                      <Input
                        type="datetime-local"
                        value={clashForm.scheduled_time}
                        onChange={(e) => setClashForm({ ...clashForm, scheduled_time: e.target.value })}
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12"
                        data-testid="scheduled-time-input"
                      />
                    </div>
                    <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400" data-testid="clash-submit-btn">
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
                          {isKnockout(clash.stage) && (
                            <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs font-bold text-red-400 uppercase">
                              Royal
                            </span>
                          )}
                          {clash.is_locked && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {clash.stage.toUpperCase()} - {clash.status}
                          {clash.duration_minutes && ` • ${formatDuration(clash.duration_minutes)}`}
                        </p>
                        {clash.scheduled_time && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {new Date(clash.scheduled_time).toLocaleString()}
                          </p>
                        )}
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingClash(clash)}
                              className="border-2 font-bold uppercase text-xs"
                              data-testid={`upload-photo-${clash.id}`}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                                Upload Clash Photo
                              </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handlePhotoUpload} className="space-y-4">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPhotoFile(e.target.files[0])}
                                required
                                className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12"
                                data-testid="photo-input"
                              />
                              <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400" data-testid="photo-submit-btn">
                                Upload Photo
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
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
        </div>
        
        <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
          <DialogContent className={`border sm:rounded-2xl max-w-6xl max-h-[90vh] overflow-y-auto ${
            editingClash && isKnockout(editingClash.stage)
              ? 'bg-gradient-to-br from-red-950/50 to-card border-red-500/30'
              : 'bg-card border-white/10'
          }`}>
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                Score Entry: {editingClash?.clash_name}
                {editingClash && isKnockout(editingClash.stage) && (
                  <span className="ml-3 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-400">ROYAL</span>
                )}
              </DialogTitle>
              {editingClash && (
                <p className="text-sm text-muted-foreground">
                  {getTeamCode(editingClash.team1_id)} {getTeamName(editingClash.team1_id)} vs {getTeamCode(editingClash.team2_id)} {getTeamName(editingClash.team2_id)}
                </p>
              )}
            </DialogHeader>
            {editingClash && (
              <form onSubmit={handleUpdateScore} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Match Status</label>
                    <Select value={scoreForm.status} onValueChange={(val) => setScoreForm({ ...scoreForm, status: val })}>
                      <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12" data-testid="status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-white/10">
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Start Time</label>
                    <Input
                      type="datetime-local"
                      value={scoreForm.start_time}
                      onChange={(e) => setScoreForm({ ...scoreForm, start_time: e.target.value })}
                      className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12"
                      data-testid="start-time-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">End Time</label>
                    <Input
                      type="datetime-local"
                      value={scoreForm.end_time}
                      onChange={(e) => setScoreForm({ ...scoreForm, end_time: e.target.value })}
                      className="rounded-lg bg-secondary/50 border-transparent focus:border-yellow-500 focus:ring-0 h-12"
                      data-testid="end-time-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {scoreForm.scores.map((score, idx) => (
                    <div key={idx} className={`border rounded-lg p-4 space-y-4 ${
                      editingClash && isKnockout(editingClash.stage)
                        ? 'border-red-500/30 bg-red-950/20'
                        : 'border-yellow-500/30 bg-yellow-500/5'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-mono font-bold text-sm px-3 py-1 rounded ${
                          editingClash && isKnockout(editingClash.stage)
                            ? 'bg-red-500 text-black'
                            : 'bg-yellow-500 text-black'
                        }`}>
                          Match {idx + 1}
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={score.completed}
                            onChange={() => toggleMatchCompleted(idx)}
                            className="rounded"
                          />
                          <span className="text-sm font-bold text-muted-foreground">Completed</span>
                        </label>
                      </div>
                      
                      {score.completed && (
                        <>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-muted-foreground uppercase">{getTeamName(editingClash.team1_id)}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <Select 
                                  value={score.team1_player1_id || ''} 
                                  onValueChange={(val) => updateScoreField(idx, 'team1_player1_id', val)}
                                >
                                  <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent h-10 text-xs">
                                    <SelectValue placeholder="Player 1" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border border-white/10">
                                    {getTeamPlayers(editingClash.team1_id).map(player => (
                                      <SelectItem 
                                        key={player.id} 
                                        value={player.id}
                                        disabled={!isPlayerEligible(player.id, idx, editingClash.team1_id)}
                                      >
                                        {player.name} {!isPlayerEligible(player.id, idx, editingClash.team1_id) && '(ineligible)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select 
                                  value={score.team1_player2_id || ''} 
                                  onValueChange={(val) => updateScoreField(idx, 'team1_player2_id', val)}
                                >
                                  <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent h-10 text-xs">
                                    <SelectValue placeholder="Player 2" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border border-white/10">
                                    {getTeamPlayers(editingClash.team1_id).map(player => (
                                      <SelectItem 
                                        key={player.id} 
                                        value={player.id}
                                        disabled={!isPlayerEligible(player.id, idx, editingClash.team1_id) || player.id === score.team1_player1_id}
                                      >
                                        {player.name} {(!isPlayerEligible(player.id, idx, editingClash.team1_id) || player.id === score.team1_player1_id) && '(ineligible)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {score.team1_player1_id && score.team1_player2_id && !isPairValid(score.team1_player1_id, score.team1_player2_id) && (
                                <p className="text-xs text-destructive">⚠️ This pair has played together before</p>
                              )}
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={getDeuceMax(editingClash.stage)}
                                  value={score.team1_set1}
                                  onChange={(e) => updateScoreNumber(idx, 'team1_set1', e.target.value)}
                                  placeholder={`Set 1 (max ${getMaxScore(editingClash.stage)})`}
                                  className="rounded-lg bg-secondary/50 border-transparent h-10 text-center"
                                />
                                {isKnockout(editingClash.stage) && (
                                  <>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={getDeuceMax(editingClash.stage)}
                                      value={score.team1_set2}
                                      onChange={(e) => updateScoreNumber(idx, 'team1_set2', e.target.value)}
                                      placeholder="Set 2"
                                      className="rounded-lg bg-secondary/50 border-transparent h-10 text-center"
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      max={getDeuceMax(editingClash.stage)}
                                      value={score.team1_set3}
                                      onChange={(e) => updateScoreNumber(idx, 'team1_set3', e.target.value)}
                                      placeholder="Set 3"
                                      className="rounded-lg bg-secondary/50 border-transparent h-10 text-center"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-muted-foreground uppercase">{getTeamName(editingClash.team2_id)}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <Select 
                                  value={score.team2_player1_id || ''} 
                                  onValueChange={(val) => updateScoreField(idx, 'team2_player1_id', val)}
                                >
                                  <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent h-10 text-xs">
                                    <SelectValue placeholder="Player 1" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border border-white/10">
                                    {getTeamPlayers(editingClash.team2_id).map(player => (
                                      <SelectItem 
                                        key={player.id} 
                                        value={player.id}
                                        disabled={!isPlayerEligible(player.id, idx, editingClash.team2_id)}
                                      >
                                        {player.name} {!isPlayerEligible(player.id, idx, editingClash.team2_id) && '(ineligible)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select 
                                  value={score.team2_player2_id || ''} 
                                  onValueChange={(val) => updateScoreField(idx, 'team2_player2_id', val)}
                                >
                                  <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent h-10 text-xs">
                                    <SelectValue placeholder="Player 2" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border border-white/10">
                                    {getTeamPlayers(editingClash.team2_id).map(player => (
                                      <SelectItem 
                                        key={player.id} 
                                        value={player.id}
                                        disabled={!isPlayerEligible(player.id, idx, editingClash.team2_id) || player.id === score.team2_player1_id}
                                      >
                                        {player.name} {(!isPlayerEligible(player.id, idx, editingClash.team2_id) || player.id === score.team2_player1_id) && '(ineligible)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {score.team2_player1_id && score.team2_player2_id && !isPairValid(score.team2_player1_id, score.team2_player2_id) && (
                                <p className="text-xs text-destructive">⚠️ This pair has played together before</p>
                              )}
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={getDeuceMax(editingClash.stage)}
                                  value={score.team2_set1}
                                  onChange={(e) => updateScoreNumber(idx, 'team2_set1', e.target.value)}
                                  placeholder={`Set 1 (max ${getMaxScore(editingClash.stage)})`}
                                  className="rounded-lg bg-secondary/50 border-transparent h-10 text-center"
                                />
                                {isKnockout(editingClash.stage) && (
                                  <>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={getDeuceMax(editingClash.stage)}
                                      value={score.team2_set2}
                                      onChange={(e) => updateScoreNumber(idx, 'team2_set2', e.target.value)}
                                      placeholder="Set 2"
                                      className="rounded-lg bg-secondary/50 border-transparent h-10 text-center"
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      max={getDeuceMax(editingClash.stage)}
                                      value={score.team2_set3}
                                      onChange={(e) => updateScoreNumber(idx, 'team2_set3', e.target.value)}
                                      placeholder="Set 3"
                                      className="rounded-lg bg-secondary/50 border-transparent h-10 text-center"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {isKnockout(editingClash.stage) 
                              ? `Best of 3 sets to 11 (deuce to 15)`
                              : `1 game to 21 (deuce to 25)`
                            }
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm font-bold text-yellow-500 mb-2">⚡ Auto-Stop Rules:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• When a team reaches 3 match wins, clash ends automatically</li>
                    <li>• Remaining matches are disabled</li>
                    <li>• Clash is locked from further edits</li>
                  </ul>
                </div>
                
                <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400" data-testid="score-submit-btn">
                  Update Scores
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
