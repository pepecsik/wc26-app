import { useEffect, useState } from 'react';
import styles from './VideoModal.module.css';

const B2_BASE = 'https://f005.backblazeb2.com/file/wc26-videos/01_GROUP_STAGE';

export default function VideoModal({ filenames, title, onClose, startIdx = 0 }) {
  const list = Array.isArray(filenames) ? filenames : [filenames];
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && idx < list.length - 1) setIdx(i => i + 1);
      if (e.key === 'ArrowLeft'  && idx > 0)               setIdx(i => i - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, idx, list.length]);

  const videoUrl = `${B2_BASE}/${encodeURIComponent(list[idx])}.mp4`;

  return (
    <div className={styles.overlay}>
      <button className={styles.backBtn} onClick={onClose}>← Back</button>
      {list.length > 1 && (
        <div className={styles.counter}>{idx + 1} / {list.length}</div>
      )}
      <div className={styles.videoWrap}>
        <video
          key={list[idx]}
          className={styles.iframe}
          src={videoUrl}
          autoPlay
          playsInline
          controls
        />
      </div>
      {list.length > 1 && (
        <>
          {idx > 0 && (
            <button className={`${styles.navBtn} ${styles.navLeft}`} onClick={() => setIdx(i => i - 1)}>‹</button>
          )}
          {idx < list.length - 1 && (
            <button className={`${styles.navBtn} ${styles.navRight}`} onClick={() => setIdx(i => i + 1)}>›</button>
          )}
        </>
      )}
    </div>
  );
}
