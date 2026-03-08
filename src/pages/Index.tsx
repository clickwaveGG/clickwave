import React from 'react';
import { ArrowRight, Sparkles, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import { Timeline } from '../components/Timeline';

const LOGOS = [
  { src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", alt: "Amazon" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", alt: "Google" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", alt: "Microsoft" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg", alt: "IBM" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", alt: "Netflix" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Slack_Technologies_Logo.svg", alt: "Slack" },
];

const TEAM_DATA = [
  {
    title: "Pedro Antônio",
    subtitle: "Fundador, CEO e Estrategista de Tráfego",
    content: (
      <div>
        <p className="text-white/70 text-sm md:text-base font-light mb-8">
          Uma das mentes por trás da Clickwave e um dos líderes do nosso exército. Especialista em gestão de tráfego e estratégias de marketing de alta performance, focado em dominar o mercado.
        </p>
        <div className="w-full sm:w-3/4 md:w-1/2">
          <img
            src="https://i.postimg.cc/2yrMw8pS/Sem-nome-(14-218-x-14-218-in).png"
            alt="Pedro Antônio"
            className="rounded-lg w-full h-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Leonardo",
    subtitle: "Web Designer e Estrategista de Marketing",
    content: (
      <div>
        <p className="text-white/70 text-sm md:text-base font-light mb-8">
          Uma das mentes e estrategistas do marketing. Responsável por traçar as rotas de ataque e garantir que cada campanha tenha um propósito claro e letal.
        </p>
        <div className="w-full sm:w-3/4 md:w-1/2">
          <img
            src="https://i.postimg.cc/gjs5BFdm/Sem-nome-(854-x-854-px).png"
            alt="Leonardo"
            className="rounded-lg w-full h-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Joao Victor",
    subtitle: "Videomaker e Editor de Vídeo",
    content: (
      <div>
        <p className="text-white/70 text-sm md:text-base font-light mb-8">
          O mestre da narrativa visual. Transforma cada frame em uma arma de persuasão, garantindo que a mensagem do nosso exército seja vista e sentida com impacto cinematográfico e força total.
        </p>
        <div className="w-full sm:w-3/4 md:w-1/2">
          <img
            src="https://i.postimg.cc/d1B4J2XJ/jv.png"
            alt="Joao Victor"
            className="rounded-lg w-full h-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    ),
  },
];

export default function Index() {
  return (
    <div className="bg-brand-black text-white font-sans selection:bg-brand-orange selection:text-white">
      {/* Hero Section */}
      <section className="min-h-screen relative overflow-hidden flex flex-col">
        {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {/* Desktop Background */}
        <img 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_39zyma8ql30s290hfBOQ8jKZC4x/hf_20260224_183417_a5606fcb-7644-462f-8e96-1d940ea9dfa7_min.webp" 
          alt="Background Desktop" 
          className="hidden md:block w-full h-full object-cover opacity-90"
          referrerPolicy="no-referrer"
        />
        {/* Mobile Background */}
        <img 
          src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_39zyma8ql30s290hfBOQ8jKZC4x%2Fhf_20260301_203944_564a49e8-b084-4ca5-9109-c67a64185f9a.png&w=1280&q=85" 
          alt="Background Mobile" 
          className="block md:hidden w-full h-full object-cover opacity-90"
          referrerPolicy="no-referrer"
        />
        {/* Gradients for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        
        {/* Header */}
        <header className="flex items-center justify-between py-2 px-4 md:py-3 md:px-6 rounded-full backdrop-blur-md bg-white/10 border border-white/20 w-full shadow-lg">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-brand-orange" />
            <span className="font-medium text-sm md:text-lg tracking-wide">Clickwave</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/90">
            <a href="#" className="hover:text-white transition-colors">Como Funciona</a>
            <span className="w-1 h-1 rounded-full bg-white/40"></span>
            <a href="#" className="hover:text-white transition-colors">Serviços</a>
            <span className="w-1 h-1 rounded-full bg-white/40"></span>
            <a href="#" className="hover:text-white transition-colors">Metodologia</a>
            <span className="w-1 h-1 rounded-full bg-white/40"></span>
            <a href="#" className="hover:text-white transition-colors">Sobre nós</a>
          </nav>

          <button className="bg-brand-orange text-white px-4 py-1.5 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-sm font-medium flex items-center gap-1.5 md:gap-2 hover:bg-orange-600 transition-colors">
            Login <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </header>

        {/* Main Hero Content */}
        <main className="flex-1 flex flex-col justify-start items-center md:items-start text-center md:text-left pt-4 md:pt-24 mt-2 md:mt-0">
          <div className="max-w-3xl w-full">
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.05] tracking-tight mb-64 md:mb-20">
              Marketing é <br />
              <span className="italic flex items-center justify-center md:justify-start gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-dashed border-white/50 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                guerra.
              </span>
            </h1>
            
            <p className="text-xs md:text-sm text-white/60 mb-10 max-w-md mx-auto md:mx-0 leading-relaxed font-mono tracking-wide uppercase border-l border-brand-orange/30 pl-4 py-1">
              // E nós somos a sua linha de frente. Estratégia implacável, clareza de marca e execução tática para dominar o seu mercado.
            </p>

            <button className="group relative overflow-hidden bg-brand-orange text-white px-8 py-4 rounded-full text-sm md:text-base font-mono uppercase tracking-widest hover:bg-orange-600 transition-all duration-300 shadow-[0_0_40px_rgba(255,87,34,0.2)]">
              <span className="relative z-10 flex items-center gap-2">
                Começar Agora! <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              </span>
            </button>
          </div>
        </main>

        {/* Bottom Widgets */}
        <div className="flex flex-col md:flex-row justify-between gap-6 mt-12 pb-4 items-end w-full">
          
          {/* Widget 1: The Mission */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col h-72 w-full md:max-w-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></div>
            </div>
            <h3 className="font-serif italic text-2xl mb-4">A Missão</h3>
            <div className="space-y-4 flex-1">
              <div className="border-l-2 border-brand-orange pl-4">
                <p className="text-[10px] font-mono text-brand-orange uppercase mb-1">Objetivo Primário</p>
                <p className="text-sm text-white/80">Aniquilar a invisibilidade da sua marca e estabelecer dominância absoluta no seu nicho.</p>
              </div>
              <div className="border-l-2 border-white/20 pl-4">
                <p className="text-[10px] font-mono text-white/40 uppercase mb-1">Status da Operação</p>
                <p className="text-sm text-white/60 italic">Pronto para mobilização imediata.</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-white/10">
              <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Protocolo: Clickwave-01</p>
            </div>
          </div>
 
          {/* Widget 2: The Arsenal */}
          <div className="hidden md:flex backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] p-6 flex-col h-72 w-full md:max-w-sm relative overflow-hidden">
            <h3 className="font-serif italic text-2xl mb-4">O Arsenal</h3>
            <ul className="space-y-3 flex-1">
              {[
                { label: "Inteligência de Dados", status: "ATIVO" },
                { label: "Design de Impacto", status: "ATIVO" },
                { label: "Tráfego de Elite", status: "STANDBY" },
                { label: "Copywriting Bélico", status: "ATIVO" }
              ].map((item, i) => (
                <li key={i} className="flex items-center justify-between group/item cursor-default">
                  <span className="text-xs text-white/70 group-hover/item:text-brand-orange transition-colors">{item.label}</span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${item.status === 'ATIVO' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-white/10 text-white/30'}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex justify-between items-center text-[9px] font-mono text-white/20">
              <span>CAPACIDADE: 100%</span>
              <span>V.2.5</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    {/* Mobile Arsenal Section */}
    <section className="md:hidden px-6 py-12 bg-brand-black border-t border-white/5 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col h-72 relative overflow-hidden">
          <h3 className="font-serif italic text-2xl mb-4">O Arsenal</h3>
          <ul className="space-y-3 flex-1">
            {[
              { label: "Inteligência de Dados", status: "ATIVO" },
              { label: "Design de Impacto", status: "ATIVO" },
              { label: "Tráfego de Elite", status: "STANDBY" },
              { label: "Copywriting Bélico", status: "ATIVO" }
            ].map((item, i) => (
              <li key={i} className="flex items-center justify-between group/item cursor-default">
                <span className="text-xs text-white/70 group-hover/item:text-brand-orange transition-colors">{item.label}</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${item.status === 'ATIVO' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-white/10 text-white/30'}`}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex justify-between items-center text-[9px] font-mono text-white/20">
            <span>CAPACIDADE: 100%</span>
            <span>V.2.5</span>
          </div>
        </div>
      </div>
    </section>

    {/* Clients Logo Cloud Section */}
    <section className="py-12 bg-brand-black border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">
          Empresas que confiam em nossa estratégia
        </p>
      </div>
      <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
        <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
          {LOGOS.map((logo, index) => (
            <li key={index}>
              <img src={logo.src} alt={logo.alt} className="h-8 md:h-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 brightness-0 invert" />
            </li>
          ))}
          {/* Duplicate for infinite scroll effect */}
          {LOGOS.map((logo, index) => (
            <li key={`dup-${index}`}>
              <img src={logo.src} alt={logo.alt} className="h-8 md:h-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 brightness-0 invert" />
            </li>
          ))}
        </ul>
      </div>
    </section>

    {/* Team Timeline Section */}
    <section className="bg-brand-black border-t border-white/5 relative z-10">
      <Timeline data={TEAM_DATA} />
    </section>

    {/* Manifesto Section */}
      <section className="py-32 md:py-48 px-6 bg-brand-black flex flex-col items-center justify-center text-center z-10 relative border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.1] tracking-tight mb-12">
            Pare de tratar o marketing<br className="hidden md:block" /> como gasto. Ele é o investimento<br />
            que financia o seu domínio.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="max-w-2xl mx-auto space-y-8 text-white/70 font-mono text-sm md:text-base leading-relaxed"
        >
          <p>
            A maioria das empresas vê o marketing como um buraco negro financeiro porque joga dinheiro em estratégias vazias e métricas de vaidade. Na Clickwave, nós transformamos cada centavo investido em um ativo de alta performance.
          </p>
          <p>
            Não estamos aqui para fazer barulho, estamos aqui para gerar lucro. Quando você para de gastar com o que não funciona e começa a investir em inteligência, design e tráfego de elite, a concorrência deixa de ser um problema e passa a ser apenas um detalhe no retrovisor.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="mt-20 mb-12"
        >
          <Crosshair className="w-12 h-12 text-white/30 stroke-[1]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
        >
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">
            ~ NOSSO ARSENAL ~
          </span>
        </motion.div>
      </section>
    </div>
  );
}
