# Who Hit a Homerun Today?

*Dingers.*

https://who-hit-a-homerun-today.vercel.app/

I just really like baseball and I really like numbers. This was supposed to be a quick weekend thing.

Pick any date, see who went yard. Each card is a player who homered that day. Click a row to expand it and you get a small trajectory view — launch angle, exit velo, distance, where it landed.

The border colors mean things. Emerald is a milestone (record-tying, 30th or 50th of the season, season debut, postseason debut). Red is a moonshot, 450+ feet. Yellow is a scorcher, 110+ mph exit velo. Purple means they hit more than one that day. Blue is clutch — MLB has an internal captivating index, and 80+ qualifies. Cards can have more than one border if they hit multiple thresholds.

## tech

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- MLB Stats API — public REST, no key needed
- Deployed on Vercel

## dev

```bash
npm install
npm run dev   # http://localhost:3000
npm run build
```

Blake Martinez
