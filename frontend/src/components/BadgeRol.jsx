const ICONOS = {
  estudiante: "bi-mortarboard",
  docente: "bi-person-workspace",
  org: "bi-people",
  admin: "bi-shield-check"
};

export default function BadgeRol({ rol }) {
  return (
    <span className={`role-badge role-${rol.slug}`} title={rol.nombre}>
      <i className={`bi ${ICONOS[rol.slug] ?? "bi-person"}`} aria-hidden="true"></i>
      <span className="d-none d-sm-inline">{rol.nombre}</span>
    </span>
  );
}
