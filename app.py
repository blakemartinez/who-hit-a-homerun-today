from flask import Flask, render_template
import statsapi
import pytz
from datetime import datetime
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Function to add suffix to inning number
def add_suffix(num):
    if num % 10 == 1 and num != 11:
        return f"{num}st"
    elif num % 10 == 2 and num != 12:
        return f"{num}nd"
    elif num % 10 == 3 and num != 13:
        return f"{num}rd"
    else:
        return f"{num}th"
        
# Function to construct Baseball Reference URL for a player
def espn_url(player_name):
    name = player_name.replace("'", "").replace(" ", "%20")
    return f"https://www.mlb.com/search?q={name}"

# Function to get player image URL from Sports Open Data API
def get_player_image_url(player_name):
    try: 
        headers = requests.utils.default_headers()
        headers.update({
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
})
        name = player_name.replace("'", "").replace(" ", "%20")
        url= f"https://www.google.com/search?q={name}%20espn%20baseball&sxsrf=ALeKk03xBalIZi7BAzyIRw8R4_KrIEYONg:1620885765119&source=lnms&tbm=isch&sa=X&ved=2ahUKEwjv44CC_sXwAhUZyjgGHSgdAQ8Q_AUoAXoECAEQAw&cshid=1620885828054361"
        response = requests.get(url, headers=headers)
        # print(url)
        html_content = response.text
        # Parse the HTML using BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        # print(soup)
        # Find all image elements containing player images
        image_elements = soup.find_all('img')
        # print(image_elements)
        return image_elements[1]['src']
    except (requests.RequestException, KeyError, IndexError, TypeError) as e:
        print(f"Error fetching image URL for {player_name}: {e}")
        return None
 
@app.route('/')
def home():
    # Get today's date
    desired_timezone = pytz.timezone('America/Chicago') 
    current_time = datetime.now(desired_timezone)
    today_date = current_time.strftime('%Y-%m-%d')
    current_date = current_time.strftime('%B %d, %Y')

   
    # Fetch today's games
    games = statsapi.schedule(sportId=1, date=today_date)

    # Dictionary to store home runs for each player
    home_runs_by_player = {}

    for game in games:
        game_id = game['game_id']
        # Get play-by-play data for the game
        plays = statsapi.get("game_playByPlay", {"gamePk": game_id})

        # Iterate through each play in the game
        for play in plays['allPlays']:
            try:
                # Check if the play resulted in a home run
                if play.get('result') and play['result'].get('eventType') == 'home_run':
                    inning = play['about']['inning']
                    inning_with_suffix = add_suffix(inning)
                    top_bottom = "Top" if play['about']['isTopInning'] else "Bot"
                    runs_scored = "Solo" if str(play['result']['rbi']) == "1" else str(play['result']['rbi']) + " run"
                    batter = play['matchup']['batter']['fullName']
                    batter_url = espn_url(batter)
                    batter_image_url = get_player_image_url(batter)  # Fetch player image URL


                    # Store home run information for each player
                    if batter not in home_runs_by_player:
                        home_runs_by_player[batter] = []
                    home_runs_by_player[batter].append((top_bottom, inning_with_suffix, runs_scored, batter_url, batter_image_url))
            except KeyError:
                pass

    # Check if home_runs_by_player is empty
    no_home_runs = not bool(home_runs_by_player)

    return render_template('index.html', current_date=current_date, home_runs=home_runs_by_player, no_home_runs=no_home_runs)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
