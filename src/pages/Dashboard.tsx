import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useClients } from '@/context/ClientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import {
  Users,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { DashboardStats } from '@/types';

export function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { clients, getDashboardStats, refreshStatuses } = useClients();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    overdueClients: 0,
    totalCollected: 0,
    monthlyData: [],
  });

  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
  }, [getDashboardStats, clients]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return formatted.replace('UZS', '').trim() + ' UZS';
  };

  const summaryCards = [
    {
      title: t('totalClients'),
      value: stats.totalClients,
      subtitle: t('thisMonth'),
      icon: Users,
      color: 'bg-[#1EEBBA]/20',
      iconColor: 'text-[#0B3A3E]',
    },
    {
      title: t('overdueClients'),
      value: stats.overdueClients,
      subtitle: t('needsAttention'),
      icon: AlertTriangle,
      color: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      title: t('totalMoneyCollected'),
      value: formatCurrency(stats.totalCollected),
      subtitle: t('ytd'),
      icon: Wallet,
      color: 'bg-[#0B3A3E]',
      iconColor: 'text-white',
      textColor: 'text-white',
    },
  ];

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const overdueClientsList = clients.filter((c) => c.status === 'overdue').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3A3E]">{t('dashboard')}</h1>
          <p className="text-sm text-[#6B7B7D] mt-1">
            {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/add-client')}
          className="bg-[#1EEBBA] text-[#0B3A3E] hover:bg-[#1EEBBA]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addNewClient')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className={`border-0 shadow-lg card-hover overflow-hidden ${card.textColor ? 'bg-[#0B3A3E]' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${card.textColor || 'text-[#6B7B7D]'}`}>
                      {card.title}
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${card.textColor || 'text-[#0B3A3E]'}`}>
                      {card.value}
                    </p>
                    <p className={`text-xs mt-1 ${card.textColor ? 'text-white/70' : 'text-[#6B7B7D]'}`}>
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-[#0B3A3E] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1EEBBA]" />
            {t('monthlyCollection')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,58,62,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6B7B7D', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(11,58,62,0.2)' }}
                />
                <YAxis
                  tick={{ fill: '#6B7B7D', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(11,58,62,0.2)' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#0B3A3E',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Bar dataKey="amount" fill="#1EEBBA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#0B3A3E]">{t('clients')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/clients')}
              className="text-[#1EEBBA] hover:text-[#0B3A3E] hover:bg-[#1EEBBA]/10"
            >
              {t('viewAll')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <p className="text-center text-[#6B7B7D] py-8">{t('noClients')}</p>
            ) : (
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/client/${client.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#0B3A3E]/5 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[#0B3A3E]">{client.fullName}</p>
                      <p className="text-sm text-[#6B7B7D]">{client.courseName}</p>
                    </div>
                    <StatusBadge status={client.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Clients Alert */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-[#0B3A3E] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {t('overdueClients')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueClientsList.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#1EEBBA]/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-[#1EEBBA]" />
                </div>
                <p className="text-[#6B7B7D]">No overdue clients</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueClientsList.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/client/${client.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[#0B3A3E]">{client.fullName}</p>
                      <p className="text-sm text-red-600">
                        Due:{' '}
                        {client.nextPaymentDate
                          ? new Date(client.nextPaymentDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <StatusBadge status="overdue" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
