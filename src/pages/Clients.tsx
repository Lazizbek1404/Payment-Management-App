import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useClients } from '@/context/ClientContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Trash2,
  UserX,
} from 'lucide-react';
import type { PaymentStatus } from '@/types';

export function Clients() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { clients, deleteClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phoneNumber.includes(searchQuery);
      const matchesStatus =
        statusFilter === 'all' || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const handleDelete = () => {
    if (deleteId) {
      deleteClient(deleteId);
      setDeleteId(null);
    }
  };

  const filters: { value: PaymentStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('all') },
    { value: 'paying', label: t('paying') },
    { value: 'overdue', label: t('overdue') },
    { value: 'completed', label: t('completed') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#0B3A3E]">{t('clientsTitle')}</h1>
        <Button
          onClick={() => navigate('/add-client')}
          className="bg-[#1EEBBA] text-[#0B3A3E] hover:bg-[#1EEBBA]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addClient')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7B7D]" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === filter.value
                  ? 'bg-[#0B3A3E] text-white'
                  : 'bg-white text-[#0B3A3E] border border-[#0B3A3E]/15 hover:bg-[#0B3A3E]/5'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-[#0B3A3E]/5 flex items-center justify-center mb-4">
                <UserX className="w-8 h-8 text-[#6B7B7D]" />
              </div>
              <p className="text-[#6B7B7D] text-center">
                {statusFilter === 'all' ? t('noClients') : 'No clients in the given category'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0B3A3E]/5 hover:bg-[#0B3A3E]/5">
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('name')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('phone')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('telegram')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('course')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('status')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('nextPayment')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold text-right">
                      {t('actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="hover:bg-[#0B3A3E]/[0.02] transition-colors cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        navigate(`/client/${client.id}`);
                      }}
                    >
                      <TableCell className="font-medium text-[#0B3A3E]">
                        {client.fullName}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[#6B7B7D]">
                        {client.phoneNumber}
                      </TableCell>
                      <TableCell className="text-[#6B7B7D]">
                        @{client.telegramUsername}
                      </TableCell>
                      <TableCell className="text-[#0B3A3E]">
                        {client.courseName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={client.status} />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[#6B7B7D]">
                        {client.nextPaymentDate
                          ? new Date(client.nextPaymentDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(client.id)}
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
