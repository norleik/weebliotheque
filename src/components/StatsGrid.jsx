import './StatsGrid.css';

function Stat({ valeur, label, detail, rose }) {
  return (
    <div className={`stat${rose ? ' rose' : ''}`}>
      <div className="val">{valeur}</div>
      <div className="lab">{label}</div>
      <span className="detail">{detail}</span>
    </div>
  );
}

export default function StatsGrid({ stats }) {
  return (
    <section className="stats">
      {stats.map((stat) => (
        <Stat key={stat.label} {...stat} />
      ))}
    </section>
  );
}
