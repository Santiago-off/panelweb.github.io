import React from 'react';

// Componente para una tarjeta de estadística individual
const StatCard = ({ title, value, description, icon }) => (
  <div className="stat-card">
    <div className="stat-card-icon">
      {/* Icono (se puede reemplazar con SVGs o una librería de iconos) */}
      <span>{icon}</span>
    </div>
    <div className="stat-card-info">
      <p className="stat-card-title">{title}</p>
      <h3 className="stat-card-value">{value}</h3>
      <p className="stat-card-description">{description}</p>
    </div>
  </div>
);

const Metrics = ({ users = [], sites = [] }) => {
  // Calculamos las métricas a partir de los datos
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'enabled').length;
  const totalSites = sites.length;
  const onlineSites = sites.filter(s => s.status === 'online').length;
  const maintenanceSites = sites.filter(s => s.status === 'maintenance').length;

  return (
    <section>
      <div className="section-header">
        <h2>Métricas del Panel</h2>
      </div>
      <p className="section-description">
        Una vista general de la actividad y el estado de la plataforma.
      </p>

      <div className="stats-grid">
        <StatCard
          title="Usuarios Totales"
          value={totalUsers}
          description={`${activeUsers} usuarios tienen acceso habilitado.`}
          icon="👥"
        />
        <StatCard
          title="Sitios Web Totales"
          value={totalSites}
          description={`${onlineSites} sitios están actualmente online.`}
          icon="🌐"
        />
        <StatCard
          title="Sitios en Mantenimiento"
          value={maintenanceSites}
          description="Sitios que muestran una página de aviso a los visitantes."
          icon="⚙️"
        />
        {/* Se pueden añadir más tarjetas aquí, por ejemplo, para tickets abiertos */}
      </div>

      <div className="placeholder-content" style={{ marginTop: 'var(--spacing-8)' }}>
        <p>Próximamente: Gráficos de actividad histórica.</p>
      </div>
    </section>
  );
};

export default Metrics;