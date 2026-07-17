'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Share2, ShieldCheck, Map, MapPin, CloudSun, Receipt } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketEntry {
  ticketId: string;
  matchName: string;
  venueName: string;
  matchDate: string;
  gate: string;
  section: string;
  row: string;
  seatNumber: string;
  price: number;
  currency: string;
  status: 'Active' | 'Used' | 'Cancelled' | 'Shared' | 'Downloaded';
  qrPayload: string;
  barcodePayload: string;
  offlineToken: string;
  homeTeam?: string;
  awayTeam?: string;
  travelShortcut: string;
  navigationShortcut: string;
  weatherShortcut: string;
  paymentReceipt: string;
}

interface WalletData {
  upcomingTickets: TicketEntry[];
  pastTickets: TicketEntry[];
  downloadedTickets: TicketEntry[];
  totalSpent: number;
  currency: string;
}

type TicketTab = 'upcoming' | 'past' | 'downloaded';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEAM_FLAGS: Record<string, string> = {
  Brazil: '🇧🇷', Spain: '🇪🇸', Argentina: '🇦🇷', France: '🇫🇷',
  Germany: '🇩🇪', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Portugal: '🇵🇹', Netherlands: '🇳🇱',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function getMockWallet(): WalletData {
  const base: Omit<TicketEntry, 'status' | 'ticketId'> = {
    matchName: 'Brazil vs Spain',
    venueName: 'Lusail Iconic Stadium',
    matchDate: new Date(Date.now() + 86400000 * 12).toISOString(),
    gate: 'Gate C',
    section: 'C',
    row: '12',
    seatNumber: '14',
    price: 350,
    currency: 'USD',
    qrPayload: 'eyJ0aWNrZXRJZCI6IlRLVC0xNzIwODY5NjAwMDAwLWFiY2RlZiJ9',
    barcodePayload: '1234567890123456',
    offlineToken: 'OFT-ABCDEF1234567890ABCDEFGH12',
    travelShortcut: 'AI Travel Plan → Lusail Iconic Stadium',
    navigationShortcut: 'Navigate: Gate C, Section C Block',
    weatherShortcut: 'Today at Lusail: ☀️ 29°C, Clear',
    paymentReceipt: 'Receipt #MOCK-TXN-DEMO — USD 350.00',
  };

  const pastBase: Omit<TicketEntry, 'status' | 'ticketId'> = {
    matchName: 'Argentina vs France — Final',
    venueName: 'MetLife Stadium',
    matchDate: new Date(Date.now() - 86400000 * 14).toISOString(),
    gate: 'Gate A',
    section: 'A',
    row: '5',
    seatNumber: '22',
    price: 950,
    currency: 'USD',
    qrPayload: 'eyJ0aWNrZXRJZCI6IlRLVC0xNzIwMDAwMDAwMDAwLXh5enduIn0=',
    barcodePayload: '9876543210987654',
    offlineToken: 'OFT-XYZWVU9876543210XYZWVU9876',
    travelShortcut: 'AI Travel Plan → MetLife Stadium',
    navigationShortcut: 'Navigate: Gate A, Section A Block',
    weatherShortcut: 'Match day: ⛅ 24°C, Partly cloudy',
    paymentReceipt: 'Receipt #MOCK-TXN-FINAL — USD 950.00',
  };

  return {
    upcomingTickets: [{ ...base, ticketId: 'TKT-DEMO-001', status: 'Active' }],
    pastTickets: [{ ...pastBase, ticketId: 'TKT-DEMO-002', status: 'Used' }],
    downloadedTickets: [],
    totalSpent: 1300,
    currency: 'USD',
  };
}

// ─── Digital Ticket Card ──────────────────────────────────────────────────────

function DigitalTicket({ ticket, expanded, onToggle, onValidate }: {
  ticket: TicketEntry;
  expanded: boolean;
  onToggle: () => void;
  onValidate: (t: TicketEntry) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const parts = ticket.matchName.split(' vs ');
  const home = parts[0]?.trim() ?? 'Home';
  const away = parts[1]?.trim().split('—')[0]?.trim() ?? 'Away';
  const homeFlag = TEAM_FLAGS[home] ?? '🏳️';
  const awayFlag = TEAM_FLAGS[away] ?? '🏳️';
  const isPast = ticket.status === 'Used';

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    await new Promise(r => setTimeout(r, 1200));
    setDownloading(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSharing(true);
    await new Promise(r => setTimeout(r, 800));
    setSharing(false);
  };

  return (
    <div 
      className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 ease-out mb-8 glass-card
        ${expanded ? 'scale-[1.02] shadow-[0_20px_50px_rgba(217,119,6,0.15)] border-primary/40' : 'scale-100'} 
        ${isPast ? 'opacity-75 grayscale-[0.3]' : ''}`}
    >
      <div 
        className="p-6 relative bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md"
        onClick={onToggle}
      >
        <div className="absolute top-4 right-6 text-right">
          <div className="text-[10px] text-primary font-bold tracking-[0.2em]">FIFA WORLD CUP</div>
          <div className="text-[10px] text-white/50 tracking-widest">2026 USA • CAN • MEX</div>
        </div>

        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-black/40 border border-primary/30">
          <div className={`w-2 h-2 rounded-full ${ticket.status === 'Active' ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">{ticket.status}</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="text-center">
            <div className="text-5xl drop-shadow-lg">{homeFlag}</div>
            <div className="text-white font-bold text-sm mt-3">{home}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">VS</div>
            <div className="text-[10px] text-white/40 mt-2 tracking-widest">MATCHDAY</div>
          </div>
          <div className="text-center">
            <div className="text-5xl drop-shadow-lg">{awayFlag}</div>
            <div className="text-white font-bold text-sm mt-3">{away}</div>
          </div>
        </div>

        <div className="text-white/80 text-sm font-medium">
          <span className="mr-2">📅</span> {formatDate(ticket.matchDate)}
        </div>
        <div className="text-white/80 text-sm font-medium mt-2">
          <span className="mr-2">🏟️</span> {ticket.venueName}
        </div>
      </div>

      <div className="relative h-2 bg-transparent">
        <div className="absolute inset-0 border-t-2 border-dashed border-white/20"></div>
        <div className="absolute -left-3 top-[-11px] w-6 h-6 rounded-full bg-background shadow-inner"></div>
        <div className="absolute -right-3 top-[-11px] w-6 h-6 rounded-full bg-background shadow-inner"></div>
      </div>

      <div className="p-6 bg-black/40 backdrop-blur-md" onClick={onToggle}>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'GATE', value: ticket.gate },
            { label: 'SECTION', value: ticket.section },
            { label: 'ROW', value: ticket.row },
            { label: 'SEAT', value: ticket.seatNumber },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] text-white/40 tracking-widest mb-1">{label}</div>
              <div className="text-primary font-mono font-bold text-lg">{value}</div>
            </div>
          ))}
        </div>
        
        <div className="h-8 rounded overflow-hidden opacity-50 flex flex-col justify-center gap-[2px]">
          {/* Simulated Barcode */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className={`bg-white h-full inline-block ${i % 2 === 0 ? 'w-1' : (i % 3 === 0 ? 'w-2' : 'w-[2px]')}`} style={{ marginRight: i%2===0?'2px':'1px' }}></div>
          ))}
        </div>
        <div className="text-center text-[10px] text-white/30 tracking-[0.3em] font-mono mt-2">
          {ticket.barcodePayload}
        </div>
      </div>

      {expanded && (
        <div className="p-6 bg-black/60 border-t border-primary/20 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl cursor-pointer hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); setQrVisible(!qrVisible); }}>
               <div className="w-32 h-32 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FIFA-TICKET')] bg-cover relative">
                 {qrVisible && <div className="absolute inset-0 bg-primary/20 animate-pulse rounded"></div>}
               </div>
               <span className="text-[10px] text-black/50 font-bold uppercase tracking-widest mt-4">Entry QR</span>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="text-[10px] text-white/50 tracking-widest uppercase mb-2">Connected Services</div>
              {[
                { icon: Map, text: ticket.travelShortcut },
                { icon: MapPin, text: ticket.navigationShortcut },
                { icon: CloudSun, text: ticket.weatherShortcut },
                { icon: Receipt, text: ticket.paymentReceipt },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="truncate">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex justify-between items-center mb-6">
            <span className="text-xs text-white/50 uppercase tracking-widest">Offline Token</span>
            <span className="text-xs text-primary font-mono font-bold">{ticket.offlineToken}</span>
          </div>

          <div className="flex gap-4">
            {!isPast && (
              <button 
                onClick={(e) => { e.stopPropagation(); onValidate(ticket); }}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Simulate Entry
              </button>
            )}
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 py-3 rounded-xl glass-panel text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Save PDF'}
            </button>
            <button 
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 py-3 rounded-xl glass-panel text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Entry Validation Modal ────────────────────────────────────────────────────

function ValidationModal({ ticket, onClose }: { ticket: TicketEntry | null; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ['Scanning QR Code...', 'Validating Signature...', 'Verifying Ticket...', ''];

  useEffect(() => {
    if (!ticket) return;
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [ticket]);

  if (!ticket) return null;
  const success = step === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`glass-card p-10 w-full max-w-sm rounded-3xl text-center border-2 transition-colors duration-500 ${success ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-primary/30'}`}>
        {!success ? (
          <div className="animate-fade-in-up">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-white mb-2">Entry Validation</h3>
            <p className="text-white/60 text-sm mb-8">{steps[step]}</p>
            <div className="flex justify-center gap-2">
              {steps.slice(0, 3).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-emerald-400 mb-2 tracking-wide uppercase">Admitted</h3>
            <p className="text-white text-lg mb-6">Welcome to the match!</p>
            <div className="bg-black/40 rounded-xl p-4 mb-8 text-left">
              <div className="text-white/60 text-xs uppercase tracking-widest mb-1">Location</div>
              <div className="text-white font-mono text-sm">Gate {ticket.gate} • Sec {ticket.section} • Row {ticket.row} • Seat {ticket.seatNumber}</div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Continue to Match Day Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<TicketTab>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [validateTicket, setValidateTicket] = useState<TicketEntry | null>(null);
  const [walletData] = useState<WalletData>(getMockWallet);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const tickets: TicketEntry[] = activeTab === 'upcoming'
    ? walletData.upcomingTickets
    : activeTab === 'past'
    ? walletData.pastTickets
    : walletData.downloadedTickets;

  const tabs: { key: TicketTab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: walletData.upcomingTickets.length },
    { key: 'past', label: 'Past', count: walletData.pastTickets.length },
    { key: 'downloaded', label: 'Downloaded', count: walletData.downloadedTickets.length },
  ];

  return (
    <main className="min-h-screen bg-background relative pb-24">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent mb-2">
              Digital Wallet
            </h1>
            <p className="text-white/60 text-sm">Your connected tournament passes</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{walletData.currency} {walletData.totalSpent.toLocaleString()}</div>
            <div className="text-xs text-primary uppercase tracking-widest">Total Value</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Upcoming', count: walletData.upcomingTickets.length, icon: '🎟️', color: 'text-primary' },
            { label: 'Past', count: walletData.pastTickets.length, icon: '📋', color: 'text-white/40' },
            { label: 'Downloads', count: walletData.downloadedTickets.length, icon: '⬇️', color: 'text-sky-400' }
          ].map((stat, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.count}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-8 backdrop-blur-sm">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                activeTab === key 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {label} {count > 0 && <span className="opacity-70 font-normal ml-1">({count})</span>}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {tickets.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl">
              <div className="text-6xl mb-4 opacity-50">🎫</div>
              <div className="text-white/60 font-medium">No {activeTab} tickets found</div>
            </div>
          ) : (
            tickets.map((ticket, i) => (
              <div key={ticket.ticketId} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <DigitalTicket
                  ticket={ticket}
                  expanded={expandedId === ticket.ticketId}
                  onToggle={() => toggleExpand(ticket.ticketId)}
                  onValidate={setValidateTicket}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <ValidationModal ticket={validateTicket} onClose={() => setValidateTicket(null)} />
    </main>
  );
}
