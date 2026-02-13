
import React from 'react';
import { motion } from 'framer-motion';

const FloatingIslands: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Mystical Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20" />
      
      {/* Animated Glowing Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.5, 0.2],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"
      />

      {/* Floating Elements (representing islands) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: Math.random() * 1000, x: Math.random() * 1500, opacity: 0 }}
          animate={{
            y: [null, Math.random() * -20 - 10, Math.random() * 20 + 10],
            opacity: [0, 0.4, 0.2],
          }}
          transition={{
            y: { duration: 5 + Math.random() * 5, repeat: Infinity, repeatType: "mirror" },
            opacity: { duration: 2 }
          }}
          className="absolute w-32 h-20 bg-gradient-to-b from-gray-800 to-transparent rounded-full blur-xl border border-white/5"
          style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
        />
      ))}
    </div>
  );
};

export default FloatingIslands;
