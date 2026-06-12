import { useEffect } from 'react';
import styles from './VideoModal.module.css';

export default function VideoModal({ driveFileId, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <button className={styles.backBtn} onClick={onClose}>← Back</button>
      <span className={styles.title}>🎬 {title}</span>
      <div className={styles.videoWrap}>
        <iframe
          src={`https://drive.google.com/file/d/${driveFileId}/preview`}
          allow="autoplay"
          allowFullScreen
          className={styles.iframe}
          title={title}
        />
      </div>
    </div>
  );
}
