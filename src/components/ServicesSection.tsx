import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Video, Rocket, ArrowRight, Check } from 'lucide-react';

const SERVICES = [
  {
    id: "webdesigner",
    badge: "Design de Conversão",
    icon: Palette,
    title: "Preciso de um Web Designer",
    description:
      "Sua marca merece mais do que um site bonito — ela merece uma máquina de conversão. Criamos páginas estratégicas que guiam o visitante até o \"Sim\" com clareza, impacto e zero fricção.",
    features: [
      "Landing pages de alta conversão",
      "Identidade visual estratégica",
      "UX focado em resultados",
      "Design responsivo e otimizado",
    ],
    cta: "Falar com Web Designer",
    featured: false,
  },
  {
    id: "videomaker",
    badge: "Narrativa Visual",
    icon: Video,
    title: "Preciso de um Videomaker",
    description:
      "Vídeos que não são apenas assistidos — são sentidos. Transformamos a mensagem da sua marca em conteúdo cinematográfico que prende a atenção, gera conexão e converte em vendas.",
    features: [
      "Vídeos institucionais de impacto",
      "Conteúdo para redes sociais",
      "Edição profissional e dinâmica",
      "Roteiros persuasivos",
    ],
    cta: "Falar com Videomaker",
    featured: false,
  },
  {
    id: "growth",
    badge: "Estratégia Completa",
    icon: Rocket,
    title: "Quero Faturar Mais em 2026",
    description:
      "Chega de ações isoladas. Este é o pacote de guerra completo: oferta irresistível + atração qualificada + conversão sem risco + retenção lucrativa. Seu negócio operando como uma máquina de crescimento contínuo.",
    features: [
      "Diagnóstico completo do negócio",
      "Estratégia de tráfego de elite",
      "Funil de vendas automatizado",
      "Acompanhamento e otimização mensal",
      "Acesso ao time completo Clickwave",
    ],
    cta: "Começar a Dominar",
    featured: true,
  },
];

export function ServicesSection() {
  return (
    <section className="py-24 md:py-36 px-6 bg-brand-black relative z-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-orange">
            Nossos Serviços
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-6xl font-serif text-center leading-[1.1] tracking-tight mb-6"
        >
          O que você precisa?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-white/50 font-mono text-xs md:text-sm max-w-xl mx-auto mb-16 md:mb-24"
        >
          Escolha o caminho que faz mais sentido para o momento do seu negócio.
        </motion.p>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className={`group relative backdrop-blur-xl rounded-2xl p-8 md:p-10 transition-all duration-500 overflow-hidden flex flex-col ${
                service.featured
                  ? "bg-gradient-to-b from-brand-orange/10 to-white/[0.02] border-2 border-brand-orange/40 hover:border-brand-orange/60 lg:scale-105"
                  : "bg-white/[0.03] border border-white/[0.08] hover:border-brand-orange/30"
              }`}
            >
              {/* Featured badge */}
              {service.featured && (
                <div className="absolute top-0 right-0 bg-brand-orange text-white text-[9px] font-mono uppercase tracking-wider px-4 py-1.5 rounded-bl-xl">
                  Recomendado
                </div>
              )}

              {/* Hover glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-brand-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl ${
                  service.featured ? "from-brand-orange/20" : ""
                }`}
              />

              <div className="relative z-10 flex flex-col flex-1">
                {/* Badge + Icon */}
                <div className="flex items-center justify-between mb-6">
                  <span
                    className={`text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                      service.featured
                        ? "border-brand-orange/50 text-brand-orange bg-brand-orange/10"
                        : "border-white/10 text-white/40"
                    }`}
                  >
                    {service.badge}
                  </span>
                  <service.icon
                    className={`w-6 h-6 transition-colors duration-300 ${
                      service.featured
                        ? "text-brand-orange"
                        : "text-brand-orange/50 group-hover:text-brand-orange"
                    }`}
                  />
                </div>

                {/* Title */}
                <h3
                  className={`text-xl md:text-2xl font-serif mb-4 transition-colors duration-300 ${
                    service.featured ? "text-white" : "group-hover:text-brand-orange/90"
                  }`}
                >
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/50 leading-relaxed font-light mb-8">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-10 flex-1">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          service.featured ? "text-brand-orange" : "text-brand-orange/50"
                        }`}
                      />
                      <span className="text-xs text-white/60 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 rounded-full font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                    service.featured
                      ? "bg-brand-orange text-white hover:bg-orange-600 shadow-[0_0_30px_rgba(255,87,34,0.3)]"
                      : "bg-white/5 text-white/80 border border-white/10 hover:bg-brand-orange hover:border-brand-orange hover:text-white"
                  }`}
                >
                  {service.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
