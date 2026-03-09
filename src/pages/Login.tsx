import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import clickwaveLogo from '@/assets/clickwave-logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = () => {
    if (!username || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (username.length < 3) {
      setError('Nome de usuário deve ter ao menos 3 caracteres.');
      return;
    }
    setError('');
    alert('Login realizado com sucesso! (Demo)');
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center relative overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-orange/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Back to home */}
      <Link
        to="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm font-mono z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src={clickwaveLogo} alt="Clickwave" className="h-16 w-auto" />
          <span className="font-medium text-xl tracking-wide text-white">Clickwave</span>
        </div>

        {/* Glass Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-10">
          {/* Icon + Title */}
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-5">
              <User className="w-6 h-6 text-brand-orange" />
            </div>
            <h1 className="text-2xl font-serif text-white mb-2">
              Bem-vindo de volta.
            </h1>
            <p className="text-white/40 text-sm">
              Acesse sua conta com seu nome de usuário e senha.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
                Nome de usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu.usuario"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40 focus:bg-white/[0.06] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-orange/40 focus:bg-white/[0.06] transition-all duration-300 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-xs font-mono mb-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Forgot password */}
          <div className="flex justify-end mb-6">
            <button className="text-xs text-white/30 hover:text-brand-orange transition-colors font-mono">
              Esqueceu a senha?
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSignIn}
            className="w-full bg-brand-orange text-white py-3.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-all duration-300 shadow-[0_0_30px_rgba(255,51,0,0.15)] hover:shadow-[0_0_40px_rgba(255,51,0,0.25)]"
          >
            Entrar
          </button>
        </div>

        <p className="text-center text-white/20 text-[10px] font-mono mt-8 tracking-widest uppercase">
          Conexão criptografada — Clickwave
        </p>
      </motion.div>
    </div>
  );
}
