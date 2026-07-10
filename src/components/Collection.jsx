import WorksGrid, { STATUTS } from './WorksGrid';
import './Collection.css';

// Toute la bibliothèque, tous types confondus, regroupée par statut.
export default function Collection({ oeuvres, lectureSeule = false, ...handlers }) {
  const sections = STATUTS.map((statut) => ({
    ...statut,
    oeuvres: oeuvres.filter((o) => o.statut === statut.id),
  })).filter((section) => section.oeuvres.length > 0);

  if (sections.length === 0) {
    return <WorksGrid oeuvres={[]} lectureSeule={lectureSeule} />;
  }

  return (
    <div className="collection">
      {sections.map((section) => (
        <section key={section.id} className="collection-section">
          <div className="collection-titre">
            <span>{section.label}</span>
          </div>
          <WorksGrid oeuvres={section.oeuvres} lectureSeule={lectureSeule} {...handlers} />
        </section>
      ))}
    </div>
  );
}
