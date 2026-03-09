import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Magnet, ShieldCheck, Repeat } from 'lucide-react';

const STEPS = [
  {
    number: "01",
    icon: Zap,
    title: "A Oferta Irresistível",
    description:
      "Aumentamos tanto o valor percebido do seu produto que cobrar mais caro se torna o único caminho lógico. Sua oferta vira uma arma que o mercado não consegue ignorar.",
  },
  {
    number: "02",
    icon: Magnet,
    title: "A Atração por Permissão",
    description:
      "Chega de marketing que interrompe e irrita. Entregamos valor real para atrair apenas quem levanta a mão e aceita ouvir — leads qualificados que já querem o que você oferece.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "A Conversão Sem Risco",
    description:
      "Sistemas de vendas e garantias que tiram todo o medo dos ombros do comprador. O \"Sim\" se torna a decisão mais fácil e segura a ser tomada.",
  },
  {
    number: "04",
    icon: Repeat,
    title: "O Lucro Contínuo",
    description:
      "O trabalho não acaba na primeira venda. Fazemos seus clientes voltarem, comprarem mais e trazerem novos clientes de graça através de indicações.",
  },
];

export function ArsenalSection() {
  return (
    <section className="py-24 md:py-36 px-6 bg-brand-black relative z-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-orange">
            Metodologia
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-6xl font-serif text-center leading-[1.1] tracking-tight mb-6"
        >
          Nosso Arsenal
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-white/50 font-mono text-xs md:text-sm max-w-xl mx-auto mb-20 md:mb-28"
        >
          4 passos estratégicos para transformar qualquer empresa em uma máquina de faturamento.
        </motion.p>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="group relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 md:p-10 hover:border-brand-orange/30 transition-all duration-500 overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              <div className="relative z-10">
                {/* Top row: number + icon */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-mono text-white/20 tracking-widest">
                    PASSO {step.number}
                  </span>
                  <step.icon className="w-5 h-5 text-brand-orange/60 group-hover:text-brand-orange transition-colors duration-300" />
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-serif mb-4 group-hover:text-brand-orange/90 transition-colors duration-300">
                  {step.title}
                </h3>

                {/* Divider */}
                <div className="w-8 h-px bg-brand-orange/30 mb-5 group-hover:w-16 transition-all duration-500" />

                {/* Description */}
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
