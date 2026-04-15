# Who Hit a Homerun Today?

*Dingers.*

https://homeruntoday.blakemartinez.dev/

I just really like baseball and I really like numbers. This was supposed to be a quick weekend thing.

Pick any date, see who went yard. Each card is a player who homered that day. Expand a row and you get the trajectory view — launch angle, exit velo, distance, where it landed.

Click a player's name or photo to open their profile. Season stats up top, a spray map of every HR landing spot, then a flipper you can page through game by game. Each HR shows the pitch type, ball metrics, and MLB's excitement score. The season picker goes back to their debut year.

⌘K (or the search button in the corner) finds any player, active or retired.

## border colors

| color | what it means |
|-------|--------------|
| emerald | milestone — record-tying, 30th/50th of the season, debut |
| red | moonshot — 450+ ft |
| yellow | scorcher — 110+ mph exit velo |
| purple | multi-HR game |
| blue | clutch — MLB's captivating index 80+ |

Cards stack up to three borders if they hit multiple thresholds.

## tech

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- [MLB Stats API](https://statsapi.mlb.com) — public REST, no key needed
- Deployed on Vercel

## dev

```bash
npm install
npm run dev   # http://localhost:3000
npm run build
```

Blake Martinez
