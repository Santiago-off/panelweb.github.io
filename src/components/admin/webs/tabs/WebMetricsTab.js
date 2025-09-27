const WebMetricsTab = ({ web }) => {
  return (
    <div>
      <h3>Métricas de la Web</h3>
      <p>Esta sección mostrará gráficos y datos de rendimiento para <strong>{web.name}</strong>.</p>
      {/* TODO: Implementar gráficos con una librería como Chart.js o Recharts */}
      <div className="placeholder-content">
        <p>Funcionalidad pendiente de implementación.</p>
      </div>
    </div>
  );
};

export default WebMetricsTab;