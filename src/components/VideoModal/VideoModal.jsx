import { useEffect } from 'react';
import styles from './VideoModal.module.css';

export default function VideoModal({ driveFileId: videoId, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <button className={styles.backBtn} onClick={onClose}>← Back</button>
      <div className={styles.videoWrap}>
        <iframe
          className={styles.iframe}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
          allow="autoplay; fullscreen"
          allowFullScreen
          title={title}
        />
      </div>
    </div>
  );
}
