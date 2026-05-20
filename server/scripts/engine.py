import sys
import json
import requests
import time
from datetime import datetime, timedelta
"""from amadeus import Client"""
import unicodedata
from pymongo import MongoClient
import os
from bson.objectid import ObjectId

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

"""amadeus = Client(
    client_id='MtlgyNLQ5nhoy5RuOkqmeoyYWeHwhd83',
    client_secret='GvbOjgVE2vsA0sru'
)"""

MONGO_URI = "mongodb://localhost:27017/"
client = MongoClient(MONGO_URI)
db = client['footryp']
users_col = db['users']
matches_col = db['matches']
suggestions_col = db['suggested_matches']
packages_col = db['packages']
print("MongoDB connected successfully.")

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
    
TEAM_MAPPING = load_mapping()

"""def calculate_estimated_price(distance, flight_date_str):
    base_price = 50 
    price_per_km = 0.07 
    target_date = datetime.strptime(flight_date_str, "%Y-%m-%d")
    days_until = (target_date - datetime.now()).days
    
    if days_until > 30:
        urgency_factor = 1.0
    elif days_until > 7:
        urgency_factor = 1.6
    else:
        urgency_factor = 2.5 
        
    estimated = (base_price + (distance * price_per_km)) * urgency_factor
    return round(estimated, 2)"""

"""def get_city_and_coords(address):
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': address,
            'format': 'json',
            'addressdetails': 1,
            'limit': 1
        }
        headers = {'User-Agent': 'Footryp/1.0'}
        res = requests.get(url, params=params, headers=headers).json()
        if res:
            components = res[0].get('address', {})
            city = (
                components.get('city') or
                components.get('town') or
                components.get('village')
            )
            latitude = float(res[0].get('lat'))
            longitude = float(res[0].get('lon'))
            return city, latitude, longitude
    except Exception as e:
        print(f"Error: {e}")
    return None, None, None"""

"""def get_nearest_iata(latitude, longitude):
    try:
        response = amadeus.reference_data.locations.airports.get(
            latitude=latitude,
            longitude=longitude,
            radius=100
        )
        if response.data:
            return response.data[0]['iataCode']
    except Exception as e:
        print(f"Error: {e}")
    return None"""

"""def check_flight_availability(origin_iata, destination_iata, departure_date, distance=3000):
    try:
        if not origin_iata or not destination_iata:
            return {"direct": False, "status": "missing_iata"}

        print(f"DEBUG: Calling Amadeus: {origin_iata} -> {destination_iata} on {departure_date}")

        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin_iata,
            destinationLocationCode=destination_iata,
            departureDate=departure_date,
            adults=1,
            max=1
        )

        if response.data:
            price = response.data[0]['price']['total']
            return {
                "direct": True, 
                "status": "success", 
                "price": float(price),
                "source": "Amadeus API"
            }
        
        raise Exception("No offers found")

    except Exception as e:
        print(f"Fallback triggered: {e}")
        estimated = calculate_estimated_price(distance, departure_date)
        return {
            "direct": True, 
            "status": "estimated", 
            "price": estimated,
            "source": "Predictive Model"
        }"""

def get_match_data_hybrid(team_input, user_origin_iata='TLV', days_before=1):
    official_name = None
    team_id = None
    search_term = str(team_input)

    for name, info in TEAM_MAPPING.items():
        if str(info.get('team_id')) == search_term:
            official_name = name
            team_id = info['team_id']
            break
        if normalize(search_term) in normalize(name) or normalize(name) in normalize(search_term):
            official_name = name
            team_id = info['team_id']
            break

    print(f"DEBUG get_match_data_hybrid: input={team_input}, found team_id={team_id}, official_name={official_name}")    

    if not team_id:
        return None

    url = f"https://api.football-data.org/v4/teams/{team_id}/matches?status=SCHEDULED"
    headers = {'X-Auth-Token': 'a2489751469b4a6a898298366aed99fa'}

    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        matches = data.get('matches', [])
        
        if not matches:
            return None

        matches_to_process = matches[:3]
        results = []

        for next_match in matches_to_process:
            home_team_info = next_match.get('homeTeam')
            if not home_team_info:
                continue
                
            home_team_id = home_team_info.get('id')
            home_team_name = home_team_info.get('name')
            
            match_date_str = next_match['utcDate'].split('T')[0]
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
                print(f"DEBUG: Skipping match — home team '{home_team_name}' not in mapping")
                continue

            home_city = dest_info['city']
            home_iata = dest_info['iata']
            distance = dest_info.get('distance_from_tlv', 3000)

            '''if user_origin_iata == home_iata:
                flight_result = {"direct": True, "status": "local", "price": 0}
            else:
                flight_result = check_flight_availability(user_origin_iata, home_iata, flight_date_str, distance)

            risk_label = "High" if days_before == 0 else "Medium" if days_before == 1 else "Low"

            results.append({
                "home_team": home_team_name,
                "away_team": next_match['awayTeam']['name'],
                "match_date": match_date_str,
                "match_time": next_match['utcDate'].split('T')[1].replace('Z', ''),
                "flight_date": flight_date_str,
                "flight_availability": flight_result,
                "risk_level": risk_label,
                "home_city": home_city,
                "home_iata": home_iata
            })'''
            
            results.append({
                "home_team": home_team_name,
                "away_team": next_match['awayTeam']['name'],
                "match_date": match_date_str,
                "match_time": next_match['utcDate'].split('T')[1].replace('Z', ''),
                "flight_date": flight_date_str,
                "home_city": home_city,
                "home_iata": home_iata,
                "distance_from_tlv": distance
            })
        return results if results else None

    except Exception as e:
        print(f"Error in match data: {e}")
        return None
    

def run_engine_for_user(user_id_input):
    user = None
    try:
        user = db.users.find_one({"_id": ObjectId(user_id_input)})
    except:
        user = db.users.find_one({"_id": user_id_input})

    if not user:
        print(f"DEBUG: User {user_id_input} not found in DB")
        return
    
    print(f"DEBUG: Found user {user.get('username')}. Deleting old matches...")
    db.suggested_matches.delete_many({"user_id": user_id_input})
    
    main_favorite = user.get("favoriteTeamId")
    other_interests = user.get("otherInterestTeamsIds", [])
    
    all_teams_to_check = []
    if main_favorite:
        all_teams_to_check.append(main_favorite)
    if isinstance(other_interests, list):
        all_teams_to_check.extend(other_interests)
        
    all_teams_to_check = list(set(all_teams_to_check))
    print(f"DEBUG: Teams to process: {all_teams_to_check}")

    #origin = user.get("origin_iata") or user.get("origin") or "TLV"

    print(f"DEBUG: Deleting old matches for user {user_id_input}")
    db.suggested_matches.delete_many({"user_id": user_id_input})

    for team in all_teams_to_check:
        print(f"DEBUG: Fetching matches for team ID: {team}...")
        matches_list = get_match_data_hybrid(team)
    
        print(f"DEBUG: matches_list result = {matches_list}")
        
        if matches_list:
            for match_data in matches_list:
                print(f"DEBUG: Saving match: {match_data['home_team']} vs {match_data['away_team']}")
                
                db.suggested_matches.update_one(
                    {
                        "user_id": user_id_input, 
                        "team": str(team), 
                        "match.match_date": match_data['match_date']
                    },
                    {"$set": {
                        "match": match_data,
                        # "flight_availability": match_data['flight_availability'],
                        "updated_at": datetime.utcnow(),
                        "status": "active"
                    }},
                    upsert=True
                )
        
        time.sleep(1.2)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_user_id = sys.argv[1].strip()
        run_engine_for_user(target_user_id)