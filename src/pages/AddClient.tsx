import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useClients } from '@/context/ClientContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calculator, Search, User } from 'lucide-react';
import { api } from '@/lib/api';
import type { RegisteredUser } from '@/types';

export function AddClient() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addClient } = useClients();

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [installmentPrice, setInstallmentPrice] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getRegisteredUsers()
      .then(setRegisteredUsers)
      .catch(console.error)
      .finally(() => setUsersLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search) return registeredUsers;
    const q = search.toLowerCase();
    return registeredUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.phoneNumber.includes(q) ||
        (u.telegramUsername || '').toLowerCase().includes(q)
    );
  }, [registeredUsers, search]);

  const monthlyPayment = useMemo(() => {
    const price = parseFloat(installmentPrice) || 0;
    const months = parseInt(numberOfMonths) || 1;
    return months > 0 ? Math.round(price / months) : 0;
  }, [installmentPrice, numberOfMonths]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('UZS', '')
      .trim();

  const handleSelectUser = (user: RegisteredUser) => {
    setSelectedUser(user);
    setSearch(user.fullName);
    setShowDropdown(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a registered client from the list.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await addClient({
        userId: selectedUser.id,
        installmentPrice: parseFloat(installmentPrice) || 0,
        numberOfMonths: parseInt(numberOfMonths) || 1,
        startDate,
      });
      navigate('/clients');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-[#0B3A3E]">{t('addClientTitle')}</h1>
      </div>

      <Card className="border-0 shadow-lg max-w-4xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Client selector */}
            <div className="space-y-2">
              <Label className="text-[#0B3A3E]">
                Select Registered Client *
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7B7D]" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedUser(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-10 h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
                  placeholder={usersLoading ? 'Loading...' : 'Search by name, phone, or username...'}
                  disabled={usersLoading}
                  autoComplete="off"
                />
                {showDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#0B3A3E]/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0B3A3E]/5 text-left transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#1EEBBA]/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#0B3A3E]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0B3A3E] text-sm">{user.fullName}</p>
                          <p className="text-xs text-[#6B7B7D]">
                            {user.phoneNumber}
                            {user.telegramUsername ? ` · @${user.telegramUsername}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && !usersLoading && filteredUsers.length === 0 && search.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#0B3A3E]/10 rounded-xl shadow-lg px-4 py-3 text-sm text-[#6B7B7D]">
                    No registered clients found
                  </div>
                )}
              </div>

              {/* Selected client preview */}
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 bg-[#1EEBBA]/10 rounded-xl border border-[#1EEBBA]/30">
                  <div className="w-9 h-9 rounded-full bg-[#1EEBBA]/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#0B3A3E]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0B3A3E] text-sm">{selectedUser.fullName}</p>
                    <p className="text-xs text-[#6B7B7D]">
                      {selectedUser.phoneNumber}
                      {selectedUser.telegramUsername ? ` · @${selectedUser.telegramUsername}` : ''}
                      {' · '}
                      {selectedUser.language === 'uz' ? "O'zbek" : selectedUser.language === 'ru' ? 'Русский' : 'English'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Installment Price */}
              <div className="space-y-2">
                <Label htmlFor="installmentPrice" className="text-[#0B3A3E]">
                  {t('installmentPrice')} *
                </Label>
                <Input
                  id="installmentPrice"
                  type="number"
                  min="0"
                  value={installmentPrice}
                  onChange={(e) => setInstallmentPrice(e.target.value)}
                  className="h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
                  placeholder="6000000"
                  required
                />
              </div>

              {/* Number of Months */}
              <div className="space-y-2">
                <Label htmlFor="numberOfMonths" className="text-[#0B3A3E]">
                  {t('numberOfMonths')} *
                </Label>
                <Input
                  id="numberOfMonths"
                  type="number"
                  min="1"
                  max="36"
                  value={numberOfMonths}
                  onChange={(e) => setNumberOfMonths(e.target.value)}
                  className="h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
                  placeholder="6"
                  required
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-[#0B3A3E]">
                  {t('startDate')} *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
                  required
                />
              </div>
            </div>

            {/* Calculation preview */}
            <div className="bg-[#0B3A3E]/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#0B3A3E]">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-medium">{t('monthlyPayment')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-[#6B7B7D] mb-1">{t('monthlyPayment')}</p>
                  <p className="text-2xl font-bold text-[#0B3A3E] font-mono">
                    {formatCurrency(monthlyPayment)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-[#6B7B7D] mb-1">{t('remainingBalance')}</p>
                  <p className="text-2xl font-bold text-[#0B3A3E] font-mono">
                    {formatCurrency(parseFloat(installmentPrice) || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedUser}
                className="flex-1 h-11 bg-[#1EEBBA] text-[#0B3A3E] hover:bg-[#1EEBBA]/90 font-semibold disabled:opacity-50"
              >
                {isSubmitting ? t('loading') : t('saveClient')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/clients')}
                className="flex-1 sm:flex-none h-11 border-[#0B3A3E]/15 text-[#0B3A3E] hover:bg-[#0B3A3E]/5"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
