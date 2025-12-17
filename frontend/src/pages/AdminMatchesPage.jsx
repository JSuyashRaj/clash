import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, Bell } from 'lucide-react';
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

export default function AdminMatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchForm, setMatchForm] = useState({
    clash_name: '',
    team1_id: '',
    team2_id: '',
    stage: 'league',
    scheduled_time: ''
  });
  const [scoreForm, setScoreForm] = useState({ scores: [], status: 'live' });
  const [photoFile, setPhotoFile] = useState(null);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', match_id: '' });
  
  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);
  
  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/teams`)
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  };
  
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/matches`, matchForm);
      toast.success('Match created successfully!');
      setShowMatchDialog(false);
      setMatchForm({ clash_name: '', team1_id: '', team2_id: '', stage: 'league', scheduled_time: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error('Failed to create match');
    }
  };
  
  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;
    
    try {
      await axios.delete(`${API}/matches/${matchId}`);
      toast.success('Match deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match');
    }
  };
  
  const openScoreDialog = (match) => {
    setEditingMatch(match);
    setScoreForm({
      scores: match.scores.map(s => ({ ...s })),
      status: match.status
    });
    setShowScoreDialog(true);
  };
  
  const handleUpdateScore = async (e) => {
    e.preventDefault();
    
    let team1Total = 0;
    let team2Total = 0;
    
    scoreForm.scores.forEach(score => {
      const team1Sets = [score.team1_set1, score.team1_set2, score.team1_set3].filter(s => s > 0);
      const team2Sets = [score.team2_set1, score.team2_set2, score.team2_set3].filter(s => s > 0);
      
      let team1Wins = 0;
      let team2Wins = 0;
      
      for (let i = 0; i < Math.max(team1Sets.length, team2Sets.length); i++) {
        if (team1Sets[i] > team2Sets[i]) team1Wins++;
        else if (team2Sets[i] > team1Sets[i]) team2Wins++;
      }
      
      if (team1Wins > team2Wins) {
        team1Total += score.points_awarded;
        score.winner = 'team1';
      } else if (team2Wins > team1Wins) {
        team2Total += score.points_awarded;
        score.winner = 'team2';
      }
    });
    
    const winnerId = team1Total > team2Total ? editingMatch.team1_id : team2Total > team1Total ? editingMatch.team2_id : null;
    
    try {
      await axios.put(`${API}/matches/${editingMatch.id}/score`, {
        match_id: editingMatch.id,
        scores: scoreForm.scores,
        team1_total_points: team1Total,
        team2_total_points: team2Total,
        winner_id: winnerId,
        status: scoreForm.status
      });
      toast.success('Match score updated successfully!');
      setShowScoreDialog(false);
      setEditingMatch(null);
      fetchData();
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    }
  };
  
  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile || !editingMatch) return;
    
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    try {
      await axios.put(`${API}/matches/${editingMatch.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo uploaded successfully!');
      setShowPhotoDialog(false);
      setEditingMatch(null);
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
      setNotifForm({ title: '', message: '', match_id: '' });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };
  
  const getTeamName = (teamId) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown';
  };
  
  const updateScoreField = (matchIdx, field, value) => {
    const updated = [...scoreForm.scores];
    updated[matchIdx][field] = parseInt(value) || 0;
    setScoreForm({ ...scoreForm, scores: updated });
  };
  
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter uppercase text-foreground mb-2">
                Manage <span className="text-primary">Matches</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                Create and update match scores
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
                    <Button type="submit" className="w-full font-bold uppercase tracking-wider glow-primary" data-testid="notif-submit-btn">
                      Send Notification
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
                <DialogTrigger asChild>
                  <Button className="font-bold uppercase tracking-wider glow-primary" data-testid="add-match-btn">
                    <Plus className="mr-2 h-4 w-4" /> Add Match
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                      Create New Match
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateMatch} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Clash Name</label>
                      <Input
                        value={matchForm.clash_name}
                        onChange={(e) => setMatchForm({ ...matchForm, clash_name: e.target.value })}
                        placeholder="e.g., Block A vs Block B"
                        required
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                        data-testid="match-name-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Team 1</label>
                        <Select value={matchForm.team1_id} onValueChange={(val) => setMatchForm({ ...matchForm, team1_id: val })}>
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="team1-select">
                            <SelectValue placeholder="Select Team 1" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-white/10">
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Team 2</label>
                        <Select value={matchForm.team2_id} onValueChange={(val) => setMatchForm({ ...matchForm, team2_id: val })}>
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="team2-select">
                            <SelectValue placeholder="Select Team 2" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-white/10">
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Stage</label>
                      <Select value={matchForm.stage} onValueChange={(val) => setMatchForm({ ...matchForm, stage: val })}>
                        <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="stage-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-white/10">
                          <SelectItem value="league">League Stage</SelectItem>
                          <SelectItem value="knockout">Knockout Stage</SelectItem>
                          <SelectItem value="semifinal">Semifinal</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Scheduled Time (Optional)</label>
                      <Input
                        type="datetime-local"
                        value={matchForm.scheduled_time}
                        onChange={(e) => setMatchForm({ ...matchForm, scheduled_time: e.target.value })}
                        className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                        data-testid="scheduled-time-input"
                      />
                    </div>
                    <Button type="submit" className="w-full font-bold uppercase tracking-wider glow-primary" data-testid="match-submit-btn">
                      Create Match
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>
        
        <div className="space-y-4">
          {matches.map((match, idx) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              data-testid={`admin-match-${match.id}`}
            >
              <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-xl tracking-tight uppercase text-foreground">
                        {match.clash_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{match.stage} - {match.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openScoreDialog(match)}
                        className="border-2 font-bold uppercase text-xs"
                        data-testid={`update-score-${match.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Score
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMatch(match)}
                            className="border-2 font-bold uppercase text-xs"
                            data-testid={`upload-photo-${match.id}`}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                              Upload Match Photo
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handlePhotoUpload} className="space-y-4">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setPhotoFile(e.target.files[0])}
                              required
                              className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                              data-testid="photo-input"
                            />
                            <Button type="submit" className="w-full font-bold uppercase tracking-wider glow-primary" data-testid="photo-submit-btn">
                              Upload Photo
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMatch(match.id)}
                        className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                        data-testid={`delete-match-${match.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="text-left">
                      <p className="font-bold text-lg">{getTeamName(match.team1_id)}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-3xl text-primary">{match.team1_total_points}</span>
                        <span className="font-mono text-sm text-muted-foreground">-</span>
                        <span className="font-mono font-black text-3xl text-primary">{match.team2_total_points}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{getTeamName(match.team2_id)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
          <DialogContent className="bg-card border border-white/10 sm:rounded-2xl max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                Update Match Score
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateScore} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Match Status</label>
                <Select value={scoreForm.status} onValueChange={(val) => setScoreForm({ ...scoreForm, status: val })}>
                  <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-white/10">
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {scoreForm.scores.map((score, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm bg-primary text-primary-foreground px-3 py-1 rounded">
                      Match {score.match_number} ({score.points_awarded} pts)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">{editingMatch && getTeamName(editingMatch.team1_id)}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="21"
                          value={score.team1_set1}
                          onChange={(e) => updateScoreField(idx, 'team1_set1', e.target.value)}
                          placeholder="Set 1"
                          className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-10 text-center"
                          data-testid={`team1-set1-${idx}`}
                        />
                        <Input
                          type="number"
                          min="0"
                          max="21"
                          value={score.team1_set2}
                          onChange={(e) => updateScoreField(idx, 'team1_set2', e.target.value)}
                          placeholder="Set 2"
                          className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-10 text-center"
                          data-testid={`team1-set2-${idx}`}
                        />
                        <Input
                          type="number"
                          min="0"
                          max="21"
                          value={score.team1_set3}
                          onChange={(e) => updateScoreField(idx, 'team1_set3', e.target.value)}
                          placeholder="Set 3"
                          className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-10 text-center"
                          data-testid={`team1-set3-${idx}`}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">{editingMatch && getTeamName(editingMatch.team2_id)}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="21"
                          value={score.team2_set1}
                          onChange={(e) => updateScoreField(idx, 'team2_set1', e.target.value)}
                          placeholder="Set 1"
                          className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-10 text-center"
                          data-testid={`team2-set1-${idx}`}
                        />
                        <Input
                          type="number"
                          min="0"
                          max="21"
                          value={score.team2_set2}
                          onChange={(e) => updateScoreField(idx, 'team2_set2', e.target.value)}
                          placeholder="Set 2"
                          className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-10 text-center"
                          data-testid={`team2-set2-${idx}`}
                        />
                        <Input
                          type="number"
                          min="0"
                          max="21"
                          value={score.team2_set3}
                          onChange={(e) => updateScoreField(idx, 'team2_set3', e.target.value)}
                          placeholder="Set 3"
                          className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-10 text-center"
                          data-testid={`team2-set3-${idx}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button type="submit" className="w-full font-bold uppercase tracking-wider glow-primary" data-testid="score-submit-btn">
                Update Score
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
