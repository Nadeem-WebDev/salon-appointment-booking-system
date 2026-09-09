import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CalendarCheck, CheckCircle2, IndianRupee, XCircle, PieChart as PieIcon, BarChart3 } from 'lucide-react';

import { GlassCard, SectionHeader, StatCard, EmptyState } from '../ui/index.js';
import { getCategoricalPalette, getChartTheme, getStatusColor, tooltipStyles } from '../../theme/chartTheme.js';

export default function AnalyticsDashboard({ bookings }) {
  const chart = getChartTheme();
  const palette = getCategoricalPalette();
  const tip = tooltipStyles();

  const totalAppointments = bookings.length;
  const completedAppointments = bookings.filter((b) => b.status === 'completed').length;
  const cancelledAppointments = bookings.filter((b) => b.status === 'cancelled').length;

  const estimatedRevenue = bookings.reduce((sum, b) => {
    if (b.status !== 'cancelled') return sum + Number(b.service_price || 0);
    return sum;
  }, 0);

  const serviceData = useMemo(() => {
    const counts = bookings.reduce((acc, b) => {
      acc[b.service] = (acc[b.service] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map((key) => ({ name: key, value: counts[key] }));
  }, [bookings]);

  const statusData = [
    { name: 'Queued', key: 'queued', count: bookings.filter((b) => b.status === 'queued').length },
    { name: 'In progress', key: 'in-progress', count: bookings.filter((b) => b.status === 'in-progress').length },
    { name: 'Completed', key: 'completed', count: completedAppointments },
    { name: 'Cancelled', key: 'cancelled', count: cancelledAppointments },
  ];

  const completionRate =
    totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

  const axisTick = { fontSize: 11, fill: chart.text };

  return (
    <div className="animate-slideIn flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarCheck}
          label="Total bookings"
          value={totalAppointments}
          tone="primary"
          trend="For the selected date"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completedAppointments}
          tone="success"
          trend={`${completionRate}% completion rate`}
        />
        <StatCard
          icon={IndianRupee}
          label="Est. revenue"
          value={`₹${estimatedRevenue.toLocaleString('en-IN')}`}
          tone="accent"
          trend="Excludes cancelled bookings"
        />
        <StatCard
          icon={XCircle}
          label="Cancelled"
          value={cancelledAppointments}
          tone="danger"
          trend={cancelledAppointments === 0 ? 'None today' : 'Review if trending up'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard className="p-5 md:p-6 min-w-0">
          <SectionHeader icon={PieIcon} title="Service popularity" description="Share of bookings by service" />
          {serviceData.length > 0 ? (
            <div className="h-[19rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={entry.name} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [`${value} bookings`, 'Count']}
                    {...tip}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: chart.text }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No data for this date" description="Pick another date to see service mix." />
          )}
        </GlassCard>

        <GlassCard className="p-5 md:p-6 min-w-0">
          <SectionHeader icon={BarChart3} title="Appointment status" description="Where today's bookings stand" />
          <div className="h-[19rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 12, right: 8, left: -18, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  tick={axisTick}
                  height={46}
                />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: chart.grid }} {...tip} />
                <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]} barSize={42}>
                  {statusData.map((entry) => (
                    <Cell key={entry.key} fill={getStatusColor(entry.key)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
