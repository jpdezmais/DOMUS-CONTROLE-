import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  ShoppingCart, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Search,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  User,
  ShieldAlert,
  Lock,
  Mail,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  subscribeToClients, 
  subscribeToSales, 
  subscribeToArchitects,
  addClient, 
  addSale, 
  addArchitect,
  getCompanySettings, 
  updateCompanySettings,
  subscribeToUsers,
  updateUserStatus
} from './services/firestoreService';
import { Client, Sale, CompanySettings, Architect, SaleStatus, UserProfile } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20' 
        : 'text-brand-400 hover:bg-brand-800 hover:text-brand-100'
    }`}
  >
    <Icon size={20} />
    {label && <span className="font-medium">{label}</span>}
  </button>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-brand-900 rounded-2xl shadow-sm border border-brand-800 p-6 ${className}`}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-brand-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-brand-800"
        >
          <div className="flex items-center justify-between p-6 border-b border-brand-800">
            <h3 className="text-xl font-bold text-brand-100">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-brand-800 rounded-full transition-colors text-brand-400 hover:text-brand-100">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Views ---

const DashboardView = ({ sales, clients }: { sales: Sale[], clients: Client[] }) => {
  const totalSales = sales.reduce((acc, sale) => acc + sale.cost, 0);
  const totalProfit = sales.reduce((acc, sale) => acc + (sale.cost - sale.commission - sale.miscExpenses), 0);
  
  // Chart data: Sales by month (last 6 months)
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const chartData = last6Months.map(month => {
    const monthSales = sales.filter(sale => isSameMonth(new Date(sale.purchaseDate), month));
    return {
      name: format(month, 'MMM', { locale: ptBR }),
      total: monthSales.reduce((acc, sale) => acc + sale.cost, 0)
    };
  });

  // Pipeline data
  const statusCounts = sales.reduce((acc, sale) => {
    acc[sale.status] = (acc[sale.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pipelineData = [
    { name: 'Orçamento', value: statusCounts['Orcamento'] || 0, color: '#64748b' },
    { name: 'Contrato', value: statusCounts['Contrato'] || 0, color: '#3b82f6' },
    { name: 'Medição', value: statusCounts['Medicao'] || 0, color: '#8b5cf6' },
    { name: 'Produção', value: statusCounts['Producao'] || 0, color: '#f59e0b' },
    { name: 'Entrega', value: statusCounts['Entrega'] || 0, color: '#10b981' },
    { name: 'Finalizado', value: statusCounts['Finalizado'] || 0, color: '#06b6d4' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-accent-blue text-white border-none">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Vendas Totais</p>
          <h2 className="text-3xl font-bold mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSales)}
          </h2>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-brand-800 text-green-400 rounded-lg">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="text-brand-400 text-sm font-medium uppercase tracking-wider">Lucro Estimado</p>
          <h2 className="text-3xl font-bold mt-1 text-brand-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProfit)}
          </h2>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-brand-800 text-blue-400 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <p className="text-brand-400 text-sm font-medium uppercase tracking-wider">Total de Clientes</p>
          <h2 className="text-3xl font-bold mt-1 text-brand-100">{clients.length}</h2>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-bold mb-6 text-brand-100">Desempenho Mensal</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-6 text-brand-100">Funil de Vendas</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pipelineData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-brand-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ClientsView = ({ clients, architects, onAddClient }: { clients: Client[], architects: Architect[], onAddClient: (c: any) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    cnpj: '',
    residentialAddress: '',
    deliveryAddress: '',
    email: '',
    phone: '',
    contactDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    referredBy: '',
    partnerArchitectId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const architect = architects.find(a => a.id === formData.partnerArchitectId);
    onAddClient({
      ...formData,
      partnerArchitectName: architect?.name || ''
    });
    setIsModalOpen(false);
    setFormData({ 
      name: '', cpf: '', cnpj: '', residentialAddress: '', deliveryAddress: '', 
      email: '', phone: '', contactDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"), 
      referredBy: '', partnerArchitectId: '' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-100">Clientes</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent-blue text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-accent-blue-dark transition-all shadow-lg shadow-accent-blue/20"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-800/50 border-b border-brand-800">
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Nome / Documento</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Endereço</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Arquiteto Parceiro</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-brand-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-100">{client.name}</p>
                    <p className="text-xs text-brand-400">{client.cpf || client.cnpj || 'Sem doc'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-brand-300">{client.email}</p>
                    <p className="text-sm text-brand-300">{client.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-brand-100 truncate max-w-[200px]">{client.residentialAddress || 'N/A'}</p>
                    <p className="text-xs text-brand-400">Desde: {format(new Date(client.contactDate), 'dd/MM/yy')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-brand-100 font-medium">{client.partnerArchitectName || 'Nenhum'}</p>
                    <p className="text-xs text-brand-400">Indicação: {client.referredBy || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-brand-400 hover:text-brand-100 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-brand-400">Nenhum cliente cadastrado.</p>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Cliente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Nome Completo</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">E-mail</label>
              <input 
                required
                type="email" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">CPF</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.cpf}
                onChange={e => setFormData({...formData, cpf: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">CNPJ</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.cnpj}
                onChange={e => setFormData({...formData, cnpj: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Telefone</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Data de Contato</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                onChange={e => setFormData({...formData, contactDate: new Date(e.target.value).toISOString()})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-400 uppercase">Endereço Residencial</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
              value={formData.residentialAddress}
              onChange={e => setFormData({...formData, residentialAddress: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-400 uppercase">Endereço de Entrega</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
              value={formData.deliveryAddress}
              onChange={e => setFormData({...formData, deliveryAddress: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Quem Indicou?</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.referredBy}
                onChange={e => setFormData({...formData, referredBy: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Arquiteto Parceiro</label>
              <select 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                value={formData.partnerArchitectId}
                onChange={e => setFormData({...formData, partnerArchitectId: e.target.value})}
              >
                <option value="">Nenhum</option>
                {architects.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="w-full bg-accent-blue text-white py-4 rounded-xl font-bold hover:bg-accent-blue-dark transition-all mt-6 shadow-lg shadow-accent-blue/20">
            Salvar Cliente
          </button>
        </form>
      </Modal>
    </div>
  );
};

const ArchitectsView = ({ architects, onAddArchitect }: { architects: Architect[], onAddArchitect: (a: any) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cau: '',
    phone: '',
    email: '',
    officeName: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddArchitect(formData);
    setIsModalOpen(false);
    setFormData({ name: '', cau: '', phone: '', email: '', officeName: '', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-100">Arquitetos</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent-blue text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-accent-blue-dark transition-all shadow-lg shadow-accent-blue/20"
        >
          <Plus size={20} />
          Novo Arquiteto
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-800/50 border-b border-brand-800">
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Nome / CAU</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Escritório</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Endereço</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
              {architects.map(architect => (
                <tr key={architect.id} className="hover:bg-brand-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-100">{architect.name}</p>
                    <p className="text-xs text-brand-400">CAU: {architect.cau || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-brand-300">{architect.email}</p>
                    <p className="text-sm text-brand-300">{architect.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-brand-100 font-medium">{architect.officeName || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-brand-300 truncate max-w-[200px]">{architect.address || 'N/A'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {architects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-brand-400">Nenhum arquiteto cadastrado.</p>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Arquiteto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Nome Completo</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">CAU</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.cau}
                onChange={e => setFormData({...formData, cau: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Telefone</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">E-mail</label>
              <input 
                required
                type="email" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-400 uppercase">Nome do Escritório</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
              value={formData.officeName}
              onChange={e => setFormData({...formData, officeName: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-400 uppercase">Endereço</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-accent-blue text-white py-4 rounded-xl font-bold hover:bg-accent-blue-dark transition-all mt-6 shadow-lg shadow-accent-blue/20">
            Salvar Arquiteto
          </button>
        </form>
      </Modal>
    </div>
  );
};

const SalesView = ({ sales, clients, onAddSale }: { sales: Sale[], clients: Client[], onAddSale: (s: any) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    status: 'Orcamento' as SaleStatus,
    cost: 0,
    commission: 0,
    miscExpenses: 0,
    purchaseDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    deliveryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    executiveMeasurementDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    executiveProjectApprovalDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) return;
    
    onAddSale({
      ...formData,
      clientName: client.name
    });
    setIsModalOpen(false);
    setFormData({
      clientId: '', description: '', status: 'Orcamento', cost: 0, commission: 0, miscExpenses: 0,
      purchaseDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      deliveryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      executiveMeasurementDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      executiveProjectApprovalDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
    });
  };

  const getStatusColor = (status: SaleStatus) => {
    switch (status) {
      case 'Orcamento': return 'bg-brand-700 text-brand-300';
      case 'Contrato': return 'bg-blue-900/50 text-blue-400 border border-blue-800';
      case 'Medicao': return 'bg-purple-900/50 text-purple-400 border border-purple-800';
      case 'Producao': return 'bg-amber-900/50 text-amber-400 border border-amber-800';
      case 'Entrega': return 'bg-emerald-900/50 text-emerald-400 border border-emerald-800';
      case 'Finalizado': return 'bg-cyan-900/50 text-cyan-400 border border-cyan-800';
      default: return 'bg-brand-800 text-brand-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-100">Vendas e Prazos</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent-blue text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-accent-blue-dark transition-all shadow-lg shadow-accent-blue/20"
        >
          <Plus size={20} />
          Nova Venda
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-800/50 border-b border-brand-800">
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Cliente / Projeto</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Valores</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Prazos Chave</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-400 uppercase tracking-wider">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-brand-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-100">{sale.clientName}</p>
                    <p className="text-sm text-brand-400">{sale.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-brand-100">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.cost)}
                    </p>
                    <p className="text-xs text-brand-500">Comissão: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.commission)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-brand-500 w-16">Entrega:</span>
                        <span className="font-bold text-brand-200">{format(new Date(sale.deliveryDate), 'dd/MM/yy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-brand-500 w-16">Medição:</span>
                        <span className="font-medium text-brand-300">{format(new Date(sale.executiveMeasurementDate), 'dd/MM/yy')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-brand-400 hover:text-brand-100 transition-colors bg-brand-800 rounded-lg">
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <div className="text-center py-12">
              <p className="text-brand-400">Nenhuma venda registrada.</p>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Nova Venda">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Cliente</label>
              <select 
                required
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                value={formData.clientId}
                onChange={e => setFormData({...formData, clientId: e.target.value})}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Descrição do Projeto</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Status Inicial</label>
              <select 
                required
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as SaleStatus})}
              >
                <option value="Orcamento">Orçamento</option>
                <option value="Contrato">Contrato</option>
                <option value="Medicao">Medição</option>
                <option value="Producao">Produção</option>
                <option value="Entrega">Entrega</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Valor da Venda (R$)</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Comissão (R$)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.commission}
                onChange={e => setFormData({...formData, commission: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Diversos / Custos Extras (R$)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.miscExpenses}
                onChange={e => setFormData({...formData, miscExpenses: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Data da Compra</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                onChange={e => setFormData({...formData, purchaseDate: new Date(e.target.value).toISOString()})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Data da Entrega</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                onChange={e => setFormData({...formData, deliveryDate: new Date(e.target.value).toISOString()})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Medição Executiva</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                onChange={e => setFormData({...formData, executiveMeasurementDate: new Date(e.target.value).toISOString()})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Aprovação Projeto</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100"
                onChange={e => setFormData({...formData, executiveProjectApprovalDate: new Date(e.target.value).toISOString()})}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-brand-800">
            <h4 className="text-sm font-bold text-brand-100 mb-4">Anexar Documentos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border-2 border-dashed border-brand-800 rounded-xl text-center hover:border-accent-blue transition-colors cursor-pointer group">
                <Upload size={20} className="mx-auto mb-2 text-brand-500 group-hover:text-accent-blue" />
                <p className="text-[10px] font-bold text-brand-500 uppercase group-hover:text-accent-blue">Orçamento</p>
              </div>
              <div className="p-4 border-2 border-dashed border-brand-800 rounded-xl text-center hover:border-accent-blue transition-colors cursor-pointer group">
                <Upload size={20} className="mx-auto mb-2 text-brand-500 group-hover:text-accent-blue" />
                <p className="text-[10px] font-bold text-brand-500 uppercase group-hover:text-accent-blue">Contrato</p>
              </div>
              <div className="p-4 border-2 border-dashed border-brand-800 rounded-xl text-center hover:border-accent-blue transition-colors cursor-pointer group">
                <Upload size={20} className="mx-auto mb-2 text-brand-500 group-hover:text-accent-blue" />
                <p className="text-[10px] font-bold text-brand-500 uppercase group-hover:text-accent-blue">Projeto</p>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-accent-blue text-white py-4 rounded-xl font-bold hover:bg-accent-blue-dark transition-all shadow-lg shadow-accent-blue/20">
            Salvar Venda
          </button>
        </form>
      </Modal>
    </div>
  );
};

const SettingsView = ({ settings, onUpdate, isAdmin }: { settings: CompanySettings | null, onUpdate: (s: any) => void, isAdmin: boolean }) => {
  const [formData, setFormData] = useState({
    name: settings?.name || '',
    logoUrl: settings?.logoUrl || '',
    address: settings?.address || '',
    contact: settings?.contact || '',
    theme: settings?.theme || 'dark'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-100">Configurações da Empresa</h2>
        {isAdmin && (
          <span className="px-3 py-1 bg-accent-blue/10 text-accent-blue text-[10px] font-bold rounded-full border border-accent-blue/20 uppercase tracking-wider">
            Administrador
          </span>
        )}
      </div>
      
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 bg-brand-800 rounded-3xl border-2 border-dashed border-brand-700 flex items-center justify-center overflow-hidden relative group">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Plus size={32} className="text-brand-600" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <p className="text-white text-[10px] font-bold">ALTERAR LOGO</p>
              </div>
            </div>
            <p className="text-xs text-brand-500 mt-2">Clique para fazer upload da logomarca</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Nome da Empresa</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Tema do Sistema</label>
              <div className="grid grid-cols-3 gap-3">
                {(['dark', 'light', 'gray'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({...formData, theme: t})}
                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                      formData.theme === t 
                        ? 'bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/20' 
                        : 'bg-brand-800 border-brand-700 text-brand-400 hover:border-brand-600'
                    }`}
                  >
                    {t === 'dark' ? 'Escuro' : t === 'light' ? 'Branco' : 'Cinza'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Endereço Comercial</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-400 uppercase">Informações de Contato</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-500"
                value={formData.contact}
                onChange={e => setFormData({...formData, contact: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-accent-blue text-white py-4 rounded-xl font-bold hover:bg-accent-blue-dark transition-all shadow-lg shadow-accent-blue/20">
            Salvar Configurações
          </button>
        </form>
      </Card>
    </div>
  );
};

const AdminUsersView = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { userProfile } = useAuth();

  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return () => unsub();
  }, []);

  const handleStatusUpdate = async (userId: string, status: 'authorized' | 'rejected') => {
    try {
      await updateUserStatus(userId, status);
    } catch (error) {
      console.error("Failed to update user status", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-100">Controle de Acesso</h2>
        <p className="text-xs text-brand-500 font-bold uppercase tracking-widest">Gerenciamento de Usuários</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-800">
                <th className="px-6 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-brand-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-brand-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center border border-brand-700 overflow-hidden">
                        {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <User size={16} className="text-brand-500" />}
                      </div>
                      <span className="text-sm font-bold text-brand-100">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      u.status === 'authorized' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      u.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {u.status === 'authorized' ? 'Autorizado' : u.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.uid !== userProfile?.uid && (
                      <div className="flex gap-2">
                        {u.status !== 'authorized' && (
                          <button 
                            onClick={() => handleStatusUpdate(u.uid, 'authorized')}
                            className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Autorizar"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {u.status !== 'rejected' && (
                          <button 
                            onClick={() => handleStatusUpdate(u.uid, 'rejected')}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Rejeitar"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const LoginView = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-brand-900 rounded-[2.5rem] shadow-2xl p-10 text-center border border-brand-800"
      >
        <div className="w-16 h-16 bg-accent-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent-blue/20">
          <LayoutDashboard size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-brand-100 mb-2">
          {isSignup ? 'Criar Conta' : 'Bem-vindo de volta'}
        </h1>
        <p className="text-brand-400 text-sm mb-8">
          {isSignup ? 'Cadastre-se para acessar o sistema' : 'Entre com suas credenciais para continuar'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {isSignup && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
              <input 
                required
                type="text" 
                placeholder="Nome Completo"
                className="w-full pl-12 pr-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-600 text-sm"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
            <input 
              required
              type="email" 
              placeholder="E-mail"
              className="w-full pl-12 pr-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-600 text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
            <input 
              required
              type="password" 
              placeholder="Senha"
              className="w-full pl-12 pr-4 py-3 bg-brand-800 border border-brand-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 text-brand-100 placeholder-brand-600 text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-accent-blue text-white rounded-xl py-3 font-bold hover:bg-accent-blue-dark transition-all shadow-lg shadow-accent-blue/20 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isSignup ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-brand-900 px-2 text-brand-500 font-bold">Ou</span></div>
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full bg-brand-800 text-brand-100 rounded-xl py-3 font-bold flex items-center justify-center gap-3 hover:bg-brand-700 transition-all border border-brand-700 mb-6"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          <span className="text-sm">Entrar com Google</span>
        </button>

        <p className="text-brand-400 text-sm">
          {isSignup ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <button 
            onClick={() => setIsSignup(!isSignup)}
            className="ml-2 text-accent-blue font-bold hover:underline"
          >
            {isSignup ? 'Faça Login' : 'Cadastre-se'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const PendingAuthView = () => {
  const { logout, userProfile } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-brand-900 rounded-[2.5rem] shadow-2xl p-12 text-center border border-brand-800"
      >
        <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
          <ShieldAlert size={40} className="text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-brand-100 mb-4">Aguardando Autorização</h1>
        <p className="text-brand-400 mb-8 leading-relaxed text-sm">
          Olá, <span className="text-brand-100 font-bold">{userProfile?.displayName}</span>. 
          Seu cadastro foi recebido com sucesso. Por motivos de segurança, o acesso ao sistema requer autorização prévia do administrador.
        </p>
        <div className="bg-brand-800/50 rounded-2xl p-4 mb-8 border border-brand-800">
          <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider mb-1">Status do Cadastro</p>
          <p className="text-yellow-500 font-bold text-sm uppercase tracking-widest">Pendente de Aprovação</p>
        </div>
        <button
          onClick={logout}
          className="w-full bg-brand-800 text-brand-100 rounded-xl py-4 font-bold flex items-center justify-center gap-3 hover:bg-brand-700 transition-all border border-brand-700"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </motion.div>
    </div>
  );
};

// --- Main App Layout ---

export default function App() {
  const { user, userProfile, loading, isAuthorized, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (user && isAuthorized) {
      const unsubClients = subscribeToClients(setClients);
      const unsubArchitects = subscribeToArchitects(setArchitects);
      const unsubSales = subscribeToSales(setSales);
      getCompanySettings().then(setSettings);
      return () => {
        unsubClients();
        unsubArchitects();
        unsubSales();
      };
    }
  }, [user, isAuthorized]);

  // Apply theme
  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [settings?.theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-950">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!isAuthorized) {
    return <PendingAuthView />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-brand-950 flex">
        {/* Sidebar */}
        <aside className={`fixed lg:relative z-40 h-screen bg-brand-900 border-r border-brand-800 transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0 lg:w-20'} overflow-hidden`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-accent-blue rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-accent-blue/20">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              {isSidebarOpen && <h1 className="font-bold text-xl tracking-tight text-brand-100 italic serif">GestãoPro</h1>}
            </div>

            <nav className="space-y-2 flex-1">
              <SidebarItem 
                icon={LayoutDashboard} 
                label={isSidebarOpen ? "Dashboard" : ""} 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
              />
              <SidebarItem 
                icon={Users} 
                label={isSidebarOpen ? "Clientes" : ""} 
                active={activeTab === 'clients'} 
                onClick={() => setActiveTab('clients')} 
              />
              <SidebarItem 
                icon={UserCheck} 
                label={isSidebarOpen ? "Arquitetos" : ""} 
                active={activeTab === 'architects'} 
                onClick={() => setActiveTab('architects')} 
              />
              <SidebarItem 
                icon={ShoppingCart} 
                label={isSidebarOpen ? "Vendas" : ""} 
                active={activeTab === 'sales'} 
                onClick={() => setActiveTab('sales')} 
              />
              <SidebarItem 
                icon={CalendarIcon} 
                label={isSidebarOpen ? "Agenda" : ""} 
                active={activeTab === 'agenda'} 
                onClick={() => setActiveTab('agenda')} 
              />
              {isAdmin && (
                <SidebarItem 
                  icon={UserPlus} 
                  label={isSidebarOpen ? "Acessos" : ""} 
                  active={activeTab === 'access'} 
                  onClick={() => setActiveTab('access')} 
                />
              )}
              <SidebarItem 
                icon={SettingsIcon} 
                label={isSidebarOpen ? "Configurações" : ""} 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
              />
            </nav>

            <div className="pt-6 border-t border-brand-800">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl transition-all"
              >
                <LogOut size={20} />
                {isSidebarOpen && <span className="font-medium">Sair</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
          <header className="sticky top-0 z-30 bg-brand-950/80 backdrop-blur-md border-b border-brand-800 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-brand-800 rounded-lg transition-colors text-brand-400"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-bold text-brand-100">
                {activeTab === 'dashboard' && 'Visão Geral'}
                {activeTab === 'clients' && 'Gestão de Clientes'}
                {activeTab === 'architects' && 'Gestão de Arquitetos'}
                {activeTab === 'sales' && 'Controle de Vendas'}
                {activeTab === 'agenda' && 'Agenda e Lembretes'}
                {activeTab === 'settings' && 'Configurações'}
                {activeTab === 'access' && 'Controle de Acesso'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-900 rounded-xl border border-brand-800">
                <Search size={16} className="text-brand-500" />
                <input type="text" placeholder="Buscar..." className="bg-transparent border-none focus:outline-none text-sm w-48 text-brand-100 placeholder-brand-600" />
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-brand-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-brand-100">{userProfile?.displayName}</p>
                  <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">{userProfile?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-brand-800 shadow-sm">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full bg-brand-800 flex items-center justify-center text-brand-400">
                      <User size={20} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <DashboardView sales={sales} clients={clients} />}
                {activeTab === 'clients' && <ClientsView clients={clients} architects={architects} onAddClient={addClient} />}
                {activeTab === 'architects' && <ArchitectsView architects={architects} onAddArchitect={addArchitect} />}
                {activeTab === 'sales' && <SalesView sales={sales} clients={clients} onAddSale={addSale} />}
                {activeTab === 'settings' && <SettingsView settings={settings} onUpdate={updateCompanySettings} isAdmin={isAdmin} />}
                {activeTab === 'access' && <AdminUsersView />}
                {activeTab === 'agenda' && (
                  <Card className="text-center py-20">
                    <CalendarIcon size={48} className="mx-auto mb-4 text-brand-600" />
                    <h3 className="text-xl font-bold mb-2 text-brand-100">Agenda Integrada</h3>
                    <p className="text-brand-400 max-w-md mx-auto">
                      A integração com o Google Agenda está sendo processada. Em breve você poderá sincronizar seus prazos automaticamente.
                    </p>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
