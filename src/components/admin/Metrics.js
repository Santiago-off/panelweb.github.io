import React from 'react';
import './Metrics.css';

// Iconos para las tarjetas de métricas
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const WebIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;

const MetricCard = ({ title, value, icon, description }) => (
  <div className="metric-card">
    <div className="metric-card-header">
      <h3 className="metric-title">{title}</h3>
      <div className="metric-icon">{icon}</div>
    </div>
    <p className="metric-value">{value}</p>
    <p className="metric-description">{description}</p>
  </div>
);

const Metrics = ({ users, sites }) => {
  // Cálculo de métricas
  const totalUsers = users.length;
  const totalSites = sites.length;

  const usersByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const sitesByStatus = sites.reduce((acc, site) => {
    const status = site.status || 'active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="section-header">
        <h2>Métricas del Panel</h2>
      </div>
      <p className="section-description">
        Una vista general del estado actual del sistema.
      </p>
      <div className="metrics-grid">
        <MetricCard 
          title="Total de Usuarios" 
          value={totalUsers} 
          icon={<UsersIcon />}
          description={`Admins: ${usersByRole.admin || 0}, Staff: ${usersByRole.staff || 0}, Usuarios: ${usersByRole.usuario || 0}`}
        />
        <MetricCard 
          title="Total de Sitios Web" 
          value={totalSites} 
          icon={<WebIcon />}
          description={`Activos: ${sitesByStatus.active || 0}, Mantenimiento: ${sitesByStatus.maintenance || 0}, Deshabilitados: ${sitesByStatus.disabled || 0}`}
        />
        {/* Aquí se pueden añadir más tarjetas de métricas en el futuro */}
      </div>
    </div>
  );
};

export default Metrics;