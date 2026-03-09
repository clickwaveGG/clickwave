import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Eye, EyeOff, Users, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

type LoginMode = 'select' | 'colaborador' | 'cliente';

export default function Login() {
  const [mode, setMode] = useState<LoginMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = () => {
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Insira um e-mail válido.');
      return;
    }
    setError('');
    alert('Login realizado com sucesso! (Demo)');
  };

  const modeConfig = {
    colaborador: {
      title: 'Área do Colaborador',
      subtitle: 'Acesse o painel interno da equipe Clickwave.',
      accent: 'brand-orange',
      icon: Users,
    },
    cliente: {
      title: 'Área do Cliente',
      subtitle: 'Acompanhe seus resultados e projetos em tempo real.',
      accent: 'brand-orange',
      icon: Briefcase,
    },
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center relative overflow-hidden px-4">
      {/* Subtle background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-orange/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px]" />
      </div>

      {/* Grid pattern */}
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

      <AnimatePresence mode="wait">
        {mode === 'select' ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-lg"
          >
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-12">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              <span className="font-medium text-lg tracking-wide text-white">Clickwave</span>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-serif text-white mb-3">
                Bem-vindo de volta.
              </h1>
              <p className="text-white/40 text-sm font-mono">
                Selecione como deseja acessar a plataforma.
              </p>
            </div>

            <div className="space-y-4">
              {/* Colaborador Card */}
              <button
                onClick={() => setMode('colaborador')}
                className="group w-full text-left p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-brand-orange/40 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center group-hover:bg-brand-orange/20 transition-colors">
                    <Users className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">Colaborador</h3>
                    <p className="text-white/40 text-xs font-mono">Painel interno da equipe</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-brand-orange/30 group-hover:bg-brand-orange/10 transition-all">
                    <ArrowLeft className="w-3.5 h-3.5 text-white/30 rotate-180 group-hover:text-brand-orange transition-colors" />
                  </div>
                </div>
              </button>

              {/* Cliente Card */}
              <button
                onClick={() => setMode('cliente')}
                className="group w-full text-left p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-brand-orange/40 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-orange/10 group-hover:border-brand-orange/20 transition-colors">
                    <Briefcase className="w-5 h-5 text-white/50 group-hover:text-brand-orange transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">Cliente</h3>
                    <p className="text-white/40 text-xs font-mono">Acompanhe seus resultados</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-brand-orange/30 group-hover:bg-brand-orange/10 transition-all">
                    <ArrowLeft className="w-3.5 h-3.5 text-white/30 rotate-180 group-hover:text-brand-orange transition-colors" />
                  </div>
                </div>
              </button>
            </div>

            <p className="text-center text-white/20 text-[10px] font-mono mt-12 tracking-widest uppercase">
              Protocolo de acesso seguro — Clickwave v2.5
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-10">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              <span className="font-medium text-lg tracking-wide text-white">Clickwave</span>
            </div>

            {/* Glass Card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-10">
              {/* Back button */}
              <button
                onClick={() => {
                  setMode('select');
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-xs font-mono mb-8"
              >
                <ArrowLeft className="w-3 h-3" />
                Voltar
              </button>

              {/* Mode icon + title */}
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-5">
                  {React.createElement(modeConfig[mode].icon, {
                    className: 'w-6 h-6 text-brand-orange',
                  })}
                </div>
                <h2 className="text-2xl font-serif text-white mb-2">
                  {modeConfig[mode].title}
                </h2>
                <p className="text-white/40 text-sm">
                  {modeConfig[mode].subtitle}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
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

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google */}
              <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/60 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar com Google
              </button>
            </div>

            <p className="text-center text-white/20 text-[10px] font-mono mt-8 tracking-widest uppercase">
              Conexão criptografada — Clickwave
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
