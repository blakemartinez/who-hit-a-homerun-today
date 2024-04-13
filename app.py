from flask import Flask, render_template
import statsapi
import pytz
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)

mlb_team_logos = {
    'Arizona Diamondbacks': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Arizona_Diamondbacks_logo_teal.svg/178px-Arizona_Diamondbacks_logo_teal.svg.png',
    'Atlanta Braves': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Atlanta_Braves.svg/263px-Atlanta_Braves.svg.png',
    'Baltimore Orioles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Baltimore_Orioles_Script.svg/263px-Baltimore_Orioles_Script.svg.png',
    'Boston Red Sox': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/RedSoxPrimary_HangingSocks.svg/153px-RedSoxPrimary_HangingSocks.svg.png',
    'Chicago White Sox': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Chicago_White_Sox.svg/108px-Chicago_White_Sox.svg.png',
    'Chicago Cubs': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Chicago_Cubs_logo.svg/149px-Chicago_Cubs_logo.svg.png',
    'Cincinnati Reds': 'https://upload.wikimedia.org/wikipedia/commons/0/01/Cincinnati_Reds_Logo.svg',
    'Cleveland Guardians': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Guardians_winged_%22G%22.svg/178px-Guardians_winged_%22G%22.svg.png',
    'Colorado Rockies': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/Colorado_Rockies_full_logo.svg/224px-Colorado_Rockies_full_logo.svg.png',
    'Detroit Tigers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Detroit_Tigers_logo.svg/104px-Detroit_Tigers_logo.svg.png',
    'Houston Astros': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Houston-Astros-Logo.svg/150px-Houston-Astros-Logo.svg.png',
    'Kansas City Royals': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Kansas_City_Royals.svg/130px-Kansas_City_Royals.svg.png',
    'Los Angeles Angels': 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Los_Angeles_Angels_of_Anaheim.svg',
    'Los Angeles Dodgers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Los_Angeles_Dodgers_Logo.svg/145px-Los_Angeles_Dodgers_Logo.svg.png',
    'Miami Marlins': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Marlins_team_logo.svg/154px-Marlins_team_logo.svg.png',
    'Milwaukee Brewers': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Milwaukee_Brewers_logo.svg/150px-Milwaukee_Brewers_logo.svg.png',
    'Minnesota Twins': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Minnesota_Twins_wordmark_logo_%282023_rebrand%29.svg/263px-Minnesota_Twins_wordmark_logo_%282023_rebrand%29.svg.png',
    'New York Yankees': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/New_York_Yankees_Primary_Logo.svg/136px-New_York_Yankees_Primary_Logo.svg.png',
    'New York Mets': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/New_York_Mets.svg/150px-New_York_Mets.svg.png',
    'Oakland Athletics': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Oakland_A%27s_logo.svg/150px-Oakland_A%27s_logo.svg.png',
    'Philadelphia Phillies': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/Philadelphia_Phillies_%282019%29_logo.svg/169px-Philadelphia_Phillies_%282019%29_logo.svg.png',
    'Pittsburgh Pirates': 'https://upload.wikimedia.org/wikipedia/commons/8/85/Pittsburgh_Pirates_Logo.svg',
    'San Diego Padres': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/SDPadres_logo.svg',
    'San Francisco Giants': 'https://upload.wikimedia.org/wikipedia/commons/4/49/San_Francisco_Giants_Cap_Insignia.svg',
    'Seattle Mariners': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/Seattle_Mariners_logo_%28low_res%29.svg/150px-Seattle_Mariners_logo_%28low_res%29.svg.png',
    'St. Louis Cardinals': 'https://upload.wikimedia.org/wikipedia/en/9/9d/St._Louis_Cardinals_logo.svg',
    'Tampa Bay Rays': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Tampa_Bay_Rays_Logo.svg/263px-Tampa_Bay_Rays_Logo.svg.png',
    'Texas Rangers': 'https://upload.wikimedia.org/wikipedia/en/4/41/Texas_Rangers.svg',
    'Toronto Blue Jays': 'https://upload.wikimedia.org/wikipedia/en/b/ba/Toronto_Blue_Jays_logo.svg',
    'Washington Nationals': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Washington_Nationals_logo.svg'
}

def add_suffix(num):
    if num % 10 == 1 and num != 11:
        return f"{num}st"
    elif num % 10 == 2 and num != 12:
        return f"{num}nd"
    elif num % 10 == 3 and num != 13:
        return f"{num}rd"
    else:
        return f"{num}th"
        
def espn_url(player_name):
    name = player_name.replace("'", "").replace(" ", "%20")
    return f"https://www.mlb.com/search?q={name}"

def get_player_image_url(player_name):
    try: 
        headers = requests.utils.default_headers()
        headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
        })
        name = player_name.replace("'", "").replace(" ", "%20")
        url= f"https://www.google.com/search?q={name}%20stats%20espn%20baseball&sxsrf=ALeKk03xBalIZi7BAzyIRw8R4_KrIEYONg:1620885765119&source=lnms&tbm=isch&sa=X&ved=2ahUKEwjv44CC_sXwAhUZyjgGHSgdAQ8Q_AUoAXoECAEQAw&cshid=1620885828054361"
        response = requests.get(url, headers=headers)
        html_content = response.text
        # Parse the HTML using BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        image_elements = soup.find_all('img')
        return image_elements[1]['src']
    except (requests.RequestException, KeyError, IndexError, TypeError) as e:
        print(f"Error fetching image URL for {player_name}: {e}")
        return None

@app.route('/')
def home():
    # Get today's date
    desired_timezone = pytz.timezone('America/Chicago') 
    current_time = datetime.now(desired_timezone)
    formatted_time = current_time.strftime('%I:%M %p')
    today_date = current_time.strftime('%Y-%m-%d')
    current_date = current_time.strftime('%B %d, %Y')

    # Fetch today's games
    games = statsapi.schedule(sportId=1, date=today_date)

    # Dictionary to store home runs for each player
    home_runs_by_player = {}

    total_home_run_count = 0

    for game in games:
        game_id = game['game_id']
        # Get play-by-play data for the game
        plays = statsapi.get("game_playByPlay", {"gamePk": game_id})

        # Iterate through each play in the game
        for play in plays['allPlays']:
            try:
                # Check if the play resulted in a home run
                if play.get('result') and play['result'].get('eventType') == 'home_run':

                    batter = play['matchup']['batter']['fullName']
                    batter_id = play['matchup']['batter']['id']

                    # unique to each homerun
                    inning = play['about']['inning']
                    inning_with_suffix = add_suffix(inning)
                    top_bottom = "Top" if play['about']['isTopInning'] else "Bot"
                    runs_scored = "Solo" if str(play['result']['rbi']) == "1" else str(play['result']['rbi']) + " run"
                    homerun_number = int(re.search(r'\((\d+)\)', play['result']['description']).group(1))
                    # Place in json that holds distance / launch speed
                    play_events = play['playEvents']

                    # Define patterns to search for
                    patterns = {
                        'totalDistance': r"'totalDistance'\s*:\s*(\d+\.?\d*)",
                        'launchSpeed': r"'launchSpeed'\s*:\s*(\d+\.?\d*)"
                    }

                    # Initialize results dictionary
                    results = {}

                    # Search for patterns in the string
                    for key, pattern in patterns.items():
                        match = re.search(pattern, str(play_events))
                        if match:
                            results[key] = float(match.group(1))
                        else:
                            results[key] = None

                    # save an api call if we already have info
                    if batter in home_runs_by_player:
                        current_team = home_runs_by_player[batter][0]
                        batter_url = home_runs_by_player[batter][0]
                        batter_image_url = home_runs_by_player[batter][0]
                    else:
                        player_stats = statsapi.player_stat_data(batter_id, 'homeruns', 'season')
                        current_team = player_stats.get('current_team')
                        batter_url = espn_url(batter)
                        # batter_image_url = get_player_image_url(batter)
                        # batter_image_url = 'https://www.shutterstock.com/image-photo/baseball-players-action-on-stadium-600nw-426420286.jpg'
                        batter_image_url = mlb_team_logos[current_team]
                    # print('\n\n')
                    # print("Batter: ", batter)
                    # print("Batter ID:", batter_id)
                    # print("Team: ", current_team)
                    # print("Homerun Number:", homerun_number)
                    # print("Launch Speed: ", results['launchSpeed'])
                    # print("Distance: ", results['totalDistance'])

                    # Store home run information for each player
                    if batter not in home_runs_by_player:
                        home_runs_by_player[batter] = []
                    home_runs_by_player[batter].append((top_bottom, inning_with_suffix, runs_scored, batter_url, batter_image_url, homerun_number, current_team, results['launchSpeed'], int(results['totalDistance'])))
                    total_home_run_count+=1
            except KeyError:
                pass

    # Check if home_runs_by_player is empty
    no_home_runs = not bool(home_runs_by_player)

    return render_template('index.html', current_date=current_date, current_time=formatted_time, home_runs=home_runs_by_player, no_home_runs=no_home_runs, total_home_run_count=total_home_run_count)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
