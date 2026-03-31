"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { LeaderboardData } from "@/app/leaderboard/page";
import HRLoadingAnim from "@/components/HRLoadingAnim";

function LeaderboardDatePicker({
  currentDate,
  activeTab,
}: {
  currentDate: string;
  activeTab: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(date: string) {
    startTransition(() =>
      router.push(`/leaderboard?tab=${activeTab}&date=${date}`)
    );
  }

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center gap-6 font-mono">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Loading...
          </h1>
          <HRLoadingAnim />
        </div>
      )}
      <div className="inline-flex items-center gap-1">
        <button
          onClick={() => {
            const d = new Date(currentDate + "T12:00:00");
            d.setDate(d.getDate() - 1);
            navigate(d.toISOString().slice(0, 10));
          }}
          className="text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
        >
          &lsaquo;
        </button>
        <input
          type="date"
          defaultValue={currentDate}
          onChange={(e) => {
            if (e.target.value) navigate(e.target.value);
          }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
        />
        <button
          onClick={() => {
            const d = new Date(currentDate + "T12:00:00");
            d.setDate(d.getDate() + 1);
            navigate(d.toISOString().slice(0, 10));
          }}
          className="text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
        >
          &rsaquo;
        </button>
      </div>
    </>
  );
}

export default function LeaderboardTabs({
  data,
  activeTab,
}: {
  data: LeaderboardData;
  activeTab: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTab(tab: string) {
    startTransition(() =>
      router.push(`/leaderboard?tab=${tab}&date=${data.date}`)
    );
  }

  const tabs = [
    { id: "season", label: `${data.season} Season` },
    { id: "daily", label: "Daily" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-zinc-400 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isPending && (
        <div className="flex justify-center py-12">
          <HRLoadingAnim />
        </div>
      )}

      {!isPending && activeTab === "season" && (
        <SeasonView leaders={data.seasonLeaders} season={data.season} />
      )}

      {!isPending && activeTab === "daily" && (
        <DailyView data={data} />
      )}
    </div>
  );
}

function SeasonView({
  leaders,
  season,
}: {
  leaders: LeaderboardData["seasonLeaders"];
  season: number;
}) {
  if (leaders.length === 0) {
    return (
      <p className="text-zinc-500 text-center py-12">
        No HR leaders found for {season}.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
        {season} Season HR Leaders
      </h2>
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4 w-12">#</th>
              <th className="text-left py-3 px-2">Player</th>
              <th className="text-left py-3 px-2 hidden sm:table-cell">Team</th>
              <th className="text-right py-3 px-4">HR</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader, i) => (
              <tr
                key={leader.playerId}
                className={`border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors ${
                  i < 3 ? "bg-zinc-900/30" : ""
                }`}
              >
                <td className="py-3 px-4 text-zinc-500 font-bold">
                  {leader.rank}
                </td>
                <td className="py-3 px-2">
                  <a
                    href={`/player/${leader.playerId}`}
                    className="text-zinc-200 hover:text-white transition-colors"
                  >
                    {leader.playerName}
                  </a>
                  <span className="text-zinc-600 text-xs ml-2 sm:hidden">
                    {leader.team}
                  </span>
                </td>
                <td className="py-3 px-2 text-zinc-500 text-xs hidden sm:table-cell">
                  {leader.team}
                </td>
                <td className="py-3 px-4 text-right font-bold text-zinc-100">
                  {leader.homeRuns}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyView({ data }: { data: LeaderboardData }) {
  const hasData =
    data.dailyLongest.length > 0 ||
    data.dailyFastest.length > 0 ||
    data.dailyMultiHR.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500">
          Daily HR Stat Leaders &mdash; {data.displayDate}
        </h2>
        <LeaderboardDatePicker currentDate={data.date} activeTab="daily" />
      </div>

      {!hasData ? (
        <p className="text-zinc-500 text-center py-12">
          No home runs recorded on {data.displayDate}.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Longest HRs */}
          {data.dailyLongest.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                <span className="text-red-400">&#9679;</span> Longest HR
              </h3>
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-4 w-8">#</th>
                      <th className="text-left py-2 px-2">Player</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Team</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Venue</th>
                      <th className="text-right py-2 px-4">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dailyLongest.map((hr, i) => (
                      <tr
                        key={`${hr.playerName}-${hr.distance}-${i}`}
                        className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-2 px-4 text-zinc-600">{i + 1}</td>
                        <td className="py-2 px-2 text-zinc-200">{hr.playerName}</td>
                        <td className="py-2 px-2 text-zinc-500 text-xs hidden sm:table-cell">
                          {hr.team}
                        </td>
                        <td className="py-2 px-2 text-zinc-600 text-xs hidden sm:table-cell">
                          {hr.venue}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-zinc-100">
                          {hr.distance} ft
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fastest HRs */}
          {data.dailyFastest.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                <span className="text-yellow-400">&#9679;</span> Fastest Exit Velo
              </h3>
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-4 w-8">#</th>
                      <th className="text-left py-2 px-2">Player</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Team</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Venue</th>
                      <th className="text-right py-2 px-4">Exit Velo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dailyFastest.map((hr, i) => (
                      <tr
                        key={`${hr.playerName}-${hr.exitVelo}-${i}`}
                        className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-2 px-4 text-zinc-600">{i + 1}</td>
                        <td className="py-2 px-2 text-zinc-200">{hr.playerName}</td>
                        <td className="py-2 px-2 text-zinc-500 text-xs hidden sm:table-cell">
                          {hr.team}
                        </td>
                        <td className="py-2 px-2 text-zinc-600 text-xs hidden sm:table-cell">
                          {hr.venue}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-zinc-100">
                          {hr.exitVelo} mph
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Multi-HR Games */}
          {data.dailyMultiHR.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                <span className="text-purple-400">&#9679;</span> Multi-HR Games
              </h3>
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-4 w-8">#</th>
                      <th className="text-left py-2 px-2">Player</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Team</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Opponent</th>
                      <th className="text-right py-2 px-4">HR/Game</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dailyMultiHR.map((hr, i) => (
                      <tr
                        key={`${hr.playerName}-${hr.count}-${i}`}
                        className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-2 px-4 text-zinc-600">{i + 1}</td>
                        <td className="py-2 px-2 text-zinc-200">{hr.playerName}</td>
                        <td className="py-2 px-2 text-zinc-500 text-xs hidden sm:table-cell">
                          {hr.team}
                        </td>
                        <td className="py-2 px-2 text-zinc-600 text-xs hidden sm:table-cell">
                          vs {hr.opponent}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-zinc-100">
                          {hr.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
