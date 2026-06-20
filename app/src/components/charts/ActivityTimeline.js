'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ActivityTimeline({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <div className="empty-desc">No activity data available</div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface-3)', padding: 'var(--sp-sm)', borderRadius: 'var(--r-md)', border: `1px solid var(--border-subtle)`, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{label}</div>
          {payload.map((p, idx) => (
            <div key={idx} style={{ color: p.color }}>
              {p.name}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card" style={{ height: '350px', padding: 'var(--sp-md)' }}>
      <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--sp-sm)', fontWeight: 700, letterSpacing: '1px' }}>Activity Timeline (14 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: '0.7rem' }} 
            tickFormatter={(val) => val.split('-').slice(1).join('/')}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: '0.7rem' }} 
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--glass-bg-hover)' }} />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
          <Bar dataKey="submitted" name="Reports" fill="var(--lime)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="issues" name="Issues" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
