import { useEffect } from 'react';
import styles from './VideoModal.module.css';

export default function VideoModal({ driveFileId, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>🎬 {title}</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
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
    </div>
  );
}
