import { motion } from 'framer-motion';

export default function Modal({ title, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-1000"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <motion.div
        className="glass-surface bg-surface text-fg rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-border">
          <h3 className="text-primary font-semibold text-lg m-0">{title}</h3>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg bg-none border-none text-lg cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors">
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
