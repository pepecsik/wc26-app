import { useMemo } from 'react';
import { PARTICIPANTS } from '../data/participants';

const B2_BASE = 'https://f005.backblazeb2.com/file/wc26-videos/01_GROUP_STAGE';

export function usePlayerStats(matches, videoMap) {
  return useMemo(() => {
    return PARTICIPANTS.map(p => {
      let wins = 0, losses = 0, draws = 0;
      const playerMatches = [];

      p.teams.forEach(teamCode => {
        matches.forEach(m => {
          const isHome = m.hCode === teamCode;
          const isAway = m.aCode === teamCode;
          if (!isHome && !isAway) return;

          const myState = isHome ? m.hState : m.aState;
          const oppCode = isHome ? m.aCode : m.hCode;
          const myGoals = isHome ? m.hGoals : m.aGoals;
          const oppGoals = isHome ? m.aGoals : m.hGoals;

          if (m.isFinished) {
            if (myState === 'winning') wins++;
            else if (myState === 'losing') losses++;
            else if (myState === 'draw') draws++;
          }

          const key = `${m.hCode}-${m.aCode}`;
          const video = videoMap[key];
          let myVideo = null;
          let myDrinkCount = 1;
          if (video && m.isFinished && (myState === 'losing' || myState === 'draw')) {
            myVideo = myState === 'draw'
              ? (isHome ? video.filename : video.filename2 || null)
              : video.filename;
            myDrinkCount = isHome
              ? (video.drinks1 ?? 1)
              : (video.drinks2 ?? video.drinks1 ?? 1);
          }

          playerMatches.push({
            id: m.id,
            kickoff: m.kickoff,
            teamCode,
            oppCode,
            myGoals,
            oppGoals,
            myState,
            isFinished: m.isFinished,
            isLive: m.isLive,
            myVideo,
            myDrinkCount,
            sideBetDrinks: m.sideBetDrinks ?? 0,
            videoUrl: myVideo ? `${B2_BASE}/${encodeURIComponent(myVideo)}.mp4` : null,
          });
        });
      });

      playerMatches.sort((a, b) => a.kickoff - b.kickoff);

      const videosSent  = playerMatches.filter(m => m.myVideo).length;
      const bonusDrinks = p.bonusDrinks ?? 0;
      const drinks      = losses + draws;   // match count only, for leaderboard display
      const sideBetDrinkCount = playerMatches
        .filter(m => m.myVideo)
        .reduce((sum, m) => sum + (m.sideBetDrinks ?? 0), 0);
      const drinksDone = bonusDrinks + playerMatches
        .filter(m => m.myVideo)
        .reduce((sum, m) => sum + (m.myDrinkCount ?? 1), 0);
      // Total drinks including side bets (done + still pending)
      const drinksTotal = bonusDrinks + playerMatches
        .filter(m => m.isFinished && (m.myState === 'losing' || m.myState === 'draw'))
        .reduce((sum, m) => {
          if (m.myVideo) return sum + (m.myDrinkCount ?? 1);
          return sum + 1 + (m.sideBetDrinks ?? 0); // estimate for pending
        }, 0);

      // Current win streak (consecutive wins from most recent finished match)
      let streak = 0;
      const finished = playerMatches.filter(m => m.isFinished);
      for (let i = finished.length - 1; i >= 0; i--) {
        if (finished[i].myState === 'winning') streak++;
        else break;
      }

      return {
        ...p,
        wins,
        losses,
        draws,
        drinks,
        drinksDone,
        drinksTotal,
        sideBetDrinkCount,
        videosSent,
        videoDebt: drinks - videosSent,
        streak,
        matches: playerMatches,
      };
    });
  }, [matches, videoMap]);
}
