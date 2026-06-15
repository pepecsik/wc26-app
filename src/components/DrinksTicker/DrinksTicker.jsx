import styles from './DrinksTicker.module.css';

export default function DrinksTicker({ players }) {
  const debtors = players
    .map(p => ({ ...p, drinksOwed: p.drinksTotal - p.drinksDone }))
    .filter(p => p.drinksOwed > 0);
  if (debtors.length === 0) return null;

  const content = debtors
    .map(p => `🍺 ${p.name}  —  owes ${p.drinksOwed} drink${p.drinksOwed > 1 ? 's' : ''}`)
    .join('          ·          ');

  return (
    <div className={styles.ticker}>
      <div className={styles.label}>🍺 DRINKS</div>
      <div className={styles.scrollArea}>
        <div className={styles.track}>
          <span className={styles.text}>{content}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span className={styles.text} aria-hidden="true">{content}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
