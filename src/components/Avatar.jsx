// Avatar réutilisable : photo si disponible, sinon initiale sur fond dégradé.
// Passe-plat des props supplémentaires (onClick, title, style…) sur l'élément rendu.
export default function Avatar({ url, pseudo, className = '', ...rest }) {
  const initiale = pseudo?.[0]?.toUpperCase() ?? '?';

  if (url) {
    return <img src={url} alt="" className={`avatar avatar-photo ${className}`.trim()} {...rest} />;
  }
  return (
    <div className={`avatar av-leo ${className}`.trim()} {...rest}>
      {initiale}
    </div>
  );
}
