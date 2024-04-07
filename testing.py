import statsapi
from datetime import datetime
import requests

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
def baseball_reference_url(player_name):
    parts = player_name.split()
    last_name = parts[-1].replace("'", "").lower()[:5]  # Remove apostrophes and limit to 5 characters
    first_name = parts[0][:2].lower()
    if len(parts) > 2:
        if parts[-1][-1] == '.' and len(parts[-1]) <= 4:
            last_name = parts[-2].replace("'", "").lower()[:5]  # Remove apostrophes and limit to 5 characters
            first_name = parts[0][:2].lower()
    return f"https://www.baseball-reference.com/players/{last_name[0]}/{last_name}{first_name}01.shtml"

# # Function to get player image URL from Sports Open Data API
# def get_player_image_url(player_name):
#     formatted_name = player_name.replace(" ", "_")
#     endpoint_url = f"https://www.thesportsdb.com/api/v1/json/4/searchplayers.php?p={formatted_name}"
#     try:
#         response = requests.get(endpoint_url)
#         data = response.json()
#         image_url = data["player"][0]["strThumb"]
#         return image_url
#     except (requests.RequestException, KeyError, IndexError) as e:
#         print(f"Error fetching image URL for {player_name}: {e}")
#         return None

# Get today's date
today_date = datetime.today().strftime('%Y-%m-%d')

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
                runs_scored = play['result']['rbi']
                batter = play['matchup']['batter']['fullName']
                batter_url = baseball_reference_url(batter)
                # batter_image_url = get_player_image_url(batter)
                
                # Store home run information for each player
                if batter not in home_runs_by_player:
                    home_runs_by_player[batter] = []
                home_runs_by_player[batter].append((top_bottom, inning_with_suffix, runs_scored, batter_url))
        except KeyError:
            pass

# Print home run information for each player
for player, home_runs in home_runs_by_player.items():
    print(f"Player: {player}")
    for top_bottom, inning_with_suffix, runs_scored, batter_url in home_runs:
        print(f"[{top_bottom} {inning_with_suffix}] {player} hit {runs_scored} run homerun")
        print(f"Baseball Reference URL: {batter_url}")
        # print(f"Player Image URL: {batter_image_url}")
    print()
