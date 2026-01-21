"""
Backend API Tests for Badminton Tournament Management App
Tests: Admin login, Teams CRUD, Players CRUD
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "TBWYhmZDAx032xaD"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "message" in data
    
    def test_admin_login_invalid_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestTeamsCRUD:
    """Team CRUD operations tests"""
    
    @pytest.fixture
    def test_team_data(self):
        """Generate unique test team data"""
        return {
            "name": f"TEST_Team_{uuid.uuid4().hex[:8]}",
            "pool": "Y",
            "pool_number": 7  # Using Y7 to avoid conflicts
        }
    
    def test_get_all_teams(self):
        """Test fetching all teams"""
        response = requests.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_team(self, test_team_data):
        """Test creating a new team"""
        response = requests.post(f"{BASE_URL}/api/teams", json=test_team_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_team_data["name"]
        assert data["pool"] == test_team_data["pool"]
        assert data["pool_number"] == test_team_data["pool_number"]
        assert "id" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/teams/{data['id']}")
    
    def test_create_and_get_team(self, test_team_data):
        """Test creating a team and verifying persistence"""
        # Create team
        create_response = requests.post(f"{BASE_URL}/api/teams", json=test_team_data)
        assert create_response.status_code == 200
        created_team = create_response.json()
        team_id = created_team["id"]
        
        # Get team to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/teams/{team_id}")
        assert get_response.status_code == 200
        fetched_team = get_response.json()
        assert fetched_team["name"] == test_team_data["name"]
        assert fetched_team["pool"] == test_team_data["pool"]
        assert fetched_team["pool_number"] == test_team_data["pool_number"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/teams/{team_id}")
    
    def test_update_team(self, test_team_data):
        """Test updating a team"""
        # Create team first
        create_response = requests.post(f"{BASE_URL}/api/teams", json=test_team_data)
        assert create_response.status_code == 200
        team_id = create_response.json()["id"]
        
        # Update team
        updated_data = {
            "name": f"TEST_Updated_{uuid.uuid4().hex[:8]}",
            "pool": "Y",
            "pool_number": 7
        }
        update_response = requests.put(f"{BASE_URL}/api/teams/{team_id}", json=updated_data)
        assert update_response.status_code == 200
        updated_team = update_response.json()
        assert updated_team["name"] == updated_data["name"]
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/teams/{team_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == updated_data["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/teams/{team_id}")
    
    def test_delete_team(self, test_team_data):
        """Test deleting a team"""
        # Create team first
        create_response = requests.post(f"{BASE_URL}/api/teams", json=test_team_data)
        assert create_response.status_code == 200
        team_id = create_response.json()["id"]
        
        # Delete team
        delete_response = requests.delete(f"{BASE_URL}/api/teams/{team_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/teams/{team_id}")
        assert get_response.status_code == 404
    
    def test_get_nonexistent_team(self):
        """Test getting a team that doesn't exist"""
        response = requests.get(f"{BASE_URL}/api/teams/nonexistent-id-12345")
        assert response.status_code == 404


class TestPlayersCRUD:
    """Player CRUD operations tests"""
    
    @pytest.fixture
    def test_team_for_player(self):
        """Create a test team for player tests"""
        team_data = {
            "name": f"TEST_PlayerTeam_{uuid.uuid4().hex[:8]}",
            "pool": "Y",
            "pool_number": 6
        }
        response = requests.post(f"{BASE_URL}/api/teams", json=team_data)
        team = response.json()
        yield team
        # Cleanup - delete team (will also delete players)
        requests.delete(f"{BASE_URL}/api/teams/{team['id']}")
    
    def test_get_all_players(self):
        """Test fetching all players"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_player(self, test_team_for_player):
        """Test creating a new player"""
        player_data = {
            "name": f"TEST_Player_{uuid.uuid4().hex[:8]}",
            "team_id": test_team_for_player["id"]
        }
        response = requests.post(f"{BASE_URL}/api/players", json=player_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == player_data["name"]
        assert data["team_id"] == player_data["team_id"]
        assert "id" in data
        assert data["matches_played"] == 0
    
    def test_create_and_get_player(self, test_team_for_player):
        """Test creating a player and verifying persistence"""
        player_data = {
            "name": f"TEST_Player_{uuid.uuid4().hex[:8]}",
            "team_id": test_team_for_player["id"]
        }
        
        # Create player
        create_response = requests.post(f"{BASE_URL}/api/players", json=player_data)
        assert create_response.status_code == 200
        created_player = create_response.json()
        player_id = created_player["id"]
        
        # Get player to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/players/{player_id}")
        assert get_response.status_code == 200
        fetched_player = get_response.json()
        assert fetched_player["name"] == player_data["name"]
        assert fetched_player["team_id"] == player_data["team_id"]
    
    def test_get_players_by_team(self, test_team_for_player):
        """Test fetching players filtered by team"""
        # Create a player for the team
        player_data = {
            "name": f"TEST_Player_{uuid.uuid4().hex[:8]}",
            "team_id": test_team_for_player["id"]
        }
        requests.post(f"{BASE_URL}/api/players", json=player_data)
        
        # Get players by team
        response = requests.get(f"{BASE_URL}/api/players?team_id={test_team_for_player['id']}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        for player in data:
            assert player["team_id"] == test_team_for_player["id"]
    
    def test_update_player(self, test_team_for_player):
        """Test updating a player"""
        # Create player first
        player_data = {
            "name": f"TEST_Player_{uuid.uuid4().hex[:8]}",
            "team_id": test_team_for_player["id"]
        }
        create_response = requests.post(f"{BASE_URL}/api/players", json=player_data)
        assert create_response.status_code == 200
        player_id = create_response.json()["id"]
        
        # Update player
        updated_data = {
            "name": f"TEST_Updated_{uuid.uuid4().hex[:8]}",
            "team_id": test_team_for_player["id"]
        }
        update_response = requests.put(f"{BASE_URL}/api/players/{player_id}", json=updated_data)
        assert update_response.status_code == 200
        updated_player = update_response.json()
        assert updated_player["name"] == updated_data["name"]
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/players/{player_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == updated_data["name"]
    
    def test_delete_player(self, test_team_for_player):
        """Test deleting a player"""
        # Create player first
        player_data = {
            "name": f"TEST_Player_{uuid.uuid4().hex[:8]}",
            "team_id": test_team_for_player["id"]
        }
        create_response = requests.post(f"{BASE_URL}/api/players", json=player_data)
        assert create_response.status_code == 200
        player_id = create_response.json()["id"]
        
        # Delete player
        delete_response = requests.delete(f"{BASE_URL}/api/players/{player_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/players/{player_id}")
        assert get_response.status_code == 404
    
    def test_get_nonexistent_player(self):
        """Test getting a player that doesn't exist"""
        response = requests.get(f"{BASE_URL}/api/players/nonexistent-id-12345")
        assert response.status_code == 404


class TestPlayerLimits:
    """Test player limits per team (5-8 players)"""
    
    @pytest.fixture
    def test_team_for_limits(self):
        """Create a test team for limit tests"""
        team_data = {
            "name": f"TEST_LimitTeam_{uuid.uuid4().hex[:8]}",
            "pool": "Y",
            "pool_number": 5
        }
        response = requests.post(f"{BASE_URL}/api/teams", json=team_data)
        team = response.json()
        yield team
        # Cleanup
        requests.delete(f"{BASE_URL}/api/teams/{team['id']}")
    
    def test_team_can_have_8_players(self, test_team_for_limits):
        """Test that a team can have up to 8 players"""
        team_id = test_team_for_limits["id"]
        created_players = []
        
        # Create 8 players
        for i in range(8):
            player_data = {
                "name": f"TEST_Player_{i}_{uuid.uuid4().hex[:6]}",
                "team_id": team_id
            }
            response = requests.post(f"{BASE_URL}/api/players", json=player_data)
            assert response.status_code == 200
            created_players.append(response.json()["id"])
        
        # Verify all 8 players exist
        response = requests.get(f"{BASE_URL}/api/players?team_id={team_id}")
        assert response.status_code == 200
        assert len(response.json()) == 8


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
