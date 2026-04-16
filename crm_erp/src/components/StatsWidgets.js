export function StatGrid({ items }) {
  return (
    <div className="stats-grid">
      {items.map((item) => (
        <article key={item.label} className="stats-card panel panel-default">
          <div className="panel-body">
            <p className="stats-card__label">{item.label}</p>
            <h3 className="stats-card__value">{item.value}</h3>
            {item.hint ? <p className="stats-card__hint">{item.hint}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function MiniBarChart({ title, data, emptyLabel, valueFormatter }) {
  const maxValue = data.reduce((max, row) => Math.max(max, Number(row.value) || 0), 0);

  return (
    <section className="stats-chart panel panel-default">
      <div className="panel-heading">{title}</div>
      <div className="panel-body">
        {data.length === 0 ? (
          <p className="page-muted">{emptyLabel || "Aucune donnee disponible."}</p>
        ) : (
          <div className="stats-chart__rows">
            {data.map((row) => {
              const numericValue = Number(row.value) || 0;
              const widthPercent = maxValue > 0 ? Math.max((numericValue / maxValue) * 100, 2) : 2;
              return (
                <div key={row.label} className="stats-chart__row">
                  <div className="stats-chart__meta">
                    <span>{row.label}</span>
                    <strong>
                      {valueFormatter ? valueFormatter(numericValue) : numericValue}
                    </strong>
                  </div>
                  <div className="stats-chart__track">
                    <span className="stats-chart__fill" style={{ width: `${widthPercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export const formatMga = (value) => {
  return `${new Intl.NumberFormat("fr-FR").format(Number(value) || 0)} MGA`;
};
