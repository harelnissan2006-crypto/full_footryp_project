import sys
import json
import math
import os
from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017/"
client = MongoClient(MONGO_URI)
db = client["footryp"]

def load_mapping():
    base_path = os.path.dirname(__file__)
    mapping_path = os.path.join(base_path, "mapping.json")
    with open(mapping_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    team_to_league = {}
    leagues = list(raw.keys())
    for league, teams in raw.items():
        for team_name, info in teams.items():
            team_to_league[info['team_id']] = leagues.index(league)
    return team_to_league, len(leagues)

def build_vector(user, team_to_league, num_leagues):

    league_vector = [0] * num_leagues
    favorite_team = user.get('favoriteTeamId')
    if favorite_team and favorite_team in team_to_league:
        league_vector[team_to_league[favorite_team]]=1
    
    budget = (user.get('budgetLevel') or 3)/5
    risk = (user.get('riskTolerance') or 3)/5

    age = user.get('age') or 25
    age_norm = min(max((age-18)/42,0),1)

    weighted = [v*3 for v in league_vector] + [budget*1.5, risk*1.0, age_norm*0.5]
    return weighted

def euclidean_distance(v1, v2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

def distance_to_score(distance, max_distance):
    if max_distance == 0:
        return 100
    return round((1-distance/max_distance)*100)

def run_knn(user_id, k=3):
    from bson.objectid import ObjectId

    current_user = db.users.find_one({"_id": ObjectId(user_id)})
    if not current_user:
        print(json.dumps([]))
        return
    
    all_users = list(db.users.find({"_id": {"$ne": ObjectId(user_id)}}))
    if not all_users:
        print(json.dumps([]))
        return
    
    team_to_league, num_leagues = load_mapping()
    current_vector = build_vector(current_user, team_to_league, num_leagues)

    distances = []
    for user in all_users:
        vector = build_vector(user, team_to_league, num_leagues)
        distance = euclidean_distance(current_vector, vector)
        distances.append((distance, user))

    distances.sort(key=lambda x: x[0])
    top_k = distances[:k]

    max_distance = distances[-1][0] if distances else 1

    result = []
    for distance, user in top_k:
        result.append({
            "userId": str(user['_id']),
            "username": user.get('username'),
            "favoriteTeamId": user.get('favoriteTeamId'),
            "otherInterestTeamsIds": user.get('otherInterestTeamsIds', []),
            "budgetLevel": user.get('budgetLevel'),
            "riskTolerance": user.get('riskTolerance'),
            "age": user.get('age'),
            "matchScore": distance_to_score(distance, max_distance)
        })
    print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_knn(sys.argv[1])
