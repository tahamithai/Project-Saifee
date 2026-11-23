'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProjectSaifeeM1() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  // Core Data States
  const [heads, setHeads] = useState([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);

  // Add Bank Account Form
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('bank');
  const [newBankName, setNewBankName] = useState('');
  const [newOpeningBal, setNewOpeningBal] = useState('0');

  // Cipher Helper States
  const [vendorInitials, setVendorInitials] = useState('MJ');
  const [costRate, setCostRate] = useState('1750');
  const [selectedCatCode, setSelectedCatCode] = useState('S');
  const [designSeq, setDesignSeq] = useState('A');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAllData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadAllData(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadAllData(userId) {
    setLoading(true);
    const [profRes, headsRes, branchRes, accRes, catRes, setRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('transaction_heads').select('*').eq('is_active', true),
      supabase.from('branches').select('*').eq('is_active', true),
      supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
      supabase.from('product_categories').select('*').eq('is_active', true),
      supabase.from('app_settings').select('*').limit(1).single(),
    ]);

    if (profRes.data) setProfile(profRes.data);
    if (headsRes.data?.length) {
      setHeads(headsRes.data);
      setSelectedHead(headsRes.data[0].id);
    }
    if (branchRes.data?.length) {
      setBranches(branchRes.data);
      setSelectedBranch(branchRes.data[0].id);
    }
    if (accRes.data) setAccounts(accRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (setRes.data) setSettings(setRes.data);
    setLoading(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  }

  async function handleAddAccount(e) {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const bal = parseFloat(newOpeningBal) || 0;
    const { error } = await supabase.from('accounts').insert({
      name: newAccName.trim(),
      account_type: newAccType,
      bank_name: newAccType === 'bank' ? newBankName.trim() : null,
      opening_balance: bal,
      current_balance: bal,
    });
    if (!error) {
      setNewAccName('');
      setNewBankName('');
      setNewOpeningBal('0');
      const { data } = await supabase.from('accounts').select('*').eq('is_active', true).order('created_at');
      if (data) setAccounts(data);
    } else {
      alert('Error adding account: ' + error.message);
    }
  }

  // Live Saifee Cipher Calculator (Strips trailing zeros, A=1..I=9, J=0)
  function generateSaifeeCode() {
    const map = settings?.cipher_map || { '1':'A','2':'B','3':'C','4':'D','5':'E','6':'F','7':'G','8':'H','9':'I','0':'J' };
    let numStr = String(costRate || '').replace(/[^0-9]/g, '');
    if (settings?.strip_trailing_zeros !== false) {
      numStr = numStr.replace(/0+$/, '');
    }
    const cipherPart = numStr.split('').map(d => map[d] || '').join('');
    return `${vendorInitials.toUpperCase()}${cipherPart}${selectedCatCode.toUpperCase()}${designSeq.toUpperCase()}`;
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', fontSize: 18 }}>Loading Project Saifee...</div>;
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: 380 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>Project Saifee</h1>
          <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>One Entry. Complete Business.</p>
          {authError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{authError}</div>}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="taha@saifeejewelry.com" />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '14px 0 4px' }}>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
          <button type="submit" style={{ ...btnPrimary, width: '100%', marginTop: 20 }}>Sign In to ERP</button>
        </form>
      </div>
    );
  }

  // MAIN MILESTONE 1 WORKSPACE
  const isOwnerOrPartner = profile?.role === 'owner' || profile?.role === 'partner';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px' }}>
      {/* TOP BAR */}
      <header style={{ background: '#0f172a', color: '#fff', padding: '14px 18px', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Project Saifee <span style={{ fontSize: 11, background: '#1e293b', padding: '2px 8px', borderRadius: 99, color: '#38bdf8' }}>M1 Core</span></div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {profile?.full_name || session.user.email} • Role: <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{profile?.role || 'Unlinked'}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select value={selectedHead} onChange={e => setSelectedHead(e.target.value)} style={topSelectStyle} title="Transaction Head">
            {heads.map(h => <option key={h.id} value={h.id}>Head: {h.name}</option>)}
          </select>
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={topSelectStyle} title="Branch">
            {branches.map(b => <option key={b.id} value={b.id}>Branch: {b.name}</option>)}
          </select>
          <button onClick={() => supabase.auth.signOut()} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Logout
          </button>
        </div>
      </header>

      {/* GRID: CIPHER HELPER + ACCOUNTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        
        {/* CARD 1: SAIFEE CIPHER PRODUCT CODE GENERATOR */}
        <section style={cardStyle}>
          <h2 style={h2Style}>Product Code & Cipher Helper</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>
            Rule: <strong>A=1 ... I=9, J=0</strong> (Trailing zeros stripped automatically).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Vendor Initials</label>
              <input value={vendorInitials} onChange={e => setVendorInitials(e.target.value)} style={inputStyle} maxLength={4} />
            </div>
            <div>
              <label style={labelStyle}>Rate / Cost (PKR)</label>
              <input type="number" value={costRate} onChange={e => setCostRate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category Code</label>
              <select value={selectedCatCode} onChange={e => setSelectedCatCode(e.target.value)} style={inputStyle}>
                {categories.map(c => <option key={c.id} value={c.short_code}>{c.name} ({c.short_code})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Design Sequence</label>
              <input value={designSeq} onChange={e => setDesignSeq(e.target.value)} style={inputStyle} maxLength={2} />
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 14, background: '#f1f5f9', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#475569' }}>Generated Product Code</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1.5, color: '#0f172a', marginTop: 4 }}>
              {generateSaifeeCode()}
            </div>
          </div>
        </section>

        {/* CARD 2: CASH & BANK ACCOUNTS MANAGER */}
        <section style={cardStyle}>
          <h2 style={h2Style}>Cash & Bank Accounts</h2>
          <div style={{ marginBottom: 16 }}>
            {accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: 14 }}>
                <div>
                  <strong>{acc.name}</strong>
                  <span style={{ marginLeft: 8, fontSize: 11, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{acc.account_type}</span>
                </div>
                <div style={{ fontWeight: 600 }}>PKR {Number(acc.current_balance).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {isOwnerOrPartner ? (
            <form onSubmit={handleAddAccount} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>+ Add New Bank / Cash Account</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="Account Name (e.g. Meezan Bank)" value={newAccName} onChange={e => setNewAccName(e.target.value)} style={inputStyle} required />
                <select value={newAccType} onChange={e => setNewAccType(e.target.value)} style={inputStyle}>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="mobile_wallet">Mobile Wallet (JazzCash/EasyPaisa)</option>
                </select>
                <input placeholder="Bank Name (Optional)" value={newBankName} onChange={e => setNewBankName(e.target.value)} style={inputStyle} />
                <input type="number" placeholder="Opening Balance (PKR)" value={newOpeningBal} onChange={e => setNewOpeningBal(e.target.value)} style={inputStyle} />
              </div>
              <button type="submit" style={{ ...btnPrimary, width: '100%', marginTop: 10 }}>Save Account</button>
            </form>
          ) : (
            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>Only Owner/Partner can add new bank accounts.</div>
          )}
        </section>

      </div>

      {/* CARD 3: SYSTEM CONFIGURATION SUMMARY */}
      <section style={{ ...cardStyle, marginTop: 20 }}>
        <h2 style={h2Style}>Active ERP Configuration (Locked Rules)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
          <div style={badgeBox}><strong>Price Rounding:</strong> Nearest PKR {settings?.price_rounding_nearest}</div>
          <div style={badgeBox}><strong>Khumus Engine:</strong> {settings?.khumus_enabled ? `${settings?.khumus_percentage}% Monthly` : 'Off'}</div>
          <div style={badgeBox}><strong>Reservation Timer:</strong> {settings?.reservation_hours_default} Hours</div>
          <div style={badgeBox}><strong>Approval Timer:</strong> {settings?.approval_hours_default} Hours</div>
          <div style={badgeBox}><strong>Dead Stock Alert:</strong> &gt; {settings?.dead_stock_days_threshold} Days</div>
          <div style={badgeBox}><strong>Negative Stock:</strong> {settings?.allow_negative_stock ? 'Allowed w/ Warning' : 'Blocked'}</div>
        </div>
      </section>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const topSelectStyle = { padding: '7px 10px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: 13 };
const btnPrimary = { background: '#0f172a', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 };
const cardStyle = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' };
const h2Style = { margin: '0 0 10px', fontSize: 17 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };
const badgeBox = { background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' };
