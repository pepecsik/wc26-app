import Header from './components/Header/Header';
import Feed from './components/Feed/Feed';
import { useMatches } from './hooks/useMatches';
import { useSheetData } from './hooks/useSheetData';
import styles from './App.module.css';

export default function App() {
  const { matches, loading, error } = useMatches();
  const videoMap = useSheetData();
  const liveCount = matches.filter(m => m.isLive).length;

  return (
    <div className={styles.app}>
      <Header liveCount={liveCount} />
      <main className={styles.main}>
        {loading && <div className={styles.status}>Loading matches…</div>}
        {error && <div className={styles.error}>⚠️ {error}</div>}
        {!loading && <Feed matches={matches} videoMap={videoMap} />}
      </main>
    </div>
  );
}
