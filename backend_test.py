#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import base64
import io

class BadmintonTournamentAPITester:
    def __init__(self, base_url="https://courtscorer.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'teams': [],
            'players': [],
            'matches': [],
            'notifications': []
        }

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        return success

    def make_request(self, method, endpoint, data=None, files=None):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                if files:
                    response = requests.put(url, files=files)
                else:
                    response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            return response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return None

    def test_admin_login(self):
        """Test admin authentication"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test valid password
        response = self.make_request('POST', 'admin/login', {'password': 'admin123'})
        success = response and response.status_code == 200 and response.json().get('success')
        self.log_test("Admin login with correct password", success, 
                     f"Status: {response.status_code if response else 'No response'}")
        
        # Test invalid password
        response = self.make_request('POST', 'admin/login', {'password': 'wrongpass'})
        success = response and response.status_code == 401
        self.log_test("Admin login with wrong password (should fail)", success,
                     f"Status: {response.status_code if response else 'No response'}")

    def test_teams_crud(self):
        """Test team CRUD operations"""
        print("\n👥 Testing Teams CRUD...")
        
        # Create team
        team_data = {
            'name': 'Test Warriors',
            'captain': 'John Doe',
            'block': 'Block A'
        }
        response = self.make_request('POST', 'teams', team_data)
        success = response and response.status_code == 200
        if success:
            team = response.json()
            self.created_resources['teams'].append(team['id'])
            self.log_test("Create team", True)
        else:
            self.log_test("Create team", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        team_id = team['id']
        
        # Get all teams
        response = self.make_request('GET', 'teams')
        success = response and response.status_code == 200 and len(response.json()) > 0
        self.log_test("Get all teams", success)
        
        # Get specific team
        response = self.make_request('GET', f'teams/{team_id}')
        success = response and response.status_code == 200 and response.json()['name'] == 'Test Warriors'
        self.log_test("Get specific team", success)
        
        # Update team
        update_data = {
            'name': 'Updated Warriors',
            'captain': 'Jane Doe',
            'block': 'Block B'
        }
        response = self.make_request('PUT', f'teams/{team_id}', update_data)
        success = response and response.status_code == 200
        self.log_test("Update team", success)

    def test_players_crud(self):
        """Test player CRUD operations"""
        print("\n🏃 Testing Players CRUD...")
        
        if not self.created_resources['teams']:
            print("❌ No teams available for player testing")
            return
        
        team_id = self.created_resources['teams'][0]
        
        # Create player
        player_data = {
            'name': 'Test Player',
            'team_id': team_id
        }
        response = self.make_request('POST', 'players', player_data)
        success = response and response.status_code == 200
        if success:
            player = response.json()
            self.created_resources['players'].append(player['id'])
            self.log_test("Create player", True)
        else:
            self.log_test("Create player", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        player_id = player['id']
        
        # Get all players
        response = self.make_request('GET', 'players')
        success = response and response.status_code == 200 and len(response.json()) > 0
        self.log_test("Get all players", success)
        
        # Get players by team
        response = self.make_request('GET', f'players?team_id={team_id}')
        success = response and response.status_code == 200
        self.log_test("Get players by team", success)
        
        # Get specific player
        response = self.make_request('GET', f'players/{player_id}')
        success = response and response.status_code == 200 and response.json()['name'] == 'Test Player'
        self.log_test("Get specific player", success)

    def test_matches_crud(self):
        """Test match CRUD operations"""
        print("\n🏸 Testing Matches CRUD...")
        
        if len(self.created_resources['teams']) < 2:
            # Create second team for match
            team_data = {
                'name': 'Test Challengers',
                'captain': 'Bob Smith',
                'block': 'Block C'
            }
            response = self.make_request('POST', 'teams', team_data)
            if response and response.status_code == 200:
                self.created_resources['teams'].append(response.json()['id'])
        
        if len(self.created_resources['teams']) < 2:
            print("❌ Need at least 2 teams for match testing")
            return
        
        # Create match
        match_data = {
            'clash_name': 'Test Clash',
            'team1_id': self.created_resources['teams'][0],
            'team2_id': self.created_resources['teams'][1],
            'stage': 'league',
            'scheduled_time': '2024-12-20T10:00:00'
        }
        response = self.make_request('POST', 'matches', match_data)
        success = response and response.status_code == 200
        if success:
            match = response.json()
            self.created_resources['matches'].append(match['id'])
            self.log_test("Create match", True)
        else:
            self.log_test("Create match", False, f"Status: {response.status_code if response else 'No response'}")
            return
        
        match_id = match['id']
        
        # Get all matches
        response = self.make_request('GET', 'matches')
        success = response and response.status_code == 200 and len(response.json()) > 0
        self.log_test("Get all matches", success)
        
        # Get specific match
        response = self.make_request('GET', f'matches/{match_id}')
        success = response and response.status_code == 200 and response.json()['clash_name'] == 'Test Clash'
        self.log_test("Get specific match", success)
        
        # Update match score
        score_data = {
            'match_id': match_id,
            'scores': [
                {
                    'match_number': 1,
                    'match_type': 'doubles',
                    'team1_set1': 21,
                    'team1_set2': 19,
                    'team1_set3': 0,
                    'team2_set1': 18,
                    'team2_set2': 21,
                    'team2_set3': 0,
                    'points_awarded': 3,
                    'winner': 'team2'
                },
                {
                    'match_number': 2,
                    'match_type': 'doubles',
                    'team1_set1': 21,
                    'team1_set2': 15,
                    'team1_set3': 0,
                    'team2_set1': 12,
                    'team2_set2': 21,
                    'team2_set3': 0,
                    'points_awarded': 4,
                    'winner': 'team1'
                }
            ],
            'team1_total_points': 4,
            'team2_total_points': 3,
            'winner_id': self.created_resources['teams'][0],
            'status': 'live'
        }
        response = self.make_request('PUT', f'matches/{match_id}/score', score_data)
        success = response and response.status_code == 200
        self.log_test("Update match score", success)

    def test_photo_upload(self):
        """Test photo upload functionality"""
        print("\n📸 Testing Photo Upload...")
        
        if not self.created_resources['matches']:
            print("❌ No matches available for photo testing")
            return
        
        match_id = self.created_resources['matches'][0]
        
        # Create a simple test image (1x1 pixel PNG)
        test_image_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
        
        files = {'photo': ('test.png', io.BytesIO(test_image_data), 'image/png')}
        response = self.make_request('PUT', f'matches/{match_id}/photo', files=files)
        success = response and response.status_code == 200
        self.log_test("Upload match photo", success)

    def test_notifications(self):
        """Test notification system"""
        print("\n🔔 Testing Notifications...")
        
        # Create notification
        notif_data = {
            'title': 'Test Notification',
            'message': 'This is a test notification for the tournament.',
            'match_id': self.created_resources['matches'][0] if self.created_resources['matches'] else None
        }
        response = self.make_request('POST', 'notifications', notif_data)
        success = response and response.status_code == 200
        if success:
            notif = response.json()
            self.created_resources['notifications'].append(notif['id'])
            self.log_test("Create notification", True)
        else:
            self.log_test("Create notification", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Get all notifications
        response = self.make_request('GET', 'notifications')
        success = response and response.status_code == 200 and len(response.json()) > 0
        self.log_test("Get all notifications", success)

    def test_leaderboard(self):
        """Test leaderboard functionality"""
        print("\n🏆 Testing Leaderboard...")
        
        response = self.make_request('GET', 'leaderboard')
        success = response and response.status_code == 200
        self.log_test("Get leaderboard", success)

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete matches
        for match_id in self.created_resources['matches']:
            response = self.make_request('DELETE', f'matches/{match_id}')
            success = response and response.status_code == 200
            self.log_test(f"Delete match {match_id}", success)
        
        # Delete players
        for player_id in self.created_resources['players']:
            response = self.make_request('DELETE', f'players/{player_id}')
            success = response and response.status_code == 200
            self.log_test(f"Delete player {player_id}", success)
        
        # Delete teams
        for team_id in self.created_resources['teams']:
            response = self.make_request('DELETE', f'teams/{team_id}')
            success = response and response.status_code == 200
            self.log_test(f"Delete team {team_id}", success)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Badminton Tournament API Tests...")
        print(f"Testing API at: {self.api_url}")
        
        try:
            self.test_admin_login()
            self.test_teams_crud()
            self.test_players_crud()
            self.test_matches_crud()
            self.test_photo_upload()
            self.test_notifications()
            self.test_leaderboard()
            
        finally:
            self.cleanup_resources()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BadmintonTournamentAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())