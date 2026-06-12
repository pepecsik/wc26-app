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
      <div className={styles.videoWrap}>
        <video
          className={styles.video}
          src={`https://drive.google.com/uc?export=download&id=${driveFileId}`}
          controls
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
}
