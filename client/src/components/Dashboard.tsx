import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useEquipment } from '../hooks/useEquipment';

export default function Dashboard() {
  const { data: equipment = [], isLoading } = useEquipment();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const areaCounts = equipment.reduce((acc: Record<string, number>, item) => {
    acc[item.area] = (acc[item.area] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(areaCounts).map(key => ({
    name: key,
    value: areaCounts[key]
  }));

  const vendorCounts = equipment.reduce((acc: Record<string, number>, item) => {
    acc[item.vendor] = (acc[item.vendor] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(vendorCounts)
    .map(key => ({
      name: key,
      count: vendorCounts[key]
    }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 8);

  // PhoneMe Brand Colors
  const COLORS = ['#F47920', '#111111', '#4B5563', '#9CA3AF', '#D1D5DB', '#F97316'];

  const stats = [
    { label: 'Active Fleet', value: equipment.length, icon: 'fa-server', color: 'text-brand-500' },
    { label: 'Network Core', value: areaCounts['Network'] || 0, icon: 'fa-network-wired', color: 'text-slate-900 dark:text-white' },
    { label: 'Cloud Nodes', value: areaCounts['Comput'] || 0, icon: 'fa-cloud', color: 'text-brand-500' },
    { label: 'Secure Sockets', value: 'Live', icon: 'fa-shield-halved', color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#111111] p-10 rounded-[2rem] shadow-sm border border-slate-200 dark:border-white/5 group hover:border-brand-500 transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className={`w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center ${s.color}`}>
                <i className={`fa-solid ${s.icon} text-xl`}></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Metric</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{s.label}</p>
            <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-[#111111] p-12 rounded-[2rem] border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Service Domain</h4>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Allocation</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
              <i className="fa-solid fa-chart-simple"></i>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] p-12 rounded-[2rem] border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">OEM Ecosystem</h4>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Hardware Footprint</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
              <i className="fa-solid fa-industry"></i>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ left: 20 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="count"
                  fill="#F47920"
                  radius={[10, 10, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
