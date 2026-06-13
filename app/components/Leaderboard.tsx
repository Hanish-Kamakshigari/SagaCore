'use client'

import { useState, useEffect } from 'react'
import { Trophy, Shield, RefreshCw, Medal } from 'lucide-react'
import { fetchLeaderboardFromMongo } from '../lib/ai'

interface LeaderboardPlayer {
  id: string
  xp: number
  level: number
  worldTheme: string
  email?: string
  displayName?: string
  lastUpdated: string
}

interface LeaderboardProps {
  theme?: 'fantasy' | 'cyberpunk' | 'steampunk'
  activeUserUid?: string
}

export default function Leaderboard({ theme = 'fantasy', activeUserUid }: LeaderboardProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const loadLeaderboard = async () => {
    setRefreshing(true)
    try {
      const data = await fetchLeaderboardFromMongo(activeUserUid)
      setPlayers(data)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const styles = {
    fantasy: 'hover:border-[#7B4FCC]/40 hover:shadow-[0_0_25px_rgba(123,79,204,0.08)] border-zinc-800/80 bg-zinc-950/50',
    cyberpunk: 'hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.08)] border-zinc-800/80 bg-zinc-950/50',
    steampunk: 'hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.08)] border-zinc-800/80 bg-zinc-950/50',
  }[theme]

  const accentColor = {
    fantasy: 'text-[#a78bfa]',
    cyberpunk: 'text-cyan-400',
    steampunk: 'text-orange-400',
  }[theme]

  const bgGlows = {
    fantasy: { left: 'bg-[#7B4FCC]/5', right: 'bg-purple-900/5' },
    cyberpunk: { left: 'bg-cyan-500/5', right: 'bg-blue-500/5' },
    steampunk: { left: 'bg-orange-500/5', right: 'bg-amber-500/5' },
  }[theme]

  const selfBg = {
    fantasy: 'bg-[#7B4FCC]/10',
    cyberpunk: 'bg-cyan-950/10',
    steampunk: 'bg-orange-950/10',
  }[theme]

  const heroBadge = {
    fantasy: 'bg-[#7B4FCC]/20 border-[#7B4FCC]/30 text-[#c4b5fd]',
    cyberpunk: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
    steampunk: 'bg-orange-500/20 border-orange-500/30 text-orange-350',
  }[theme]

  // Cumulative XP = completed levels * 1000 + remainder XP in current level
  const totalXp = (p: LeaderboardPlayer) => (p.level - 1) * 1000 + p.xp

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={18} />
      case 2:
        return <Medal className="text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.5)]" size={18} />
      case 3:
        return <Medal className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" size={18} />
      default:
        return <span className="font-mono text-xs font-bold text-zinc-500">#{rank}</span>
    }
  }

  const formatUsername = (player: LeaderboardPlayer) => {
    const nameToUse = player.displayName || (player.email ? player.email.split('@')[0] : '') || `Scribe_${player.id.substring(0, 5)}`
    const truncatedName = nameToUse.length > 15 ? `${nameToUse.substring(0, 15)}...` : nameToUse

    if (player.id === activeUserUid) {
      return (
        <span className="font-bold text-white flex items-center gap-1.5">
          You ({truncatedName})
          <span className={`rounded-full border px-1.5 py-0.2 text-[8px] uppercase tracking-widest font-mono ${heroBadge}`}>Hero</span>
        </span>
      )
    }
    return truncatedName
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl transition-all duration-500 border ${styles}`}>
      {/* Background glowing particles simulation */}
      <div className={`absolute left-0 top-0 -z-10 h-32 w-32 ${bgGlows.left} blur-3xl animate-pulse`} />
      <div className={`absolute right-0 bottom-0 -z-10 h-32 w-32 ${bgGlows.right} blur-3xl animate-pulse`} />

      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Trophy className={accentColor} />
          <h2 className="text-xl font-bold text-zinc-100">
            Global Hall of Legends
          </h2>
        </div>
        <button
          onClick={loadLeaderboard}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-850 px-3 py-1 text-xs text-zinc-400 hover:text-white transition-all hover:cursor-pointer"
        >
          <RefreshCw size={12} className={`${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-550">
            <RefreshCw size={32} className={`mb-3 animate-spin ${accentColor}`} />
            <h3 className="font-bold text-zinc-400">Consulting the Grand Registry...</h3>
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-550">
            <Shield size={32} className={`mb-3 opacity-30 ${accentColor}`} />
            <h3 className="font-bold text-zinc-400">The Hall is Silent</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
              No legends have forged user accounts in this database yet. Sync your progress to claim the first rank!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                  <th className="pb-3 pl-2 w-16">Rank</th>
                  <th className="pb-3">Scribe</th>
                  <th className="pb-3">Active Grid</th>
                  <th className="pb-3 text-right">Level</th>
                  <th className="pb-3 pr-2 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {players.map((player, idx) => {
                  const rank = idx + 1
                  const isSelf = player.id === activeUserUid
                  return (
                    <tr 
                      key={player.id} 
                      className={`text-sm transition-colors duration-200 ${isSelf ? selfBg : 'hover:bg-zinc-900/10'}`}
                    >
                      <td className="py-4 pl-2">
                        <div className="flex items-center">
                          {getRankBadge(rank)}
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-zinc-350">
                        {formatUsername(player)}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                          player.worldTheme === 'fantasy' ? 'bg-[#7B4FCC]/10 border-[#7B4FCC]/20 text-[#c4b5fd]' :
                          player.worldTheme === 'cyberpunk' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' :
                          'bg-orange-500/10 border-orange-500/20 text-orange-300'
                        }`}>
                          {player.worldTheme}
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono font-bold text-zinc-200">
                        {player.level}
                      </td>
                      <td className="py-4 pr-2 text-right font-mono text-zinc-400">
                        {totalXp(player).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
