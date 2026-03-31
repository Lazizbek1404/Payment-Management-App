import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useClients } from '@/context/ClientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  BookOpen,
  CheckCircle,
  Send,
  X,
} from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { getClient, addPayment, clearMonthPayments, sendReminder } = useClients();
  const [reminderSending, setReminderSending] = useState<number | null>(null);
  const [clearMonthTarget, setClearMonthTarget] = useState<number | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    monthNumber: 1,
  });
  const [paymentStep, setPaymentStep] = useState<'choose' | 'partial'>('choose');

  const client = id ? getClient(id) : undefined;

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-[#6B7B7D]">Client not found</p>
        <Button
          onClick={() => navigate('/clients')}
          className="mt-4 bg-[#1EEBBA] text-[#0B3A3E]"
        >
          {t('back')}
        </Button>
      </div>
    );
  }

  const totalPaid = client.payments.filter(p => !p.cancelled && !p.overpayment).reduce((sum, p) => sum + p.amount, 0);

  // Generate payment schedule
  const schedule = Array.from({ length: client.numberOfMonths }, (_, i) => {
    const monthNumber = i + 1;
    const dueDate = format(addMonths(parseISO(client.startDate), i), 'yyyy-MM-dd');
    const monthPayments = client.payments.filter((p) => p.monthNumber === monthNumber && !p.cancelled && !p.overpayment);
    const totalPaidForMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const isPaid = totalPaidForMonth >= client.monthlyPayment;
    const isPartial = !isPaid && totalPaidForMonth > 0;
    const today = new Date();
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const isDue = !isPaid && new Date(dueDate) <= endOfCurrentMonth;
    return {
      monthNumber,
      dueDate,
      amount: client.monthlyPayment,
      totalPaidForMonth,
      isPaid,
      isPartial,
      isDue,
    };
  });

  const firstUnpaidMonth = schedule.find((s) => !s.isPaid)?.monthNumber;

  const handleAddPayment = async (partial: boolean) => {
    const amount = partial ? (parseFloat(paymentForm.amount) || 0) : client.monthlyPayment;
    if (amount <= 0) return;

    await addPayment(client.id, {
      amount,
      date: paymentForm.date,
      note: paymentForm.note,
      monthNumber: paymentForm.monthNumber,
    });

    setIsPaymentDialogOpen(false);
    setPaymentStep('choose');
    setPaymentForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      monthNumber: 1,
    });
  };

  const handleSendReminder = async (monthNumber: number) => {
    setReminderSending(monthNumber);
    try {
      await sendReminder(client.id);
    } catch (err) {
      console.error('Failed to send reminder:', err);
      alert(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setReminderSending(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('UZS', '').trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/clients')}
          className="text-[#0B3A3E] hover:bg-[#0B3A3E]/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#0B3A3E]">{client.fullName}</h1>
          <StatusBadge status={client.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-[#0B3A3E]">{t('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1EEBBA]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#0B3A3E]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7B7D]">{t('fullName')}</p>
                <p className="font-medium text-[#0B3A3E]">{client.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1EEBBA]/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#0B3A3E]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7B7D]">{t('phoneNumber')}</p>
                <p className="font-medium text-[#0B3A3E] font-mono">{client.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1EEBBA]/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#0B3A3E]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7B7D]">{t('telegramUsername')}</p>
                <p className="font-medium text-[#0B3A3E]">@{client.telegramUsername}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1EEBBA]/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#0B3A3E]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7B7D]">{t('courseName')}</p>
                <p className="font-medium text-[#0B3A3E]">{client.courseName}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-[#6B7B7D] mb-1">{t('totalPrice')}</p>
                  <p className="font-bold text-[#0B3A3E] font-mono text-sm">
                    {formatCurrency(client.installmentPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7B7D] mb-1">{t('paidSoFar')}</p>
                  <p className="font-bold text-[#1EEBBA] font-mono text-sm">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7B7D] mb-1">{t('remaining')}</p>
                  <p className="font-bold text-red-500 font-mono text-sm">
                    {formatCurrency(client.remainingBalance)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Schedule */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-[#0B3A3E]">{t('paymentSchedule')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0B3A3E]/5">
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('month')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('dueDate')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('amount')}
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      Paid
                    </TableHead>
                    <TableHead className="text-[#0B3A3E] font-semibold">
                      {t('status')}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((item) => (
                    <TableRow
                      key={item.monthNumber}
                      className={item.isPaid ? 'bg-[#1EEBBA]/5' : item.isPartial ? 'bg-yellow-50' : ''}
                    >
                      <TableCell className="font-medium">
                        {item.monthNumber} / {client.numberOfMonths}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[#6B7B7D]">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[#6B7B7D]">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.totalPaidForMonth > 0 ? (
                          <span className={item.isPaid ? 'text-[#1EEBBA] font-semibold' : 'text-yellow-600'}>
                            {formatCurrency(item.totalPaidForMonth)}
                          </span>
                        ) : (
                          <span className="text-[#6B7B7D]">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[#1EEBBA] text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Paid
                          </span>
                        ) : item.isPartial ? (
                          <span className="inline-flex items-center gap-1 text-yellow-600 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Partial
                          </span>
                        ) : (
                          <span className="text-[#6B7B7D] text-sm">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(item.isPaid || item.isPartial) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setClearMonthTarget(item.monthNumber)}
                              className="h-8 w-8 p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
                              title="Clear payment"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          {item.isDue && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-[#229ED9] hover:bg-[#229ED9]/10"
                              title="Send Telegram reminder"
                              disabled={reminderSending === item.monthNumber}
                              onClick={() => handleSendReminder(item.monthNumber)}
                            >
                              <Send className={`w-4 h-4 ${reminderSending === item.monthNumber ? 'animate-pulse' : ''}`} />
                            </Button>
                          )}
                          {item.monthNumber === firstUnpaidMonth && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setPaymentForm((prev) => ({ ...prev, monthNumber: item.monthNumber }));
                                setPaymentStep('choose');
                                setIsPaymentDialogOpen(true);
                              }}
                              className="bg-[#1EEBBA] text-[#0B3A3E] hover:bg-[#1EEBBA]/90 h-8 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t('markAsPaid')}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-[#0B3A3E]">{t('paymentHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {client.payments.length === 0 ? (
            <div className="text-center py-8 text-[#6B7B7D]">{t('noPayments')}</div>
          ) : (() => {
            // Group payments by groupId (or by id if no groupId)
            const groups = new Map<string, typeof client.payments>();
            [...client.payments]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .forEach(p => {
                const key = p.groupId || p.id;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(p);
              });

            return (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0B3A3E]/5">
                      <TableHead className="text-[#0B3A3E] font-semibold">{t('month')}</TableHead>
                      <TableHead className="text-[#0B3A3E] font-semibold">{t('paymentDate')}</TableHead>
                      <TableHead className="text-[#0B3A3E] font-semibold">{t('amount')}</TableHead>
                      <TableHead className="text-[#0B3A3E] font-semibold">{t('note')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...groups.values()].map(group => {
                      const allCancelled = group.every(p => p.cancelled);
                      const totalAmount = group.reduce((sum, p) => sum + p.amount, 0);
                      const months = [...new Set(group.map(p => p.monthNumber))].sort((a, b) => a - b);
                      const monthLabel = months.length > 1
                        ? `${months[0]}-${months[months.length - 1]} / ${client.numberOfMonths}`
                        : `${months[0]} / ${client.numberOfMonths}`;
                      const cancelledAt = group.find(p => p.cancelledAt)?.cancelledAt;
                      const note = allCancelled
                        ? `Cancelled on ${new Date(cancelledAt!).toLocaleDateString()}`
                        : (group[0].note || '-');

                      return (
                        <TableRow key={group[0].groupId || group[0].id} className={allCancelled ? 'opacity-50' : ''}>
                          <TableCell className={`font-medium ${allCancelled ? 'line-through' : ''}`}>
                            {monthLabel}
                          </TableCell>
                          <TableCell className={`font-mono text-sm text-[#6B7B7D] ${allCancelled ? 'line-through' : ''}`}>
                            {new Date(group[0].date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className={`font-mono font-semibold ${allCancelled ? 'line-through text-[#6B7B7D]' : 'text-[#1EEBBA]'}`}>
                            {formatCurrency(totalAmount)}
                          </TableCell>
                          <TableCell className={`${allCancelled ? 'text-red-400' : 'text-[#6B7B7D]'}`}>
                            {note}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { setIsPaymentDialogOpen(open); setPaymentStep('choose'); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B3A3E]">
              Month {paymentForm.monthNumber} / {client.numberOfMonths}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'choose' ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleAddPayment(false)}
                className="w-full text-left p-4 rounded-xl border border-[#0B3A3E]/15 hover:bg-[#1EEBBA]/10 hover:border-[#1EEBBA] transition-colors"
              >
                <p className="font-semibold text-[#0B3A3E]">Paid full amount</p>
                <p className="text-sm text-[#6B7B7D] mt-0.5">{formatCurrency(client.monthlyPayment)} UZS</p>
              </button>
              <button
                onClick={() => setPaymentStep('partial')}
                className="w-full text-left p-4 rounded-xl border border-[#0B3A3E]/15 hover:bg-yellow-50 hover:border-yellow-400 transition-colors"
              >
                <p className="font-semibold text-[#0B3A3E]">Paid partially</p>
                <p className="text-sm text-[#6B7B7D] mt-0.5">Enter the amount paid</p>
              </button>
              <Button
                onClick={() => setIsPaymentDialogOpen(false)}
                variant="outline"
                className="w-full h-11 border-[#0B3A3E]/15 text-[#0B3A3E] hover:bg-[#0B3A3E]/5"
              >
                {t('cancel')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="paymentAmount" className="text-[#0B3A3E]">
                  Amount paid (UZS)
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
                  placeholder={client.monthlyPayment.toString()}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAddPayment(true)}
                  disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
                  className="flex-1 h-11 bg-[#1EEBBA] text-[#0B3A3E] hover:bg-[#1EEBBA]/90 font-semibold"
                >
                  {t('save')}
                </Button>
                <Button
                  onClick={() => setPaymentStep('choose')}
                  variant="outline"
                  className="flex-1 h-11 border-[#0B3A3E]/15 text-[#0B3A3E] hover:bg-[#0B3A3E]/5"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clear Payment Confirmation */}
      <AlertDialog open={clearMonthTarget !== null} onOpenChange={() => setClearMonthTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear payment for month {clearMonthTarget}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all recorded payments for this month and revert its status. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (clearMonthTarget !== null) {
                  await clearMonthPayments(client.id, clearMonthTarget);
                  setClearMonthTarget(null);
                }
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
