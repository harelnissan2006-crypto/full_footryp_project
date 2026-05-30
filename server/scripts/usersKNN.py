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
    all_team_ids = sorted(set(team_to_league.keys()))
    team_to_idx = {tid: i for i, tid in enumerate(all_team_ids)}
    num_teams = len(all_team_ids)

    team_vector = [0.0] * num_teams

    favorite_team = user.get('favoriteTeamId')
    if favorite_team and favorite_team in team_to_idx:
        team_vector[team_to_idx[favorite_team]] = 1.0

    other_teams = user.get('otherInterestTeamsIds') or []
    for team_id in other_teams:
        if team_id in team_to_idx:
            idx = team_to_idx[team_id]
            team_vector[idx] = max(team_vector[idx], 0.5)

    budget = (user.get('budgetLevel') or 3) / 5
    risk = (user.get('riskTolerance') or 3) / 5
    age = user.get('age') or 25
    age_norm = min(max((age - 18) / 42, 0), 1)

    weighted = [v * 2 for v in team_vector] + [budget * 1.5, risk * 1.0, age_norm * 0.5]
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

    all_team_ids = sorted(set(team_to_league.keys()))
    team_to_idx = {tid: i for i, tid in enumerate(all_team_ids)}
    num_teams = len(all_team_ids)

    def build_vec(user):
        team_vector = [0.0] * num_teams
        fav = user.get('favoriteTeamId')
        if fav and fav in team_to_idx:
            team_vector[team_to_idx[fav]] = 1.0
        for tid in (user.get('otherInterestTeamsIds') or []):
            if tid in team_to_idx:
                team_vector[team_to_idx[tid]] = max(team_vector[team_to_idx[tid]], 0.5)
        budget = (user.get('budgetLevel') or 3) / 5
        risk = (user.get('riskTolerance') or 3) / 5
        age_norm = min(max(((user.get('age') or 25) - 18) / 42, 0), 1)
        return [v * 2 for v in team_vector] + [budget * 1.5, risk * 1.0, age_norm * 0.5]

    current_vector = build_vec(current_user)

    distances = []
    for user in all_users:
        dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(current_vector, build_vec(user))))
        distances.append((dist, user))

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
