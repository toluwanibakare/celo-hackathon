import { motion } from 'framer-motion';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center relative"
    >
      {/* Ambient glow behind text */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none animate-orb-1" />

      {/* Celo badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center gap-2 mb-5"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Powered by Celo
        </span>
      </motion.div>

      {/* Main headline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.55 }}
        className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 leading-tight"
      >
        <span className="gradient-text-green">Hello there! 👋</span>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.55 }}
        className="text-xl text-muted-foreground font-medium"
      >
        I'm your{' '}
        <span className="text-emerald-400 font-semibold">AI Financial Coach</span>
        . How can I help you manage your stablecoins today?
      </motion.div>

      {/* Hint pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="flex flex-wrap gap-2 mt-5"
      >
        {['💰 Check savings', '📊 Track goals', '💸 Pay bills', '🔗 Celo wallet'].map((hint, i) => (
          <span
            key={hint}
            className="px-3 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50 hover-lift cursor-default"
            style={{ animationDelay: `${0.7 + i * 0.08}s` }}
          >
            {hint}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
