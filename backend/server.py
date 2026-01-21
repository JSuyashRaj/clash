from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_PASSWORD_HASH = "$2b$12$ahyYGx.T7QJPOQrSrVcyhOgiOIk9rhuGDKDAqE2h29fdWoNugYhLe"

class Player(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    team_id: str
    matches_played: int = 0
    pairs_history: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlayerCreate(BaseModel):
    name: str
    team_id: str

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pool: Optional[str] = "X"
    pool_number: Optional[int] = 1
    players: List[str] = Field(default_factory=list)
    matches_played: int = 0
    matches_won: int = 0
    matches_lost: int = 0
    points: int = 0
    total_games_won: int = 0
    total_games_lost: int = 0
    point_difference: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TeamCreate(BaseModel):
    name: str
    pool: str
    pool_number: int

class MatchScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_number: int
    team1_player1_id: Optional[str] = None
    team1_player2_id: Optional[str] = None
    team2_player1_id: Optional[str] = None
    team2_player2_id: Optional[str] = None
    team1_set1: int = 0
    team1_set2: int = 0
    team1_set3: int = 0
    team2_set1: int = 0
    team2_set2: int = 0
    team2_set3: int = 0
    winner: Optional[str] = None
    completed: bool = False

class Clash(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clash_name: str
    team1_id: str
    team2_id: str
    stage: str
    status: str = "upcoming"
    scheduled_time: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    scores: List[MatchScore] = Field(default_factory=list)
    team1_games_won: int = 0
    team2_games_won: int = 0
    winner_id: Optional[str] = None
    is_locked: bool = False
    photo_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClashCreate(BaseModel):
    clash_name: str
    team1_id: str
    team2_id: str
    stage: str
    scheduled_time: Optional[str] = None

class ClashScoreUpdate(BaseModel):
    clash_id: str
    scores: List[MatchScore]
    team1_games_won: int
    team2_games_won: int
    winner_id: Optional[str] = None
    status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    clash_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NotificationCreate(BaseModel):
    title: str
    message: str
    clash_id: Optional[str] = None

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if bcrypt.checkpw(data.password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8')):
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.post("/teams", response_model=Team)
async def create_team(team: TeamCreate):
    # Check for duplicate pool+pool_number
    existing = await db.teams.find_one({"pool": team.pool, "pool_number": team.pool_number}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"Team {team.pool}{team.pool_number} already exists")
    
    team_obj = Team(**team.model_dump())
    doc = team_obj.model_dump()
    await db.teams.insert_one(doc)
    return team_obj

@api_router.get("/teams", response_model=List[Team])
async def get_teams():
    teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
    return teams

@api_router.get("/teams/{team_id}", response_model=Team)
async def get_team(team_id: str):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@api_router.put("/teams/{team_id}", response_model=Team)
async def update_team(team_id: str, team: TeamCreate):
    # Check if new pool+pool_number would conflict with another team
    existing = await db.teams.find_one({
        "pool": team.pool, 
        "pool_number": team.pool_number,
        "id": {"$ne": team_id}
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"Team {team.pool}{team.pool_number} already exists")
    
    result = await db.teams.update_one(
        {"id": team_id},
        {"$set": team.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    updated_team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    return updated_team

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str):
    result = await db.teams.delete_one({"id": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    await db.players.delete_many({"team_id": team_id})
    return {"success": True}

@api_router.post("/players", response_model=Player)
async def create_player(player: PlayerCreate):
    player_obj = Player(**player.model_dump())
    doc = player_obj.model_dump()
    await db.players.insert_one(doc)
    await db.teams.update_one(
        {"id": player.team_id},
        {"$push": {"players": player_obj.id}}
    )
    return player_obj

@api_router.get("/players", response_model=List[Player])
async def get_players(team_id: Optional[str] = None):
    query = {"team_id": team_id} if team_id else {}
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    return players

@api_router.get("/players/{player_id}", response_model=Player)
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.put("/players/{player_id}", response_model=Player)
async def update_player(player_id: str, player: PlayerCreate):
    result = await db.players.update_one(
        {"id": player_id},
        {"$set": player.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    updated_player = await db.players.find_one({"id": player_id}, {"_id": 0})
    return updated_player

@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    result = await db.players.delete_one({"id": player_id})
    await db.teams.update_one(
        {"id": player["team_id"]},
        {"$pull": {"players": player_id}}
    )
    return {"success": True}

@api_router.post("/generate-fixtures")
async def generate_fixtures():
    pool_x_fixtures = [
        ("X1", ["X2", "X3", "X6", "X7"]),
        ("X2", ["X1", "X3", "X4", "X7"]),
        ("X3", ["X1", "X2", "X4", "X5"]),
        ("X4", ["X2", "X3", "X5", "X6"]),
        ("X5", ["X3", "X4", "X6", "X7"]),
        ("X6", ["X1", "X4", "X5", "X7"]),
        ("X7", ["X1", "X2", "X5", "X6"])
    ]
    
    pool_y_fixtures = [
        ("Y1", ["Y2", "Y3", "Y6", "Y7"]),
        ("Y2", ["Y1", "Y3", "Y4", "Y7"]),
        ("Y3", ["Y1", "Y2", "Y4", "Y5"]),
        ("Y4", ["Y2", "Y3", "Y5", "Y6"]),
        ("Y5", ["Y3", "Y4", "Y6", "Y7"]),
        ("Y6", ["Y1", "Y4", "Y5", "Y7"]),
        ("Y7", ["Y1", "Y2", "Y5", "Y6"])
    ]
    
    teams = await db.teams.find({}, {"_id": 0}).to_list(1000)
    team_map = {f"{t['pool']}{t['pool_number']}": t['id'] for t in teams}
    
    created_clashes = []
    processed_pairs = set()
    
    for pool_fixtures in [pool_x_fixtures, pool_y_fixtures]:
        for team_code, opponents in pool_fixtures:
            if team_code not in team_map:
                continue
            team1_id = team_map[team_code]
            
            for opponent_code in opponents:
                if opponent_code not in team_map:
                    continue
                team2_id = team_map[opponent_code]
                
                pair = tuple(sorted([team1_id, team2_id]))
                if pair in processed_pairs:
                    continue
                processed_pairs.add(pair)
                
                clash_name = f"{team_code} vs {opponent_code}"
                default_scores = [MatchScore(match_number=i+1) for i in range(5)]
                
                clash_obj = Clash(
                    clash_name=clash_name,
                    team1_id=team1_id,
                    team2_id=team2_id,
                    stage="league",
                    scores=[s.model_dump() for s in default_scores]
                )
                doc = clash_obj.model_dump()
                await db.clashes.insert_one(doc)
                created_clashes.append(clash_name)
    
    return {"success": True, "created": len(created_clashes), "clashes": created_clashes}

@api_router.post("/clashes", response_model=Clash)
async def create_clash(clash: ClashCreate):
    num_matches = 5
    default_scores = [MatchScore(match_number=i+1) for i in range(num_matches)]
    clash_data = clash.model_dump()
    clash_data["scores"] = [s.model_dump() for s in default_scores]
    clash_obj = Clash(**clash_data)
    doc = clash_obj.model_dump()
    await db.clashes.insert_one(doc)
    return clash_obj

@api_router.get("/clashes", response_model=List[Clash])
async def get_clashes(stage: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if stage:
        query["stage"] = stage
    if status:
        query["status"] = status
    clashes = await db.clashes.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return clashes

@api_router.get("/clashes/{clash_id}", response_model=Clash)
async def get_clash(clash_id: str):
    clash = await db.clashes.find_one({"id": clash_id}, {"_id": 0})
    if not clash:
        raise HTTPException(status_code=404, detail="Clash not found")
    return clash

@api_router.put("/clashes/{clash_id}/score")
async def update_clash_score(clash_id: str, score_update: ClashScoreUpdate):
    clash = await db.clashes.find_one({"id": clash_id}, {"_id": 0})
    if not clash:
        raise HTTPException(status_code=404, detail="Clash not found")
    
    if clash.get("is_locked"):
        raise HTTPException(status_code=400, detail="Clash is locked")
    
    is_league = clash["stage"] == "league"
    team1_wins = 0
    team2_wins = 0
    
    for score in score_update.scores:
        if score.completed:
            if is_league:
                if score.team1_set1 > score.team2_set1:
                    team1_wins += 1
                elif score.team2_set1 > score.team1_set1:
                    team2_wins += 1
            else:
                sets_won_team1 = 0
                sets_won_team2 = 0
                if score.team1_set1 > score.team2_set1:
                    sets_won_team1 += 1
                else:
                    sets_won_team2 += 1
                if score.team1_set2 > 0 and score.team2_set2 > 0:
                    if score.team1_set2 > score.team2_set2:
                        sets_won_team1 += 1
                    else:
                        sets_won_team2 += 1
                if score.team1_set3 > 0 and score.team2_set3 > 0:
                    if score.team1_set3 > score.team2_set3:
                        sets_won_team1 += 1
                    else:
                        sets_won_team2 += 1
                
                if sets_won_team1 > sets_won_team2:
                    team1_wins += 1
                elif sets_won_team2 > sets_won_team1:
                    team2_wins += 1
    
    is_locked = team1_wins >= 3 or team2_wins >= 3
    winner_id = None
    if is_locked:
        winner_id = clash["team1_id"] if team1_wins >= 3 else clash["team2_id"]
        score_update.status = "completed"
    
    duration_minutes = None
    if score_update.start_time and score_update.end_time:
        try:
            start = datetime.fromisoformat(score_update.start_time.replace('Z', '+00:00'))
            end = datetime.fromisoformat(score_update.end_time.replace('Z', '+00:00'))
            duration_minutes = int((end - start).total_seconds() / 60)
        except:
            pass
    
    update_data = {
        "scores": [s.model_dump() for s in score_update.scores],
        "team1_games_won": team1_wins,
        "team2_games_won": team2_wins,
        "winner_id": winner_id,
        "status": score_update.status,
        "is_locked": is_locked,
        "start_time": score_update.start_time,
        "end_time": score_update.end_time,
        "duration_minutes": duration_minutes
    }
    
    result = await db.clashes.update_one(
        {"id": clash_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Clash not found")
    
    if score_update.status == "completed" and winner_id and is_league:
        loser_id = clash["team1_id"] if winner_id == clash["team2_id"] else clash["team2_id"]
        
        team1_games_lost = team2_wins
        team2_games_lost = team1_wins
        
        await db.teams.update_one(
            {"id": winner_id},
            {"$inc": {
                "matches_won": 1,
                "matches_played": 1,
                "points": 2,
                "total_games_won": team1_wins if winner_id == clash["team1_id"] else team2_wins,
                "total_games_lost": team1_games_lost if winner_id == clash["team1_id"] else team2_games_lost
            }}
        )
        await db.teams.update_one(
            {"id": loser_id},
            {"$inc": {
                "matches_lost": 1,
                "matches_played": 1,
                "total_games_won": team2_wins if loser_id == clash["team2_id"] else team1_wins,
                "total_games_lost": team2_games_lost if loser_id == clash["team2_id"] else team1_games_lost
            }}
        )
        
        winner_team = await db.teams.find_one({"id": winner_id}, {"_id": 0})
        loser_team = await db.teams.find_one({"id": loser_id}, {"_id": 0})
        
        if winner_team:
            point_diff = winner_team["total_games_won"] - winner_team["total_games_lost"]
            await db.teams.update_one({"id": winner_id}, {"$set": {"point_difference": point_diff}})
        
        if loser_team:
            point_diff = loser_team["total_games_won"] - loser_team["total_games_lost"]
            await db.teams.update_one({"id": loser_id}, {"$set": {"point_difference": point_diff}})
    
    for score in score_update.scores:
        if score.completed:
            player_ids = [
                score.team1_player1_id, score.team1_player2_id,
                score.team2_player1_id, score.team2_player2_id
            ]
            for pid in player_ids:
                if pid:
                    await db.players.update_one(
                        {"id": pid},
                        {"$inc": {"matches_played": 1}}
                    )
            
            if score.team1_player1_id and score.team1_player2_id:
                pair_key = "-".join(sorted([score.team1_player1_id, score.team1_player2_id]))
                await db.players.update_one(
                    {"id": score.team1_player1_id},
                    {"$addToSet": {"pairs_history": pair_key}}
                )
                await db.players.update_one(
                    {"id": score.team1_player2_id},
                    {"$addToSet": {"pairs_history": pair_key}}
                )
            
            if score.team2_player1_id and score.team2_player2_id:
                pair_key = "-".join(sorted([score.team2_player1_id, score.team2_player2_id]))
                await db.players.update_one(
                    {"id": score.team2_player1_id},
                    {"$addToSet": {"pairs_history": pair_key}}
                )
                await db.players.update_one(
                    {"id": score.team2_player2_id},
                    {"$addToSet": {"pairs_history": pair_key}}
                )
    
    return {"success": True, "is_locked": is_locked, "winner_id": winner_id}

@api_router.put("/clashes/{clash_id}/photo")
async def upload_clash_photo(clash_id: str, photo: UploadFile = File(...)):
    contents = await photo.read()
    base64_photo = base64.b64encode(contents).decode('utf-8')
    photo_url = f"data:{photo.content_type};base64,{base64_photo}"
    
    result = await db.clashes.update_one(
        {"id": clash_id},
        {"$set": {"photo_url": photo_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Clash not found")
    
    return {"success": True, "photo_url": photo_url}

@api_router.delete("/clashes/{clash_id}")
async def delete_clash(clash_id: str):
    result = await db.clashes.delete_one({"id": clash_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clash not found")
    return {"success": True}

@api_router.get("/leaderboard")
async def get_leaderboard(pool: Optional[str] = None):
    query = {"pool": pool} if pool else {}
    teams = await db.teams.find(query, {"_id": 0}).to_list(1000)
    
    sorted_teams = sorted(teams, key=lambda t: (
        -t.get("points", 0),
        t.get("matches_lost", 0),
        -t.get("point_difference", 0)
    ))
    
    return sorted_teams

@api_router.post("/notifications", response_model=Notification)
async def create_notification(notification: NotificationCreate):
    notif_obj = Notification(**notification.model_dump())
    doc = notif_obj.model_dump()
    await db.notifications.insert_one(doc)
    return notif_obj

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications():
    notifications = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
