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
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlayerCreate(BaseModel):
    name: str
    team_id: str

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    captain: str
    block: str
    players: List[str] = Field(default_factory=list)
    matches_played: int = 0
    matches_won: int = 0
    matches_lost: int = 0
    points: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TeamCreate(BaseModel):
    name: str
    captain: str
    block: str

class MatchScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_number: int
    match_type: str
    team1_set1: int = 0
    team1_set2: int = 0
    team1_set3: int = 0
    team2_set1: int = 0
    team2_set2: int = 0
    team2_set3: int = 0
    handicap_applied: bool = False
    winner: Optional[str] = None
    points_awarded: int

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clash_name: str
    team1_id: str
    team2_id: str
    stage: str
    status: str = "upcoming"
    scheduled_time: Optional[str] = None
    scores: List[MatchScore] = Field(default_factory=list)
    team1_total_points: int = 0
    team2_total_points: int = 0
    winner_id: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MatchCreate(BaseModel):
    clash_name: str
    team1_id: str
    team2_id: str
    stage: str
    scheduled_time: Optional[str] = None

class MatchScoreUpdate(BaseModel):
    match_id: str
    scores: List[MatchScore]
    team1_total_points: int
    team2_total_points: int
    winner_id: Optional[str] = None
    status: str

class AdminLogin(BaseModel):
    password: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    match_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NotificationCreate(BaseModel):
    title: str
    message: str
    match_id: Optional[str] = None

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if bcrypt.checkpw(data.password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8')):
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.post("/teams", response_model=Team)
async def create_team(team: TeamCreate):
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

@api_router.post("/matches", response_model=Match)
async def create_match(match: MatchCreate):
    default_scores = [
        MatchScore(match_number=1, match_type="doubles", points_awarded=3),
        MatchScore(match_number=2, match_type="doubles", points_awarded=4),
        MatchScore(match_number=3, match_type="doubles", points_awarded=5),
        MatchScore(match_number=4, match_type="doubles", points_awarded=3),
        MatchScore(match_number=5, match_type="doubles", points_awarded=6),
    ]
    match_data = match.model_dump()
    match_data["scores"] = [s.model_dump() for s in default_scores]
    match_obj = Match(**match_data)
    doc = match_obj.model_dump()
    await db.matches.insert_one(doc)
    return match_obj

@api_router.get("/matches", response_model=List[Match])
async def get_matches(stage: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if stage:
        query["stage"] = stage
    if status:
        query["status"] = status
    matches = await db.matches.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return matches

@api_router.get("/matches/{match_id}", response_model=Match)
async def get_match(match_id: str):
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@api_router.put("/matches/{match_id}/score")
async def update_match_score(match_id: str, score_update: MatchScoreUpdate):
    update_data = {
        "scores": [s.model_dump() for s in score_update.scores],
        "team1_total_points": score_update.team1_total_points,
        "team2_total_points": score_update.team2_total_points,
        "winner_id": score_update.winner_id,
        "status": score_update.status
    }
    
    result = await db.matches.update_one(
        {"id": match_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if score_update.status == "completed" and score_update.winner_id:
        match = await db.matches.find_one({"id": match_id}, {"_id": 0})
        loser_id = match["team1_id"] if score_update.winner_id == match["team2_id"] else match["team2_id"]
        
        await db.teams.update_one(
            {"id": score_update.winner_id},
            {"$inc": {"matches_won": 1, "matches_played": 1, "points": score_update.team1_total_points if score_update.winner_id == match["team1_id"] else score_update.team2_total_points}}
        )
        await db.teams.update_one(
            {"id": loser_id},
            {"$inc": {"matches_lost": 1, "matches_played": 1, "points": score_update.team2_total_points if loser_id == match["team2_id"] else score_update.team1_total_points}}
        )
    
    return {"success": True}

@api_router.put("/matches/{match_id}/photo")
async def upload_match_photo(match_id: str, photo: UploadFile = File(...)):
    contents = await photo.read()
    base64_photo = base64.b64encode(contents).decode('utf-8')
    photo_url = f"data:{photo.content_type};base64,{base64_photo}"
    
    result = await db.matches.update_one(
        {"id": match_id},
        {"$set": {"photo_url": photo_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    
    return {"success": True, "photo_url": photo_url}

@api_router.delete("/matches/{match_id}")
async def delete_match(match_id: str):
    result = await db.matches.delete_one({"id": match_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"success": True}

@api_router.get("/leaderboard")
async def get_leaderboard():
    teams = await db.teams.find({}, {"_id": 0}).sort("points", -1).to_list(1000)
    return teams

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