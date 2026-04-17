import sys
import json
import requests
import time
from datetime import datetime, timedelta
from amadeus import Client
import unicodedata
from pymongo import MongoClient
import os
from bson.objectid import ObjectId

amadeus = Client(
    client_id = 'MtlgyNLQ5nhoy5RuOkqmeoyYWeHwhd83',
    client_secret = 'GvbOjgVE2vsA0sru')

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
        return json.load(f)
    
TEAM_MAPPING = load_mapping()

def get_city_and_coords(address):
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
        print(f"Error fetching city and coordinates for '{address}': {e}")
    return None, None, None


def get_nearest_iata(latitude, longitude):
    try:
        response = amadeus.reference_data.locations.airports.get(
            latitude=latitude,
            longitude=longitude,
            radius=100
        )
        if response.data:
            return response.data[0]['iataCode']
    except Exception as e:
        print(f"Error finding nearest IATA code for coordinates ({latitude}, {longitude}): {e}")
    return None


def check_flight_availability(origin_iata, destination_iata, departure_date):
    try:
        # בדיקה שהפרמטרים לא ריקים
        if not origin_iata or not destination_iata:
            return {"direct": False, "status": "missing_iata"}

        print(f"DEBUG: Calling Amadeus with: Origin={origin_iata}, Dest={destination_iata}, Date={departure_date}")

        # קריאה עם מינימום פרמטרים - הכי בטוח ל-Sandbox
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin_iata,
            destinationLocationCode=destination_iata,
            departureDate=departure_date,
            adults=1,
            max=1  # חשוב מאוד! לבקש רק הצעה אחת
        )

        if response.data:
            # שליפת המחיר אם קיים
            price = response.data[0]['price']['total']
            return {
                "direct": True, 
                "connecting": False, 
                "status": "success", 
                "price": price
            }
        
        return {"direct": False, "connecting": False, "status": "no_offers"}

    except Exception as e:
        print(f"Amadeus API Error: {e}")
        # כאן נכנס ה-Fallback שדיברנו עליו - אל תיתן לקוד לקרוס
        return {
            "direct": True, 
            "connecting": True, 
            "status": "simulated", 
            "note": "API 500 Error - using default availability"
        }





def get_match_data_hybrid(team_input, user_origin_iata='TLV', days_before=1):
    official_name = None
    team_id = None
    search_term = str(team_input)

    # שלב 1: זיהוי הקבוצה ב-Mapping
    for name, info in TEAM_MAPPING.items():
        if str(info.get('team_id')) == search_term:
            official_name = name
            team_id = info['team_id']
            break
        if normalize(search_term) in normalize(name) or normalize(name) in normalize(search_term):
            official_name = name
            team_id = info['team_id']
            break

    if not team_id:
        print(f"'{team_input}' is not supported. Please add it to mapping.json.")
        return None

    # שלב 2: שליפת משחקים מתוזמנים מה-API
    url = f"https://api.football-data.org/v4/teams/{team_id}/matches?status=SCHEDULED"
    headers = {'X-Auth-Token': 'a2489751469b4a6a898298366aed99fa'}

    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        matches = data.get('matches', [])
        
        if not matches:
            print(f"No scheduled matches found for {official_name}.")
            return None

        # שלב 3: ניתוח המשחק הקרוב וחיפוש טיסה
        next_match = matches[0]
        home_team_name = next_match['homeTeam']['name']
        match_date_str = next_match['utcDate'].split('T')[0]
        match_date = datetime.strptime(match_date_str, "%Y-%m-%d")
        
        # חישוב תאריך טיסה לפי רמת סיכון
        flight_date = match_date - timedelta(days=days_before)
        flight_date_str = flight_date.strftime("%Y-%m-%d")

        # זיהוי עיר היעד וה-IATA שלה מתוך ה-Mapping
        dest_info = next(
            (info for n, info in TEAM_MAPPING.items() 
             if normalize(info.get('api_name', n)) == normalize(home_team_name)), 
            None
        )

        if not dest_info:
            print(f"Could not determine destination info for '{home_team_name}'.")
            return None

        home_city = dest_info['city']
        home_iata = dest_info['iata']

        # שלב 4: בדיקת טיסות
        if user_origin_iata == home_iata:
            flight_result = {"direct": True, "connecting": False, "note": "Local Match"}
        else:
            flight_result = check_flight_availability(user_origin_iata, home_iata, flight_date_str)

        risk_label = "High" if days_before == 0 else "Medium" if days_before == 1 else "Low"

        return {
            "home_team": home_team_name,
            "away_team": next_match['awayTeam']['name'],
            "match_date": match_date_str,
            "match_time": next_match['utcDate'].split('T')[1].replace('Z', ''),
            "flight_date": flight_date_str,
            "flight_availability": flight_result,
            "risk_level": risk_label,
            "home_city": home_city,
            "home_iata": home_iata
        }

    except Exception as e:
        print(f"ERROR in get_match_data_hybrid: {e}")
        return None





def run_engine_for_user(user_id_input):
    user = None
    try:
        user = db.users.find_one({"_id": ObjectId(user_id_input)})
    except:
        user = db.users.find_one({"_id": user_id_input})

    if not user:
        print(f"User with ID {user_id_input} not found.")
        return
    
    raw_teams = user.get("favoriteTeamId") or user.get("favoriteTeam") or user.get("favorite_teams")
    if raw_teams is None:
        print(f"No teams found for user {user_id_input}")
        return
    
    favorite_teams = raw_teams if isinstance(raw_teams, list) else [raw_teams]
    origin = user.get("origin_iata") or user.get("origin") or "TLV"

    for team in favorite_teams:
        print(f"Searching for team: {team}")
        match_data = get_match_data_hybrid(team, origin)
        
        if match_data:
        # במקום לקרוא שוב ל-check_flight_availability, פשוט תשלוף מה שכבר יש ב-match_data
            flight_info = match_data.get('flight_availability') 
            db.suggested_matches.update_one(
                {"user_id": user_id_input, "team": str(team)},
                {"$set": {
                "match": match_data,
                "flight_availability": flight_info, 
                "updated_at": datetime.utcnow(),
                "status": "active"
                }},
            upsert=True
            )
            print(f"Match saved for team {team}")
        time.sleep(2)







if __name__ == "__main__":
    if len(sys.argv)>1:
        target_user_id = sys.argv[1].strip()
        print(f"Running engine for user ID: {target_user_id}")
        run_engine_for_user(target_user_id)
            