'use client';

import React, { useState, useEffect, useCallback } from 'react';

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
  status: string;
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

const TEAM_COLORS: Record<string, string[]> = {
  Brazil: ['#009C3B', '#FEDF00'],
  Spain: ['#c60b1e', '#f1bf00'],
  Argentina: ['#74acdf', '#ffffff'],
  France: ['#002395', '#ED2939'],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── QR Code SVG (visual mock) ────────────────────────────────────────────────

function QRCodeDisplay({ payload, animated }: { payload: string; animated?: boolean }) {
  const size = 120;
  const cells = 10;
  const cellSize = size / cells;

  // Deterministic pattern from payload
  const pattern: boolean[][] = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      const idx = (r * cells + c) % payload.length;
      return payload.charCodeAt(idx) % 2 === 0;
    })
  );

  // Corner finder patterns
  const isFinderPattern = (r: number, c: number) =>
    (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="white" rx="4" />
        {pattern.map((row, r) =>
          row.map((filled, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={filled || isFinderPattern(r, c) ? '#0a0a1a' : 'transparent'}
            />
          ))
        )}
      </svg>
      {animated && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 4,
          background: 'linear-gradient(135deg, transparent 40%, rgba(249,184,0,0.15) 50%, transparent 60%)',
          animation: 'qrSweep 2.5s ease-in-out infinite',
        }} />
      )}
    </div>
  );
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
  const homeColor = TEAM_COLORS[home]?.[0] ?? '#1e3a5f';
  const awayColor = TEAM_COLORS[away]?.[0] ?? '#3d1a1a';
  const homeFlag = TEAM_FLAGS[home] ?? '🏳️';
  const awayFlag = TEAM_FLAGS[away] ?? '🏳️';
  const isPast = ticket.status === 'Used';
  const statusColor = { Active: '#00d084', Used: '#888', Cancelled: '#e74c3c', Shared: '#f39c12', Downloaded: '#3498db' }[ticket.status] ?? '#888';

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise(r => setTimeout(r, 1200));
    setDownloading(false);
  };

  const handleShare = async () => {
    setSharing(true);
    await new Promise(r => setTimeout(r, 800));
    setSharing(false);
  };

  return (
    <div
      id={`ticket-${ticket.ticketId}`}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s',
        transform: expanded ? 'scale(1.01)' : 'scale(1)',
        boxShadow: expanded
          ? '0 24px 60px rgba(249,184,0,0.25)'
          : '0 8px 32px rgba(0,0,0,0.4)',
        opacity: isPast ? 0.75 : 1,
        marginBottom: 24,
      }}
    >
      {/* Ticket top — match info */}
      <div
        style={{
          background: `linear-gradient(135deg, ${homeColor}dd, #0a0a1a 40%, ${awayColor}dd)`,
          padding: '28px 28px 20px',
          position: 'relative',
        }}
        onClick={onToggle}
      >
        {/* World Cup badge */}
        <div style={{ position: 'absolute', top: 16, right: 20, textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#f9b800', letterSpacing: 2, fontWeight: 700 }}>FIFA WORLD CUP</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>2026 USA • CAN • MEX</div>
        </div>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
          background: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: '4px 12px',
          border: `1px solid ${statusColor}44`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span style={{ color: statusColor, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{ticket.status.toUpperCase()}</span>
        </div>

        {/* Teams */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>{homeFlag}</div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginTop: 4 }}>{home}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f9b800', fontSize: 22, fontWeight: 900 }}>VS</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>MATCHDAY</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>{awayFlag}</div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginTop: 4 }}>{away}</div>
          </div>
        </div>

        {/* Date & venue */}
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
          📅 {formatDate(ticket.matchDate)}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>
          🏟️ {ticket.venueName}
        </div>
      </div>

      {/* Perforated separator */}
      <div style={{
        height: 2, background: 'repeating-linear-gradient(90deg, #1a1a2e 0, #1a1a2e 8px, transparent 8px, transparent 16px)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', left: -14, top: -12, width: 24, height: 24, borderRadius: '50%', background: '#0a0a1a' }} />
        <div style={{ position: 'absolute', right: -14, top: -12, width: 24, height: 24, borderRadius: '50%', background: '#0a0a1a' }} />
      </div>

      {/* Ticket bottom — seat info */}
      <div style={{ background: 'rgba(10,10,26,0.97)', padding: '16px 28px 20px', backdropFilter: 'blur(20px)' }} onClick={onToggle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'GATE', value: ticket.gate },
            { label: 'SECTION', value: ticket.section },
            { label: 'ROW', value: ticket.row },
            { label: 'SEAT', value: ticket.seatNumber },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
              <div style={{ color: '#f9b800', fontWeight: 800, fontSize: 16, fontFamily: 'monospace' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Barcode strip */}
        <div style={{
          height: 32, background: 'repeating-linear-gradient(90deg, #1a1a2e 0, #1a1a2e 2px, transparent 2px, transparent 4px)',
          borderRadius: 4, marginBottom: 8, opacity: 0.6,
        }} />
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 3, fontFamily: 'monospace', textAlign: 'center' }}>
          {ticket.barcodePayload}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ background: 'rgba(15,15,30,0.98)', padding: '20px 28px 24px', borderTop: '1px solid rgba(249,184,0,0.1)' }}>
          {/* QR Code */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, marginBottom: 10 }}>ENTRY QR CODE</div>
              <div
                onClick={(e) => { e.stopPropagation(); setQrVisible(!qrVisible); }}
                style={{ cursor: 'pointer', padding: 8, background: 'white', borderRadius: 8, display: 'inline-block' }}
                title="Click to animate QR"
              >
                <QRCodeDisplay payload={ticket.qrPayload} animated={qrVisible} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 6, textAlign: 'center' }}>Click to animate</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, marginBottom: 10 }}>DETAILS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🚇', text: ticket.travelShortcut },
                  { icon: '🗺️', text: ticket.navigationShortcut },
                  { icon: '☀️', text: ticket.weatherShortcut },
                  { icon: '🧾', text: ticket.paymentReceipt },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                    <span>{icon}</span>
                    <span style={{ flex: 1 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Offline token */}
          <div style={{ background: 'rgba(249,184,0,0.06)', border: '1px solid rgba(249,184,0,0.15)', borderRadius: 8, padding: '8px 14px', marginBottom: 20 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1 }}>OFFLINE TOKEN: </span>
            <span style={{ color: '#f9b800', fontSize: 11, fontFamily: 'monospace' }}>{ticket.offlineToken}</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!isPast && (
              <button
                id={`btn-validate-${ticket.ticketId}`}
                onClick={(e) => { e.stopPropagation(); onValidate(ticket); }}
                style={{ flex: 1, minWidth: 100, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #00d084, #00b36b)', color: 'white', fontWeight: 700, fontSize: 13 }}
              >
                🏟️ Simulate Entry
              </button>
            )}
            <button
              id={`btn-download-${ticket.ticketId}`}
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              disabled={downloading}
              style={{ flex: 1, minWidth: 100, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(249,184,0,0.3)', cursor: 'pointer', background: 'rgba(249,184,0,0.08)', color: '#f9b800', fontWeight: 700, fontSize: 13, opacity: downloading ? 0.6 : 1 }}
            >
              {downloading ? '⏳ Generating...' : '⬇️ Download'}
            </button>
            <button
              id={`btn-share-${ticket.ticketId}`}
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              disabled={sharing}
              style={{ flex: 1, minWidth: 100, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(100,181,246,0.3)', cursor: 'pointer', background: 'rgba(100,181,246,0.08)', color: '#64b5f6', fontWeight: 700, fontSize: 13, opacity: sharing ? 0.6 : 1 }}
            >
              {sharing ? '⏳ Sharing...' : '🔗 Share'}
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0a0a1a, #1a1a2e)', borderRadius: 24, padding: '40px 48px', textAlign: 'center', border: success ? '1px solid #00d084' : '1px solid rgba(249,184,0,0.2)', maxWidth: 400, width: '90%', boxShadow: success ? '0 0 60px rgba(0,208,132,0.3)' : '0 0 60px rgba(249,184,0,0.1)' }}>
        {!success ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 20, animation: 'spin 1s linear infinite' }}>⟳</div>
            <div style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Entry Validation</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{steps[step]}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              {steps.slice(0, 3).map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= step ? '#f9b800' : 'rgba(255,255,255,0.2)', transition: 'background 0.3s' }} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ color: '#00d084', fontSize: 22, fontWeight: 900, marginBottom: 8 }}>ADMITTED</div>
            <div style={{ color: 'white', fontSize: 16, marginBottom: 4 }}>Welcome to the match!</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>Gate: {ticket.gate}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 24 }}>Section {ticket.section} · Row {ticket.row} · Seat {ticket.seatNumber}</div>
            <div style={{ color: '#f9b800', fontSize: 13, marginBottom: 24 }}>🏆 Achievement unlocked: First Match!</div>
            <button
              id="btn-close-validation"
              onClick={onClose}
              style={{ padding: '12px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #00d084, #00b36b)', color: 'white', fontWeight: 700, fontSize: 15 }}
            >
              Continue →
            </button>
          </>
        )}
      </div>
    </div>
  );
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050510; font-family: 'Inter', sans-serif; }
        @keyframes qrSweep { 0%,100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0d1b4b22, transparent), radial-gradient(ellipse at 80% 80%, #1a0a2e22, transparent), #050510', color: 'white' }}>

        {/* Header */}
        <div style={{ padding: '32px 24px 0', maxWidth: 680, margin: '0 auto' }}>
          <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Dashboard
          </a>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg, #f9b800, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Digital Wallet
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Your FIFA World Cup 2026 tickets</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f9b800', fontSize: 22, fontWeight: 900 }}>{walletData.currency} {walletData.totalSpent.toLocaleString()}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Total invested</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, marginTop: 20 }}>
            {[
              { label: 'Upcoming', value: walletData.upcomingTickets.length, icon: '🎫', color: '#00d084' },
              { label: 'Past', value: walletData.pastTickets.length, icon: '📋', color: '#888' },
              { label: 'Downloaded', value: walletData.downloadedTickets.length, icon: '⬇️', color: '#3498db' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', backdropFilter: 'blur(20px)' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ color, fontSize: 22, fontWeight: 800 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                id={`tab-${key}`}
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                  background: activeTab === key ? 'linear-gradient(135deg, #f9b800, #ff6b35)' : 'transparent',
                  color: activeTab === key ? '#0a0a1a' : 'rgba(255,255,255,0.5)',
                }}
              >
                {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets */}
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 48px' }}>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
              <div style={{ fontSize: 16 }}>No {activeTab} tickets</div>
            </div>
          ) : (
            tickets.map((ticket, i) => (
              <div key={ticket.ticketId} style={{ animation: `fadeUp 0.4s ease ${i * 0.1}s both` }}>
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

        {/* Validation Modal */}
        <ValidationModal ticket={validateTicket} onClose={() => setValidateTicket(null)} />
      </div>
    </>
  );
}
