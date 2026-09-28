'use client';

import { HelpCircle, BookOpen, MessageCircle, FileText } from 'lucide-react';

export function Help() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <HelpCircle className="text-white" />
        <h1 className="text-2xl font-bold text-white">Help Center</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 shadow-sm hover:bg-[#111111] transition-colors cursor-pointer group">
          <BookOpen className="text-green-500 mb-4 w-8 h-8 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-medium text-white mb-2">Knowledge Base</h2>
          <p className="text-sm text-[#a1a1aa]">Browse our articles and tutorials on how to use TradeEdu platform effectively.</p>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 shadow-sm hover:bg-[#111111] transition-colors cursor-pointer group">
          <MessageCircle className="text-blue-500 mb-4 w-8 h-8 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-medium text-white mb-2">Live Support</h2>
          <p className="text-sm text-[#a1a1aa]">Chat with our support agents. Currently online and replying in under 5 minutes.</p>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 shadow-sm hover:bg-[#111111] transition-colors cursor-pointer group">
          <FileText className="text-yellow-500 mb-4 w-8 h-8 group-hover:scale-110 transition-transform" />
          <h2 className="text-lg font-medium text-white mb-2">API Documentation</h2>
          <p className="text-sm text-[#a1a1aa]">Integrate TradeEdu with your own applications using our comprehensive API.</p>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#27272a] rounded-xl p-6 text-center">
        <h3 className="text-white font-medium mb-2">Still need help?</h3>
        <p className="text-[#a1a1aa] text-sm mb-4">Send us an email and we'll get back to you within 24 hours.</p>
        <button className="px-6 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
}
