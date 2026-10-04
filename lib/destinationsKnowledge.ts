export interface ActivityTemplate {
  title: string;
  desc: string;
  category: 'Sightseeing' | 'Dining' | 'Activity' | 'Hotel' | 'Flight';
  loc: string;
  baseCost?: number;
}

export interface DayAttractionPlan {
  day: number;
  morning: ActivityTemplate;
  afternoon: ActivityTemplate;
  evening: ActivityTemplate;
}

export const POPULAR_DESTINATIONS_DATA: Record<string, DayAttractionPlan[]> = {
  // SIKKIM
  sikkim: [
    {
      day: 1,
      morning: {
        title: 'Tsomgo (Changu) Lake & Baba Mandir Excursion',
        desc: 'Visit the sacred glacial Tsomgo Lake at 12,310 ft and the historic Baba Harbhajan Singh Memorial Temple.',
        category: 'Sightseeing',
        loc: 'East Sikkim, 38km from Gangtok'
      },
      afternoon: {
        title: 'Nathula Pass Indo-China Border & Yak Safari',
        desc: 'Experience the historic Silk Route pass at 14,140 ft and enjoy high-altitude yak rides.',
        category: 'Activity',
        loc: 'Nathula Border Ridge, East Sikkim'
      },
      evening: {
        title: 'MG Marg Gangtok Walking Promenade & Momos Tasting',
        desc: 'Stroll the pedestrianized MG Marg for authentic steaming Sikkimese pork/veg momos and Thukpa.',
        category: 'Dining',
        loc: 'MG Marg, Gangtok'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Rumtek Monastery & Namgyal Institute of Tibetology',
        desc: 'Explore the grand Dharma Chakra Centre of Tibetan Buddhism and ancient Tibetan manuscripts and frescoes.',
        category: 'Sightseeing',
        loc: 'Rumtek Dharma Chakra Centre, Gangtok'
      },
      afternoon: {
        title: 'Ban Jhakri Falls & Energy Park Adventure Walk',
        desc: 'Explore the 100-foot cascading Ban Jhakri waterfall with lush shamanistic rock sculptures and bridges.',
        category: 'Activity',
        loc: 'Ban Jhakri Park, Gangtok'
      },
      evening: {
        title: 'Tashi Viewpoint & Cafe Live Acoustic Night',
        desc: 'Witness twilight panoramic views of Mt. Kanchenjunga followed by cozy cafe dining.',
        category: 'Dining',
        loc: 'Tashi View Point, Gangtok'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Ganesh Tok & Hanuman Tok Mountain Shrines',
        desc: 'Morning prayer bells and 360-degree panoramic viewpoints of Gangtok city and snowcapped Himalayan ranges.',
        category: 'Sightseeing',
        loc: 'Hanuman Tok Hilltop, Gangtok'
      },
      afternoon: {
        title: 'Gangtok Ropeway Cable Car Ride over Valley',
        desc: 'Thrilling aerial cable car ride from Deorali to Tashiling enjoying bird-eye views of the Himalayas.',
        category: 'Activity',
        loc: 'Deorali Cable Car Station'
      },
      evening: {
        title: 'Lal Bazaar Spice Shopping & Authentic Gundruk Dinner',
        desc: 'Browse cardamom and Chhurpi (yak cheese) and savor traditional fermented Gundruk soup and Sel Roti.',
        category: 'Dining',
        loc: 'Lal Bazaar Heritage Market'
      }
    },
    {
      day: 4,
      morning: {
        title: 'Ravangla Buddha Park (Tathagata Tsal)',
        desc: 'Marvel at the breathtaking 130-foot copper statue of Gautama Buddha surrounded by Himalayan peaks.',
        category: 'Sightseeing',
        loc: 'Ravangla, South Sikkim'
      },
      afternoon: {
        title: 'Temi Tea Garden Walk & Organic Tasting',
        desc: 'Walk through Sikkim\'s only organic tea estate rolling gently over the cherry blossom slopes.',
        category: 'Activity',
        loc: 'Temi Tea Estate, South Sikkim'
      },
      evening: {
        title: 'Pelling Helipad Sunset Lounge & Himalayan Dinner',
        desc: 'Golden hour sunset over Kanchenjunga peak followed by hot traditional Lepcha butter tea and dinner.',
        category: 'Dining',
        loc: 'Pelling Ridge, West Sikkim'
      }
    }
  ],

  // MUMBAI
  mumbai: [
    {
      day: 1,
      morning: {
        title: 'Gateway of India & Elephanta Caves Ferry',
        desc: 'Photograph the iconic 1924 basalt arch monument and take a harbor ferry to UNESCO Elephanta rock caves.',
        category: 'Sightseeing',
        loc: 'Apollo Bunder, Colaba'
      },
      afternoon: {
        title: 'Colaba Causeway Shopping & Cafe Leopold',
        desc: 'Street souvenir shopping, vintage curios, and cold drinks with Iranian keema pav at iconic Leopold Cafe.',
        category: 'Dining',
        loc: 'Colaba Causeway, South Mumbai'
      },
      evening: {
        title: 'Marine Drive Queen’s Necklace & Girgaon Chowpatty Bhel',
        desc: 'Sunset promenade stroll along the Arabian Sea curve and famous street food bhelpuri at Chowpatty.',
        category: 'Sightseeing',
        loc: 'Marine Drive & Chowpatty'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Chhatrapati Shivaji Maharaj Terminus (CSMT) & Fort Heritage Walk',
        desc: 'Victorian Gothic UNESCO railway terminal, Flora Fountain, and Mumbai Heritage District architecture.',
        category: 'Sightseeing',
        loc: 'Fort & CST Precinct'
      },
      afternoon: {
        title: 'Wankhede Stadium & Churchgate Heritage Quarter',
        desc: 'Visit the legendary cricket ground precinct followed by colonial lane cafes and bakeries.',
        category: 'Activity',
        loc: 'Churchgate & Marine Lines'
      },
      evening: {
        title: 'Bandra Bandstand, Walk of the Stars & Shah Rukh Khan Mannat',
        desc: 'Stroll along seaside Bandstand promenade, see Bollywood celebrity homes, and enjoy sunset sea breeze.',
        category: 'Sightseeing',
        loc: 'Bandstand Promenade, Bandra West'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Siddhivinayak Ganpati Temple & Shivaji Park',
        desc: 'Pay morning respects at Mumbai\'s iconic Ganpati temple and walk through historic cricket nursery park.',
        category: 'Sightseeing',
        loc: 'Prabhadevi & Dadar'
      },
      afternoon: {
        title: 'Bandra Linking Road & Hill Road Fashion Hunt',
        desc: 'Bustling boutique shopping for trendy street fashion and chic bohemian seaside cafes.',
        category: 'Activity',
        loc: 'Linking Road, Bandra West'
      },
      evening: {
        title: 'Juhu Beach Sunset, Pav Bhaji & Seaside Dinner',
        desc: 'Walk barefoot on Juhu Beach, sample butter-rich Sardar pav bhaji and dine at coastal seaside lounges.',
        category: 'Dining',
        loc: 'Juhu Tara Road & Beach'
      }
    },
    {
      day: 4,
      morning: {
        title: 'Sanjay Gandhi National Park & Kanheri Caves Trek',
        desc: 'Explore 1st-century Buddhist caves hand-carved in basalt rock inside the urban national forest.',
        category: 'Activity',
        loc: 'Borivali East, Mumbai'
      },
      afternoon: {
        title: 'Dharavi Guided Artisan Leather & Pottery Tour',
        desc: 'Ethical guided tour showcasing Mumbai\'s vibrant leather craftsmanship and Kumbharwada pottery kiln art.',
        category: 'Activity',
        loc: 'Kumbharwada & Sion'
      },
      evening: {
        title: 'Worli Sea Face Walk & Coastline Seafood Dinner',
        desc: 'Panoramic skyline view of the Bandra-Worli Sea Link bridge with authentic coastal Malvani curry.',
        category: 'Dining',
        loc: 'Worli Sea Face'
      }
    }
  ],

  // DELHI
  delhi: [
    {
      day: 1,
      morning: {
        title: 'India Gate, Kartavya Path & Rashtrapati Bhavan',
        desc: 'Walk along the majestic central vista, War Memorial archway, and view the Presidential Palace gardens.',
        category: 'Sightseeing',
        loc: 'Central Vista, Rajpath'
      },
      afternoon: {
        title: 'Humayun\'s Tomb Mughal Gardens Heritage Tour',
        desc: 'UNESCO World Heritage red sandstone tomb that inspired the architectural design of the Taj Mahal.',
        category: 'Sightseeing',
        loc: 'Nizamuddin East, New Delhi'
      },
      evening: {
        title: 'Connaught Place (CP) Heritage Walk & Keventers Shake',
        desc: 'Georgian colonnade circular markets, underground Palika Bazaar, and British-era cafes.',
        category: 'Dining',
        loc: 'Connaught Place Inner Circle'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Red Fort (Lal Qila) & Jama Masjid Old Delhi Walk',
        desc: 'Grand 17th-century Mughal red sandstone citadel and India\'s largest historic congregational mosque.',
        category: 'Sightseeing',
        loc: 'Chandni Chowk, Old Delhi'
      },
      afternoon: {
        title: 'Chandni Chowk Rickshaw Ride & Paranthe Wali Gali Feast',
        desc: 'Thrilling cycle rickshaw ride through spice alleys and legendary stuffed fried parathas.',
        category: 'Dining',
        loc: 'Paranthe Wali Gali, Chandni Chowk'
      },
      evening: {
        title: 'Dilli Haat INA Crafts Bazaar & Regional Food Stalls',
        desc: 'Open-air craft village with artisans from all Indian states and authentic regional dinner stalls.',
        category: 'Activity',
        loc: 'INA Market, South Delhi'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Qutub Minar Complex & Iron Pillar of Delhi',
        desc: 'Marvel at the 73-meter medieval minaret and the rust-resistant 4th-century Gupta iron pillar.',
        category: 'Sightseeing',
        loc: 'Mehrauli Archaeological Park'
      },
      afternoon: {
        title: 'Lotus Temple (Bahai House of Worship) Meditation',
        desc: 'Architectural marvel shaped like a blooming lotus petal surrounded by nine serene ponds.',
        category: 'Sightseeing',
        loc: 'Kalkaji, South Delhi'
      },
      evening: {
        title: 'Hauz Khas Village Medieval Fort & Rooftop Lakefront Dining',
        desc: 'Explore 14th-century Khalji reservoir ruins and enjoy lively evening music lounges.',
        category: 'Dining',
        loc: 'Hauz Khas Village'
      }
    },
    {
      day: 4,
      morning: {
        title: 'Akshardham Temple Grand Spiritual Architecture',
        desc: 'Intricately carved pink sandstone temple complex, Sahaj Anand water show, and cultural boat ride.',
        category: 'Sightseeing',
        loc: 'NH 24, Noida Mor'
      },
      afternoon: {
        title: 'National Gallery of Modern Art & Crafts Museum',
        desc: 'Admire modern Indian masters, tribal woodwork, textiles, and village courtyards.',
        category: 'Activity',
        loc: 'Jaipur House, India Gate'
      },
      evening: {
        title: 'Khan Market Boutique Stroll & Gourmet Kebabs',
        desc: 'Upscale diplomatic market shopping for books and tasting famous Galouti & Kakori kebabs.',
        category: 'Dining',
        loc: 'Khan Market, New Delhi'
      }
    }
  ],

  // GOA
  goa: [
    {
      day: 1,
      morning: {
        title: 'Fort Aguada & Sinquerim Beach Promenade',
        desc: 'Explore the 17th-century Portuguese coastal bastion with panoramic views of the Arabian Sea.',
        category: 'Sightseeing',
        loc: 'Sinquerim, North Goa'
      },
      afternoon: {
        title: 'Calangute & Baga Water Sports Adventure',
        desc: 'Enjoy thrilling parasailing, jet-ski speedboats, and bumper rides on Baga Beach.',
        category: 'Activity',
        loc: 'Baga Beach, North Goa'
      },
      evening: {
        title: 'Mandovi River Sunset Cruise with Goan Folk Dance',
        desc: 'River catamaran cruise featuring traditional Dekhni & Fugdi performances and coastal buffet.',
        category: 'Dining',
        loc: 'Panaji Jetty, Central Goa'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Old Goa Basilica of Bom Jesus & Se Cathedral',
        desc: 'UNESCO World Heritage shrines holding the sacred relics of St. Francis Xavier.',
        category: 'Sightseeing',
        loc: 'Old Goa Heritage Precinct'
      },
      afternoon: {
        title: 'Fontainhas Latin Quarter Heritage Walk & Cafe Hopping',
        desc: 'Stroll past colorful Portuguese colonial villas and artisan bakeries for fresh bebinca cake.',
        category: 'Sightseeing',
        loc: 'Fontainhas, Panaji'
      },
      evening: {
        title: 'Anjuna Beach Sunset & Tito’s Lane Night Vibe',
        desc: 'Relax at beachside shacks with acoustic live music and coastal Goan prawn curry.',
        category: 'Dining',
        loc: 'Anjuna & Tito’s Lane'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Dudhsagar Waterfalls Jeep Jungle Safari',
        desc: 'Thrilling off-road safari through Bhagwan Mahavir Wildlife Sanctuary to the majestic multi-tiered falls.',
        category: 'Activity',
        loc: 'Mollem National Park'
      },
      afternoon: {
        title: 'Sahakari Spice Plantation Guided Tour & Buffet Lunch',
        desc: 'Organic spice valley tour with elephant encounters and authentic Goan buffet on banana leaves.',
        category: 'Dining',
        loc: 'Ponda Spice Valley'
      },
      evening: {
        title: 'Curlies & Shiva Valley Sunset Lounge',
        desc: 'Unwind with refreshing tropical coolers and beach bonfire lounges.',
        category: 'Dining',
        loc: 'Anjuna Beachfront'
      }
    },
    {
      day: 4,
      morning: {
        title: 'Chapora Fort (Dil Chahta Hai Fort) & Vagator Cliff',
        desc: 'Red laterite cliff-top fort overlooking Ozran Beach and the Chapora river estuary.',
        category: 'Sightseeing',
        loc: 'Vagator, North Goa'
      },
      afternoon: {
        title: 'Palolem Beach Kayaking & Dolphin Spotting Cruise',
        desc: 'Paddle through serene South Goa coves and spot playful Arabian sea dolphins.',
        category: 'Activity',
        loc: 'Palolem Beach, South Goa'
      },
      evening: {
        title: 'Thalassa Greek Taverna Sunset Clifftop Dinner',
        desc: 'Famous clifftop dining watching golden sunsets with live fire dancers and Mediterranean delicacies.',
        category: 'Dining',
        loc: 'Siolim Clifftop'
      }
    }
  ],

  // MANALI
  manali: [
    {
      day: 1,
      morning: {
        title: 'Hadimba Devi Temple & Dhungri Pine Forest Walk',
        desc: 'Historic 1553 wooden pagoda temple nestled inside giant deodar pine forests.',
        category: 'Sightseeing',
        loc: 'Dhungri Van Vihar, Manali'
      },
      afternoon: {
        title: 'Solang Valley Paragliding & Zorbing Adventure',
        desc: 'High-altitude paragliding flight over snow-capped Himalayan peaks and alpine meadows.',
        category: 'Activity',
        loc: 'Solang Valley Adventure Hub'
      },
      evening: {
        title: 'Old Manali Bohemian Cafe Hopping & Trout Dinner',
        desc: 'Riverside cafes tasting fresh Himalayan rainbow trout fish and firewood pizzas.',
        category: 'Dining',
        loc: 'Old Manali Village'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Atal Tunnel & Sissu Waterfalls Day Excursion',
        desc: 'Drive through the world\'s longest high-altitude tunnel into the surreal Lahaul valley.',
        category: 'Activity',
        loc: 'Atal Tunnel & Sissu Valley'
      },
      afternoon: {
        title: 'Vashisht Hot Sulphur Springs & Wooden Temple',
        desc: 'Soak in natural therapeutic thermal hot springs with mountain valley views.',
        category: 'Activity',
        loc: 'Vashisht Village'
      },
      evening: {
        title: 'Mall Road Souvenir Shopping & Himachali Siddu Tasting',
        desc: 'Browse handcrafted woolens, Kullu shawls, and steaming warm Himachali delicacies.',
        category: 'Dining',
        loc: 'Manali Mall Road'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Jogini Waterfalls Nature Trekking Trail',
        desc: 'Scenic 2-hour nature trek along mountain streams and apple orchards to Jogini Falls.',
        category: 'Activity',
        loc: 'Bahang Trek Route'
      },
      afternoon: {
        title: 'Beas River White Water Rafting in Kullu',
        desc: 'Thrilling Class 3 river rafting rapids down the icy meltwaters of Beas river.',
        category: 'Activity',
        loc: 'Kullu River Valley'
      },
      evening: {
        title: 'Cafe 1947 Live Music & Riverside Twilight Lounge',
        desc: 'Acoustic live music, artisan Italian bites, and sound of rushing river waters.',
        category: 'Dining',
        loc: 'Old Manali River Bank'
      }
    }
  ],

  // JAIPUR
  jaipur: [
    {
      day: 1,
      morning: {
        title: 'Amber Fort Ramparts & Sheesh Mahal (Mirror Palace)',
        desc: 'Explore magnificent hilltop fort with opulent halls, mirror mosaics, and Maota Lake reflection.',
        category: 'Sightseeing',
        loc: 'Amer, Jaipur'
      },
      afternoon: {
        title: 'Jal Mahal Water Palace Photo Stop & Blue Pottery Workshop',
        desc: 'Admire 5-story palace floating in Man Sagar Lake and learn iconic Jaipur Blue Pottery making.',
        category: 'Sightseeing',
        loc: 'Man Sagar Lake'
      },
      evening: {
        title: 'Chokhi Dhani Rajasthani Cultural Village & Thali Feast',
        desc: 'Puppet shows, folk dancers, camel rides, and unlimited royal Rajasthani Thali feast.',
        category: 'Dining',
        loc: 'Tonk Road, Jaipur'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Hawa Mahal Palace of Winds & City Palace Museum',
        desc: 'Photograph 953 honeycombed jharokha windows and royal arms collection in City Palace.',
        category: 'Sightseeing',
        loc: 'Pink City Heritage Zone'
      },
      afternoon: {
        title: 'Jantar Mantar UNESCO Astronomical Observatory',
        desc: 'Discover the world\'s largest stone sundial and precision medieval astronomical instruments.',
        category: 'Sightseeing',
        loc: 'City Palace Complex'
      },
      evening: {
        title: 'Johari Bazaar Gemstone Shopping & Laxmi Misthan Ghewar',
        desc: 'Explore traditional bazaars and taste authentic Jaipur Paneer Ghewar and Pyaaz Kachori.',
        category: 'Dining',
        loc: 'Johari Bazaar Market'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Nahargarh Fort Sunset Viewpoint & Stepwell (Baori)',
        desc: 'Hilltop fortress offering breathtaking panoramic views over Pink City and Stepwell corridors.',
        category: 'Sightseeing',
        loc: 'Aravalli Hills Range'
      },
      afternoon: {
        title: 'Albert Hall Museum & Ram Niwas Garden Walk',
        desc: 'Indo-Saracenic museum housing rare Persian carpets, Egyptian mummies, and armor.',
        category: 'Sightseeing',
        loc: 'Ram Niwas Garden'
      },
      evening: {
        title: 'Tapri Central Rooftop Tea Lounge & Sunset Dinner',
        desc: 'Scenic rooftop dining with masala chai infusions and modern fusion Rajasthani bites.',
        category: 'Dining',
        loc: 'C-Scheme, Jaipur'
      }
    }
  ],

  // KERALA / MUNNAR
  kerala: [
    {
      day: 1,
      morning: {
        title: 'Fort Kochi Chinese Fishing Nets & St. Francis Church',
        desc: 'Watch massive cantilevered wooden fishing nets dip into the Arabian Sea and visit India\'s oldest European church.',
        category: 'Sightseeing',
        loc: 'Fort Kochi Waterfront'
      },
      afternoon: {
        title: 'Mattancherry Palace (Dutch Palace) & Jew Town Antique Hunt',
        desc: 'Explore Ramayana murals in Dutch Palace and browse cardamom and antique spice shops.',
        category: 'Sightseeing',
        loc: 'Jew Town, Mattancherry'
      },
      evening: {
        title: 'Kerala Kathakali Centre Traditional Dance & Martial Art Show',
        desc: 'Mesmerizing evening of classical Kathakali makeup rituals, dance dramas, and Kalaripayattu.',
        category: 'Activity',
        loc: 'Kochi Cultural Centre'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Alleppey Traditional Kettuvallam Houseboat Cruise',
        desc: 'Board a luxury wooden houseboat gliding through tranquil palm-fringed backwaters and paddy fields.',
        category: 'Activity',
        loc: 'Punnamada Jetty, Alleppey'
      },
      afternoon: {
        title: 'Backwater Village Canoe Safari & Coconut Toddy Tasting',
        desc: 'Narrow canal rowing tour interacting with coir weavers and tasting fresh Karimeen Pollichathu fish.',
        category: 'Dining',
        loc: 'Kuttanad Canals, Alleppey'
      },
      evening: {
        title: 'Marari Beach Sunset Walk & Fresh Catch Seafood Dinner',
        desc: 'Golden sand beach relaxation under coconut groves with fiery Malabar fish curry.',
        category: 'Dining',
        loc: 'Marari Beachfront'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Munnar Eravikulam National Park (Nilgiri Tahr Sanctuary)',
        desc: 'Safari amidst rolling misty tea hills spotting the endangered mountain Nilgiri Tahr goat.',
        category: 'Sightseeing',
        loc: 'Rajamalai Hills, Munnar'
      },
      afternoon: {
        title: 'Tata Tea Museum & Tea Processing Workshop',
        desc: 'Witness CTC tea roller machinery demonstration followed by exotic single-estate tea tastings.',
        category: 'Activity',
        loc: 'Nullatanni Estate, Munnar'
      },
      evening: {
        title: 'Munnar Town Spice Market & Cardamom Coffee Lounge',
        desc: 'Shop farm-fresh black pepper, cloves, and natural wild honey in Munnar hillside markets.',
        category: 'Dining',
        loc: 'Munnar Hill Bazaar'
      }
    }
  ],

  // LADAKH
  ladakh: [
    {
      day: 1,
      morning: {
        title: 'Leh Palace & Acclimatization Heritage Stroll',
        desc: 'Explore 17th-century Tibetan royal palace perched above Leh town with snow mountain backdrop.',
        category: 'Sightseeing',
        loc: 'Old Leh Town'
      },
      afternoon: {
        title: 'Shanti Stupa White Dome Sunset Meditation',
        desc: 'Climb 500 steps to the white Buddhist stupa inaugurated by the Dalai Lama overlooking Leh valley.',
        category: 'Sightseeing',
        loc: 'Changsipa Hill, Leh'
      },
      evening: {
        title: 'Leh Main Bazaar Stroll & Traditional Tingmo Dinner',
        desc: 'Walk through cobbled market lanes sampling Tibetan steam bread (Tingmo) and Thukpa noodles.',
        category: 'Dining',
        loc: 'Main Bazaar, Leh'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Magnetic Hill Defying Gravity & Indus-Zanskar Confluence',
        desc: 'Witness optical anti-gravity hill and the vivid color collision of green Indus and muddy Zanskar rivers.',
        category: 'Activity',
        loc: 'Nimmu, Leh-Srinagar Highway'
      },
      afternoon: {
        title: 'Alchi Monastery Ancient 11th-Century Murals',
        desc: 'Enclave of four separate shrines renowned for Indo-Tibetan wood carvings and mini paintings.',
        category: 'Sightseeing',
        loc: 'Alchi Village'
      },
      evening: {
        title: 'Hall of Fame War Memorial & Sunset Patriotism Salute',
        desc: 'Museum curated by Indian Army commemorating brave soldiers of Siachen and Kargil battles.',
        category: 'Sightseeing',
        loc: 'Leh Airport Road'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Khardung La Pass Crossing (17,982 ft)',
        desc: 'Drive through one of the world\'s highest motorable mountain passes with flags fluttering in gale winds.',
        category: 'Activity',
        loc: 'Khardung La Ridge'
      },
      afternoon: {
        title: 'Nubra Valley Hunder White Sand Dunes & Camel Safari',
        desc: 'Ride rare Bactrian double-humped camels amidst surreal high-altitude cold desert dunes.',
        category: 'Activity',
        loc: 'Hunder, Nubra Valley'
      },
      evening: {
        title: 'Diskit Monastery 106-ft Maitreya Buddha Twilight View',
        desc: 'Golden statue of Future Buddha watching over Shyok River valley with evening monk prayer chants.',
        category: 'Sightseeing',
        loc: 'Diskit, Nubra Valley'
      }
    },
    {
      day: 4,
      morning: {
        title: 'Pangong Tso Blue Glacial Lake Expedition',
        desc: 'Marvel at the 134km long lake that changes color shades from sapphire blue to turquoise green.',
        category: 'Sightseeing',
        loc: 'Spangmik, Pangong Lake'
      },
      afternoon: {
        title: 'Pangong Lake Shore Photography & 3 Idiots Point',
        desc: 'Photograph yellow scooter landmark along pristine crystal water banks and spot Himalayan marmots.',
        category: 'Activity',
        loc: 'Lukung, Pangong Tso'
      },
      evening: {
        title: 'Lakeside Campfire, Stargazing & Warm Butter Tea',
        desc: 'Unrivaled night sky Milky Way stargazing in crystal-clear zero-light-pollution high altitude.',
        category: 'Dining',
        loc: 'Pangong Campsite'
      }
    }
  ],

  // KASHMIR
  kashmir: [
    {
      day: 1,
      morning: {
        title: 'Dal Lake Morning Shikara Ride & Floating Flower Market',
        desc: 'Glide gently on wooden Gondola Shikara past lotus blooms and early morning floating vendors.',
        category: 'Sightseeing',
        loc: 'Boulevard Road, Srinagar'
      },
      afternoon: {
        title: 'Mughal Gardens (Shalimar Bagh & Nishat Bagh)',
        desc: 'Terraced fountains, chinar trees, and cascading water channels built by Emperor Jahangir for Nur Jahan.',
        category: 'Sightseeing',
        loc: 'Nishat, Srinagar'
      },
      evening: {
        title: 'Traditional Kashmiri Wazwan Feast & Kahwa Tea',
        desc: 'Multi-course royal feast of Rogan Josh, Gushtaba, Rista, and saffron almond Kahwa tea.',
        category: 'Dining',
        loc: 'Lal Chowk, Srinagar'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Gulmarg Gondola World Highest Cable Car Ride',
        desc: 'Ascend to Kongdoori and Apharwat Peak at 13,780 ft with breathtaking snow mountain panoramas.',
        category: 'Activity',
        loc: 'Gulmarg Ski Resort'
      },
      afternoon: {
        title: 'Gulmarg Golf Course Walk & Strawberry Valley Exploration',
        desc: 'Stroll around the historic British-era high-altitude golf greens and pine meadows.',
        category: 'Activity',
        loc: 'Gulmarg Meadow'
      },
      evening: {
        title: 'Highland Park Fireside Lounge & Barbeque',
        desc: 'Cozy fireside wooden lounge with hot snacks and panoramic twilight views of Mt. Apharwat.',
        category: 'Dining',
        loc: 'Gulmarg Hill'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Pahalgam Betaab Valley & Aru Valley Pony Excursion',
        desc: 'Lush green meadows flanked by deodar forests and rushing Lidder River made famous in Hindi cinema.',
        category: 'Sightseeing',
        loc: 'Betaab Valley, Pahalgam'
      },
      afternoon: {
        title: 'Lidder River White Water Rafting',
        desc: 'Thrilling white water rafting expedition down snow-melt rapids of the Lidder river valley.',
        category: 'Activity',
        loc: 'Lidder Valley, Pahalgam'
      },
      evening: {
        title: 'Pahalgam Bazaar Walnut Woodcrafts & Riverside Dining',
        desc: 'Shop hand-embroidered Pashmina shawls, walnut wood carving, and dine alongside rushing river waters.',
        category: 'Dining',
        loc: 'Pahalgam Main Bazaar'
      }
    }
  ],

  // VARANASI
  varanasi: [
    {
      day: 1,
      morning: {
        title: 'Subah-e-Banaras Sunrise Boat Ride on Ganges',
        desc: 'Rowing wooden boat ride at dawn past Assi, Dashashwamedh, and Manikarnika ghats with chanting pilgrims.',
        category: 'Activity',
        loc: 'Assi Ghat to Manikarnika Ghat'
      },
      afternoon: {
        title: 'Kashi Vishwanath Jyotirlinga Temple & Corridor Walk',
        desc: 'Visit one of the twelve sacred Jyotirlingas of Lord Shiva through the grand river corridor.',
        category: 'Sightseeing',
        loc: 'Vishwanath Gali, Varanasi'
      },
      evening: {
        title: 'Dashashwamedh Ghat Grand Ganga Aarti Ceremony',
        desc: 'Witness priests perform the rhythmic fire Aarti ritual with brass lamps, conch shells, and incense.',
        category: 'Sightseeing',
        loc: 'Dashashwamedh Ghat'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Sarnath Deer Park & Dhamek Stupa Archeological Site',
        desc: 'Visit where Lord Buddha delivered his first sermon after enlightenment and see Ashoka Lion Capital.',
        category: 'Sightseeing',
        loc: 'Sarnath, 10km from Varanasi'
      },
      afternoon: {
        title: 'Banarasi Silk Weaving Artisan Workshop in Madanpura',
        desc: 'Watch master weavers create pure gold zari brocade silk sarees on traditional handlooms.',
        category: 'Activity',
        loc: 'Madanpura Weavers Colony'
      },
      evening: {
        title: 'Blue Lassi Shop & Iconic Malaiyo Winter Saffron Treat',
        desc: 'Taste legendary kulhad lassi, Banarasi Tamatar Chaat, and delicate saffron milk foam Malaiyo.',
        category: 'Dining',
        loc: 'Kachori Gali & Godowlia'
      }
    }
  ],

  // AGRA
  agra: [
    {
      day: 1,
      morning: {
        title: 'Taj Mahal Sunrise Grand Architectural Tour',
        desc: 'Admire the 17th-century white marble mausoleum of Mumtaz Mahal glowing in pink morning sunrise light.',
        category: 'Sightseeing',
        loc: 'Taj East Gate, Agra'
      },
      afternoon: {
        title: 'Agra Fort (Red Fort) UNESCO Imperial Residence',
        desc: 'Vast red sandstone fortress of Mughal Emperors featuring Jahangiri Mahal, Diwan-i-Khas, and Musamman Burj.',
        category: 'Sightseeing',
        loc: 'Agra Fort Road'
      },
      evening: {
        title: 'Mehtab Bagh Moonlight Garden Taj View & Petha Tasting',
        desc: 'Relax in Charbagh gardens across the Yamuna River with Taj sunset views and sample famous Agra Petha sweets.',
        category: 'Dining',
        loc: 'Mehtab Bagh, Across Yamuna'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Fatehpur Sikri Imperial Deserted City & Buland Darwaza',
        desc: 'Explore Emperor Akbar\'s ghost capital and the 54-meter high Gateway of Magnificence.',
        category: 'Sightseeing',
        loc: 'Fatehpur Sikri, 36km from Agra'
      },
      afternoon: {
        title: 'Tomb of I\'timād-ud-Daulah (Baby Taj)',
        desc: 'Exquisite jewel-box marble tomb featuring delicate pietra dura stone inlays overlooking the Yamuna river.',
        category: 'Sightseeing',
        loc: 'Moti Bagh, Agra'
      },
      evening: {
        title: 'Sadar Bazaar Leather & Marble Inlay Shopping & Mughlai Dinner',
        desc: 'Browse handcrafted marble inlay souvenirs and savor authentic Mughlai butter chicken and kebabs.',
        category: 'Dining',
        loc: 'Sadar Bazaar, Agra Cantt'
      }
    }
  ],

  // UDAIPUR
  udaipur: [
    {
      day: 1,
      morning: {
        title: 'City Palace Complex & Crystal Gallery on Lake Pichola',
        desc: 'Rajasthan\'s largest palace complex featuring ornate peacocks in mosaic glass, courtyards, and silver carriage.',
        category: 'Sightseeing',
        loc: 'Old City, Udaipur'
      },
      afternoon: {
        title: 'Lake Pichola Boat Cruise & Jag Mandir Island Palace',
        desc: 'Glide past the floating Lake Palace (Taj) and explore marble stone elephants on Jag Mandir island.',
        category: 'Activity',
        loc: 'Rameshwar Ghat Jetty'
      },
      evening: {
        title: 'Ambrai Ghat Sunset View & Romantic Lakefront Dinner',
        desc: 'Watch palace lights reflect on water ripples while dining on traditional Laal Maas mutton curry.',
        category: 'Dining',
        loc: 'Ambrai Ghat, Chandpole'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Jagdish Temple & Saheliyon-ki-Bari (Garden of Maids)',
        desc: 'Carved 1651 Vishnu temple followed by marble elephant fountains in lush royal princess gardens.',
        category: 'Sightseeing',
        loc: 'Jagdish Chowk & Saheli Marg'
      },
      afternoon: {
        title: 'Monsoon Palace (Sajjangarh) Hilltop Fortress Walk',
        desc: 'Climb high into the Aravalli peaks to the 19th-century summer retreat built to watch monsoon clouds.',
        category: 'Sightseeing',
        loc: 'Sajjangarh Wildlife Sanctuary'
      },
      evening: {
        title: 'Bagore Ki Haveli Dharohar Rajasthani Folk & Puppet Dance',
        desc: '138-room 18th-century haveli hosting thrilling Chari fire pot dances and traditional puppet shows.',
        category: 'Activity',
        loc: 'Gangaur Ghat, Lake Pichola'
      }
    }
  ],

  // HYDERABAD
  hyderabad: [
    {
      day: 1,
      morning: {
        title: 'Charminar & Laad Bazaar (Choodi Bazaar) Heritage Walk',
        desc: 'Climb into the iconic 1591 four-minaret monument and stroll the bustling lacquer bangle market.',
        category: 'Sightseeing',
        loc: 'Old City, Hyderabad'
      },
      afternoon: {
        title: 'Chowmahalla Palace of Nizams & Vintage Rolls Royce Collection',
        desc: 'Opulent palace complex featuring Belgian crystal chandeliers, Persian carpets, and royal court darbars.',
        category: 'Sightseeing',
        loc: 'Motigalli, Old City'
      },
      evening: {
        title: 'Paradise / Shadab World-Famous Dum Biryani Tasting',
        desc: 'Feast on authentic slow-cooked fragrant Hyderabadi mutton dum biryani with Mirchi ka Salan.',
        category: 'Dining',
        loc: 'Ghansi Bazaar / Secunderabad'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Golconda Fort Acoustic Marvels & Fateh Darwaza Clap',
        desc: 'Climb the medieval diamond capital fort and experience whisper acoustics from gate to highest pavilion.',
        category: 'Sightseeing',
        loc: 'Ibrahim Bagh, Hyderabad'
      },
      afternoon: {
        title: 'Qutb Shahi Tombs Heritage Garden Excursion',
        desc: 'Explore domed mausoleums blending Persian, Pashtun, and Hindu architectural styles.',
        category: 'Sightseeing',
        loc: 'Tolichowki, Hyderabad'
      },
      evening: {
        title: 'Hussain Sagar Lake Boat Cruise & Buddha Statue Sunset',
        desc: 'Speedboat ride to the world\'s tallest monolithic statue of Gautama Buddha and sunset drive on Necklace Road.',
        category: 'Activity',
        loc: 'Necklace Road, Tank Bund'
      }
    }
  ],

  // BANGALORE
  bangalore: [
    {
      day: 1,
      morning: {
        title: 'Lalbagh Botanical Garden & Victorian Glass House Walk',
        desc: '240-acre garden with centuries-old trees, bonsai nursery, and famous flower exhibition glass house.',
        category: 'Sightseeing',
        loc: 'Mavalli, Bangalore'
      },
      afternoon: {
        title: 'Bangalore Palace Tudor Revival Architecture Tour',
        desc: 'Inspired by England\'s Windsor Castle, featuring fortified towers, stained glass, and hunting memorabilia.',
        category: 'Sightseeing',
        loc: 'Vasanth Nagar, Bangalore'
      },
      evening: {
        title: 'Indiranagar 100-ft Road Microbrewery Crawl & Dosa Feast',
        desc: 'Taste craft IPAs and lagers followed by crispy butter benne dosa at iconic local darshinis.',
        category: 'Dining',
        loc: 'Indiranagar & 12th Main'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Cubbon Park Morning Walk & Vidhana Soudha Landmark',
        desc: 'Lush 300-acre green lung of the city and photography outside India\'s largest Neo-Dravidian state legislature.',
        category: 'Sightseeing',
        loc: 'Kasturba Road, Bangalore'
      },
      afternoon: {
        title: 'Visvesvaraya Industrial & Technological Museum',
        desc: 'Interactive rocket exhibits, dinosaur corner, and hands-on science laboratories.',
        category: 'Activity',
        loc: 'Kasturba Road, Bangalore'
      },
      evening: {
        title: 'Church Street Bookstores & Brigade Road Shopping',
        desc: 'Browse Blossom Book House, sample filter coffee, and dine at contemporary fusion gastro-pubs.',
        category: 'Dining',
        loc: 'Church Street, Bangalore'
      }
    }
  ],

  // NAGPUR
  nagpur: [
    {
      day: 1,
      morning: {
        title: 'Deekshabhoomi Monument & Stupa Visit',
        desc: 'Visit the world-famous Buddhist stupa and peaceful architectural gardens.',
        category: 'Sightseeing',
        loc: 'Deekshabhoomi, Nagpur'
      },
      afternoon: {
        title: 'Famous Nagpur Tarri Poha & Saoji Culinary Tasting',
        desc: 'Taste authentic spicy Saoji chicken curry and iconic Nagpur Tarri Poha.',
        category: 'Dining',
        loc: 'Sitabuldi Food Quarter'
      },
      evening: {
        title: 'Futala Lake Musical Fountain & Waterfront Promenade',
        desc: 'Stroll along Futala Lake with evening fountain light shows and sidewalk snacks.',
        category: 'Sightseeing',
        loc: 'Futala Lake Waterfront'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Sitabuldi Fort Heritage Excursion',
        desc: 'Explore historic 1817 hill fort with panoramic city views.',
        category: 'Sightseeing',
        loc: 'Sitabuldi Fort Reserve'
      },
      afternoon: {
        title: 'Raman Science Centre & Planetarium Show',
        desc: 'Interactive science exhibits, 3D space planetarium, and prehistoric park.',
        category: 'Activity',
        loc: 'Subhash Nagar, Nagpur'
      },
      evening: {
        title: 'Haldiram’s Original Sweets & Orange Barfi Shopping',
        desc: 'Sample original Nagpur Santra (Orange) Barfi and savory delicacies.',
        category: 'Dining',
        loc: 'Dharampeth Commercial Market'
      }
    },
    {
      day: 3,
      morning: {
        title: 'Ambazari Lake & Garden Morning Boating Safari',
        desc: 'Peaceful boat ride and garden walking trail along Nag River origin.',
        category: 'Activity',
        loc: 'Ambazari Lake Park'
      },
      afternoon: {
        title: 'Dragon Palace Temple Kamptee Visit',
        desc: 'Beautiful Japanese Buddhist temple set amidst manicured zen gardens.',
        category: 'Sightseeing',
        loc: 'Kamptee, Nagpur District'
      },
      evening: {
        title: 'Nagpur Central Mall Shopping & Rooftop Cafe Lounge',
        desc: 'Souvenir shopping and relaxing sunset dinner overlooking the city.',
        category: 'Dining',
        loc: 'Civil Lines, Nagpur'
      }
    }
  ],
  // SHIRDI
  shirdi: [
    {
      day: 1,
      morning: {
        title: 'Shri Sai Baba Samadhi Mandir & Kakad Aarti Darshan',
        desc: 'Experience early morning sacred Kakad Aarti and holy Samadhi Darshan of Sai Baba.',
        category: 'Sightseeing',
        loc: 'Shirdi Temple Complex'
      },
      afternoon: {
        title: 'Dwarkamai & Chavadi Sacred Heritage Walk',
        desc: 'Visit the sacred mosque where Baba resided and the Chavadi procession pavilion.',
        category: 'Sightseeing',
        loc: 'Shirdi Central Compound'
      },
      evening: {
        title: 'Sai Teerth Spiritual Theme Park & 5D Show',
        desc: 'Experience India\'s first devotional theme park featuring 5D Teerth Yatra and fountain light show.',
        category: 'Activity',
        loc: 'Pimpalwadi Road, Shirdi'
      }
    },
    {
      day: 2,
      morning: {
        title: 'Khandoba Mandir & Gurusthan Sacred Neem Tree',
        desc: 'Pay homage where Mahalsapati welcomed Baba, and visit the sacred wish-fulfilling Neem tree.',
        category: 'Sightseeing',
        loc: 'Ahmednagar-Manmad Road, Shirdi'
      },
      afternoon: {
        title: 'Shani Shingnapur Holy Shrine Countryside Excursion',
        desc: 'Short scenic countryside trip to the unique lockless village and open-air Shani Dev temple.',
        category: 'Activity',
        loc: 'Nevasa Taluka, 70km from Shirdi'
      },
      evening: {
        title: 'Sai Prasadalaya Mahaprasad & Traditional Mawa Peda Tasting',
        desc: 'Savor blessed satvik Mahaprasad at Asia\'s largest solar kitchen followed by local sweets shopping.',
        category: 'Dining',
        loc: 'Sai Prasadalaya Complex, Shirdi'
      }
    }
  ]
};

// Common aliases mapping
POPULAR_DESTINATIONS_DATA['gangtok'] = POPULAR_DESTINATIONS_DATA['sikkim'];
POPULAR_DESTINATIONS_DATA['bombay'] = POPULAR_DESTINATIONS_DATA['mumbai'];
POPULAR_DESTINATIONS_DATA['new delhi'] = POPULAR_DESTINATIONS_DATA['delhi'];
POPULAR_DESTINATIONS_DATA['dilli'] = POPULAR_DESTINATIONS_DATA['delhi'];
POPULAR_DESTINATIONS_DATA['bengaluru'] = POPULAR_DESTINATIONS_DATA['bangalore'];
POPULAR_DESTINATIONS_DATA['kullu'] = POPULAR_DESTINATIONS_DATA['manali'];
POPULAR_DESTINATIONS_DATA['solang'] = POPULAR_DESTINATIONS_DATA['manali'];
POPULAR_DESTINATIONS_DATA['pink city'] = POPULAR_DESTINATIONS_DATA['jaipur'];
POPULAR_DESTINATIONS_DATA['munnar'] = POPULAR_DESTINATIONS_DATA['kerala'];
POPULAR_DESTINATIONS_DATA['alleppey'] = POPULAR_DESTINATIONS_DATA['kerala'];
POPULAR_DESTINATIONS_DATA['leh'] = POPULAR_DESTINATIONS_DATA['ladakh'];
POPULAR_DESTINATIONS_DATA['srinagar'] = POPULAR_DESTINATIONS_DATA['kashmir'];
POPULAR_DESTINATIONS_DATA['gulmarg'] = POPULAR_DESTINATIONS_DATA['kashmir'];
POPULAR_DESTINATIONS_DATA['pahalgam'] = POPULAR_DESTINATIONS_DATA['kashmir'];
POPULAR_DESTINATIONS_DATA['kashi'] = POPULAR_DESTINATIONS_DATA['varanasi'];
POPULAR_DESTINATIONS_DATA['benaras'] = POPULAR_DESTINATIONS_DATA['varanasi'];
POPULAR_DESTINATIONS_DATA['taj mahal'] = POPULAR_DESTINATIONS_DATA['agra'];
