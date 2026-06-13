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
          if (video && m.isFinished && (myState === 'losing' || myState === 'draw')) {
            myVideo = isHome ? video.filename : (video.filename2 || video.filename);
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
            videoUrl: myVideo ? `${B2_BASE}/${encodeURIComponent(myVideo)}.mp4` : null,
          });
        });
      });

      playerMatches.sort((a, b) => a.kickoff - b.kickoff);

      return {
        ...p,
        wins,
        losses,
        draws,
        drinks: losses + draws,
        videosSent: playerMatches.filter(m => m.myVideo).length,
        matches: playerMatches,
      };
    });
  }, [matches, videoMap]);
}
