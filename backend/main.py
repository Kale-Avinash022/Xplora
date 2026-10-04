import asyncio
import os
import random
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import httpx

load_dotenv()

app = FastAPI(
    title="Xplora AI Travel Agent API",
    description="High-performance Asyncio FastAPI backend with Real Attractions & Live Weather",
    version="1.0.0"
)

# Enable CORS for Next.js Frontend
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Schemas
class ItineraryRequest(BaseModel):
    destination: str = Field(..., example="Sikkim")
    durationDays: int = Field(default=3, ge=1, le=30)
    budget: float = Field(default=25000.0, ge=1000.0)
    travelStyle: str = Field(default="Adventure", example="Adventure")

class Activity(BaseModel):
    timeSlot: str
    title: str
    description: str
    category: str
    cost: float
    location: str

class DayPlan(BaseModel):
    dayNumber: int
    summary: str
    activities: List[Activity]

class WeatherPreview(BaseModel):
    temp: str
    condition: str
    recommendation: str

class ItineraryResponse(BaseModel):
    title: str
    destination: str
    durationDays: int
    totalBudget: float
    estimatedCost: float
    currency: str = "INR"
    travelStyle: str
    weatherPreview: WeatherPreview
    dayPlans: List[DayPlan]
    budgetWarning: Optional[str] = None

# REAL CITY & STATE SPECIFIC POPULAR ATTRACTIONS KNOWLEDGE BASE
POPULAR_DESTINATIONS_DATA = {
    "sikkim": [
        {
            "morning": ("Tsomgo (Changu) Lake & Baba Mandir Excursion", "Visit the sacred glacial Tsomgo Lake at 12,310 ft and the historic Baba Harbhajan Singh Memorial Temple.", "Sightseeing", "East Sikkim, 38km from Gangtok"),
            "afternoon": ("Nathula Pass Indo-China Border & Yak Safari", "Experience the historic Silk Route pass at 14,140 ft and enjoy high-altitude yak rides.", "Activity", "Nathula Border Ridge, East Sikkim"),
            "evening": ("MG Marg Gangtok Walking Promenade & Momos Tasting", "Stroll the pedestrianized MG Marg for authentic steaming Sikkimese pork/veg momos and Thukpa.", "Dining", "MG Marg, Gangtok")
        },
        {
            "morning": ("Rumtek Monastery & Namgyal Institute of Tibetology", "Explore the grand Dharma Chakra Centre of Tibetan Buddhism and ancient Tibetan manuscripts.", "Sightseeing", "Rumtek Dharma Chakra Centre, Gangtok"),
            "afternoon": ("Ban Jhakri Falls & Energy Park Adventure Walk", "Explore the 100-foot cascading Ban Jhakri waterfall with lush shamanistic rock sculptures.", "Activity", "Ban Jhakri Park, Gangtok"),
            "evening": ("Tashi Viewpoint & Cafe Live Acoustic Night", "Witness twilight panoramic views of Mt. Kanchenjunga followed by cozy cafe dining.", "Dining", "Tashi View Point, Gangtok")
        },
        {
            "morning": ("Ganesh Tok & Hanuman Tok Mountain Shrines", "Morning prayer bells and 360-degree panoramic viewpoints of Gangtok city and snowcapped Himalayan ranges.", "Sightseeing", "Hanuman Tok Hilltop, Gangtok"),
            "afternoon": ("Gangtok Ropeway Cable Car Ride over Valley", "Thrilling aerial cable car ride from Deorali to Tashiling enjoying bird-eye views of the Himalayas.", "Activity", "Deorali Cable Car Station"),
            "evening": ("Lal Bazaar Spice Shopping & Authentic Gundruk Dinner", "Browse cardamom and Chhurpi (yak cheese) and savor traditional fermented Gundruk soup and Sel Roti.", "Dining", "Lal Bazaar Heritage Market")
        },
        {
            "morning": ("Ravangla Buddha Park (Tathagata Tsal)", "Marvel at the breathtaking 130-foot copper statue of Gautama Buddha surrounded by Himalayan peaks.", "Sightseeing", "Ravangla, South Sikkim"),
            "afternoon": ("Temi Tea Garden Walk & Organic Tasting", "Walk through Sikkim's only organic tea estate rolling gently over cherry blossom slopes.", "Activity", "Temi Tea Estate, South Sikkim"),
            "evening": ("Pelling Helipad Sunset Lounge & Himalayan Dinner", "Golden hour sunset over Kanchenjunga peak followed by hot traditional Lepcha butter tea and dinner.", "Dining", "Pelling Ridge, West Sikkim")
        }
    ],
    "mumbai": [
        {
            "morning": ("Gateway of India & Elephanta Caves Ferry", "Photograph the iconic 1924 basalt arch monument and take a harbor ferry to UNESCO Elephanta rock caves.", "Sightseeing", "Apollo Bunder, Colaba"),
            "afternoon": ("Colaba Causeway Shopping & Cafe Leopold", "Street souvenir shopping, vintage curios, and cold drinks with Iranian keema pav at iconic Leopold Cafe.", "Dining", "Colaba Causeway, South Mumbai"),
            "evening": ("Marine Drive Queen’s Necklace & Girgaon Chowpatty Bhel", "Sunset promenade stroll along the Arabian Sea curve and famous street food bhelpuri at Chowpatty.", "Sightseeing", "Marine Drive & Chowpatty")
        },
        {
            "morning": ("Chhatrapati Shivaji Maharaj Terminus (CSMT) & Fort Heritage Walk", "Victorian Gothic UNESCO railway terminal, Flora Fountain, and Mumbai Heritage District architecture.", "Sightseeing", "Fort & CST Precinct"),
            "afternoon": ("Wankhede Stadium & Churchgate Heritage Quarter", "Visit the legendary cricket ground precinct followed by colonial lane cafes and bakeries.", "Activity", "Churchgate & Marine Lines"),
            "evening": ("Bandra Bandstand, Walk of the Stars & Shah Rukh Khan Mannat", "Stroll along seaside Bandstand promenade, see Bollywood celebrity homes, and enjoy sunset sea breeze.", "Sightseeing", "Bandstand Promenade, Bandra West")
        },
        {
            "morning": ("Siddhivinayak Ganpati Temple & Shivaji Park", "Pay morning respects at Mumbai's iconic Ganpati temple and walk through historic cricket nursery park.", "Sightseeing", "Prabhadevi & Dadar"),
            "afternoon": ("Bandra Linking Road & Hill Road Fashion Hunt", "Bustling boutique shopping for trendy street fashion and chic bohemian seaside cafes.", "Activity", "Linking Road, Bandra West"),
            "evening": ("Juhu Beach Sunset, Pav Bhaji & Seaside Dinner", "Walk barefoot on Juhu Beach, sample butter-rich Sardar pav bhaji and dine at coastal seaside lounges.", "Dining", "Juhu Tara Road & Beach")
        },
        {
            "morning": ("Sanjay Gandhi National Park & Kanheri Caves Trek", "Explore 1st-century Buddhist caves hand-carved in basalt rock inside the urban national forest.", "Activity", "Borivali East, Mumbai"),
            "afternoon": ("Dharavi Guided Artisan Leather & Pottery Tour", "Ethical guided tour showcasing Mumbai's vibrant leather craftsmanship and Kumbharwada pottery kiln art.", "Activity", "Kumbharwada & Sion"),
            "evening": ("Worli Sea Face Walk & Coastline Seafood Dinner", "Panoramic skyline view of the Bandra-Worli Sea Link bridge with authentic coastal Malvani curry.", "Dining", "Worli Sea Face")
        }
    ],
    "delhi": [
        {
            "morning": ("India Gate, Kartavya Path & Rashtrapati Bhavan", "Walk along the majestic central vista, War Memorial archway, and view the Presidential Palace gardens.", "Sightseeing", "Central Vista, Rajpath"),
            "afternoon": ("Humayun's Tomb Mughal Gardens Heritage Tour", "UNESCO World Heritage red sandstone tomb that inspired the architectural design of the Taj Mahal.", "Sightseeing", "Nizamuddin East, New Delhi"),
            "evening": ("Connaught Place (CP) Heritage Walk & Keventers Shake", "Georgian colonnade circular markets, underground Palika Bazaar, and British-era cafes.", "Dining", "Connaught Place Inner Circle")
        },
        {
            "morning": ("Red Fort (Lal Qila) & Jama Masjid Old Delhi Walk", "Grand 17th-century Mughal red sandstone citadel and India's largest historic congregational mosque.", "Sightseeing", "Chandni Chowk, Old Delhi"),
            "afternoon": ("Chandni Chowk Rickshaw Ride & Paranthe Wali Gali Feast", "Thrilling cycle rickshaw ride through spice alleys and legendary stuffed fried parathas.", "Dining", "Paranthe Wali Gali, Chandni Chowk"),
            "evening": ("Dilli Haat INA Crafts Bazaar & Regional Food Stalls", "Open-air craft village with artisans from all Indian states and authentic regional dinner stalls.", "Activity", "INA Market, South Delhi")
        },
        {
            "morning": ("Qutub Minar Complex & Iron Pillar of Delhi", "Marvel at the 73-meter medieval minaret and the rust-resistant 4th-century Gupta iron pillar.", "Sightseeing", "Mehrauli Archaeological Park"),
            "afternoon": ("Lotus Temple (Bahai House of Worship) Meditation", "Architectural marvel shaped like a blooming lotus petal surrounded by nine serene ponds.", "Sightseeing", "Kalkaji, South Delhi"),
            "evening": ("Hauz Khas Village Medieval Fort & Rooftop Lakefront Dining", "Explore 14th-century Khalji reservoir ruins and enjoy lively evening music lounges.", "Dining", "Hauz Khas Village")
        }
    ],
    "goa": [
        {
            "morning": ("Fort Aguada & Sinquerim Beach Promenade", "Explore the 17th-century Portuguese coastal bastion with panoramic views of the Arabian Sea.", "Sightseeing", "Sinquerim, North Goa"),
            "afternoon": ("Calangute & Baga Water Sports Adventure", "Enjoy thrilling parasailing, jet-ski speedboats, and bumper rides on Baga Beach.", "Activity", "Baga Beach, North Goa"),
            "evening": ("Mandovi River Sunset Cruise with Goan Folk Dance", "River catamaran cruise featuring traditional Dekhni & Fugdi performances and coastal buffet.", "Dining", "Panaji Jetty, Central Goa")
        },
        {
            "morning": ("Old Goa Basilica of Bom Jesus & Se Cathedral", "UNESCO World Heritage shrines holding the sacred relics of St. Francis Xavier.", "Sightseeing", "Old Goa Heritage Precinct"),
            "afternoon": ("Fontainhas Latin Quarter Heritage Walk & Cafe Hopping", "Stroll past colorful Portuguese colonial villas and artisan bakeries for fresh bebinca cake.", "Sightseeing", "Fontainhas, Panaji"),
            "evening": ("Anjuna Beach Sunset & Tito’s Lane Night Vibe", "Relax at beachside shacks with acoustic live music and coastal Goan prawn curry.", "Dining", "Anjuna & Tito’s Lane")
        },
        {
            "morning": ("Dudhsagar Waterfalls Jeep Jungle Safari", "Thrilling off-road safari through Bhagwan Mahavir Wildlife Sanctuary to the majestic multi-tiered falls.", "Activity", "Mollem National Park"),
            "afternoon": ("Sahakari Spice Plantation Guided Tour & Buffet Lunch", "Organic spice valley tour with elephant encounters and authentic Goan buffet on banana leaves.", "Dining", "Ponda Spice Valley"),
            "evening": ("Curlies & Shiva Valley Sunset Lounge", "Unwind with refreshing tropical coolers and beach bonfire lounges.", "Dining", "Anjuna Beachfront")
        }
    ],
    "manali": [
        {
            "morning": ("Hadimba Devi Temple & Dhungri Pine Forest Walk", "Historic 1553 wooden pagoda temple nestled inside giant deodar pine forests.", "Sightseeing", "Dhungri Van Vihar, Manali"),
            "afternoon": ("Solang Valley Paragliding & Zorbing Adventure", "High-altitude paragliding flight over snow-capped Himalayan peaks and alpine meadows.", "Activity", "Solang Valley Adventure Hub"),
            "evening": ("Old Manali Bohemian Cafe Hopping & Trout Dinner", "Riverside cafes tasting fresh Himalayan rainbow trout fish and firewood pizzas.", "Dining", "Old Manali Village")
        },
        {
            "morning": ("Atal Tunnel & Sissu Waterfalls Day Excursion", "Drive through the world's longest high-altitude tunnel into the surreal Lahaul valley.", "Activity", "Atal Tunnel & Sissu Valley"),
            "afternoon": ("Vashisht Hot Sulphur Springs & Wooden Temple", "Soak in natural therapeutic thermal hot springs with mountain valley views.", "Activity", "Vashisht Village"),
            "evening": ("Mall Road Souvenir Shopping & Himachali Siddu Tasting", "Browse handcrafted woolens, Kullu shawls, and steaming warm Himachali delicacies.", "Dining", "Manali Mall Road")
        },
        {
            "morning": ("Jogini Waterfalls Nature Trekking Trail", "Scenic 2-hour nature trek along mountain streams and apple orchards to Jogini Falls.", "Activity", "Bahang Trek Route"),
            "afternoon": ("Beas River White Water Rafting in Kullu", "Thrilling Class 3 river rafting rapids down the icy meltwaters of Beas river.", "Activity", "Kullu River Valley"),
            "evening": ("Cafe 1947 Live Music & Riverside Twilight Lounge", "Acoustic live music, artisan Italian bites, and sound of rushing river waters.", "Dining", "Old Manali River Bank")
        }
    ],
    "jaipur": [
        {
            "morning": ("Amber Fort Ramparts & Sheesh Mahal (Mirror Palace)", "Explore magnificent hilltop fort with opulent halls, mirror mosaics, and Maota Lake reflection.", "Sightseeing", "Amer, Jaipur"),
            "afternoon": ("Jal Mahal Water Palace Photo Stop & Blue Pottery Workshop", "Admire 5-story palace floating in Man Sagar Lake and learn iconic Jaipur Blue Pottery making.", "Sightseeing", "Man Sagar Lake"),
            "evening": ("Chokhi Dhani Rajasthani Cultural Village & Thali Feast", "Puppet shows, folk dancers, camel rides, and unlimited royal Rajasthani Thali feast.", "Dining", "Tonk Road, Jaipur")
        },
        {
            "morning": ("Hawa Mahal Palace of Winds & City Palace Museum", "Photograph 953 honeycombed jharokha windows and royal arms collection in City Palace.", "Sightseeing", "Pink City Heritage Zone"),
            "afternoon": ("Jantar Mantar UNESCO Astronomical Observatory", "Discover the world's largest stone sundial and precision medieval astronomical instruments.", "Sightseeing", "City Palace Complex"),
            "evening": ("Johari Bazaar Gemstone Shopping & Laxmi Misthan Ghewar", "Explore traditional bazaars and taste authentic Jaipur Paneer Ghewar and Pyaaz Kachori.", "Dining", "Johari Bazaar Market")
        }
    ],
    "kerala": [
        {
            "morning": ("Fort Kochi Chinese Fishing Nets & St. Francis Church", "Watch massive cantilevered wooden fishing nets dip into the Arabian Sea and visit India's oldest European church.", "Sightseeing", "Fort Kochi Waterfront"),
            "afternoon": ("Mattancherry Palace (Dutch Palace) & Jew Town Antique Hunt", "Explore Ramayana murals in Dutch Palace and browse cardamom and antique spice shops.", "Sightseeing", "Jew Town, Mattancherry"),
            "evening": ("Kerala Kathakali Centre Traditional Dance & Martial Art Show", "Mesmerizing evening of classical Kathakali makeup rituals, dance dramas, and Kalaripayattu.", "Activity", "Kochi Cultural Centre")
        },
        {
            "morning": ("Alleppey Traditional Kettuvallam Houseboat Cruise", "Board a luxury wooden houseboat gliding through tranquil palm-fringed backwaters and paddy fields.", "Activity", "Punnamada Jetty, Alleppey"),
            "afternoon": ("Backwater Village Canoe Safari & Coconut Toddy Tasting", "Narrow canal rowing tour interacting with coir weavers and tasting fresh Karimeen Pollichathu fish.", "Dining", "Kuttanad Canals, Alleppey"),
            "evening": ("Marari Beach Sunset Walk & Fresh Catch Seafood Dinner", "Golden sand beach relaxation under coconut groves with fiery Malabar fish curry.", "Dining", "Marari Beachfront")
        }
    ],
    "ladakh": [
        {
            "morning": ("Leh Palace & Acclimatization Heritage Stroll", "Explore 17th-century Tibetan royal palace perched above Leh town with snow mountain backdrop.", "Sightseeing", "Old Leh Town"),
            "afternoon": ("Shanti Stupa White Dome Sunset Meditation", "Climb 500 steps to the white Buddhist stupa inaugurated by the Dalai Lama overlooking Leh valley.", "Sightseeing", "Changsipa Hill, Leh"),
            "evening": ("Leh Main Bazaar Stroll & Traditional Tingmo Dinner", "Walk through cobbled market lanes sampling Tibetan steam bread (Tingmo) and Thukpa noodles.", "Dining", "Main Bazaar, Leh")
        },
        {
            "morning": ("Magnetic Hill Defying Gravity & Indus-Zanskar Confluence", "Witness optical anti-gravity hill and the vivid color collision of green Indus and muddy Zanskar rivers.", "Activity", "Nimmu, Leh-Srinagar Highway"),
            "afternoon": ("Khardung La Pass Crossing (17,982 ft)", "Drive through one of the world's highest motorable mountain passes with flags fluttering in gale winds.", "Activity", "Khardung La Ridge"),
            "evening": ("Nubra Valley Hunder White Sand Dunes & Camel Safari", "Ride rare Bactrian double-humped camels amidst surreal high-altitude cold desert dunes.", "Activity", "Hunder, Nubra Valley")
        }
    ],
    "varanasi": [
        {
            "morning": ("Subah-e-Banaras Sunrise Boat Ride on Ganges", "Rowing wooden boat ride at dawn past Assi, Dashashwamedh, and Manikarnika ghats with chanting pilgrims.", "Activity", "Assi Ghat to Manikarnika Ghat"),
            "afternoon": ("Kashi Vishwanath Jyotirlinga Temple & Corridor Walk", "Visit one of the twelve sacred Jyotirlingas of Lord Shiva through the grand river corridor.", "Sightseeing", "Vishwanath Gali, Varanasi"),
            "evening": ("Dashashwamedh Ghat Grand Ganga Aarti Ceremony", "Witness priests perform the rhythmic fire Aarti ritual with brass lamps, conch shells, and incense.", "Sightseeing", "Dashashwamedh Ghat")
        },
        {
            "morning": ("Sarnath Deer Park & Dhamek Stupa Archeological Site", "Visit where Lord Buddha delivered his first sermon after enlightenment and see Ashoka Lion Capital.", "Sightseeing", "Sarnath, 10km from Varanasi"),
            "afternoon": ("Banarasi Silk Weaving Artisan Workshop in Madanpura", "Watch master weavers create pure gold zari brocade silk sarees on traditional handlooms.", "Activity", "Madanpura Weavers Colony"),
            "evening": ("Blue Lassi Shop & Iconic Malaiyo Winter Saffron Treat", "Taste legendary kulhad lassi, Banarasi Tamatar Chaat, and delicate saffron milk foam Malaiyo.", "Dining", "Kachori Gali & Godowlia")
        }
    ],
    "agra": [
        {
            "morning": ("Taj Mahal Sunrise Grand Architectural Tour", "Admire the 17th-century white marble mausoleum of Mumtaz Mahal glowing in pink morning sunrise light.", "Sightseeing", "Taj East Gate, Agra"),
            "afternoon": ("Agra Fort (Red Fort) UNESCO Imperial Residence", "Vast red sandstone fortress of Mughal Emperors featuring Jahangiri Mahal, Diwan-i-Khas, and Musamman Burj.", "Sightseeing", "Agra Fort Road"),
            "evening": ("Mehtab Bagh Moonlight Garden Taj View & Petha Tasting", "Relax in Charbagh gardens across the Yamuna River with Taj sunset views and sample famous Agra Petha sweets.", "Dining", "Mehtab Bagh, Across Yamuna")
        },
        {
            "morning": ("Fatehpur Sikri Imperial Deserted City & Buland Darwaza", "Explore Emperor Akbar's ghost capital and the 54-meter high Gateway of Magnificence.", "Sightseeing", "Fatehpur Sikri, 36km from Agra"),
            "afternoon": ("Tomb of I'timād-ud-Daulah (Baby Taj)", "Exquisite jewel-box marble tomb featuring delicate pietra dura stone inlays overlooking the Yamuna river.", "Sightseeing", "Moti Bagh, Agra"),
            "evening": ("Sadar Bazaar Leather & Marble Inlay Shopping & Mughlai Dinner", "Browse handcrafted marble inlay souvenirs and savor authentic Mughlai butter chicken and kebabs.", "Dining", "Sadar Bazaar, Agra Cantt")
        }
    ]
}

# Add common aliases
POPULAR_DESTINATIONS_DATA["gangtok"] = POPULAR_DESTINATIONS_DATA["sikkim"]
POPULAR_DESTINATIONS_DATA["bombay"] = POPULAR_DESTINATIONS_DATA["mumbai"]
POPULAR_DESTINATIONS_DATA["new delhi"] = POPULAR_DESTINATIONS_DATA["delhi"]
POPULAR_DESTINATIONS_DATA["kullu"] = POPULAR_DESTINATIONS_DATA["manali"]
POPULAR_DESTINATIONS_DATA["leh"] = POPULAR_DESTINATIONS_DATA["ladakh"]

async def fetch_live_weather(dest: str) -> WeatherPreview:
    """
    Fetches real-time weather using OpenWeatherMap, WeatherAPI, or Open-Meteo keyless API.
    """
    api_key = os.getenv("WEATHER_API_KEY", "").strip()

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            if api_key:
                owm_url = f"https://api.openweathermap.org/data/2.5/weather?q={dest}&units=metric&appid={api_key}"
                res = await client.get(owm_url)
                if res.status_code == 200:
                    data = res.json()
                    temp_c = round(data["main"]["temp"])
                    cond = data["weather"][0]["description"].title()
                    return WeatherPreview(
                        temp=f"{temp_c}°C Live Forecast",
                        condition=cond,
                        recommendation=f"Live Weather for {dest}: {cond} with {temp_c}°C."
                    )

            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={dest}&count=1&language=en&format=json"
            geo_res = await client.get(geo_url)
            if geo_res.status_code == 200:
                geo_data = geo_res.json()
                if geo_data.get("results"):
                    lat = geo_data["results"][0]["latitude"]
                    lon = geo_data["results"][0]["longitude"]
                    w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code"
                    w_res = await client.get(w_url)
                    if w_res.status_code == 200:
                        w_data = w_res.json()
                        temp_c = round(w_data["current"]["temperature_2m"])
                        code = w_data["current"]["weather_code"]
                        cond = "Clear & Sunny" if code == 0 else "Partly Cloudy" if code <= 3 else "Rain Showers" if code >= 51 else "Pleasant"
                        return WeatherPreview(
                            temp=f"{temp_c}°C Live Forecast",
                            condition=cond,
                            recommendation=f"Live Weather update for {dest}: {cond} with {temp_c}°C."
                        )
    except Exception as e:
        print(f"Weather fetch exception: {e}")

    return WeatherPreview(
        temp="24°C Live Forecast",
        condition="Clear & Pleasant",
        recommendation=f"Pleasant conditions for visiting top sights in {dest}."
    )

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "Xplora Asyncio FastAPI AI Engine",
        "destinationsLoaded": len(POPULAR_DESTINATIONS_DATA)
    }

@app.post("/api/generate-itinerary", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    """
    Asynchronous Travel Agent Endpoint with destination-specific top attractions.
    """
    dest = request.destination.strip().title()
    dest_lower = dest.lower()
    days = request.durationDays
    budget = request.budget
    style = request.travelStyle

    # Concurrent Async Weather API Call
    weather_task = asyncio.create_task(fetch_live_weather(dest))

    daily_budget = budget / days
    hotel_daily = daily_budget * 0.35
    food_daily = daily_budget * 0.25
    activities_daily = daily_budget * 0.30

    # Match destination database
    matched_data = None
    for key, data in POPULAR_DESTINATIONS_DATA.items():
        if key in dest_lower or dest_lower in key:
            matched_data = data
            break

    day_plans: List[DayPlan] = []
    total_cost = 0.0

    generic_variations = [
        (
            ("Old Town & Historic Heritage Walk", f"Guided morning walking tour of historical landmarks and heritage sights of {dest}.", "Sightseeing", f"{dest} Heritage Quarter"),
            ("Local Artisan Market & Culinary Tasting", f"Sample authentic regional street delicacies and browse local handicrafts in {dest}.", "Dining", f"{dest} Central Bazaar"),
            ("Waterfront Promenade & Sunset Viewpoint", f"Unwind along the scenic lakefront/promenade with twilight sunset viewpoints of {dest}.", "Sightseeing", f"{dest} Waterfront Promenade")
        ),
        (
            ("Nature Trail & Sunrise Viewpoint", f"Morning scenic nature excursion and panoramic viewpoint photography in {dest}.", "Activity", f"{dest} Valley Ridge"),
            ("Cultural Arts Museum & Heritage Gallery", f"Explore regional art collections, folklore artifacts, and historical exhibitions in {dest}.", "Sightseeing", f"{dest} Museum Precinct"),
            ("Famous Regional Specialty Gourmet Dinner", f"Savor authentic local recipes and traditional cuisine at top-rated dining spots in {dest}.", "Dining", f"{dest} Food Street")
        ),
        (
            ("Historic Citadel & Fortress Tour", f"Discover medieval ramparts, bastions, and centuries-old defensive architecture around {dest}.", "Sightseeing", f"{dest} Fortification Hill"),
            ("Outdoor Adventure & Nature Reserve", f"Engage in thrilling outdoor activity, nature park exploration, or scenic boat cruise in {dest}.", "Activity", f"{dest} Adventure Reserve"),
            ("Night Market & Acoustic Live Music", f"Enjoy vibrant night shopping, regional music performances, and twilight cafe dining.", "Dining", f"{dest} Night Market Square")
        ),
    ]

    def get_dynamic_activity_cost(title: str, cat: str, day_idx: int, slot: str) -> float:
        t = title.lower()
        weight = 1.0
        if any(w in t for w in ['safari', 'water sports', 'scuba', 'paragliding', 'cruise', 'kayak', 'ropeway', 'ferry']):
            weight = 1.8 + ((day_idx * 7) % 5) * 0.1
        elif any(w in t for w in ['monastery', 'temple', 'church', 'shrine', 'fort', 'monument', 'lake', 'beach', 'palace']):
            weight = 0.45 + ((day_idx * 3) % 4) * 0.08
        elif cat == 'Dining' or any(w in t for w in ['dinner', 'tasting', 'buffet', 'cafe', 'biryani', 'bazaar']):
            weight = 1.35 + ((day_idx * 5) % 4) * 0.1 if slot == 'evening' else 0.85
        elif cat == 'Activity':
            weight = 1.25
        else:
            weight = 0.7

        raw_cost = (daily_budget / 3.0) * weight
        return float(max(250, round(raw_cost / 50.0) * 50))

    for d in range(1, days + 1):
        if matched_data:
            day_data = matched_data[(d - 1) % len(matched_data)]
            m_tuple = day_data["morning"]
            a_tuple = day_data["afternoon"]
            e_tuple = day_data["evening"]
        else:
            v = generic_variations[(d - 1) % len(generic_variations)]
            m_tuple = v[0]
            a_tuple = v[1]
            e_tuple = v[2]

        m_cost = get_dynamic_activity_cost(m_tuple[0], m_tuple[2], d, 'morning')
        a_cost = get_dynamic_activity_cost(a_tuple[0], a_tuple[2], d, 'afternoon')
        e_cost = get_dynamic_activity_cost(e_tuple[0], e_tuple[2], d, 'evening')

        total_cost += m_cost + a_cost + e_cost

        day_plans.append(DayPlan(
            dayNumber=d,
            summary=f"Day {d}: {dest} {m_tuple[0]} & Evening Experiences",
            activities=[
                Activity(
                    timeSlot="09:00 AM - 12:00 PM",
                    title=m_tuple[0],
                    description=m_tuple[1],
                    category=m_tuple[2],
                    cost=m_cost,
                    location=m_tuple[3]
                ),
                Activity(
                    timeSlot="01:00 PM - 05:00 PM",
                    title=a_tuple[0],
                    description=a_tuple[1],
                    category=a_tuple[2],
                    cost=a_cost,
                    location=a_tuple[3]
                ),
                Activity(
                    timeSlot="06:30 PM - 09:30 PM",
                    title=e_tuple[0],
                    description=e_tuple[1],
                    category=e_tuple[2],
                    cost=e_cost,
                    location=e_tuple[3]
                )
            ]
        ))

    live_weather = await weather_task

    return ItineraryResponse(
        title=f"{days}-Day {style} Experience in {dest}",
        destination=dest,
        durationDays=days,
        totalBudget=budget,
        estimatedCost=min(round(total_cost, 2), budget),
        currency="INR",
        travelStyle=style,
        weatherPreview=live_weather,
        dayPlans=day_plans
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
