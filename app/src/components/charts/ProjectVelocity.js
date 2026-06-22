'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ProjectVelocity({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-desc">No project data available</div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: 'var(--surface-3)', padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)', border: `1px solid ${data.fill}50`, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 'bold', color: data.fill }}>{data.name}</div>
          <div>{data.value} contributions</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card" style={{ height: '350px', padding: 'var(--sp-md)' }}>
      <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--sp-sm)', fontWeight: 700, letterSpacing: '1px' }}>Project Velocity</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || 'var(--lime)'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
