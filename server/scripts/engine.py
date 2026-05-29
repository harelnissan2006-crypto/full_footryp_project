import sys
import json
import requests
import time
from datetime import datetime, timedelta
import unicodedata
from pymongo import MongoClient
import os
from bson.objectid import ObjectId
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

MONGO_URI = "mongodb://localhost:27017/"
client = MongoClient(MONGO_URI)
db = client['footryp']
print("MongoDB connected successfully.")

API_TOKEN = 'a2489751469b4a6a898298366aed99fa'

LEAGUE_CODES = {
    "Premier League": "PL",
    "La Liga": "PD",
    "Bundesliga": "BL1",
    "Serie A": "SA",
    "Ligue 1": "FL1",
    "Eredivisie": "DED",
    "Primeira Liga": "PPL",
    "Champions League": "CL"
}

def normalize(text):
    text = str(text)
    return unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8').lower()

def load_mapping():
    base_path = os.path.dirname(__file__)
    mapping_path = os.path.join(base_path, 'mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    flat = {}
    for league, teams in raw.items():
        for team_name, team_info in teams.items():
            flat[team_name] = team_info
    return flat

def load_mapping_raw():
    base_path = os.path.dirname(__file__)
    mapping_path = os.path.join(base_path, 'mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        return json.load(f)

TEAM_MAPPING = load_mapping()

def get_team_crest(team_id):
    try:
        url = f"https://api.football-data.org/v4/teams/{team_id}"
        headers = {'X-Auth-Token': API_TOKEN}
        response = requests.get(url, headers=headers, verify=False)
        data = response.json()
        return data.get('crest', '')
    except:
        return ''

def fetch_matches_from_api(team_id, days_before=1):
    url = f"https://api.football-data.org/v4/teams/{team_id}/matches?season=2025"
    headers = {'X-Auth-Token': API_TOKEN}

    try:
        response = requests.get(url, headers=headers, verify=False)
        data = response.json()
        matches = data.get('matches', [])

        if not matches:
            print(f"DEBUG: No matches found for team {team_id}")
            return []

        results = []
        for match in matches:
            home_team_info = match.get('homeTeam')
            if not home_team_info:
                continue

            home_team_id = home_team_info.get('id')
            away_team_id = match.get('awayTeam', {}).get('id')
            home_team_name = home_team_info.get('name')

            match_date_str = match['utcDate'].split('T')[0]
            match_date = datetime.strptime(match_date_str, "%Y-%m-%d")
            flight_date = match_date - timedelta(days=days_before)
            flight_date_str = flight_date.strftime("%Y-%m-%d")

            dest_info = None
            for name, info in TEAM_MAPPING.items():
                if info.get('team_id') == home_team_id:
                    dest_info = info
                    break
            if not dest_info:
                dest_info = next(
                    (info for n, info in TEAM_MAPPING.items()
                     if normalize(info.get('api_name', n)) == normalize(home_team_name)),
                    None
                )
            if not dest_info:
                print(f"DEBUG: Skipping - home team '{home_team_name}' not in mapping")
                continue

            competition = match.get('competition', {}).get('name', 'Unknown')

            team_ids = [home_team_id]
            if away_team_id and any(info.get('team_id') == away_team_id for info in TEAM_MAPPING.values()):
                team_ids.append(away_team_id)

            results.append({
                "apiMatchId": match.get('id'),
                "homeTeam": home_team_name,
                "awayTeam": match['awayTeam']['name'],
                "match_date": match_date_str,
                "match_time": match['utcDate'].split('T')[1].replace('Z', ''),
                "flight_date": flight_date_str,
                "home_city": dest_info['city'],
                "home_iata": dest_info['iata'],
                "distance_from_tlv": dest_info.get('distance_from_tlv', 3000),
                "competition": competition,
                "team_ids": team_ids
            })
        return results
    except Exception as e:
        print(f"Error fetching matches for team {team_id}: {e}")
        return []

def fetch_and_store_all_matches():
    print("DEBUG: Starting full match fetch for all leagues...")

    team_id_to_info = {}
    for league, teams in load_mapping_raw().items():
        for team_name, info in teams.items():
            team_id_to_info[info['team_id']] = {
                **info,
                'league': league,
                'name': team_name
            }

    total_saved = 0

    for league_name, league_code in LEAGUE_CODES.items():
        print(f"DEBUG: Fetching {league_name} ({league_code})...")

        url = f"https://api.football-data.org/v4/competitions/{league_code}/matches?season=2025"
        headers = {'X-Auth-Token': API_TOKEN}

        try:
            response = requests.get(url, headers=headers, verify=False)
            data = response.json()
            matches = data.get('matches', [])
            print(f"DEBUG: Got {len(matches)} matches for {league_name}")

            for match in matches:
                home_team = match.get('homeTeam', {})
                away_team = match.get('awayTeam', {})
                home_team_id = home_team.get('id')
                away_team_id = away_team.get('id')

                if home_team_id not in team_id_to_info:
                    continue

                home_info = team_id_to_info[home_team_id]
                home_team_name = home_team.get('name', home_info['api_name'])
                away_team_name = away_team.get('name', '')

                match_date_str = match['utcDate'].split('T')[0]
                match_time_str = match['utcDate'].split('T')[1].replace('Z', '')
                match_date = datetime.strptime(match_date_str, "%Y-%m-%d")
                flight_date = match_date - timedelta(days=1)
                flight_date_str = flight_date.strftime("%Y-%m-%d")

                team_ids_for_match = [home_team_id]
                if away_team_id and away_team_id in team_id_to_info:
                    team_ids_for_match.append(away_team_id)

                match_data = {
                    "apiMatchId": match.get('id'),
                    "homeTeam": home_team_name,
                    "awayTeam": away_team_name,
                    "homeCrest": home_team.get('crest', ''),
                    "awayCrest": away_team.get('crest', ''),
                    "match_date": match_date_str,
                    "match_time": match_time_str,
                    "flight_date": flight_date_str,
                    "home_city": home_info['city'],
                    "home_iata": home_info['iata'],
                    "distance_from_tlv": home_info.get('distance_from_tlv', 3000),
                    "timezone": home_info.get('timezone', 'Europe/London'),
                    "competition": league_name,
                    "last_updated": datetime.utcnow()
                }

                db.matches.update_one(
                    {"apiMatchId": match_data['apiMatchId']},
                    {
                        "$set": match_data,
                        "$addToSet": {"team_ids": {"$each": team_ids_for_match}}
                    },
                    upsert=True
                )
                total_saved += 1

        except Exception as e:
            print(f"Error fetching {league_name}: {e}")

        time.sleep(1.2)

    print(f"DEBUG: Done. Total matches saved/updated: {total_saved}")


def run_engine_for_user(user_id_input):
    user = None
    try:
        user = db.users.find_one({"_id": ObjectId(user_id_input)})
    except:
        user = db.users.find_one({"_id": user_id_input})

    if not user:
        print(f"DEBUG: User {user_id_input} not found in DB")
        return

    print(f"DEBUG: Found user {user.get('username')}. Building suggestions...")

    main_favorite = user.get("favoriteTeamId")
    other_interests = user.get("otherInterestTeamsIds", [])

    all_teams_to_check = []
    if main_favorite:
        all_teams_to_check.append(main_favorite)
    if isinstance(other_interests, list):
        all_teams_to_check.extend(other_interests)

    all_teams_to_check = list(set(all_teams_to_check))
    print(f"DEBUG: Teams to check: {all_teams_to_check}")

    db.suggested_matches.delete_many({"user_id": user_id_input})

    for team_id in all_teams_to_check:
        print(f"DEBUG: Fetching matches from DB for team ID: {team_id}...")
        matches_from_db = list(db.matches.find({
            "team_ids": team_id
        }).sort("match_date", 1))

        print(f"DEBUG: Found {len(matches_from_db)} matches in DB for team {team_id}")

        if not matches_from_db:
            print(f"DEBUG: No matches in DB for team {team_id}, fetching from API...")
            api_matches = fetch_matches_from_api(team_id)
            for match_data in api_matches:
                team_ids = match_data.pop('team_ids', [team_id])
                db.matches.update_one(
                    {"apiMatchId": match_data['apiMatchId']},
                    {
                        "$set": {**match_data, "last_updated": datetime.utcnow()},
                        "$addToSet": {"team_ids": {"$each": team_ids}}
                    },
                    upsert=True
                )
            matches_from_db = list(db.matches.find({
                "team_ids": team_id
            }).sort("match_date", 1))

        for match in matches_from_db:
            match_data = {
                "home_team": match['homeTeam'],
                "away_team": match['awayTeam'],
                "home_crest": match.get('homeCrest', ''),
                "away_crest": match.get('awayCrest', ''),
                "match_date": match['match_date'],
                "match_time": match['match_time'],
                "flight_date": match['flight_date'],
                "home_city": match['home_city'],
                "home_iata": match['home_iata'],
                "distance_from_tlv": match['distance_from_tlv'],
                "timezone": match.get('timezone', 'Europe/London')
            }

            competition = match.get('competition', 'Unknown')

            print(f"DEBUG: Saving suggestion: {match_data['home_team']} vs {match_data['away_team']}")

            db.suggested_matches.update_one(
                {
                    "user_id": user_id_input,
                    "team": str(team_id),
                    "match.match_date": match_data['match_date']
                },
                {"$set": {
                    "match": match_data,
                    "competition": competition,
                    "updated_at": datetime.utcnow(),
                    "status": "active"
                }},
                upsert=True
            )

    print(f"DEBUG: Done building suggestions for user {user_id_input}")


def run_engine_for_all_users():
    users = list(db.users.find({}))
    print(f"DEBUG: Found {len(users)} users")
    for user in users:
        user_id = str(user['_id'])
        print(f"DEBUG: Running engine for user {user.get('username')} ({user_id})")
        run_engine_for_user(user_id)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1].strip()
        if arg == "--fetch-all":
            fetch_and_store_all_matches()
        elif arg == "--all-users":
            run_engine_for_all_users()
        else:
            run_engine_for_user(arg)