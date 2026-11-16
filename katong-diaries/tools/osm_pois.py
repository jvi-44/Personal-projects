#!/usr/bin/env python3
"""Pass 3a: categorise OpenStreetMap places (nodes + areas) around Katong.
Writes pois_osm.json: [{name, cat, sub, x, y, addr..., tags subset}]"""
import json, math, sys, re, collections

RAW, OUT = sys.argv[1], sys.argv[2]
RW = 5000.0
raw = json.load(open(RAW))

CUISINE_NICE = {
    'coffee_shop': 'Coffee', 'bubble_tea': 'Bubble tea', 'ice_cream': 'Ice cream', 'chinese': 'Chinese', 'japanese': 'Japanese',
    'korean': 'Korean', 'thai': 'Thai', 'vietnamese': 'Vietnamese', 'indian': 'Indian', 'malay': 'Malay', 'indonesian': 'Indonesian',
    'italian': 'Italian', 'pizza': 'Pizza', 'burger': 'Burgers', 'sushi': 'Sushi', 'ramen': 'Ramen', 'seafood': 'Seafood',
    'regional': 'Local', 'asian': 'Asian', 'western': 'Western', 'american': 'American', 'mexican': 'Mexican', 'french': 'French',
    'chicken': 'Chicken', 'noodle': 'Noodles', 'dessert': 'Dessert', 'cake': 'Cakes', 'bagel': 'Bagels', 'sandwich': 'Sandwiches',
    'steak_house': 'Steakhouse', 'barbecue': 'BBQ', 'bbq': 'BBQ', 'hotpot': 'Hotpot', 'dim_sum': 'Dim sum', 'vegetarian': 'Vegetarian',
    'vegan': 'Vegan', 'singaporean': 'Singaporean', 'peranakan': 'Peranakan', 'nyonya': 'Peranakan', 'spanish': 'Spanish', 'tapas': 'Tapas',
    'mediterranean': 'Mediterranean', 'middle_eastern': 'Middle Eastern', 'turkish': 'Turkish', 'german': 'German', 'greek': 'Greek',
    'kebab': 'Kebab', 'fish_and_chips': 'Fish & chips', 'donut': 'Doughnuts', 'pancake': 'Pancakes', 'breakfast': 'Breakfast',
    'brunch': 'Brunch', 'tea': 'Tea', 'juice': 'Juice', 'yogurt': 'Yogurt', 'frozen_yogurt': 'Froyo', 'crepe': 'Crepes', 'pastry': 'Pastry',
    'teochew': 'Teochew', 'cantonese': 'Cantonese', 'hainanese': 'Hainanese', 'hokkien': 'Hokkien', 'sichuan': 'Sichuan', 'taiwanese': 'Taiwanese',
    'filipino': 'Filipino', 'nepalese': 'Nepalese', 'pakistani': 'Pakistani', 'bangladeshi': 'Bangladeshi', 'sri_lankan': 'Sri Lankan',
    'fried_chicken': 'Fried chicken', 'wings': 'Wings', 'curry': 'Curry', 'dumpling': 'Dumplings', 'porridge': 'Porridge', 'satay': 'Satay',
    'laksa': 'Laksa', 'chicken_rice': 'Chicken rice', 'nasi_lemak': 'Nasi lemak', 'local': 'Local', 'international': 'International',
    'fusion': 'Fusion', 'fine_dining': 'Fine dining', 'bistro': 'Bistro', 'grill': 'Grill', 'salad': 'Salads', 'healthy': 'Healthy',
    'acai': 'Açaí', 'waffle': 'Waffles', 'bakery': 'Bakery', 'halal': 'Halal', 'zi_char': 'Zi char', 'bak_kut_teh': 'Bak kut teh',
    'peruvian': 'Peruvian', 'brazilian': 'Brazilian', 'russian': 'Russian', 'british': 'British', 'irish': 'Irish', 'european': 'European',
    'oriental': 'Asian', 'shanghainese': 'Shanghainese', 'hakka': 'Hakka', 'yakiniku': 'Yakiniku', 'yakitori': 'Yakitori', 'tempura': 'Tempura',
    'udon': 'Udon', 'soba': 'Soba', 'donburi': 'Donburi', 'poke': 'Poke', 'hawaiian': 'Hawaiian', 'soup': 'Soup', 'mala': 'Mala',
    'chocolate': 'Chocolate', 'gelato': 'Gelato', 'smoothie': 'Smoothies', 'beef': 'Beef', 'fish': 'Fish', 'crab': 'Crab', 'duck': 'Duck',
    'prata': 'Prata', 'roti_prata': 'Prata', 'briyani': 'Biryani', 'biryani': 'Biryani', 'nasi_padang': 'Nasi padang', 'padang': 'Nasi padang',
}


def nice_cuisine(c):
    if not c:
        return ''
    parts = [p.strip().lower() for p in re.split(r'[;,]', c) if p.strip()]
    out = []
    for p in parts[:3]:
        n = CUISINE_NICE.get(p) or p.replace('_', ' ').capitalize()
        if n not in out:
            out.append(n)
    return ' · '.join(out)


FIT_WORDS = [('pilates', 'Pilates'), ('reformer', 'Pilates'), ('yoga', 'Yoga'), ('barre', 'Barre'), ('spin', 'Spin'), ('cycle', 'Spin'),
             ('boxing', 'Boxing'), ('muay', 'Muay Thai'), ('climb', 'Climbing'), ('boulder', 'Climbing'), ('dance', 'Dance'),
             ('crossfit', 'CrossFit'), ('f45', 'HIIT'), ('swim', 'Swimming'), ('martial', 'Martial arts'), ('taekwondo', 'Martial arts'),
             ('jiu', 'Martial arts'), ('karate', 'Martial arts'), ('gym', 'Gym'), ('fitness', 'Gym'), ('anytime', 'Gym'), ('activesg', 'Gym')]

SHOP_FASHION = {'clothes': 'Fashion', 'shoes': 'Shoes', 'boutique': 'Boutique', 'fashion_accessories': 'Accessories', 'bag': 'Bags',
                'jewelry': 'Jewellery', 'watches': 'Watches', 'department_store': 'Department store', 'second_hand': 'Thrift & vintage',
                'charity': 'Thrift & vintage', 'vintage': 'Thrift & vintage', 'gift': 'Gifts', 'books': 'Books', 'stationery': 'Stationery',
                'art': 'Art', 'music': 'Records & music', 'musical_instrument': 'Music', 'toys': 'Toys', 'games': 'Games', 'florist': 'Flowers',
                'interior_decoration': 'Home & decor', 'furniture': 'Furniture', 'houseware': 'Homeware', 'antiques': 'Antiques', 'craft': 'Craft',
                'frame': 'Art', 'sports': 'Sportswear', 'outdoor': 'Outdoor gear', 'bicycle': 'Bikes', 'fabric': 'Fabric', 'tailor': 'Tailor',
                'collector': 'Collectibles', 'anime': 'Collectibles', 'photo': 'Photo', 'camera': 'Cameras', 'candles': 'Home & decor',
                'pottery': 'Ceramics', 'baby_goods': 'Kids', 'bed': 'Home & decor', 'kitchen': 'Kitchenware', 'lighting': 'Home & decor',
                'curtain': 'Home & decor', 'carpet': 'Home & decor', 'tea': 'Tea', 'wine': 'Wine', 'cheese': 'Cheese', 'spices': 'Spices'}
SHOP_BEAUTY = {'beauty': 'Beauty salon', 'hairdresser': 'Hair', 'massage': 'Massage', 'cosmetics': 'Beauty store', 'perfumery': 'Fragrance',
               'tattoo': 'Tattoo', 'nails': 'Nails', 'hairdresser_supply': 'Hair', 'herbalist': 'Wellness', 'nutrition_supplements': 'Wellness',
               'spa': 'Spa'}
SHOP_DESSERT = {'bakery': 'Bakery', 'pastry': 'Patisserie', 'confectionery': 'Sweets', 'chocolate': 'Chocolate', 'ice_cream': 'Ice cream'}
SHOP_ESS = {'supermarket': 'Supermarket', 'convenience': 'Convenience', 'greengrocer': 'Grocer', 'butcher': 'Butcher', 'seafood': 'Seafood',
            'deli': 'Deli', 'alcohol': 'Bottle shop', 'beverages': 'Drinks', 'health_food': 'Health food', 'variety_store': 'Variety store',
            'chemist': 'Pharmacy', 'hardware': 'Hardware', 'doityourself': 'DIY', 'electronics': 'Electronics', 'mobile_phone': 'Phones',
            'computer': 'Computers', 'laundry': 'Laundry', 'dry_cleaning': 'Dry cleaning', 'pet': 'Pets', 'optician': 'Optician',
            'medical_supply': 'Pharmacy', 'general': 'General store', 'kiosk': 'Kiosk', 'newsagent': 'Newsagent', 'frozen_food': 'Grocer',
            'pet_grooming': 'Pets', 'travel_agency': 'Travel', 'copyshop': 'Printing', 'organic': 'Grocer', 'bakery;convenience': 'Convenience'}


MRT_LINES = {'Tanjong Rhu': 'TEL', 'Katong Park': 'TEL', 'Tanjong Katong': 'TEL', 'Marine Parade': 'TEL', 'Marine Terrace': 'TEL',
             'Siglap': 'TEL', 'Bayshore': 'TEL', 'Gardens by the Bay': 'TEL', 'Kallang': 'EWL', 'Aljunied': 'EWL', 'Paya Lebar': 'EWL · CCL',
             'Eunos': 'EWL', 'Kembangan': 'EWL', 'Bedok': 'EWL', 'Lavender': 'EWL', 'Stadium': 'CCL', 'Mountbatten': 'CCL', 'Dakota': 'CCL',
             'MacPherson': 'CCL · DTL', 'Nicoll Highway': 'CCL', 'Tai Seng': 'CCL', 'Ubi': 'DTL', 'Kaki Bukit': 'DTL', 'Mattar': 'DTL',
             'Geylang Bahru': 'DTL', 'Bendemeer': 'DTL', 'Bedok North': 'DTL', 'Boon Keng': 'NEL', 'Potong Pasir': 'NEL', 'Woodleigh': 'NEL',
             'Bedok Reservoir': 'DTL', 'Promenade': 'CCL · DTL', 'Bartley': 'CCL'}
MRT_SKIP = {"Founders' Memorial"}


def categorize(t):
    """-> (cat, sub) or None"""
    am, sh, le, to, hi = t.get('amenity'), t.get('shop'), t.get('leisure'), t.get('tourism'), t.get('historic')
    name = (t.get('name') or '').lower()
    cu = nice_cuisine(t.get('cuisine'))
    if am == 'cafe':
        if 'bubble' in (t.get('cuisine') or '') or any(k in name for k in ('koi', 'liho', 'gong cha', 'chicha', 'playmade', 'tea')) and 'cafe' not in name:
            return ('dessert', 'Bubble tea')
        return ('cafe', cu if cu and cu != 'Coffee' else 'Café')
    if am in ('restaurant',):
        return ('eat', cu or 'Restaurant')
    if am == 'fast_food':
        return ('eat', cu or 'Quick bites')
    if am == 'food_court':
        return ('hawker', 'Hawker centre' if any(k in name for k in ('food centre', 'market', 'hawker', 'food village')) else 'Food court')
    if am in ('bar', 'pub', 'biergarten'):
        return ('bar', 'Pub' if am == 'pub' else 'Bar')
    if am == 'ice_cream':
        return ('dessert', 'Ice cream')
    if am in ('cinema',):
        return ('do', 'Cinema')
    if am in ('theatre', 'arts_centre'):
        return ('do', 'Arts')
    if am == 'library':
        return ('do', 'Library')
    if am in ('karaoke_box', 'karaoke'):
        return ('do', 'Karaoke')
    if am == 'place_of_worship':
        rel = t.get('religion', '')
        return ('heritage', {'muslim': 'Mosque', 'hindu': 'Hindu temple', 'buddhist': 'Buddhist temple', 'taoist': 'Taoist temple',
                             'christian': 'Church', 'sikh': 'Gurdwara', 'jewish': 'Synagogue'}.get(rel, 'Place of worship'))
    if am == 'marketplace':
        return ('hawker', 'Market')
    if am == 'spa':
        return ('beauty', 'Spa')
    if am == 'community_centre':
        return ('do', 'Community club')
    if am in ('dancing_school',):
        return ('fit', 'Dance')
    if sh:
        if sh in SHOP_DESSERT:
            return ('dessert', SHOP_DESSERT[sh])
        if sh == 'coffee':
            return ('cafe', 'Coffee')
        if sh in SHOP_BEAUTY:
            return ('beauty', SHOP_BEAUTY[sh])
        if sh == 'mall':
            return ('mall', 'Mall')
        if sh in SHOP_FASHION:
            return ('shop', SHOP_FASHION[sh])
        if sh in SHOP_ESS:
            return ('ess', SHOP_ESS[sh])
        if sh in ('yes',):
            return ('shop', 'Shop')
        return None
    if le in ('fitness_centre', 'sports_centre', 'dance', 'sports_hall'):
        sp = (t.get('sport') or '').lower()
        hay = name + ' ' + sp
        for k, v in FIT_WORDS:
            if k in hay:
                return ('fit', v)
        return ('fit', 'Sports centre' if le != 'fitness_centre' else 'Gym')
    if le in ('bowling_alley', 'amusement_arcade', 'escape_game', 'miniature_golf', 'ice_rink', 'water_park', 'trampoline_park',
              'indoor_play', 'adult_gaming_centre', 'hackerspace', 'stadium'):
        return ('do', {'bowling_alley': 'Bowling', 'amusement_arcade': 'Arcade', 'escape_game': 'Escape room', 'ice_rink': 'Ice skating',
                       'water_park': 'Water park', 'stadium': 'Stadium', 'miniature_golf': 'Mini golf'}.get(le, 'Fun'))
    if le in ('park', 'garden', 'nature_reserve', 'dog_park', 'beach_resort', 'marina'):
        return ('park', {'garden': 'Garden', 'dog_park': 'Dog run', 'marina': 'Marina'}.get(le, 'Park'))
    if le == 'swimming_pool' and t.get('access') != 'private' and name:
        return ('fit', 'Swimming')
    if to in ('attraction', 'theme_park', 'zoo', 'aquarium'):
        return ('do', 'Attraction')
    if to in ('museum', 'gallery'):
        return ('heritage', 'Museum' if to == 'museum' else 'Gallery')
    if to == 'artwork':
        return ('photo', 'Mural' if t.get('artwork_type') in ('mural', 'graffiti', 'painting') else 'Public art')
    if to == 'viewpoint':
        return ('photo', 'Viewpoint')
    if to in ('hotel', 'hostel', 'guest_house', 'apartment'):
        return ('stay', 'Hotel' if to == 'hotel' else 'Hostel')
    if to in ('picnic_site', 'camp_site'):
        return ('park', 'Picnic spot')
    if hi in ('memorial', 'monument', 'building', 'heritage', 'house', 'ruins', 'fort'):
        return ('heritage', 'Landmark')
    if t.get('railway') in ('station', 'stop') and (t.get('station') == 'subway' or t.get('subway') == 'yes' or t.get('railway') == 'station'
                                                    or 'Line' in t.get('network', '') or 'Mass Rapid' in t.get('network', '')):
        return ('mrt', MRT_LINES.get((t.get('name') or '').strip(), 'MRT'))
    if t.get('public_transport') == 'station' and t.get('subway') == 'yes':
        return ('mrt', MRT_LINES.get((t.get('name') or '').strip(), 'MRT'))
    if t.get('natural') == 'beach' and name:
        return ('park', 'Beach')
    if t.get('craft') in ('pottery', 'photographer', 'jeweller', 'confectionery', 'bakery', 'brewery', 'distillery'):
        cr = t.get('craft')
        if cr in ('confectionery', 'bakery'):
            return ('dessert', 'Bakery')
        if cr in ('brewery', 'distillery'):
            return ('bar', 'Brewery')
        return ('do', 'Workshop')
    return None


def addr_of(t):
    hn, st = t.get('addr:housenumber', ''), t.get('addr:street', '')
    unit = t.get('addr:unit', '') or t.get('addr:door', '')
    a = (hn + ' ' + st).strip()
    if unit:
        u = unit if unit.startswith('#') else '#' + unit
        a = (a + ', ' + u).strip(', ')
    return a


out = []
seen = collections.defaultdict(list)
SKIP_NAMES = re.compile(r'(?i)\b(ktv|karaoke lounge|night ?club|massage parlou?r)\b')


def consider(t, x, y, src):
    if x * x + y * y > RW * RW:
        return
    if t.get('disused') == 'yes' or t.get('abandoned') == 'yes' or any(k.startswith(('disused:', 'abandoned:', 'was:', 'razed:', 'demolished:')) for k in t):
        return
    if t.get('amenity') in ('brothel', 'nightclub', 'stripclub', 'gambling', 'love_hotel'):
        return
    c = categorize(t)
    if not c:
        return
    name = t.get('name:en') or t.get('name') or t.get('brand') or ''
    name = name.strip()
    if not name:
        if c[0] == 'photo' and t.get('artwork_type'):
            name = 'Mural' if c[1] == 'Mural' else 'Public art'
        else:
            return
    if SKIP_NAMES.search(name):
        return
    key = re.sub(r'[^a-z0-9]', '', name.lower())
    rad = 700 if c[0] == 'mrt' else 45
    for (ox, oy, oc) in seen[key]:
        if (ox - x) ** 2 + (oy - y) ** 2 < rad * rad:
            return
    seen[key].append((x, y, c[0]))
    if c[0] == 'mrt' and name in MRT_SKIP:
        return
    if c[0] == 'mrt' and not name.endswith('MRT'):
        name = name + ' MRT'
    rec = {'n': name, 'c': c[0], 's': c[1], 'x': round(x, 1), 'y': round(y, 1)}
    a = addr_of(t)
    if a:
        rec['a'] = a
    if t.get('addr:postcode'):
        rec['pc'] = t['addr:postcode']
    oh = t.get('opening_hours')
    if oh and len(oh) < 90:
        rec['oh'] = oh
    w = t.get('website') or t.get('contact:website') or t.get('url')
    if w and len(w) < 120:
        rec['w'] = w
    ig = t.get('contact:instagram')
    if ig and len(ig) < 80:
        rec['ig'] = ig
    if t.get('level'):
        rec['lvl'] = t['level']
    if t.get('diet:halal') == 'yes' or 'halal' in (t.get('cuisine') or ''):
        rec['halal'] = 1
    if t.get('diet:vegetarian') in ('yes', 'only') or t.get('diet:vegan') in ('yes', 'only'):
        rec['veg'] = 1
    if t.get('brand'):
        rec['brand'] = t['brand']
    if src == 'area':
        rec['area'] = 1
    out.append(rec)


for n in raw['nodes']:
    consider(n['t'], n['x'], n['y'], 'node')
for a in raw['areas']:
    t = a['t']
    if not a['g']:
        continue
    o = a['g'][0]['o']
    cx = sum(p[0] for p in o[:-1]) / max(1, len(o) - 1)
    cy = sum(p[1] for p in o[:-1]) / max(1, len(o) - 1)
    consider(t, cx, cy, 'area')

if not any(r['n'] == 'Katong Park MRT' for r in out):
    out.append({'n': 'Katong Park MRT', 'c': 'mrt', 's': 'TEL', 'x': -1972.0, 'y': -915.0})
json.dump(out, open(OUT, 'w'), ensure_ascii=False)
cnt = collections.Counter(r['c'] for r in out)
print('pois', len(out), cnt.most_common())
near = [r for r in out if math.hypot(r['x'], r['y']) < 1300]
print('within 1.3km', len(near), collections.Counter(r['c'] for r in near).most_common())
if len(sys.argv) > 3:
    for c in sys.argv[3].split(','):
        print('\n##', c)
        rows = sorted([r for r in near if r['c'] == c], key=lambda r: r['n'])
        print(' | '.join(f"{r['n']} ({r.get('a', '')})" for r in rows))
