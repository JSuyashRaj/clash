import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, UserPlus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminTeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', captain: '', block: '' });
  const [playerForm, setPlayerForm] = useState({ name: '', team_id: '' });
  
  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);
  
  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        axios.get(`${API}/teams`),
        axios.get(`${API}/players`)
      ]);
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  };
  
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/teams`, teamForm);
      toast.success('Team created successfully!');
      setShowTeamDialog(false);
      setTeamForm({ name: '', captain: '', block: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };
  
  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/teams/${editingTeam.id}`, teamForm);
      toast.success('Team updated successfully!');
      setShowTeamDialog(false);
      setEditingTeam(null);
      setTeamForm({ name: '', captain: '', block: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };
  
  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await axios.delete(`${API}/teams/${teamId}`);
      toast.success('Team deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };
  
  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/players`, playerForm);
      toast.success('Player added successfully!');
      setShowPlayerDialog(false);
      setSelectedTeamForPlayer(null);
      setPlayerForm({ name: '', team_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating player:', error);
      toast.error('Failed to add player');
    }
  };
  
  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to remove this player?')) return;
    
    try {
      await axios.delete(`${API}/players/${playerId}`);
      toast.success('Player removed successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to remove player');
    }
  };
  
  const openEditTeamDialog = (team) => {
    setEditingTeam(team);
    setTeamForm({ name: team.name, captain: team.captain, block: team.block });
    setShowTeamDialog(true);
  };
  
  const openAddPlayerDialog = (teamId) => {
    setSelectedTeamForPlayer(teamId);
    setPlayerForm({ name: '', team_id: teamId });
    setShowPlayerDialog(true);
  };
  
  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId);
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
                Manage <span className="text-primary">Teams</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                Add, edit, and manage tournament teams
              </p>
            </div>
            <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
              <DialogTrigger asChild>
                <Button
                  className="font-bold uppercase tracking-wider glow-primary"
                  onClick={() => {
                    setEditingTeam(null);
                    setTeamForm({ name: '', captain: '', block: '' });
                  }}
                  data-testid="add-team-btn"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Team
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                    {editingTeam ? 'Edit Team' : 'Create New Team'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      Team Name
                    </label>
                    <Input
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="Enter team name"
                      required
                      className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                      data-testid="team-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      Captain Name
                    </label>
                    <Input
                      value={teamForm.captain}
                      onChange={(e) => setTeamForm({ ...teamForm, captain: e.target.value })}
                      placeholder="Enter captain name"
                      required
                      className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                      data-testid="team-captain-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      Block
                    </label>
                    <Input
                      value={teamForm.block}
                      onChange={(e) => setTeamForm({ ...teamForm, block: e.target.value })}
                      placeholder="Enter block name"
                      required
                      className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                      data-testid="team-block-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-bold uppercase tracking-wider glow-primary"
                    data-testid="team-submit-btn"
                  >
                    {editingTeam ? 'Update Team' : 'Create Team'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {teams.map((team, idx) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              data-testid={`admin-team-${team.id}`}
            >
              <Card className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-heading font-bold text-2xl tracking-tight uppercase text-foreground mb-2">
                        {team.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Block: {team.block}</p>
                      <p className="text-sm text-muted-foreground">Captain: {team.captain}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditTeamDialog(team)}
                        className="border-2"
                        data-testid={`edit-team-${team.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTeam(team.id)}
                        className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                        data-testid={`delete-team-${team.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      Players ({getTeamPlayers(team.id).length})
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openAddPlayerDialog(team.id)}
                      className="font-bold uppercase text-xs"
                      data-testid={`add-player-${team.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Add Player
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {getTeamPlayers(team.id).map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2"
                        data-testid={`admin-player-${player.id}`}
                      >
                        <span className="text-sm text-foreground">{player.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                          data-testid={`delete-player-${player.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
          <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                Add New Player
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  Player Name
                </label>
                <Input
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  placeholder="Enter player name"
                  required
                  className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12"
                  data-testid="player-name-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full font-bold uppercase tracking-wider glow-primary"
                data-testid="player-submit-btn"
              >
                Add Player
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
