
import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Send, FileText, Map, Github, HelpCircle, ShieldAlert } from 'lucide-react';
import { SOCIAL_LINKS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 w-full border-t border-white/5 backdrop-blur-md bg-black/40 py-8 px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Brand/Legal */}
        <div className="text-center md:text-left">
          <h2 className="font-cinzel font-bold text-lg tracking-widest text-white mb-2 uppercase">Aetheria</h2>
          <p className="text-gray-500 text-[10px] leading-tight max-w-[200px] mx-auto md:mx-0">
            Automated yield-generating ecosystem. Built for the Open Network.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <Link to="/docs" className="hover:text-cyan-400 flex items-center gap-2 transition-colors">
            Docs
          </Link>
          <Link to="/roadmap" className="hover:text-purple-400 flex items-center gap-2 transition-colors">
            Roadmap
          </Link>
          <Link to="/faq" className="hover:text-yellow-400 flex items-center gap-2 transition-colors">
            FAQ
          </Link>
          <Link to="/legal" className="hover:text-red-400 flex items-center gap-2 transition-colors">
            Legal
          </Link>
        </div>

        {/* Socials */}
        <div className="flex justify-center md:justify-end gap-4">
          <a
            href={SOCIAL_LINKS.TWITTER}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-gray-400 hover:text-cyan-400 transition-all"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href={SOCIAL_LINKS.TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-gray-400 hover:text-cyan-400 transition-all"
          >
            <Send className="w-4 h-4" />
          </a>
          <a
            href="https://github.com/aetheria-labs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-gray-400 hover:text-white transition-all"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
      <div className="text-center mt-8 text-[9px] text-gray-600 font-mono">
        &copy; 2024 AETHERIA LABS. ALL ASSETS PROTECTED BY THE VOID.
      </div>
    </footer>
  );
};

export default Footer;
