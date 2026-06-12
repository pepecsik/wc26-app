import { useEffect } from 'react';
import styles from './VideoModal.module.css';

const B2_BASE = 'https://f005.backblazeb2.com/file/wc26-videos';

export default function VideoModal({ filename, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const videoUrl = `${B2_BASE}/${encodeURIComponent(filename)}.mp4`;

  return (
    <div className={styles.overlay}>
      <button className={styles.backBtn} onClick={onClose}>← Back</button>
      <div className={styles.videoWrap}>
        <video
          className={styles.iframe}
          src={videoUrl}
          autoPlay
          playsInline
          controls
        />
      </div>
    </div>
  );
}
