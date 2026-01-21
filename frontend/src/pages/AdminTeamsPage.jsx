import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, UserPlus, X, Zap, Pencil } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  const [showFixtureDialog, setShowFixtureDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', pool: 'X', pool_number: 1 });
  const [playerForm, setPlayerForm] = useState({ name: '', team_id: '' });
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  
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
      setTeams(teamsRes.data.sort((a, b) => {
        if (a.pool !== b.pool) return a.pool.localeCompare(b.pool);
        return a.pool_number - b.pool_number;
      }));
      setPlayers(playersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  };
  
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    const existingTeam = teams.find(t => t.pool === teamForm.pool && t.pool_number === teamForm.pool_number);
    if (existingTeam) {
      toast.error(`${teamForm.pool}${teamForm.pool_number} already exists`);
      return;
    }
    
    try {
      await axios.post(`${API}/teams`, teamForm);
      toast.success('Team created successfully!');
      setShowTeamDialog(false);
      setTeamForm({ name: '', pool: 'X', pool_number: 1 });
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
      setTeamForm({ name: '', pool: 'X', pool_number: 1 });
      fetchData();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };
  
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete ${teamName}? This will also delete all players in this team.`)) return;
    
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
    
    const teamPlayers = getTeamPlayers(playerForm.team_id);
    if (teamPlayers.length >= 8) {
      toast.error('Team already has maximum 8 players');
      return;
    }
    
    try {
      await axios.post(`${API}/players`, playerForm);
      toast.success('Player added successfully!');
      setShowPlayerDialog(false);
      setSelectedTeamForPlayer(null);
      setEditingPlayer(null);
      setPlayerForm({ name: '', team_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating player:', error);
      toast.error('Failed to add player');
    }
  };
  
  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/players/${editingPlayer.id}`, playerForm);
      toast.success('Player updated successfully!');
      setShowPlayerDialog(false);
      setEditingPlayer(null);
      setPlayerForm({ name: '', team_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    }
  };
  
  const handleDeletePlayer = async (playerId, playerName) => {
    if (!window.confirm(`Are you sure you want to remove ${playerName}?`)) return;
    
    try {
      await axios.delete(`${API}/players/${playerId}`);
      toast.success('Player removed successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to remove player');
    }
  };
  
  const openEditPlayerDialog = (player) => {
    setEditingPlayer(player);
    setPlayerForm({ name: player.name, team_id: player.team_id });
    setShowPlayerDialog(true);
  };
  
  const handleGenerateFixtures = async () => {
    if (!window.confirm('Generate all league stage fixtures? This will create 28 clashes based on the circular format.')) return;
    
    setGeneratingFixtures(true);
    try {
      const response = await axios.post(`${API}/generate-fixtures`);
      toast.success(`Successfully created ${response.data.created} clashes!`);
      setShowFixtureDialog(false);
    } catch (error) {
      console.error('Error generating fixtures:', error);
      toast.error('Failed to generate fixtures');
    } finally {
      setGeneratingFixtures(false);
    }
  };
  
  const openEditTeamDialog = (team) => {
    setEditingTeam(team);
    setTeamForm({ 
      name: team.name, 
      pool: team.pool || 'X', 
      pool_number: team.pool_number || 1 
    });
    setShowTeamDialog(true);
  };
  
  const openAddPlayerDialog = (teamId) => {
    setSelectedTeamForPlayer(teamId);
    setEditingPlayer(null);
    setPlayerForm({ name: '', team_id: teamId });
    setShowPlayerDialog(true);
  };
  
  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId);
  };
  
  const getPoolTeams = (pool) => {
    return teams.filter(t => t.pool === pool);
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
                Manage <span className="text-primary">Teams</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                14 teams • 2 pools • Each team plays 4 clashes
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showFixtureDialog} onOpenChange={setShowFixtureDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-bold uppercase tracking-wider border-2 border-primary text-primary hover:bg-primary hover:text-black"
                    data-testid="generate-fixtures-btn"
                  >
                    <Zap className="mr-2 h-4 w-4" /> Generate Fixtures
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                      Generate League Fixtures
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-foreground font-bold">Fixture Structure:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Each team plays exactly 4 clashes</li>
                        <li>• 14 clashes per pool (Pool X & Pool Y)</li>
                        <li>• Total: 28 league stage clashes</li>
                        <li>• Circular format as per tournament rules</li>
                      </ul>
                    </div>
                    <p className="text-sm text-primary font-bold">⚠️ This will create all league clashes at once</p>
                    <Button
                      onClick={handleGenerateFixtures}
                      disabled={generatingFixtures || teams.length < 14}
                      className="w-full font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400"
                      data-testid="confirm-generate-fixtures"
                    >
                      {generatingFixtures ? 'Generating...' : 'Generate All Fixtures'}
                    </Button>
                    {teams.length < 14 && (
                      <p className="text-sm text-destructive text-center">Need 14 teams to generate fixtures</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400"
                    style={{ boxShadow: '0 0 20px -5px rgba(204, 255, 0, 0.5)' }}
                    onClick={() => {
                      setEditingTeam(null);
                      setTeamForm({ name: '', pool: 'X', pool_number: 1 });
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                          Pool
                        </label>
                        <Select value={teamForm.pool} onValueChange={(val) => setTeamForm({ ...teamForm, pool: val })}>
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="pool-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-white/10">
                            <SelectItem value="X">Pool X</SelectItem>
                            <SelectItem value="Y">Pool Y</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                          Number (1-7)
                        </label>
                        <Select value={String(teamForm.pool_number)} onValueChange={(val) => setTeamForm({ ...teamForm, pool_number: parseInt(val) })}>
                          <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="pool-number-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-white/10">
                            {[1, 2, 3, 4, 5, 6, 7].map(num => (
                              <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                      <p className="text-xs text-primary font-bold">Team ID: {teamForm.pool}{teamForm.pool_number}</p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400"
                      data-testid="team-submit-btn"
                    >
                      {editingTeam ? 'Update Team' : 'Create Team'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>
        
        <div className="space-y-8">
          {['X', 'Y'].map(pool => (
            <div key={pool}>
              <h2 className="font-heading font-bold text-2xl tracking-tight uppercase text-primary mb-4">
                Pool {pool} ({getPoolTeams(pool).length}/7 teams)
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getPoolTeams(pool).map((team, idx) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    data-testid={`admin-team-${team.id}`}
                  >
                    <Card className="rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
                      <CardHeader className="border-b border-border pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-primary text-black font-mono font-bold text-xs rounded">
                                {team.pool}{team.pool_number}
                              </span>
                            </div>
                            <CardTitle className="font-heading font-bold text-xl tracking-tight uppercase text-foreground">
                              {team.name}
                            </CardTitle>
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
                              onClick={() => handleDeleteTeam(team.id, team.name)}
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
                            Players ({getTeamPlayers(team.id).length}/8)
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAddPlayerDialog(team.id)}
                            disabled={getTeamPlayers(team.id).length >= 8}
                            className="font-bold uppercase text-xs"
                            data-testid={`add-player-${team.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        {getTeamPlayers(team.id).length < 5 && (
                          <div className="mb-3 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                            ⚠️ Need minimum 5 players
                          </div>
                        )}
                        <div className="space-y-2">
                          {getTeamPlayers(team.id).map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2"
                              data-testid={`admin-player-${player.id}`}
                            >
                              <div className="flex-1">
                                <span className="text-sm text-foreground">{player.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">({player.matches_played}/2 matches)</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditPlayerDialog(player)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/20"
                                  data-testid={`edit-player-${player.id}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletePlayer(player.id, player.name)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                                  data-testid={`delete-player-${player.id}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <Dialog open={showPlayerDialog} onOpenChange={(open) => {
          setShowPlayerDialog(open);
          if (!open) {
            setEditingPlayer(null);
            setPlayerForm({ name: '', team_id: '' });
          }
        }}>
          <DialogContent className="bg-card border border-white/10 sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-2xl tracking-tight uppercase">
                {editingPlayer ? 'Edit Player' : 'Add New Player'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingPlayer ? handleUpdatePlayer : handleCreatePlayer} className="space-y-4">
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
              {editingPlayer && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                    Team
                  </label>
                  <Select value={playerForm.team_id} onValueChange={(val) => setPlayerForm({ ...playerForm, team_id: val })}>
                    <SelectTrigger className="rounded-lg bg-secondary/50 border-transparent focus:border-primary focus:ring-0 h-12" data-testid="player-team-select">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-white/10">
                      {teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.pool}{t.pool_number} - {t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                type="submit"
                className="w-full font-bold uppercase tracking-wider bg-primary text-black hover:bg-yellow-400"
                data-testid="player-submit-btn"
              >
                {editingPlayer ? 'Update Player' : 'Add Player'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
