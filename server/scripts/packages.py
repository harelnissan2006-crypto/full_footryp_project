import sys
import json
import requests
import os
from datetime import datetime, timedelta
from amadeus import Client
from pymongo import MongoClient
from bson.objectid import ObjectId

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

amadeus = Client(
    client_id='MtlgyNLQ5nhoy5RuOkqmeoyYWeHwhd83',
    client_secret='GvbOjgVE2vsA0sru'
)

MONGO_URI = "mongodb://localhost:27017/"
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["footryp"]

def log(msg):
    print(msg, file=sys.stderr, flush=True)

def load_mapping():
    base_path = os.path.dirname(__file__)
    mapping_path = os.path.join(base_path, 'mapping.json')
    with open(mapping_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    mapping = {}
    for league, teams in raw.items():
        for team_name, team_info in teams.items():
            mapping[team_name] = team_info
    return mapping

TEAM_MAPPING = load_mapping()

def get_cached_hotels(cache_key):
    doc = db.packages_cache.find_one({"cacheKey": cache_key})
    if not doc:
        return None
    age = (datetime.utcnow() - doc['createdAt']).total_seconds()
    if age > 86400:
        db.packages_cache.delete_one({"cacheKey": cache_key})
        return None
    log(f"Cache hit for key: {cache_key}")
    return doc['hotels']

def save_cached_hotels(cache_key, hotels):
    db.packages_cache.update_one(
        {"cacheKey": cache_key},
        {"$set": {"hotels": hotels, "createdAt": datetime.utcnow()}},
        upsert=True
    )
    log(f"Cached {len(hotels)} hotels for key: {cache_key}")

# def get_hotels(city_code, check_in, check_out):
#     cache_key = f"{city_code}_{check_in}_{check_out}"
#     cached = get_cached_hotels(cache_key)
#     if cached:
#         return cached
    
#     try:
#         log(f"Fetching hotel list for {city_code}")
#         list_response = amadeus.reference_data.locations.hotels.by_city.get(
#             cityCode=city_code,
#             radius=20,
#             radiusUnit='KM',
#             ratings=[3,4,5]
#         )
#         if not list_response.data:
#             log(f"No hotels found for city code: {city_code}")
#             return []
        
#         hotel_ids = [h['hotelId'] for h in list_response.data[:10]]
#         log(f"Found {len(hotel_ids)} hotels, fetching prices...")

#         search_response = amadeus.shopping.hotel_offers_search.get(
#             hotelIds=hotel_ids,  
#             checkInDate=check_in,
#             checkOutDate=check_out,
#             adults=1,
#             currency='USD',
#             bestRateOnly=True
#         )
#         hotels=[]
#         for offer in search_response.data:
#             hotel = offer.get('hotel', {})
#             offers = offer.get('offers', [])
#             if not offers:
#                 continue

#             price = float(offers[0]['price']['total'])
#             hotels.append({
#                 "hotelId": hotel.get('hotelId'),
#                 "name": hotel.get('name'),
#                 "rating": hotel.get('rating', 3),
#                 "latitude": hotel.get('latitude'),
#                 "longitude": hotel.get('longitude'),
#                 "price": price,
#                 "currency": "USD"
#             })
#         save_cached_hotels(cache_key, hotels)
#         return hotels
#     except Exception as e:
#         log(f"Error fetching hotels: {e}")
#         return get_mock_hotels(city_code)

def get_hotels(city_code, check_in, check_out):
    cache_key = f"{city_code}_{check_in}_{check_out}"
    cached = get_cached_hotels(cache_key)
    if cached:
        return cached

    try:
        # ✅ קבל access token
        token_response = requests.post(
            'https://test.api.amadeus.com/v1/security/oauth2/token',
            data={
                'grant_type': 'client_credentials',
                'client_id': amadeus.client_id,
                'client_secret': amadeus.client_secret
            }
        )
        token = token_response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}

        # ✅ Hotel List
        log(f"Fetching hotel list for {city_code}")
        list_res = requests.get(
            'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city',
            headers=headers,
            params={
                'cityCode': city_code,
                'radius': 20,
                'radiusUnit': 'KM',
                'ratings': '3,4,5'
            }
        )
        hotels_data = list_res.json().get('data', [])
        if not hotels_data:
            log(f"No hotels found for {city_code}")
            return get_mock_hotels(city_code)

        hotel_ids = [h['hotelId'] for h in hotels_data[:10]]
        log(f"Found {len(hotel_ids)} hotels, fetching prices...")

        # ✅ Hotel Offers
        offers_res = requests.get(
            'https://test.api.amadeus.com/v3/shopping/hotel-offers',
            headers=headers,
            params={
                'hotelIds': ','.join(hotel_ids),
                'checkInDate': check_in,
                'checkOutDate': check_out,
                'adults': 1,
                'currency': 'USD',
                'bestRateOnly': 'true'
            }
        )
        offers_data = offers_res.json().get('data', [])
        log(f"Hotel offers response status: {offers_res.status_code}")

        hotels = []
        for offer in offers_data:
            hotel = offer.get('hotel', {})
            offers = offer.get('offers', [])
            if not offers:
                continue
            price = float(offers[0]['price']['total'])
            hotels.append({
                "hotelId": hotel.get('hotelId'),
                "name": hotel.get('name'),
                "rating": hotel.get('rating', 3),
                "latitude": hotel.get('latitude'),
                "longitude": hotel.get('longitude'),
                "price": price,
                "currency": "USD"
            })

        if not hotels:
            log("No hotel offers found, using mock")
            return get_mock_hotels(city_code)

        save_cached_hotels(cache_key, hotels)
        return hotels

    except Exception as e:
        log(f"Error fetching hotels: {e}")
        return get_mock_hotels(city_code)

def get_mock_hotels(city):
    return [
        {"hotelId": "mock1", "name": f"Grand Hotel {city}", "rating": 4,
         "latitude": 0, "longitude": 0, "price": 120.0, "currency": "USD"},
        {"hotelId": "mock2", "name": f"City Inn {city}", "rating": 3,
         "latitude": 0, "longitude": 0, "price": 80.0, "currency": "USD"},
        {"hotelId": "mock3", "name": f"Luxury Palace {city}", "rating": 5,
         "latitude": 0, "longitude": 0, "price": 250.0, "currency": "USD"},
    ]

def calculate_estimated_price(distance, flight_date_str):
    base_price = 50
    price_per_km = 0.07
    target_date = datetime.strptime(flight_date_str, "%Y-%m-%d")
    days_until = (target_date - datetime.utcnow()).days
    if days_until > 30:
        urgency_factor = 1.0
    elif days_until > 7:
        urgency_factor = 1.6
    else:
        urgency_factor = 2.5
    return round((base_price + (distance * price_per_km)) * urgency_factor, 2)

def get_flight(origin_iata, dest_iata, flight_date, distance=3000):
    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin_iata,
            destinationLocationCode=dest_iata,
            departureDate=flight_date,
            adults=1,
            max=3
        )
        if response.data:
            offers = []
            for offer in response.data:
                offers.append({
                    "price": float(offer['price']['total']),
                    "duration": offer['itineraries'][0]['duration'],
                    "stops": len(offer['itineraries'][0]['segments']) - 1,
                    "source": "Amadeus"
                })
            return offers
        raise Exception("No flight offers found")
    except Exception as e:
        log(f"Flight fallback: {e}")
        estimated = calculate_estimated_price(distance, flight_date)
        return [{"price": estimated, "duration": "N/A", "stops": 0, "source": "Predictive Model"}]
    
def score_package(flight_price, hotel_price, hotel_rating, budget_level, risk_tolerance):
    total_price = flight_price + hotel_price

    price_norm = min(total_price/3000, 1.0)
    rating_norm = hotel_rating / 5.0

    w_price = 1.0 - (budget_level/5.0)
    w_rating = budget_level/5.0

    score = (w_price*(1-price_norm) + w_rating*rating_norm)*100
    return round(score,1)

def get_recommendation(flight_price, hotel_price, match_date_str):
    total = flight_price + hotel_price
    match_date = datetime.strptime(match_date_str, "%Y-%m-%d")
    days_until = (match_date - datetime.utcnow()).days

    if days_until > 30 and total < 800:
        return "Great deal! Book now to lock in this price."
    elif days_until > 14 and total < 1200:
        return "Good price, but it may rise. Consider it"
    elif days_until <= 14:
        return "Last Minute - prices are high"
    else: 
        return "Wait, prices may drop"
    
def run_packages(user_id, match_data_json):
    try:
        match_data = json.loads(match_data_json)
    except Exception as e:
        print(json.dumps({"error": f"Invalid match data: {e}"}))
        return
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        print(json.dumps({"error": "User not found"}))
        return
    
    budget_level = user.get("budgetLevel", 3)
    risk_tolerance = user.get("riskTolerance", 3)
    origin_iata = user.get('origin_iata', 'TLV')

    home_iata = match_data.get('home_iata')
    home_city = match_data.get('home_city')
    match_date = match_data.get('match_date')
    flight_date = match_data.get('flight_date')
    distance = match_data.get('distance_from_tlv', 3000)

    check_in = flight_date
    check_out_date = datetime.strptime(match_date, "%Y-%m-%d") + timedelta(days=1)
    check_out = check_out_date.strftime("%Y-%m-%d")

    city_code = home_iata[:3] if home_iata else 'LON'

    log(f"Fetching hotels in {city_code} from {check_in} to {check_out}")
    hotels = get_hotels(city_code, check_in, check_out)

    log(f"Fetching flights from {origin_iata} to {home_iata} on {flight_date}")
    flights = get_flight(origin_iata, home_iata, flight_date, distance)

    packages = []
    for flight in flights:
        for hotel in hotels:
            score = score_package(
                flight['price'], hotel['price'],
                hotel.get('rating', 3),
                budget_level, risk_tolerance
            )
            recommendation = get_recommendation(flight['price'], hotel['price'], match_date)
            packages.append({
                "flight": flight,
                "hotel": hotel,
                "totalPrice": round(flight['price'] + hotel['price'], 2),
                "score": score,
                "recommendation": recommendation
            })
    packages.sort(key=lambda x: x['score'], reverse=True)
    result = {
        "match": match_data,
        "packages": packages[:5]
    }
    print(json.dumps(result, ensure_ascii=False), flush=True)

if __name__ == "__main__":
    if len(sys.argv) > 2:
        run_packages(sys.argv[1], sys.argv[2])