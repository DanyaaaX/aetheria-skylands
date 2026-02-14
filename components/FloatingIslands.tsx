
import React from 'react';
import { motion } from 'framer-motion';

const FloatingIslands: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020205]">
      {/* Cinematic Film Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-20 mix-blend-overlay"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />

      {/* Deep Space Gradient / Vignette */}
      <div className="absolute inset-0 bg-radial-at-c from-[#0a0a12] via-[#050505] to-[#000000] z-0" />

      {/* Aurora Borealis / Nebula Effects */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] left-[10%] w-[80vw] h-[80vw] bg-cyan-900/20 rounded-full blur-[120px] mix-blend-screen z-1 opacity-30"
      />
      <motion.div
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] -right-[10%] w-[70vw] h-[70vw] bg-purple-900/15 rounded-full blur-[150px] mix-blend-screen z-1 opacity-20"
      />
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
          y: [0, 50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-20%] left-[20%] w-[90vw] h-[50vw] bg-indigo-900/20 rounded-full blur-[100px] mix-blend-screen z-1 opacity-20"
      />

      {/* Distant Stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          initial={{ opacity: Math.random() * 0.5 + 0.2 }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
          className="absolute w-[2px] h-[2px] bg-white rounded-full"
          style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
        />
      ))}
      
      {/* Floating Mystic Islands (Subtle Atmosphere) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`island-${i}`}
          initial={{ y: Math.random() * 1000, x: Math.random() * 1500, opacity: 0 }}
          animate={{
            y: [null, Math.random() * -30 - 10, Math.random() * 30 + 10],
            opacity: [0, 0.2, 0.1],
          }}
          transition={{
            y: { duration: 10 + Math.random() * 10, repeat: Infinity, repeatType: "mirror" },
            opacity: { duration: 4, repeat: Infinity, repeatType: "mirror" }
          }}
          className="absolute w-48 h-12 bg-gradient-to-b from-white/5 to-transparent rounded-[100%] blur-3xl"
          style={{ top: `${Math.random() * 90}%`, left: `${Math.random() * 90}%` }}
        />
      ))}
    </div>
  );
};

export default FloatingIslands;