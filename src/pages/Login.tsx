import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0B3A3E] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-xl bg-[#1EEBBA] flex items-center justify-center">
              <span className="text-[#0B3A3E] font-bold text-xl">CP</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#0B3A3E]">
            {t('appName')}
          </CardTitle>
          <p className="text-sm text-[#6B7B7D] mt-1">
            {t('login')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{t('loginError')}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#0B3A3E]">
                {t('username')}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
                placeholder="admin"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0B3A3E]">
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-[#0B3A3E]/15 focus:border-[#1EEBBA] focus:ring-[#1EEBBA]/20"
                placeholder="••••••••"
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#1EEBBA] text-[#0B3A3E] hover:bg-[#1EEBBA]/90 font-semibold"
            >
              {isLoading ? t('loading') : t('login')}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-[#6B7B7D]">
            <p>Default: admin / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
