import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ChartDataPoint, CategorySummary } from '../types';

interface ChartsProps {
  dailyData: ChartDataPoint[];
  categoryData: CategorySummary[];
  isDarkMode: boolean;
}

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#84cc16'];

export const Charts: React.FC<ChartsProps> = ({ dailyData, categoryData, isDarkMode }) => {
  const axisColor = isDarkMode ? '#64748b' : '#94a3b8';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#f1f5f9' : '#0f172a';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Line Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm uppercase tracking-wide mb-6">Spending Trend Timeline</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="date" 
                tick={{fill: axisColor, fontSize: 11, fontFamily: 'monospace'}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.slice(5)} // MM-DD
                minTickGap={30}
              />
              <YAxis 
                tick={{fill: axisColor, fontSize: 11, fontFamily: 'monospace'}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                    borderRadius: '8px', 
                    border: `1px solid ${tooltipBorder}`, 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: tooltipBg,
                    color: tooltipText,
                    fontSize: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ color: tooltipText, fontFamily: 'monospace', marginBottom: '4px' }}
              />
              <Line 
                type="step" 
                dataKey="amount" 
                data={dailyData.filter(d => d.type === 'Discretionary')} 
                name="Discretionary" 
                stroke="#38bdf8" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4, fill: '#38bdf8' }} 
              />
              <Line 
                type="step" 
                dataKey="amount" 
                data={dailyData.filter(d => d.type === 'Essential')} 
                name="Essential" 
                stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={false} 
              />
              <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm uppercase tracking-wide mb-2">Category Distribution</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke={isDarkMode ? '#0f172a' : '#fff'}
                strokeWidth={2}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value: number) => `₹${value.toFixed(2)}`}
                 contentStyle={{ 
                    borderRadius: '8px',
                    border: `1px solid ${tooltipBorder}`,
                    backgroundColor: tooltipBg,
                    color: tooltipText,
                    fontSize: '12px'
                 }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px', opacity: 0.8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};