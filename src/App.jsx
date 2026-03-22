import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

/* ═══════════════════════════════════════════════════════════════
   THEME & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const C = {
  navy: '#0F1A2E', darkNavy: '#0A1220', blue: '#2D7FF9', blueLight: '#E8F0FE',
  orange: '#FF6B35', orangeLight: '#FFF3ED', green: '#22C55E', greenLight: '#ECFDF5',
  red: '#EF4444', redLight: '#FEF2F2', yellow: '#F59E0B', yellowLight: '#FFFBEB',
  g50: '#F9FAFB', g100: '#F3F4F6', g200: '#E5E7EB', g300: '#D1D5DB',
  g400: '#9CA3AF', g500: '#6B7280', g600: '#4B5563', g700: '#374151',
  g800: '#1F2937', g900: '#111827', white: '#FFFFFF',
}

const STATUS = {
  draft:             { label: 'Draft',             color: C.g500,   bg: C.g100 },
  pending_review:    { label: 'Pending Review',    color: C.yellow, bg: C.yellowLight },
  changes_requested: { label: 'Changes Requested', color: C.orange, bg: C.orangeLight },
  approved:          { label: 'Approved',          color: C.green,  bg: C.greenLight },
  scheduled:         { label: 'Scheduled',         color: C.blue,   bg: C.blueLight },
  posted:            { label: 'Posted',            color: C.navy,   bg: C.g200 },
}

const PLATFORMS = ['LinkedIn', 'Twitter', 'Instagram', 'Facebook']
const CONTENT_TYPES = ['Text', 'Carousel', 'Image', 'Video', 'Poll', 'Article']

/* ═══════════════════════════════════════════════════════════════
   REUSABLE UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: ${C.g50}; color: ${C.g900}; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: ${C.g300}; border-radius: 3px; }
  input:focus, textarea:focus, select:focus { outline: none; border-color: ${C.blue} !important; box-shadow: 0 0 0 3px rgba(45,127,249,0.1); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease-out; }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .slide-in { animation: slideIn 0.3s ease-out; }
`

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.draft
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  )
}

const Btn = ({ children, v = 'primary', sz = 'md', onClick, style = {}, disabled }) => {
  const base = { border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, borderRadius: 8, transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.5 : 1, fontFamily: 'inherit' }
  const sizes = { sm: { padding: '6px 14px', fontSize: 13 }, md: { padding: '10px 20px', fontSize: 14 }, lg: { padding: '14px 28px', fontSize: 15 } }
  const vars = {
    primary: { background: C.blue, color: C.white },
    secondary: { background: C.g100, color: C.g700 },
    danger: { background: C.red, color: C.white },
    ghost: { background: 'transparent', color: C.g600 },
    success: { background: C.green, color: C.white },
    orange: { background: C.orange, color: C.white },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[sz], ...vars[v], ...style }}>{children}</button>
}

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.g200}`, padding: 24, cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</div>
)

const Field = ({ label, value, onChange, type = 'text', placeholder = '', textarea, rows = 4, style = {} }) => {
  const iStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 14, fontFamily: 'inherit', background: C.white, ...style }
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: C.g700 }}>{label}</label>}
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...iStyle, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={iStyle} />}
    </div>
  )
}

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: C.g700 }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 14, fontFamily: 'inherit', background: C.white, cursor: 'pointer' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const KPI = ({ label, value, change, icon }) => (
  <Card style={{ textAlign: 'center', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: -1 }}>{value}</div>
    <div style={{ fontSize: 12, color: C.g500, marginTop: 2 }}>{label}</div>
    {change != null && <div style={{ fontSize: 12, fontWeight: 600, color: change >= 0 ? C.green : C.red, marginTop: 4 }}>{change >= 0 ? '+' : ''}{change}%</div>}
  </Card>
)

const Avatar = ({ initials, size = 36, color = C.blue }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
)

const EmptyState = ({ icon, title, sub }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: C.g400 }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: C.g600, marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 14 }}>{sub}</div>
  </div>
)

const Modal = ({ open, onClose, title, children, width = 560 }) => {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div className="fade-in" style={{ position: 'relative', background: C.white, borderRadius: 16, width, maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.g400, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${C.g200}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

/* ═══════════════════════════════════════════════════════════════
   AUTH HOOK
   ═══════════════════════════════════════════════════════════════ */

function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s) fetchProfile(s.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) fetchProfile(s.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, meta = {}) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: meta } })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  return { session, profile, loading, signIn, signUp, signOut, refreshProfile: () => session && fetchProfile(session.user.id) }
}

/* ═══════════════════════════════════════════════════════════════
   DATA HOOKS
   ═══════════════════════════════════════════════════════════════ */

function usePosts(clientId = null) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('posts').select('*, profiles!posts_client_id_fkey(full_name, company, avatar_initials)').order('scheduled_date', { ascending: true, nullsFirst: false })
    if (clientId) q = q.eq('client_id', clientId)
    const { data } = await q
    setPosts(data || [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])
  return { posts, loading, refresh: fetch }
}

function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('role', 'client').order('full_name')
    setClients(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { clients, loading, refresh: fetch }
}

function useComments(postId) {
  const [comments, setComments] = useState([])

  const fetch = useCallback(async () => {
    if (!postId) return
    const { data } = await supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at')
    setComments(data || [])
  }, [postId])

  useEffect(() => { fetch() }, [fetch])
  return { comments, refresh: fetch }
}

function useReportData(clientId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const { data: d } = await supabase.from('report_data').select('*').eq('client_id', clientId).order('week_start', { ascending: true })
    setData(d || [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refresh: fetch }
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════ */

function LoginPage({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [fullName, setFullName] = useState('')
  const [signUpRole, setSignUpRole] = useState('client')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    if (isReset) {
      const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })
      if (e) setError(e.message)
      else setError('Password reset link sent! Check your email.')
      setLoading(false)
      return
    }
    if (isSignUp) {
      const { error: e } = await onAuth.signUp(email, password, { full_name: fullName, role: signUpRole })
      if (e) setError(e.message)
      else setError('Check your email to confirm your account.')
    } else {
      const { error: e } = await onAuth.signIn(email, password)
      if (e) setError(e.message)
    }
    setLoading(false)
  }

  const successMsg = error && (error.includes('Check your email') || error.includes('reset link sent'))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.navy} 0%, #1a2744 50%, ${C.darkNavy} 100%)` }}>
      <div style={{ width: 420, maxWidth: '90vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: C.white, letterSpacing: -2 }}>DPT</div>
          <div style={{ fontSize: 13, color: C.g400, letterSpacing: 5, textTransform: 'uppercase', marginTop: 4 }}>Content Hub</div>
        </div>
        <Card style={{ padding: 36 }}>
          <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 700, color: C.navy }}>
            {isReset ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: successMsg ? C.greenLight : C.redLight, color: successMsg ? C.green : C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {isSignUp && !isReset && <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Jane Smith" />}
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
          {!isReset && <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />}
          {isSignUp && !isReset && (
            <Sel label="Account Type" value={signUpRole} onChange={setSignUpRole} options={[
              { value: 'client', label: 'Client' },
              { value: 'admin', label: 'DPT Admin' },
            ]} />
          )}
          <Btn onClick={handleSubmit} disabled={loading || !email} style={{ width: '100%', marginTop: 8 }} sz="lg">
            {loading ? 'Please wait...' : isReset ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
          </Btn>
          <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isReset && (
              <button onClick={() => { setIsReset(true); setError('') }} style={{ background: 'none', border: 'none', color: C.g400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Forgot password?
              </button>
            )}
            <button onClick={() => { setIsSignUp(!isSignUp); setIsReset(false); setError('') }} style={{ background: 'none', border: 'none', color: C.blue, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              {isSignUp || isReset ? 'Back to sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR NAVIGATION
   ═══════════════════════════════════════════════════════════════ */

function Sidebar({ profile, view, setView, onLogout, unreadCount = 0 }) {
  const isAdmin = profile?.role === 'admin'
  const items = isAdmin
    ? [{ id: 'dashboard', label: 'Dashboard', icon: '◉' }, { id: 'create', label: 'Create Content', icon: '⚡' }, { id: 'content', label: 'Content', icon: '✎' }, { id: 'clients', label: 'Clients', icon: '◎' }, { id: 'reports', label: 'Reports', icon: '▤' }, { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount }]
    : [{ id: 'my_dashboard', label: 'Dashboard', icon: '◉' }, { id: 'my_content', label: 'My Content', icon: '✎' }, { id: 'my_reports', label: 'My Reports', icon: '▤' }, { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount }]

  return (
    <div style={{ width: 220, minHeight: '100vh', background: C.navy, padding: '20px 0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: C.white, letterSpacing: -1 }}>DPT</div>
        <div style={{ fontSize: 10, color: C.g400, letterSpacing: 3, textTransform: 'uppercase' }}>Content Hub</div>
      </div>
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {items.map(it => (
          <div key={it.id} onClick={() => setView(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 8,
            cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s',
            background: view === it.id ? 'rgba(45,127,249,0.15)' : 'transparent',
            color: view === it.id ? C.white : 'rgba(255,255,255,0.55)',
          }}>
            <span style={{ fontSize: 16 }}>{it.icon}</span>
            <span style={{ fontSize: 14, fontWeight: view === it.id ? 600 : 400, flex: 1 }}>{it.label}</span>
            {it.badge > 0 && (
              <span style={{ background: C.red, color: C.white, fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 7px', minWidth: 20, textAlign: 'center' }}>{it.badge}</span>
            )}
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar initials={profile?.avatar_initials || profile?.full_name?.split(' ').map(w => w[0]).join('') || '?'} size={32} color={isAdmin ? C.orange : C.blue} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white, lineHeight: 1.2 }}>{profile?.full_name}</div>
            <div style={{ fontSize: 11, color: C.g400 }}>{isAdmin ? 'Admin' : profile?.company || 'Client'}</div>
          </div>
        </div>
        <Btn v="ghost" sz="sm" onClick={onLogout} style={{ color: 'rgba(255,255,255,0.4)', width: '100%', justifyContent: 'flex-start', padding: '6px 0' }}>Sign Out</Btn>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE HEADER
   ═══════════════════════════════════════════════════════════════ */

const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, letterSpacing: -0.5 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: C.g500, marginTop: 4 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
)

/* ═══════════════════════════════════════════════════════════════
   ADMIN: DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

function AdminDashboard({ profile }) {
  const { posts, loading: postsLoading } = usePosts()
  const { clients, loading: clientsLoading } = useClients()

  if (postsLoading || clientsLoading) return <Loader />

  const byStatus = {}
  Object.keys(STATUS).forEach(k => byStatus[k] = posts.filter(p => p.status === k).length)
  const pending = byStatus.pending_review + byStatus.changes_requested
  const upcoming = posts.filter(p => p.scheduled_date && new Date(p.scheduled_date) >= new Date()).length

  return (
    <div className="fade-in">
      <PageHeader title="Dashboard" subtitle={`Welcome back. ${posts.length} posts across ${clients.length} clients.`} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <KPI icon="✎" label="Total Posts" value={posts.length} />
        <KPI icon="◎" label="Active Clients" value={clients.length} />
        <KPI icon="⏳" label="Awaiting Action" value={pending} />
        <KPI icon="📅" label="Upcoming" value={upcoming} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Status Breakdown</h3>
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.g600, flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{byStatus[key]}</span>
              <div style={{ width: 80 }}>
                <div style={{ height: 5, borderRadius: 3, background: C.g100, overflow: 'hidden' }}>
                  <div style={{ width: `${posts.length ? (byStatus[key] / posts.length) * 100 : 0}%`, height: '100%', background: s.color, borderRadius: 3 }} />
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Posts by Client</h3>
          {clients.map(c => {
            const count = posts.filter(p => p.client_id === c.id).length
            const pendingCount = posts.filter(p => p.client_id === c.id && (p.status === 'pending_review' || p.status === 'changes_requested')).length
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar initials={c.avatar_initials || c.full_name?.split(' ').map(w => w[0]).join('')} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.g800 }}>{c.full_name}</div>
                  <div style={{ fontSize: 12, color: C.g400 }}>{c.company}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{count} posts</div>
                  {pendingCount > 0 && <div style={{ fontSize: 11, color: C.orange }}>{pendingCount} pending</div>}
                </div>
              </div>
            )
          })}
          {clients.length === 0 && <div style={{ color: C.g400, fontSize: 14, textAlign: 'center', padding: 20 }}>No clients yet</div>}
        </Card>
      </div>

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  )
}

function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      // Fetch recent comments
      const { data: comments } = await supabase.from('post_comments').select('*, posts(content, client_id, profiles!posts_client_id_fkey(full_name))').order('created_at', { ascending: false }).limit(10)
      // Fetch recent notifications (as proxy for status changes)
      const { data: notifs } = await supabase.from('notifications').select('*, posts(content, profiles!posts_client_id_fkey(full_name))').order('created_at', { ascending: false }).limit(10)

      const items = []
      ;(comments || []).forEach(c => items.push({
        id: 'c-' + c.id, type: 'comment', time: c.created_at,
        actor: c.author_name, isClient: c.is_client,
        text: c.content, clientName: c.posts?.profiles?.full_name,
        postPreview: c.posts?.content?.slice(0, 60)
      }))
      ;(notifs || []).forEach(n => items.push({
        id: 'n-' + n.id, type: n.type, time: n.created_at,
        clientName: n.posts?.profiles?.full_name,
        postPreview: n.posts?.content?.slice(0, 60)
      }))

      items.sort((a, b) => new Date(b.time) - new Date(a.time))
      setActivities(items.slice(0, 15))
      setLoading(false)
    }
    fetchActivity()
  }, [])

  const typeIcon = { comment: '💬', content_ready_for_review: '📤', content_approved: '✅', content_changes_requested: '↩️', graphic_ready_for_review: '🖼', graphic_approved: '✅', graphic_changes_requested: '↩️' }
  const typeLabel = { comment: 'commented', content_ready_for_review: 'Content sent for review', content_approved: 'Content approved', content_changes_requested: 'Changes requested', graphic_ready_for_review: 'Graphic sent for review', graphic_approved: 'Graphic approved', graphic_changes_requested: 'Graphic changes requested' }

  const timeAgo = (t) => {
    const mins = Math.floor((Date.now() - new Date(t)) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <Card style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Recent Activity</h3>
      {loading ? <Loader /> : activities.length === 0 ? <div style={{ color: C.g400, fontSize: 13, textAlign: 'center', padding: 16 }}>No recent activity</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {activities.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < activities.length - 1 ? `1px solid ${C.g100}` : 'none' }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{typeIcon[a.type] || '•'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.g700 }}>
                  {a.type === 'comment' ? (
                    <><span style={{ fontWeight: 600, color: a.isClient ? C.blue : C.navy }}>{a.actor}</span> commented{a.clientName ? ` on ${a.clientName}'s post` : ''}</>
                  ) : (
                    <>{typeLabel[a.type] || a.type}{a.clientName ? ` — ${a.clientName}` : ''}</>
                  )}
                </div>
                {a.type === 'comment' && a.text && <div style={{ fontSize: 12, color: C.g500, marginTop: 2, fontStyle: 'italic' }}>"{a.text.slice(0, 80)}{a.text.length > 80 ? '...' : ''}"</div>}
                {a.postPreview && a.type !== 'comment' && <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{a.postPreview}...</div>}
              </div>
              <span style={{ fontSize: 11, color: C.g400, flexShrink: 0, marginTop: 2 }}>{timeAgo(a.time)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POST DETAIL PANEL (shared between admin & client)
   ═══════════════════════════════════════════════════════════════ */

function PostDetail({ post, profile, onClose, onUpdate }) {
  const { comments, refresh: refreshComments } = useComments(post?.id)
  const [newComment, setNewComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showChangesFeedback, setShowChangesFeedback] = useState(false)
  const [changesFeedback, setChangesFeedback] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const isAdmin = profile?.role === 'admin'
  const isClient = profile?.role === 'client'

  if (!post) return null

  const startEditing = () => { setEditedContent(post.content); setIsEditing(true) }
  const cancelEditing = () => { setIsEditing(false); setEditedContent('') }
  const saveEditing = async () => {
    if (!editedContent.trim()) return
    setSavingEdit(true)
    await supabase.from('posts').update({ content: editedContent.trim() }).eq('id', post.id)
    setSavingEdit(false)
    setIsEditing(false)
    onUpdate()
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    await supabase.from('post_comments').insert({
      post_id: post.id,
      author_id: profile.id,
      author_name: profile.full_name,
      content: newComment.trim(),
      is_client: isClient,
    })
    setNewComment('')
    refreshComments()
  }

  const updateStatus = async (status) => {
    await supabase.from('posts').update({ status }).eq('id', post.id)
    onUpdate()
  }

  const submitChangesRequested = async () => {
    if (!changesFeedback.trim()) return
    // Add the feedback as a comment first
    await supabase.from('post_comments').insert({
      post_id: post.id,
      author_id: profile.id,
      author_name: profile.full_name,
      content: changesFeedback.trim(),
      is_client: true,
    })
    // Then update status
    await supabase.from('posts').update({ status: 'changes_requested' }).eq('id', post.id)
    setChangesFeedback('')
    setShowChangesFeedback(false)
    onUpdate()
  }

  const handleGraphicUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${post.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('graphics').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('graphics').getPublicUrl(path)
      await supabase.from('posts').update({ graphic_url: publicUrl }).eq('id', post.id)
      onUpdate()
    }
    setUploading(false)
  }

  const clientName = post.profiles?.full_name || 'Unknown'

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '100vw', background: C.white, borderLeft: `1px solid ${C.g200}`, zIndex: 900, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)' }} className="slide-in">
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.g200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Post Detail</div>
          <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{clientName} · {post.platform} · {post.content_type}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.g400 }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Badge status={post.status} />
            {post.scheduled_date && <span style={{ fontSize: 13, color: C.g500 }}>📅 {new Date(post.scheduled_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}</span>}
          </div>
          {isEditing ? (
            <div>
              <textarea value={editedContent} onChange={e => setEditedContent(e.target.value)} rows={10}
                style={{ width: '100%', padding: 14, borderRadius: 10, border: `2px solid ${C.blue}`, fontSize: 14, fontFamily: 'inherit', lineHeight: 1.7, resize: 'vertical', background: C.white }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Btn v="secondary" sz="sm" onClick={cancelEditing}>Cancel</Btn>
                <Btn v="success" sz="sm" onClick={saveEditing} disabled={savingEdit || !editedContent.trim()}>{savingEdit ? 'Saving...' : 'Save Changes'}</Btn>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: C.g800, whiteSpace: 'pre-wrap', background: C.g50, padding: 16, borderRadius: 10, border: `1px solid ${C.g200}` }}>
                {post.content}
              </div>
              {isAdmin && (
                <button onClick={startEditing} style={{ position: 'absolute', top: 8, right: 8, background: C.white, border: `1px solid ${C.g300}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: C.g600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Graphic */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.g700 }}>Graphic</div>
            {post.graphic_url && post.graphic_status && post.graphic_status !== 'none' && (
              <Badge status={post.graphic_status === 'approved' ? 'approved' : post.graphic_status === 'changes_requested' ? 'changes_requested' : 'pending_review'} />
            )}
          </div>
          {post.graphic_url ? (
            <div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.g200}`, marginBottom: 10 }}>
                <img src={post.graphic_url} alt="Post graphic" style={{ width: '100%', display: 'block' }} />
              </div>
              {/* Admin: send graphic for review / replace */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {(!post.graphic_status || post.graphic_status === 'none' || post.graphic_status === 'changes_requested') && (
                    <Btn v="orange" sz="sm" onClick={async () => {
                      await supabase.from('posts').update({ graphic_status: 'pending_review' }).eq('id', post.id)
                      await supabase.from('notifications').insert({ recipient_id: post.client_id, post_id: post.id, type: 'graphic_ready_for_review' })
                      onUpdate()
                    }}>Send Graphic for Review</Btn>
                  )}
                  <label style={{ cursor: 'pointer' }}>
                    <Btn v="secondary" sz="sm" disabled={uploading}>{uploading ? 'Uploading...' : 'Replace Graphic'}</Btn>
                    <input type="file" accept="image/*" onChange={handleGraphicUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
              {/* Client: approve/reject graphic */}
              {isClient && post.graphic_status === 'pending_review' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn v="success" sz="sm" onClick={async () => {
                    await supabase.from('posts').update({ graphic_status: 'approved' }).eq('id', post.id)
                    await supabase.from('notifications').insert({ recipient_id: post.created_by || post.client_id, post_id: post.id, type: 'graphic_approved' })
                    onUpdate()
                  }}>✓ Approve Graphic</Btn>
                  <Btn v="orange" sz="sm" onClick={() => setShowChangesFeedback('graphic')}>Request Graphic Changes</Btn>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 24, border: `2px dashed ${C.g300}`, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.g400, marginBottom: 8 }}>No graphic uploaded</div>
              {isAdmin && (
                <label style={{ cursor: 'pointer' }}>
                  <Btn v="secondary" sz="sm" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Graphic'}</Btn>
                  <input type="file" accept="image/*" onChange={handleGraphicUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Status Actions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 8 }}>Actions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isAdmin && (
              <>
                {post.status === 'draft' && <Btn v="orange" sz="sm" onClick={async () => {
                  await updateStatus('pending_review')
                  await supabase.from('notifications').insert({ recipient_id: post.client_id, post_id: post.id, type: 'content_ready_for_review' })
                }}>Send for Review</Btn>}
                {post.status === 'approved' && <Btn v="primary" sz="sm" onClick={() => updateStatus('scheduled')}>Mark Scheduled</Btn>}
                {post.status === 'scheduled' && <Btn v="success" sz="sm" onClick={() => updateStatus('posted')}>Mark Posted</Btn>}
                {post.status === 'changes_requested' && <Btn v="orange" sz="sm" onClick={async () => {
                  await updateStatus('pending_review')
                  await supabase.from('notifications').insert({ recipient_id: post.client_id, post_id: post.id, type: 'content_ready_for_review' })
                }}>Resubmit for Review</Btn>}
              </>
            )}
            {isClient && (
              <>
                {post.status === 'pending_review' && showChangesFeedback !== 'copy' && !showChangesFeedback && (
                  <>
                    <Btn v="success" sz="sm" onClick={async () => {
                      await updateStatus('approved')
                      if (post.created_by) await supabase.from('notifications').insert({ recipient_id: post.created_by, post_id: post.id, type: 'content_approved' })
                    }}>✓ Approve Copy</Btn>
                    <Btn v="orange" sz="sm" onClick={() => setShowChangesFeedback('copy')}>Request Changes</Btn>
                  </>
                )}
              </>
            )}
          </div>

          {/* Changes Requested Feedback Form (for both copy and graphic) */}
          {isClient && showChangesFeedback && (
            <div style={{ marginTop: 12, padding: 16, background: C.orangeLight, borderRadius: 10, border: `1px solid ${C.orange}33` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 8 }}>
                {showChangesFeedback === 'graphic' ? 'What changes do you need on the graphic?' : 'What changes do you need?'}
              </div>
              <textarea
                value={changesFeedback}
                onChange={e => setChangesFeedback(e.target.value)}
                placeholder={showChangesFeedback === 'graphic' ? 'Describe graphic changes — e.g. wrong colours, text too small, use different image...' : 'Describe the changes — e.g. soften the tone, change the hook, remove a specific line...'}
                rows={4}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${C.orange}55`, fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', background: C.white }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <Btn v="secondary" sz="sm" onClick={() => { setShowChangesFeedback(false); setChangesFeedback('') }}>Cancel</Btn>
                <Btn v="orange" sz="sm" onClick={async () => {
                  if (!changesFeedback.trim()) return
                  await supabase.from('post_comments').insert({ post_id: post.id, author_id: profile.id, author_name: profile.full_name, content: `[${showChangesFeedback === 'graphic' ? 'GRAPHIC' : 'COPY'} FEEDBACK] ${changesFeedback.trim()}`, is_client: true })
                  if (showChangesFeedback === 'graphic') {
                    await supabase.from('posts').update({ graphic_status: 'changes_requested' }).eq('id', post.id)
                    if (post.created_by) await supabase.from('notifications').insert({ recipient_id: post.created_by, post_id: post.id, type: 'graphic_changes_requested' })
                  } else {
                    await supabase.from('posts').update({ status: 'changes_requested' }).eq('id', post.id)
                    if (post.created_by) await supabase.from('notifications').insert({ recipient_id: post.created_by, post_id: post.id, type: 'content_changes_requested' })
                  }
                  setChangesFeedback(''); setShowChangesFeedback(false); onUpdate()
                }} disabled={!changesFeedback.trim()}>Submit Feedback</Btn>
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 12 }}>Comments ({comments.length})</div>
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: c.is_client ? C.blueLight : C.g50, border: `1px solid ${c.is_client ? 'rgba(45,127,249,0.2)' : C.g200}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.is_client ? C.blue : C.g700 }}>{c.author_name}</span>
                <span style={{ fontSize: 11, color: C.g400 }}>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 13, color: C.g600, lineHeight: 1.5 }}>{c.content}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && addComment()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
            <Btn v="primary" sz="sm" onClick={addComment} disabled={!newComment.trim()}>Send</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN: CONTENT PIPELINE
   ═══════════════════════════════════════════════════════════════ */

function AdminContent({ profile }) {
  const { clients } = useClients()
  const [filterClient, setFilterClient] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const { posts, loading, refresh } = usePosts(filterClient !== 'all' ? filterClient : null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [viewMode, setViewMode] = useState('list')

  // Quick action states
  const [datePickerPostId, setDatePickerPostId] = useState(null)
  const [datePickerAction, setDatePickerAction] = useState(null)
  const [pickedDate, setPickedDate] = useState('')

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkSelected, setBulkSelected] = useState(new Set())
  const [bulkActioning, setBulkActioning] = useState(false)

  const toggleBulkSelect = (id) => setBulkSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAll = () => setBulkSelected(new Set(filtered.map(p => p.id)))
  const deselectAll = () => setBulkSelected(new Set())

  const bulkUpdateStatus = async (newStatus) => {
    setBulkActioning(true)
    for (const id of bulkSelected) {
      await supabase.from('posts').update({ status: newStatus }).eq('id', id)
    }
    setBulkActioning(false); setBulkSelected(new Set()); refresh()
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${bulkSelected.size} posts?`)) return
    setBulkActioning(true)
    for (const id of bulkSelected) { await supabase.from('posts').delete().eq('id', id) }
    setBulkActioning(false); setBulkSelected(new Set()); refresh()
  }

  // Create form
  const [newClientId, setNewClientId] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newPlatform, setNewPlatform] = useState('LinkedIn')
  const [newType, setNewType] = useState('Text')
  const [creating, setCreating] = useState(false)

  const filtered = filterStatus === 'all' ? posts : posts.filter(p => p.status === filterStatus)

  const handleCreate = async () => {
    if (!newClientId || !newContent.trim()) return
    setCreating(true)
    await supabase.from('posts').insert({
      client_id: newClientId,
      content: newContent.trim(),
      scheduled_date: newDate || null,
      platform: newPlatform,
      content_type: newType,
      status: 'draft',
      created_by: profile.id,
    })
    setShowCreate(false)
    setNewContent('')
    setNewDate('')
    setCreating(false)
    refresh()
  }

  const handleDelete = async (postId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setSelectedPost(null)
    refresh()
  }

  // Quick status changes from the list
  const quickStatus = async (postId, newStatus, e) => {
    e.stopPropagation()
    await supabase.from('posts').update({ status: newStatus }).eq('id', postId)
    refresh()
  }

  // Schedule or mark posted with date
  const openDatePicker = (postId, action, e) => {
    e.stopPropagation()
    setDatePickerPostId(postId)
    setDatePickerAction(action)
    setPickedDate(new Date().toISOString().split('T')[0])
  }

  const confirmDateAction = async () => {
    if (!datePickerPostId || !pickedDate) return
    const updates = datePickerAction === 'schedule'
      ? { status: 'scheduled', scheduled_date: pickedDate }
      : { status: 'posted', posted_date: pickedDate }
    await supabase.from('posts').update(updates).eq('id', datePickerPostId)
    setDatePickerPostId(null)
    setPickedDate('')
    refresh()
  }

  // Quick action buttons per status
  const QuickActions = ({ post }) => {
    const s = post.status
    return (
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {s === 'draft' && <Btn v="orange" sz="sm" onClick={e => quickStatus(post.id, 'pending_review', e)}>Send for Review</Btn>}
        {s === 'approved' && <Btn v="primary" sz="sm" onClick={e => openDatePicker(post.id, 'schedule', e)}>Schedule</Btn>}
        {s === 'scheduled' && <Btn v="success" sz="sm" onClick={e => openDatePicker(post.id, 'post', e)}>Mark Posted</Btn>}
        {s === 'changes_requested' && <Btn v="orange" sz="sm" onClick={e => quickStatus(post.id, 'pending_review', e)}>Resubmit</Btn>}
        <Btn v="danger" sz="sm" onClick={e => handleDelete(post.id, e)}>✕</Btn>
      </div>
    )
  }

  // Calendar view - group posts by week
  const calendarPosts = [...filtered].filter(p => p.scheduled_date || p.posted_date).sort((a, b) => {
    const da = a.posted_date || a.scheduled_date || ''
    const db = b.posted_date || b.scheduled_date || ''
    return da.localeCompare(db)
  })
  const groupedByWeek = {}
  calendarPosts.forEach(p => {
    const d = new Date((p.posted_date || p.scheduled_date) + 'T00:00:00')
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay() + 1) // Monday
    const key = weekStart.toISOString().split('T')[0]
    const label = `Week of ${weekStart.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} — ${new Date(weekStart.getTime() + 4 * 86400000).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`
    if (!groupedByWeek[key]) groupedByWeek[key] = { label, posts: [] }
    groupedByWeek[key].posts.push(p)
  })

  return (
    <div className="fade-in">
      <PageHeader title="Content Pipeline" subtitle={`${filtered.length} posts`}
        action={<div style={{ display: 'flex', gap: 8 }}>
          <Btn v={viewMode === 'list' ? 'primary' : 'secondary'} sz="sm" onClick={() => setViewMode('list')}>List</Btn>
          <Btn v={viewMode === 'calendar' ? 'primary' : 'secondary'} sz="sm" onClick={() => setViewMode('calendar')}>Calendar</Btn>
          <Btn v={bulkMode ? 'orange' : 'secondary'} sz="sm" onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()) }}>{bulkMode ? 'Exit Bulk' : 'Bulk'}</Btn>
          <Btn onClick={() => setShowCreate(true)}>+ New Post</Btn>
        </div>} />

      {/* Bulk Action Bar */}
      {bulkMode && bulkSelected.size > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', background: C.blueLight, borderRadius: 10, border: `1px solid ${C.blue}33`, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginRight: 8 }}>{bulkSelected.size} selected</span>
          <Btn v="secondary" sz="sm" onClick={selectAll}>Select All</Btn>
          <Btn v="secondary" sz="sm" onClick={deselectAll}>Deselect</Btn>
          <span style={{ width: 1, height: 20, background: C.g300 }} />
          <Btn v="orange" sz="sm" onClick={() => bulkUpdateStatus('pending_review')} disabled={bulkActioning}>Send for Review</Btn>
          <Btn v="success" sz="sm" onClick={() => bulkUpdateStatus('approved')} disabled={bulkActioning}>Approve</Btn>
          <Btn v="primary" sz="sm" onClick={() => bulkUpdateStatus('scheduled')} disabled={bulkActioning}>Schedule</Btn>
          <Btn v="danger" sz="sm" onClick={bulkDelete} disabled={bulkActioning}>Delete</Btn>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit', background: C.white }}>
          <option value="all">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit', background: C.white }}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : filtered.length === 0 ? <EmptyState icon="✎" title="No posts yet" sub="Create your first post to get started" /> : viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => (
            <Card key={p.id} onClick={() => bulkMode ? toggleBulkSelect(p.id) : setSelectedPost(p)} style={{ padding: 16, cursor: 'pointer', transition: 'all 0.15s', border: `1px solid ${bulkSelected.has(p.id) ? C.blue : selectedPost?.id === p.id ? C.blue : C.g200}`, background: bulkSelected.has(p.id) ? C.blueLight : C.white }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {bulkMode && (
                  <div onClick={e => { e.stopPropagation(); toggleBulkSelect(p.id) }} style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${bulkSelected.has(p.id) ? C.blue : C.g300}`, background: bulkSelected.has(p.id) ? C.blue : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 6, cursor: 'pointer' }}>
                    {bulkSelected.has(p.id) && '✓'}
                  </div>
                )}
                <Avatar initials={p.profiles?.avatar_initials || p.profiles?.full_name?.split(' ').map(w => w[0]).join('') || '?'} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.g800 }}>{p.profiles?.full_name || 'Unknown'}</div>
                    <Badge status={p.status} />
                  </div>
                  <div style={{ fontSize: 13, color: C.g600, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.content}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.g400 }}>
                      <span>{p.platform}</span>
                      <span>{p.content_type}</span>
                      {p.scheduled_date && <span>📅 {new Date(p.scheduled_date + 'T00:00:00').toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</span>}
                      {p.posted_date && <span>✓ Posted {new Date(p.posted_date + 'T00:00:00').toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</span>}
                      {p.graphic_url && <span>🖼 Graphic</span>}
                    </div>
                    <QuickActions post={p} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Calendar View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.keys(groupedByWeek).length === 0 ? <EmptyState icon="▦" title="No dated posts" sub="Schedule or post content to see it on the calendar" /> :
            Object.entries(groupedByWeek).sort(([a], [b]) => a.localeCompare(b)).map(([weekKey, { label, posts: weekPosts }]) => (
            <div key={weekKey}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${C.g200}` }}>{label}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {weekPosts.map(p => {
                  const d = new Date((p.posted_date || p.scheduled_date) + 'T00:00:00')
                  return (
                    <div key={p.id} onClick={() => setSelectedPost(p)} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 14, background: C.white, borderRadius: 10, border: `1px solid ${C.g200}`, cursor: 'pointer' }}>
                      <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: C.blue, textTransform: 'uppercase' }}>{d.toLocaleDateString('en-AU', { weekday: 'short' })}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{d.getDate()}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <Avatar initials={p.profiles?.avatar_initials || '?'} size={24} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.g700 }}>{p.profiles?.full_name}</span>
                          <Badge status={p.status} />
                        </div>
                        <div style={{ fontSize: 13, color: C.g600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.content}</div>
                      </div>
                      <QuickActions post={p} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPost && <PostDetail post={selectedPost} profile={profile} onClose={() => setSelectedPost(null)} onUpdate={() => { refresh(); setSelectedPost(null) }} />}

      {/* Date Picker Modal */}
      <Modal open={!!datePickerPostId} onClose={() => setDatePickerPostId(null)} title={datePickerAction === 'schedule' ? 'Schedule Post' : 'Mark as Posted'} width={400}>
        <Field label={datePickerAction === 'schedule' ? 'Scheduled Date' : 'Posted Date'} value={pickedDate} onChange={setPickedDate} type="date" />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn v="secondary" onClick={() => setDatePickerPostId(null)}>Cancel</Btn>
          <Btn v={datePickerAction === 'schedule' ? 'primary' : 'success'} onClick={confirmDateAction} disabled={!pickedDate}>
            {datePickerAction === 'schedule' ? 'Schedule' : 'Mark Posted'}
          </Btn>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Post" width={600}>
        <Sel label="Client" value={newClientId} onChange={setNewClientId}
          options={[{ value: '', label: 'Select a client...' }, ...clients.map(c => ({ value: c.id, label: `${c.full_name} — ${c.company || ''}` }))]} />
        <Field label="Post Content" value={newContent} onChange={setNewContent} textarea rows={6} placeholder="Write the post content..." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Scheduled Date" value={newDate} onChange={setNewDate} type="date" />
          <Sel label="Platform" value={newPlatform} onChange={setNewPlatform} options={PLATFORMS.map(p => ({ value: p, label: p }))} />
          <Sel label="Type" value={newType} onChange={setNewType} options={CONTENT_TYPES.map(t => ({ value: t, label: t }))} />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn v="secondary" onClick={() => setShowCreate(false)}>Cancel</Btn>
          <Btn onClick={handleCreate} disabled={!newClientId || !newContent.trim() || creating}>{creating ? 'Creating...' : 'Create Post'}</Btn>
        </div>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN: CLIENTS
   ═══════════════════════════════════════════════════════════════ */

function useClientConfig(clientId) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!clientId) { setConfig(null); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.from('client_config').select('*').eq('client_id', clientId).single()
    setConfig(data || null)
    setLoading(false)
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])
  return { config, loading, refresh: fetch }
}

function AdminClients({ profile }) {
  const { clients, loading, refresh } = useClients()
  const [showInvite, setShowInvite] = useState(false)
  const [invEmail, setInvEmail] = useState('')
  const [invName, setInvName] = useState('')
  const [invCompany, setInvCompany] = useState('')
  const [invNiche, setInvNiche] = useState('')
  const [inviting, setInviting] = useState(false)
  const [invMsg, setInvMsg] = useState('')

  // Voice config
  const [configClientId, setConfigClientId] = useState(null)
  const { config, loading: configLoading, refresh: refreshConfig } = useClientConfig(configClientId)
  const [cfg, setCfg] = useState({})
  const [savingConfig, setSavingConfig] = useState(false)
  const [configTab, setConfigTab] = useState('voice')

  useEffect(() => {
    if (config) setCfg({ ...config })
    else if (configClientId) setCfg({ client_id: configClientId })
  }, [config, configClientId])

  const updateCfg = (field, value) => setCfg(prev => ({ ...prev, [field]: value }))

  const saveConfig = async () => {
    setSavingConfig(true)
    const payload = { ...cfg, client_id: configClientId }
    delete payload.id; delete payload.created_at; delete payload.updated_at
    await supabase.from('client_config').upsert(payload, { onConflict: 'client_id' })
    setSavingConfig(false)
    refreshConfig()
  }

  const handleInvite = async () => {
    if (!invEmail || !invName) return
    setInviting(true); setInvMsg('')
    const tempPw = 'Welcome123!'
    const { error } = await supabase.auth.signUp({ email: invEmail, password: tempPw, options: { data: { full_name: invName, role: 'client' } } })
    if (error) { setInvMsg(error.message) }
    else {
      setTimeout(async () => {
        await supabase.from('profiles').update({ company: invCompany, niche: invNiche, avatar_initials: invName.split(' ').map(w => w[0]).join('').slice(0, 2) }).eq('email', invEmail)
        refresh()
      }, 1000)
      setInvMsg(`Invite sent to ${invEmail}. Temp password: ${tempPw}`)
      setInvEmail(''); setInvName(''); setInvCompany(''); setInvNiche('')
    }
    setInviting(false)
  }

  const configClient = clients.find(c => c.id === configClientId)
  const hasConfig = config !== null

  const ConfigField = ({ label, field, textarea, placeholder, rows = 3 }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: C.g600 }}>{label}</label>
      {textarea ? (
        <textarea value={cfg[field] || ''} onChange={e => updateCfg(field, e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
      ) : (
        <input value={cfg[field] || ''} onChange={e => updateCfg(field, e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
      )}
    </div>
  )

  return (
    <div className="fade-in">
      <PageHeader title="Clients" subtitle={`${clients.length} active clients`}
        action={<Btn onClick={() => setShowInvite(true)}>+ Add Client</Btn>} />

      {loading ? <Loader /> : clients.length === 0 ? <EmptyState icon="◎" title="No clients" sub="Add your first client to get started" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {clients.map(c => (
            <Card key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <Avatar initials={c.avatar_initials || c.full_name?.split(' ').map(w => w[0]).join('')} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{c.full_name}</div>
                  <div style={{ fontSize: 13, color: C.g500 }}>{c.company || 'No company'}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.g400, marginBottom: 12 }}>
                {c.email}<br />
                {c.niche && <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4, background: C.g100, fontSize: 11, color: C.g600 }}>{c.niche}</span>}
              </div>
              <Btn v="primary" sz="sm" onClick={() => { setConfigClientId(c.id); setConfigTab('voice') }} style={{ width: '100%' }}>
                Configure Voice & Content
              </Btn>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); setInvMsg('') }} title="Add Client">
        {invMsg && <div style={{ padding: '10px 14px', borderRadius: 8, background: invMsg.includes('Invite sent') ? C.greenLight : C.redLight, color: invMsg.includes('Invite sent') ? C.green : C.red, fontSize: 13, marginBottom: 16 }}>{invMsg}</div>}
        <Field label="Full Name" value={invName} onChange={setInvName} placeholder="Jane Smith" />
        <Field label="Email" value={invEmail} onChange={setInvEmail} type="email" placeholder="jane@company.com" />
        <Field label="Company" value={invCompany} onChange={setInvCompany} placeholder="Company name" />
        <Field label="Niche" value={invNiche} onChange={setInvNiche} placeholder="e.g. SaaS, Finance, Health" />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn v="secondary" onClick={() => setShowInvite(false)}>Cancel</Btn>
          <Btn onClick={handleInvite} disabled={!invEmail || !invName || inviting}>{inviting ? 'Creating...' : 'Add Client'}</Btn>
        </div>
      </Modal>

      {/* Voice & Content Config Modal */}
      <Modal open={!!configClientId} onClose={() => setConfigClientId(null)} title={`Configure: ${configClient?.full_name || ''}`} width={720}>
        {configLoading ? <Loader /> : (
          <>
            {!hasConfig && (
              <div style={{ padding: '12px 16px', background: C.yellowLight, borderRadius: 8, border: `1px solid ${C.yellow}33`, marginBottom: 16, fontSize: 13, color: C.g700 }}>
                No config yet for this client. Fill in the fields below and save to create their voice profile.
              </div>
            )}

            {/* Config Tabs */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `2px solid ${C.g200}` }}>
              {[{ id: 'voice', label: 'Voice & Style' }, { id: 'content', label: 'Content Rules' }, { id: 'research', label: 'Research & Niche' }, { id: 'calendar', label: 'Calendar' }].map(t => (
                <button key={t.id} onClick={() => setConfigTab(t.id)} style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: configTab === t.id ? C.white : 'transparent', color: configTab === t.id ? C.navy : C.g400,
                  borderBottom: configTab === t.id ? `3px solid ${C.blue}` : '3px solid transparent', marginBottom: -2,
                }}>{t.label}</button>
              ))}
            </div>

            {/* VOICE TAB */}
            {configTab === 'voice' && (
              <div>
                <ConfigField label="Voice Tone" field="voice_tone" placeholder="e.g. Direct, practitioner, no-BS, occasionally admits uncertainty" />
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: C.g600 }}>Perspective</label>
                  <select value={cfg.voice_perspective || 'first_person'} onChange={e => updateCfg('voice_perspective', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit', background: C.white }}>
                    <option value="first_person">First Person (I/me — most LinkedIn creators)</option>
                    <option value="third_person">Third Person (they — about the brand)</option>
                    <option value="company_voice">Company Voice (we — brand account)</option>
                  </select>
                </div>
                <ConfigField label="Voice Description" field="voice_description" textarea placeholder="Longer description of how this person sounds. E.g. 'Speaks like a practitioner who's been in the trenches. Uses specific examples from real work. Never sounds like a consultant or coach. Occasionally drops a casual profanity. References real numbers and situations.'" rows={4} />
                <ConfigField label="Banned Words (comma-separated)" field="banned_words" textarea placeholder="transformative, unlock, empower, leverage, elevate, game-changer, navigate, foster, delve, crucial, landscape" rows={2} />
                <ConfigField label="Preferred Vocabulary" field="preferred_vocabulary" textarea placeholder="Words/phrases they actually use. E.g. 'in the trenches, BS, real talk, the hard truth'" rows={2} />
                <ConfigField label="Writing Style Notes" field="writing_style_notes" textarea placeholder="Any other notes about how they write. E.g. 'Never uses bullet points. Loves one-line paragraphs. Often starts posts with a provocative statement.'" rows={3} />
                <ConfigField label="Example Posts (paste 3-5 of their best, separated by ---)" field="example_posts" textarea placeholder="Paste their best performing posts here, separated by --- on a new line. These will be used as voice reference when generating content." rows={8} />
              </div>
            )}

            {/* CONTENT RULES TAB */}
            {configTab === 'content' && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: C.g600 }}>Emoji Policy</label>
                  <select value={cfg.emoji_policy || 'never'} onChange={e => updateCfg('emoji_policy', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit', background: C.white }}>
                    <option value="never">Never use emojis</option>
                    <option value="sparingly">Use sparingly (1-2 per post max)</option>
                    <option value="freely">Use freely</option>
                  </select>
                </div>
                <ConfigField label="CTA Preferences" field="cta_preferences" textarea placeholder="e.g. 'Link in comments only. Never REPOST if you agree. Never P.S. Follow me. Invite genuine responses only.'" rows={2} />
                <ConfigField label="Hashtag Strategy" field="hashtag_strategy" textarea placeholder="e.g. 'Max 3 hashtags. Always use #CustomerSuccess. Never use #Motivation'" rows={2} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: C.g600 }}>Min Post Length (words)</label>
                    <input type="number" value={cfg.post_length_min || 100} onChange={e => updateCfg('post_length_min', parseInt(e.target.value) || 100)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: C.g600 }}>Max Post Length (words)</label>
                    <input type="number" value={cfg.post_length_max || 200} onChange={e => updateCfg('post_length_max', parseInt(e.target.value) || 200)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                </div>
                <ConfigField label="Formatting Rules" field="formatting_rules" textarea placeholder="e.g. 'Short paragraphs (1-3 lines). Line breaks between thoughts. No bullet points. End with thought-provoking question, not a CTA.'" rows={3} />
              </div>
            )}

            {/* RESEARCH & NICHE TAB */}
            {configTab === 'research' && (
              <div>
                <ConfigField label="Industry" field="industry" placeholder="e.g. SaaS, FinTech, Healthcare, Government" />
                <ConfigField label="Sub-Topics They Cover (comma-separated)" field="sub_topics" textarea placeholder="e.g. churn prevention, QBR strategy, stakeholder management, public sector CS, AI in customer success" rows={2} />
                <ConfigField label="Unique Angle / Thesis" field="unique_angle" textarea placeholder="What makes their perspective different? E.g. 'Traditional CS health scores are broken. Real account health is measured by stakeholder silence patterns and champion engagement, not NPS.'" rows={3} />
                <ConfigField label="Target Audience" field="target_audience" textarea placeholder="Who are they writing for? E.g. 'VP/Director level CS leaders at B2B SaaS companies, 50-500 employees. Also read by CSMs who aspire to leadership.'" rows={2} />
                <ConfigField label="Competitors / Others in Their Space" field="competitors" textarea placeholder="Other LinkedIn creators in their niche. E.g. 'Jay Nathan, Daphne Lopes, Rick Adams — but our client is more practitioner-focused and less consultant-y'" rows={2} />
                <ConfigField label="Research Keywords (comma-separated)" field="research_keywords" textarea placeholder="Specific terms to search when looking for trending topics. E.g. 'customer success, churn, NRR, QBR, enterprise CS, health score'" rows={2} />
                <ConfigField label="Subreddits to Monitor" field="subreddits" placeholder="e.g. r/CustomerSuccess, r/SaaS, r/sales, r/consulting" />
                <ConfigField label="Blogs & Sources" field="blogs_and_sources" textarea placeholder="Industry blogs, newsletters, publications to check for trends. E.g. 'Gainsight blog, ChurnZero blog, SaaStr, First Round Review'" rows={2} />
                <ConfigField label="Thought Leaders to Reference" field="thought_leaders" placeholder="People whose content to be aware of. E.g. 'Jason Lemkin, Tomasz Tunguz, Lincoln Murphy'" />
              </div>
            )}

            {/* CALENDAR TAB */}
            {configTab === 'calendar' && (
              <div>
                <ConfigField label="Posting Frequency" field="posting_frequency" placeholder="e.g. 5 per week, 3 per week, daily" />
                <ConfigField label="Day-of-Week Themes" field="day_themes" textarea placeholder="e.g. Monday: Hot takes / contrarian opinions. Tuesday: Newsletter teasers. Wednesday: Carousels / educational. Thursday: Personal stories. Friday: Quick punch / under 10 lines." rows={5} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.g200}` }}>
              <div style={{ fontSize: 12, color: C.g400 }}>
                {hasConfig ? `Last updated: ${new Date(config.updated_at).toLocaleDateString('en-AU')}` : 'Not configured yet'}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn v="secondary" onClick={() => setConfigClientId(null)}>Close</Btn>
                <Btn v="success" onClick={saveConfig} disabled={savingConfig}>{savingConfig ? 'Saving...' : 'Save Config'}</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN: REPORTS
   ═══════════════════════════════════════════════════════════════ */

function AdminReports({ profile }) {
  const { clients } = useClients()
  const [selClient, setSelClient] = useState('')
  const { data: reportData, loading, refresh } = useReportData(selClient)
  const [showAdd, setShowAdd] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [tab, setTab] = useState('weekly')

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [postedPosts, setPostedPosts] = useState([])
  const [postMetrics, setPostMetrics] = useState({})
  const [loadingPosts, setLoadingPosts] = useState(false)

  const [wLabel, setWLabel] = useState('')
  const [wStart, setWStart] = useState('')
  const [wImpressions, setWImpressions] = useState('')
  const [wLikes, setWLikes] = useState('')
  const [wComments, setWComments] = useState('')
  const [wShares, setWShares] = useState('')
  const [wProfileViews, setWProfileViews] = useState('')
  const [wFollowers, setWFollowers] = useState('')
  const [wSearch, setWSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const [reportFrom, setReportFrom] = useState('')
  const [reportTo, setReportTo] = useState('')
  const [reportPosts, setReportPosts] = useState([])
  const [reportWeekly, setReportWeekly] = useState([])
  const [loadingReport, setLoadingReport] = useState(false)

  const client = clients.find(c => c.id === selClient)
  const metricFields = ['impressions', 'likes', 'comments', 'shares', 'reposts', 'clicks', 'saves', 'video_views']

  const fetchPostedPosts = async () => {
    if (!selClient || !dateFrom || !dateTo) return
    setLoadingPosts(true)
    const { data: posts } = await supabase.from('posts').select('*, post_metrics(*)').eq('client_id', selClient)
      .not('posted_date', 'is', null).gte('posted_date', dateFrom).lte('posted_date', dateTo).order('posted_date', { ascending: true })
    setPostedPosts(posts || [])
    const metrics = {}
    ;(posts || []).forEach(p => {
      if (p.post_metrics?.length > 0) {
        const m = p.post_metrics[0]
        metrics[p.id] = { impressions: m.impressions || '', likes: m.likes || '', comments: m.comments || '', shares: m.shares || '', reposts: m.reposts || '', clicks: m.clicks || '', saves: m.saves || '', video_views: m.video_views || '', notes: m.notes || '' }
      }
    })
    setPostMetrics(metrics)
    setLoadingPosts(false)
  }

  useEffect(() => { if (selClient && dateFrom && dateTo) fetchPostedPosts() }, [selClient, dateFrom, dateTo])

  const handleSaveWeekly = async () => {
    if (!selClient || !wStart) return
    setSaving(true)
    await supabase.from('report_data').upsert({ client_id: selClient, week_label: wLabel || `Week of ${wStart}`, week_start: wStart,
      impressions: parseInt(wImpressions) || 0, likes: parseInt(wLikes) || 0, comments: parseInt(wComments) || 0,
      shares: parseInt(wShares) || 0, profile_views: parseInt(wProfileViews) || 0,
      followers: parseInt(wFollowers) || 0, search_appearances: parseInt(wSearch) || 0,
    }, { onConflict: 'client_id,week_start' })
    setShowAdd(false)
    setWLabel(''); setWStart(''); setWImpressions(''); setWLikes(''); setWComments(''); setWShares(''); setWProfileViews(''); setWFollowers(''); setWSearch('')
    setSaving(false); refresh()
  }

  const updatePostMetric = (postId, field, value) => setPostMetrics(prev => ({ ...prev, [postId]: { ...(prev[postId] || {}), [field]: value } }))

  const saveAllPostMetrics = async () => {
    setSaving(true)
    for (const postId of Object.keys(postMetrics)) {
      const m = postMetrics[postId]; if (!m) continue
      await supabase.from('post_metrics').upsert({ post_id: postId, impressions: parseInt(m.impressions) || 0, likes: parseInt(m.likes) || 0,
        comments: parseInt(m.comments) || 0, shares: parseInt(m.shares) || 0, reposts: parseInt(m.reposts) || 0, clicks: parseInt(m.clicks) || 0,
        saves: parseInt(m.saves) || 0, video_views: parseInt(m.video_views) || 0, notes: m.notes || '' }, { onConflict: 'post_id' })
    }
    setSaving(false); fetchPostedPosts()
  }

  const generateReport = async () => {
    if (!selClient || !reportFrom || !reportTo) return
    setLoadingReport(true)
    const { data: wkData } = await supabase.from('report_data').select('*').eq('client_id', selClient)
      .gte('week_start', reportFrom).lte('week_start', reportTo).order('week_start', { ascending: true })
    setReportWeekly(wkData || [])
    const { data: pData, error: pErr } = await supabase.from('posts').select('*, post_metrics(*)').eq('client_id', selClient)
      .not('posted_date', 'is', null).gte('posted_date', reportFrom).lte('posted_date', reportTo).order('posted_date', { ascending: true })
    if (pErr) console.error('Report posts error:', pErr)
    console.log('Report posts:', pData?.length, 'found. With metrics:', pData?.filter(p => p.post_metrics?.length > 0).length)
    setReportPosts(pData || [])
    setLoadingReport(false); setShowReport(true)
  }

  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const downloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          client: { full_name: client?.full_name, company: client?.company, niche: client?.niche },
          weeklyData: reportWeekly,
          postsData: reportPosts,
          periodStart: reportFrom,
          periodEnd: reportTo,
        })
      })
      const data = await res.json()
      if (data.pdf) {
        // data.pdf is a data URI — trigger download
        const link = document.createElement('a')
        link.href = data.pdf
        link.download = `LinkedIn_Report_${client?.full_name?.replace(/\s+/g, '_')}_${reportFrom}_${reportTo}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert(data.error || 'Failed to generate PDF')
      }
    } catch (e) {
      alert(`PDF generation failed: ${e.message}. Make sure the generate-report Edge Function is deployed.`)
    }
    setDownloadingPdf(false)
  }

  const rTotalImps = reportWeekly.reduce((s, d) => s + (d.impressions || 0), 0)
  const rTotalEng = reportWeekly.reduce((s, d) => s + (d.likes || 0) + (d.comments || 0) + (d.shares || 0), 0)
  const rAvgEngRate = rTotalImps ? ((rTotalEng / rTotalImps) * 100).toFixed(1) : '0'
  const rLatestFollowers = reportWeekly.length ? reportWeekly[reportWeekly.length - 1].followers : 0
  const rFirstFollowers = reportWeekly.length ? reportWeekly[0].followers : 0
  const rFollowerGrowth = rFirstFollowers ? (((rLatestFollowers - rFirstFollowers) / rFirstFollowers) * 100).toFixed(1) : '0'
  const rFollowerNet = rLatestFollowers - rFirstFollowers
  const rTotalProfileViews = reportWeekly.reduce((s, d) => s + (d.profile_views || 0), 0)
  const postsWithMetrics = reportPosts.filter(p => p.post_metrics?.length > 0).map(p => ({ ...p, m: p.post_metrics[0] })).sort((a, b) => (b.m.impressions || 0) - (a.m.impressions || 0))
  const typeCount = {}; reportPosts.forEach(p => { typeCount[p.content_type || 'Text'] = (typeCount[p.content_type || 'Text'] || 0) + 1 })
  const typeTotal = reportPosts.length || 1

  return (
    <div className="fade-in">
      <PageHeader title="Reports" subtitle="Weekly account metrics + per-post performance" />
      <Sel label="Select Client" value={selClient} onChange={v => { setSelClient(v); setPostedPosts([]) }}
        options={[{ value: '', label: 'Choose a client...' }, ...clients.map(c => ({ value: c.id, label: `${c.full_name} — ${c.company || ''}` }))]} />

      {selClient && (<>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${C.g200}` }}>
          {[{ id: 'weekly', label: 'Weekly Account Data' }, { id: 'posts', label: 'Per-Post Metrics' }, { id: 'generate', label: 'Generate Report' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: tab === t.id ? C.white : 'transparent', color: tab === t.id ? C.navy : C.g400,
              borderBottom: tab === t.id ? `3px solid ${C.blue}` : '3px solid transparent', marginBottom: -2 }}>{t.label}</button>
          ))}
        </div>

        {tab === 'weekly' && (<>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}><Btn onClick={() => setShowAdd(true)}>+ Add Weekly Data</Btn></div>
          {loading ? <Loader /> : reportData.length === 0 ? <EmptyState icon="▤" title="No data yet" sub="Add weekly LinkedIn metrics" /> : (
            <Card style={{ overflow: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: C.navy, color: C.white }}>
                {['Week', 'Impressions', 'Likes', 'Comments', 'Shares', 'Profile Views', 'Followers', 'Search'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>))}
              </tr></thead>
              <tbody>{reportData.map((d, i) => (
                <tr key={d.id} style={{ background: i % 2 ? C.g50 : C.white }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{d.week_label}</td>
                  <td style={{ padding: '10px 14px' }}>{d.impressions?.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>{d.likes?.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>{d.comments?.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>{d.shares?.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>{d.profile_views?.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>{d.followers?.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>{d.search_appearances?.toLocaleString()}</td>
                </tr>))}</tbody>
            </table></Card>)}
        </>)}

        {tab === 'posts' && (<>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 12 }}>Select date range to load posted content</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <Field label="From" value={dateFrom} onChange={setDateFrom} type="date" style={{ marginBottom: 0 }} />
              <Field label="To" value={dateTo} onChange={setDateTo} type="date" style={{ marginBottom: 0 }} />
              <Btn onClick={fetchPostedPosts} disabled={!dateFrom || !dateTo} style={{ marginBottom: 16 }}>Load Posts</Btn>
            </div>
          </Card>
          {loadingPosts ? <Loader /> : postedPosts.length === 0 ? (
            <EmptyState icon="✎" title={dateFrom ? 'No posted content in this range' : 'Select a date range'} sub="Only posts marked as Posted with a posted date will appear" />
          ) : (<>
            <div style={{ fontSize: 13, color: C.g500, marginBottom: 12 }}>{postedPosts.length} posted posts. Enter current lifetime metrics, then save.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {postedPosts.map(p => { const m = postMetrics[p.id] || {}; const hasM = p.post_metrics?.length > 0; return (
                <Card key={p.id} style={{ padding: 16 }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: C.g400 }}>{p.posted_date && new Date(p.posted_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.g100, color: C.g600 }}>{p.content_type}</span>
                      {hasM && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.greenLight, color: C.green }}>Saved</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.g700, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.content}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {metricFields.map(f => (<div key={f}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'capitalize' }}>{f.replace('_', ' ')}</label>
                      <input type="number" value={m[f] || ''} onChange={e => updatePostMetric(p.id, f, e.target.value)} placeholder="0"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
                    </div>))}
                  </div>
                  <div style={{ marginTop: 8 }}><label style={{ fontSize: 11, fontWeight: 600, color: C.g500 }}>Notes</label>
                    <input value={m.notes || ''} onChange={e => updatePostMetric(p.id, 'notes', e.target.value)} placeholder="e.g. Went viral, reshared by..."
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                </Card>)})}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn v="success" sz="lg" onClick={saveAllPostMetrics} disabled={saving}>{saving ? 'Saving...' : 'Save All Post Metrics'}</Btn>
            </div>
          </>)}
        </>)}

        {tab === 'generate' && (<>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Generate Client Report</h3>
            <div style={{ fontSize: 13, color: C.g500, marginBottom: 16 }}>Select reporting period. Pulls weekly data AND per-post metrics for this range.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <Field label="Period Start" value={reportFrom} onChange={setReportFrom} type="date" style={{ marginBottom: 0 }} />
              <Field label="Period End" value={reportTo} onChange={setReportTo} type="date" style={{ marginBottom: 0 }} />
              <Btn v="orange" sz="lg" onClick={generateReport} disabled={!reportFrom || !reportTo || loadingReport} style={{ marginBottom: 16 }}>
                {loadingReport ? 'Loading...' : 'Generate Report'}</Btn>
            </div>
          </Card>
          <Card style={{ background: C.g50, border: `1px dashed ${C.g300}` }}>
            <div style={{ fontSize: 13, color: C.g500, lineHeight: 1.7 }}>
              <strong style={{ color: C.g700 }}>The report will include:</strong><br />
              — Cover page with client branding and reporting period<br />
              — Executive summary with 6 KPI cards<br />
              — Weekly performance trends with visual bars and data table<br />
              — Per-post performance ranking by impressions<br />
              — Content type distribution<br />
              — Confidential footer with DPT branding
            </div>
          </Card>
        </>)}
      </>)}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Weekly Data" width={600}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Week Label" value={wLabel} onChange={setWLabel} placeholder="e.g. Mar 10-16" />
          <Field label="Week Start Date" value={wStart} onChange={setWStart} type="date" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Impressions" value={wImpressions} onChange={setWImpressions} type="number" placeholder="0" />
          <Field label="Likes" value={wLikes} onChange={setWLikes} type="number" placeholder="0" />
          <Field label="Comments" value={wComments} onChange={setWComments} type="number" placeholder="0" />
          <Field label="Shares" value={wShares} onChange={setWShares} type="number" placeholder="0" />
          <Field label="Profile Views" value={wProfileViews} onChange={setWProfileViews} type="number" placeholder="0" />
          <Field label="Followers" value={wFollowers} onChange={setWFollowers} type="number" placeholder="0" />
          <Field label="Search Appearances" value={wSearch} onChange={setWSearch} type="number" placeholder="0" />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn v="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
          <Btn onClick={handleSaveWeekly} disabled={!wStart || saving}>{saving ? 'Saving...' : 'Save Data'}</Btn>
        </div>
      </Modal>

      <Modal open={showReport} onClose={() => setShowReport(false)} title="Performance Report" width={780}>
        <div id="report-print" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #1a2744 100%)`, color: C.white, padding: '48px 40px', borderRadius: 14, marginBottom: 28 }}>
            <div style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: C.g400, marginBottom: 12 }}>DPT Agency — Confidential</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>LinkedIn Performance Report</div>
            <div style={{ fontSize: 16, color: C.g300, marginBottom: 20 }}>{client?.full_name} — {client?.company}</div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: C.g400 }}>
              <span>Niche: {client?.niche || 'General'}</span>
              <span>Period: {reportFrom && new Date(reportFrom+'T00:00:00').toLocaleDateString('en-AU',{month:'short',day:'numeric'})} — {reportTo && new Date(reportTo+'T00:00:00').toLocaleDateString('en-AU',{month:'short',day:'numeric',year:'numeric'})}</span>
              <span>Generated: {new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}</span>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 16, paddingBottom: 8, borderBottom: `3px solid ${C.orange}` }}>Executive Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Current Followers', value: rLatestFollowers.toLocaleString(), sub: rFollowerNet>=0?`+${rFollowerNet.toLocaleString()} (+${rFollowerGrowth}%)`:`${rFollowerNet.toLocaleString()} (${rFollowerGrowth}%)`, color: C.blue },
                { label: 'Total Impressions', value: rTotalImps.toLocaleString(), sub: `Across ${reportWeekly.length} week${reportWeekly.length!==1?'s':''}`, color: C.orange },
                { label: 'Total Engagements', value: rTotalEng.toLocaleString(), sub: 'Likes + Comments + Shares', color: C.green },
                { label: 'Avg Engagement Rate', value: `${rAvgEngRate}%`, sub: 'Engagements / Impressions', color: C.navy },
                { label: 'Profile Views', value: rTotalProfileViews.toLocaleString(), sub: 'Total in period', color: '#8B5CF6' },
                { label: 'Posts Published', value: reportPosts.length.toString(), sub: `${postsWithMetrics.length} with metrics`, color: C.g700 },
              ].map((k,i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, border: `1px solid ${C.g200}` }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: -1 }}>{k.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.g600, marginTop: 2 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: C.g400, marginTop: 2 }}>{k.sub}</div>
                </div>))}
            </div>
          </div>

          {reportWeekly.length > 0 && (<div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 16, paddingBottom: 8, borderBottom: `3px solid ${C.blue}` }}>Weekly Performance</h3>
            <div style={{ marginBottom: 16 }}>
              {reportWeekly.map((d,i) => { const maxImp=Math.max(...reportWeekly.map(r=>r.impressions||0)); const pct=maxImp?((d.impressions||0)/maxImp)*100:0; const eng=(d.likes||0)+(d.comments||0)+(d.shares||0); const engR=d.impressions?((eng/d.impressions)*100).toFixed(1):'0'; return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                  <div style={{ width:110, fontSize:12, color:C.g500, flexShrink:0, fontWeight:600 }}>{d.week_label}</div>
                  <div style={{ flex:1, height:28, background:C.g100, borderRadius:6, overflow:'hidden', position:'relative' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg, ${C.blue}, ${C.orange})`, borderRadius:6 }} />
                    <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:600, color:pct>60?C.white:C.g600 }}>{(d.impressions||0).toLocaleString()} impr · {engR}% eng</div>
                  </div>
                </div>)})}
            </div>
            <div style={{ overflow:'auto', borderRadius:10, border:`1px solid ${C.g200}` }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:C.navy, color:C.white }}>
                  {['Week','Impressions','Likes','Comments','Shares','Profile Views','Followers'].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:600 }}>{h}</th>))}
                </tr></thead>
                <tbody>{reportWeekly.map((d,i)=>(
                  <tr key={i} style={{ background:i%2?C.g50:C.white }}>
                    <td style={{ padding:'8px 12px', fontWeight:600 }}>{d.week_label}</td>
                    <td style={{ padding:'8px 12px' }}>{(d.impressions||0).toLocaleString()}</td>
                    <td style={{ padding:'8px 12px' }}>{(d.likes||0).toLocaleString()}</td>
                    <td style={{ padding:'8px 12px' }}>{(d.comments||0).toLocaleString()}</td>
                    <td style={{ padding:'8px 12px' }}>{(d.shares||0).toLocaleString()}</td>
                    <td style={{ padding:'8px 12px' }}>{(d.profile_views||0).toLocaleString()}</td>
                    <td style={{ padding:'8px 12px' }}>{(d.followers||0).toLocaleString()}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </div>)}

          {reportPosts.length > 0 && (<div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 16, paddingBottom: 8, borderBottom: `3px solid ${C.green}` }}>Content Mix</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.entries(typeCount).sort((a,b)=>b[1]-a[1]).map(([type,count],i) => {
                const cols=[C.blue,C.orange,C.green,'#8B5CF6',C.yellow,C.red]; return (
                <div key={type} style={{ flex:1, padding:16, borderRadius:10, border:`1px solid ${C.g200}`, textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:cols[i%cols.length] }}>{count}</div>
                  <div style={{ fontSize:12, color:C.g600, fontWeight:600 }}>{type}</div>
                  <div style={{ fontSize:11, color:C.g400 }}>{((count/typeTotal)*100).toFixed(0)}% of posts</div>
                </div>)})}
            </div>
          </div>)}

          {postsWithMetrics.length > 0 && (<div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginBottom: 16, paddingBottom: 8, borderBottom: `3px solid ${C.yellow}` }}>Post Performance Ranking</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {postsWithMetrics.map((p,i) => { const m=p.m; const tEng=(m.likes||0)+(m.comments||0)+(m.shares||0)+(m.reposts||0); const engR=m.impressions?((tEng/m.impressions)*100).toFixed(1):'0'; const isTop=i===0; return (
                <div key={p.id} style={{ padding:16, borderRadius:10, border:`1px solid ${isTop?C.green:C.g200}`, background:isTop?C.greenLight:C.white }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:C.white, background:isTop?C.green:C.g400 }}>{i+1}</span>
                      <span style={{ fontSize:12, color:C.g400 }}>{p.posted_date && new Date(p.posted_date+'T00:00:00').toLocaleDateString('en-AU',{weekday:'short',month:'short',day:'numeric'})}</span>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:C.g100, color:C.g600 }}>{p.content_type}</span>
                      {isTop && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:C.green, color:C.white, fontWeight:600 }}>Best Performer</span>}
                    </div>
                    <span style={{ fontSize:14, fontWeight:700, color:C.navy }}>{engR}% eng rate</span>
                  </div>
                  <div style={{ fontSize:13, color:C.g700, lineHeight:1.5, marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.content}</div>
                  <div style={{ display:'flex', gap:16, fontSize:12, color:C.g500, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:600, color:C.navy }}>{(m.impressions||0).toLocaleString()} impressions</span>
                    <span>{m.likes||0} likes</span><span>{m.comments||0} comments</span><span>{m.shares||0} shares</span>
                    {m.reposts>0&&<span>{m.reposts} reposts</span>}{m.clicks>0&&<span>{m.clicks} clicks</span>}{m.saves>0&&<span>{m.saves} saves</span>}
                  </div>
                  {m.notes&&<div style={{ fontSize:12, color:C.blue, marginTop:6, fontStyle:'italic' }}>Note: {m.notes}</div>}
                </div>)})}
            </div>
          </div>)}

          {reportWeekly.length===0 && reportPosts.length===0 && <EmptyState icon="▤" title="No data for this period" sub="Enter weekly data and mark posts as posted with dates in this range" />}

          <div style={{ marginTop:28, padding:16, background:C.g50, borderRadius:8, textAlign:'center', fontSize:12, color:C.g400, borderTop:`2px solid ${C.g200}` }}>
            Confidential — Prepared by DPT Agency — {new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:20, paddingTop:16, borderTop:`1px solid ${C.g200}` }}>
          <Btn v="secondary" onClick={() => setShowReport(false)}>Close</Btn>
          <Btn v="secondary" onClick={() => window.print()}>Print Preview</Btn>
          <Btn v="orange" onClick={downloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
/* ═══════════════════════════════════════════════════════════════
   CLIENT: MY CONTENT
   ═══════════════════════════════════════════════════════════════ */

function ClientContent({ profile }) {
  const { posts, loading, refresh } = usePosts(profile.id)
  const [selectedPost, setSelectedPost] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = filterStatus === 'all' ? posts : posts.filter(p => p.status === filterStatus)
  const pending = posts.filter(p => p.status === 'pending_review').length

  return (
    <div className="fade-in">
      <PageHeader title="My Content" subtitle={`${posts.length} posts${pending > 0 ? ` · ${pending} awaiting your review` : ''}`} />

      {pending > 0 && (
        <div style={{ padding: '14px 20px', background: C.yellowLight, borderRadius: 10, border: `1px solid ${C.yellow}33`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.g800 }}>{pending} post{pending > 1 ? 's' : ''} awaiting your review</div>
            <div style={{ fontSize: 13, color: C.g500 }}>Click on a post to approve or request changes</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending_review', 'approved', 'scheduled', 'posted'].map(s => (
          <Btn key={s} v={filterStatus === s ? 'primary' : 'secondary'} sz="sm" onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'All' : STATUS[s].label}
          </Btn>
        ))}
      </div>

      {loading ? <Loader /> : filtered.length === 0 ? <EmptyState icon="✎" title="No posts" sub="Your content will appear here" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <Card key={p.id} onClick={() => setSelectedPost(p)} style={{ padding: 18, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Badge status={p.status} />
                  <span style={{ fontSize: 12, color: C.g400 }}>{p.platform} · {p.content_type}</span>
                </div>
                {p.scheduled_date && <span style={{ fontSize: 13, color: C.g500 }}>📅 {new Date(p.scheduled_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}</span>}
              </div>
              <div style={{ fontSize: 14, color: C.g700, lineHeight: 1.6, whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.content}
              </div>
              {p.graphic_url && (
                <div style={{ marginTop: 10, borderRadius: 8, overflow: 'hidden', maxHeight: 120 }}>
                  <img src={p.graphic_url} alt="" style={{ width: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedPost && <PostDetail post={selectedPost} profile={profile} onClose={() => setSelectedPost(null)} onUpdate={() => { refresh(); setSelectedPost(null) }} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CLIENT: CALENDAR VIEW
   ═══════════════════════════════════════════════════════════════ */

function ClientCalendar({ profile }) {
  const { posts, loading } = usePosts(profile.id)

  const scheduled = posts.filter(p => p.scheduled_date).sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
  const grouped = {}
  scheduled.forEach(p => {
    const d = new Date(p.scheduled_date + 'T00:00:00')
    const key = d.toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(p)
  })

  return (
    <div className="fade-in">
      <PageHeader title="Calendar" subtitle="Your upcoming content schedule" />
      {loading ? <Loader /> : Object.keys(grouped).length === 0 ? <EmptyState icon="▦" title="No scheduled content" sub="Posts with dates will appear here" /> : (
        Object.entries(grouped).map(([month, psts]) => (
          <div key={month} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 12 }}>{month}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {psts.map(p => {
                const d = new Date(p.scheduled_date + 'T00:00:00')
                return (
                  <div key={p.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16, background: C.white, borderRadius: 10, border: `1px solid ${C.g200}` }}>
                    <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, textTransform: 'uppercase' }}>{d.toLocaleDateString('en-AU', { weekday: 'short' })}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>{d.getDate()}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <Badge status={p.status} />
                        <span style={{ fontSize: 12, color: C.g400 }}>{p.platform} · {p.content_type}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.g600, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CLIENT: MY REPORTS
   ═══════════════════════════════════════════════════════════════ */

function ClientDashboard({ profile }) {
  const { posts, loading: postsLoading } = usePosts(profile.id)
  const { data: reportData, loading: reportLoading } = useReportData(profile.id)
  const [topPosts, setTopPosts] = useState([])
  const [loadingTop, setLoadingTop] = useState(true)

  useEffect(() => {
    const fetchTop = async () => {
      const { data } = await supabase.from('posts').select('*, post_metrics(*)').eq('client_id', profile.id)
        .not('posted_date', 'is', null).order('posted_date', { ascending: false }).limit(20)
      const withMetrics = (data || []).filter(p => p.post_metrics?.length > 0)
        .map(p => ({ ...p, m: p.post_metrics[0] }))
        .sort((a, b) => (b.m.impressions || 0) - (a.m.impressions || 0))
      setTopPosts(withMetrics.slice(0, 5))
      setLoadingTop(false)
    }
    fetchTop()
  }, [profile.id])

  if (postsLoading || reportLoading) return <Loader />

  const totalImps = reportData.reduce((s, d) => s + (d.impressions || 0), 0)
  const totalEng = reportData.reduce((s, d) => s + (d.likes || 0) + (d.comments || 0) + (d.shares || 0), 0)
  const avgEngRate = totalImps ? ((totalEng / totalImps) * 100).toFixed(1) : '0'
  const latestFollowers = reportData.length ? reportData[reportData.length - 1].followers : 0
  const firstFollowers = reportData.length ? reportData[0].followers : 0
  const followerGrowth = firstFollowers ? (((latestFollowers - firstFollowers) / firstFollowers) * 100).toFixed(0) : 0

  const pendingReview = posts.filter(p => p.status === 'pending_review').length
  const upcoming = posts.filter(p => p.scheduled_date && new Date(p.scheduled_date) >= new Date()).length
  const totalPosted = posts.filter(p => p.status === 'posted').length

  // Engagement rate trend
  const engTrend = reportData.map(d => {
    const eng = (d.likes || 0) + (d.comments || 0) + (d.shares || 0)
    return { week: d.week_label, rate: d.impressions ? ((eng / d.impressions) * 100).toFixed(1) : 0, impressions: d.impressions || 0 }
  })

  return (
    <div className="fade-in">
      <PageHeader title={`Welcome, ${profile.full_name?.split(' ')[0]}`} subtitle={`${profile.company || ''} — LinkedIn Performance Overview`} />

      {/* Action banner */}
      {pendingReview > 0 && (
        <div style={{ padding: '14px 20px', background: C.yellowLight, borderRadius: 10, border: `1px solid ${C.yellow}33`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.g800 }}>{pendingReview} post{pendingReview > 1 ? 's' : ''} awaiting your review</div>
            <div style={{ fontSize: 13, color: C.g500 }}>Head to My Content to approve or request changes</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KPI icon="👥" label="Followers" value={latestFollowers.toLocaleString()} change={parseInt(followerGrowth) || null} />
        <KPI icon="👁" label="Total Impressions" value={totalImps.toLocaleString()} />
        <KPI icon="💬" label="Engagements" value={totalEng.toLocaleString()} />
        <KPI icon="📊" label="Eng Rate" value={`${avgEngRate}%`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Content Status */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Content Status</h3>
          {[
            { label: 'Awaiting Your Review', count: pendingReview, color: C.yellow },
            { label: 'Upcoming / Scheduled', count: upcoming, color: C.blue },
            { label: 'Posted', count: totalPosted, color: C.green },
            { label: 'Total Posts', count: posts.length, color: C.navy },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${C.g100}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: 13, color: C.g600 }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{item.count}</span>
            </div>
          ))}
        </Card>

        {/* Engagement Trend */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Engagement Rate Trend</h3>
          {engTrend.length === 0 ? <div style={{ color: C.g400, fontSize: 13, textAlign: 'center', padding: 20 }}>No data yet</div> : (
            <div>
              {engTrend.map((d, i) => {
                const maxRate = Math.max(...engTrend.map(r => parseFloat(r.rate) || 0))
                const pct = maxRate ? ((parseFloat(d.rate) || 0) / maxRate) * 100 : 0
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 80, fontSize: 11, color: C.g500, flexShrink: 0 }}>{d.week}</div>
                    <div style={{ flex: 1, height: 20, background: C.g100, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: parseFloat(d.rate) >= 3 ? C.green : parseFloat(d.rate) >= 2 ? C.blue : C.orange, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.navy, width: 40, textAlign: 'right' }}>{d.rate}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Top Posts */}
      {!loadingTop && topPosts.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Your Top Performing Posts</h3>
          {topPosts.map((p, i) => {
            const m = p.m
            const eng = (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
            const engR = m.impressions ? ((eng / m.impressions) * 100).toFixed(1) : '0'
            return (
              <div key={p.id} style={{ padding: 12, marginBottom: 8, borderRadius: 8, background: i === 0 ? C.greenLight : C.g50, border: `1px solid ${i === 0 ? C.green + '33' : C.g200}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? C.green : C.g400, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: C.g400 }}>{p.posted_date && new Date(p.posted_date + 'T00:00:00').toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{engR}% eng</span>
                </div>
                <div style={{ fontSize: 13, color: C.g700, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>{p.content}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.g500 }}>
                  <span>{(m.impressions || 0).toLocaleString()} impr</span>
                  <span>{m.likes || 0} likes</span>
                  <span>{m.comments || 0} comments</span>
                  <span>{m.shares || 0} shares</span>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* Follower Growth */}
      {reportData.length > 1 && (
        <Card style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Follower Growth</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
            {reportData.map((d, i) => {
              const max = Math.max(...reportData.map(r => r.followers || 0))
              const min = Math.min(...reportData.filter(r => r.followers > 0).map(r => r.followers))
              const range = max - min || 1
              const h = ((d.followers - min) / range) * 100 + 10
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: C.g500, fontWeight: 600 }}>{(d.followers || 0).toLocaleString()}</span>
                  <div style={{ width: '100%', height: h, background: `linear-gradient(180deg, ${C.blue} 0%, rgba(45,127,249,0.3) 100%)`, borderRadius: '4px 4px 0 0', minHeight: 10 }} />
                  <span style={{ fontSize: 9, color: C.g400, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{d.week_label}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function ClientReports({ profile }) {
  const { data: reportData, loading } = useReportData(profile.id)

  if (loading) return <Loader />

  const totalImps = reportData.reduce((s, d) => s + (d.impressions || 0), 0)
  const totalEng = reportData.reduce((s, d) => s + (d.likes || 0) + (d.comments || 0) + (d.shares || 0), 0)
  const avgEngRate = totalImps ? ((totalEng / totalImps) * 100).toFixed(1) : '0'
  const latestFollowers = reportData.length ? reportData[reportData.length - 1].followers : 0

  return (
    <div className="fade-in">
      <PageHeader title="My Reports" subtitle="LinkedIn performance metrics" />

      {reportData.length === 0 ? <EmptyState icon="▤" title="No reports yet" sub="Your performance data will appear here once DPT adds it" /> : (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <KPI icon="👥" label="Followers" value={latestFollowers.toLocaleString()} />
            <KPI icon="👁" label="Total Impressions" value={totalImps.toLocaleString()} />
            <KPI icon="💬" label="Total Engagements" value={totalEng.toLocaleString()} />
            <KPI icon="📊" label="Avg Engagement Rate" value={`${avgEngRate}%`} />
          </div>

          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Weekly Performance</h3>
            {reportData.map((d, i) => {
              const maxImp = Math.max(...reportData.map(r => r.impressions || 0))
              const pct = maxImp ? ((d.impressions || 0) / maxImp) * 100 : 0
              const eng = (d.likes || 0) + (d.comments || 0) + (d.shares || 0)
              return (
                <div key={i} style={{ marginBottom: 16, padding: 14, background: i % 2 ? C.g50 : C.white, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{d.week_label}</span>
                    <span style={{ fontSize: 13, color: C.g500 }}>{d.followers?.toLocaleString()} followers</span>
                  </div>
                  <div style={{ height: 8, background: C.g200, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: C.blue, borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 12, color: C.g500 }}>
                    <span>{(d.impressions || 0).toLocaleString()} impressions</span>
                    <span>{d.likes || 0} likes</span>
                    <span>{d.comments || 0} comments</span>
                    <span>{d.shares || 0} shares</span>
                  </div>
                </div>
              )
            })}
          </Card>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN: AI-POWERED CONTENT CREATION
   Flow: Select Client → Research Topics → Pick Topics → Generate Posts → Review → Push to Client
   ═══════════════════════════════════════════════════════════════ */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

async function callClaude(systemPrompt, userPrompt, useSearch = false) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }
  if (useSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  }

  // Try Edge Function proxy first (production), fall back to direct API (dev/artifact)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const session = (await supabase.auth.getSession()).data.session

  let res
  if (supabaseUrl && session) {
    // Production: route through Supabase Edge Function (API key stays server-side)
    res = await fetch(`${supabaseUrl}/functions/v1/claude-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    })
  } else {
    // Fallback: direct API call (works in Claude artifact environment)
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `API request failed with status ${res.status}`)
  }

  const data = await res.json()
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
}

function parseJsonFromAI(raw) {
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const match = cleaned.match(/\[[\s\S]*\]/)
  return match ? JSON.parse(match[0]) : null
}

function AdminCreateContent({ profile }) {
  const { clients } = useClients()
  const [step, setStep] = useState('select_client')
  const [selClientId, setSelClientId] = useState('')
  const [customContext, setCustomContext] = useState('')
  const [numDays, setNumDays] = useState('5')
  const [topics, setTopics] = useState([])
  const [selectedTopics, setSelectedTopics] = useState([])
  const [generatedPosts, setGeneratedPosts] = useState([])
  const [editingIdx, setEditingIdx] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const client = clients.find(c => c.id === selClientId)
  const { config } = useClientConfig(selClientId)

  // Build dynamic prompts from client config
  const buildResearchContext = () => {
    if (!config) return ''
    const parts = []
    if (config.industry) parts.push(`INDUSTRY: ${config.industry}`)
    if (config.sub_topics) parts.push(`KEY TOPICS: ${config.sub_topics}`)
    if (config.unique_angle) parts.push(`UNIQUE ANGLE: ${config.unique_angle}`)
    if (config.target_audience) parts.push(`TARGET AUDIENCE: ${config.target_audience}`)
    if (config.competitors) parts.push(`COMPETITORS IN SPACE: ${config.competitors}`)
    if (config.research_keywords) parts.push(`SEARCH THESE KEYWORDS: ${config.research_keywords}`)
    if (config.subreddits) parts.push(`CHECK THESE SUBREDDITS: ${config.subreddits}`)
    if (config.blogs_and_sources) parts.push(`CHECK THESE BLOGS/SOURCES: ${config.blogs_and_sources}`)
    if (config.thought_leaders) parts.push(`AWARE OF THESE THOUGHT LEADERS: ${config.thought_leaders}`)
    return parts.join('\n')
  }

  const buildVoicePrompt = () => {
    if (!config) return `VOICE RULES:
- First person as the client. Direct, practitioner voice
- Short lines. Lots of white space. No walls of text
- NO emojis
- BANNED WORDS: "transformative", "unlock", "empower", "leverage", "elevate", "game-changer", "navigate", "foster", "delve", "crucial", "landscape"
- NO engagement bait: no "REPOST if you agree", "SAVE this", "Comment FRAMEWORK below"
- Posts should be 100-200 words
- If it sounds like a TED talk or SaaS blog, rewrite it`

    const parts = ['VOICE RULES (follow these EXACTLY for this client):']
    const perspective = { first_person: 'Write in first person (I/me)', third_person: 'Write in third person', company_voice: 'Write as the company (we/our)' }
    parts.push(`- ${perspective[config.voice_perspective] || perspective.first_person}`)
    if (config.voice_tone) parts.push(`- Tone: ${config.voice_tone}`)
    if (config.voice_description) parts.push(`- Voice description: ${config.voice_description}`)
    if (config.emoji_policy === 'never') parts.push('- NO emojis. Ever.')
    else if (config.emoji_policy === 'sparingly') parts.push('- Use emojis sparingly (1-2 per post max)')
    else parts.push('- Emojis are fine to use')
    if (config.banned_words) parts.push(`- BANNED WORDS: ${config.banned_words}`)
    if (config.preferred_vocabulary) parts.push(`- USE THESE WORDS/PHRASES: ${config.preferred_vocabulary}`)
    if (config.cta_preferences) parts.push(`- CTA RULES: ${config.cta_preferences}`)
    if (config.hashtag_strategy) parts.push(`- HASHTAGS: ${config.hashtag_strategy}`)
    parts.push(`- Post length: ${config.post_length_min || 100}-${config.post_length_max || 200} words`)
    if (config.formatting_rules) parts.push(`- FORMAT: ${config.formatting_rules}`)
    if (config.writing_style_notes) parts.push(`- STYLE NOTES: ${config.writing_style_notes}`)
    if (config.example_posts) {
      parts.push('\nREFERENCE POSTS (match this voice and style):')
      parts.push(config.example_posts)
    }
    return parts.join('\n')
  }

  const handleResearch = async () => {
    if (!selClientId) return
    setError('')
    setStep('researching')
    const researchContext = buildResearchContext()
    try {
      const raw = await callClaude(
        `You are a senior social media strategist researching trending content topics for a LinkedIn thought leader.

RESEARCH APPROACH:
- Search LinkedIn trends, industry blogs, Reddit discussions, Quora questions, and trending search queries
- Look for contrarian angles, not obvious takes everyone posts
- Prioritise topics that spark debate or have a strong personal story angle
- Avoid generic motivational content, listicles, and "5 tips" style topics
${researchContext ? `\nCLIENT-SPECIFIC RESEARCH INSTRUCTIONS:\n${researchContext}` : ''}

OUTPUT: Return EXACTLY a JSON array of 6-8 topic objects. No markdown, no preamble. Just the JSON array.
Each object: {"title":"...","angle":"...","source":"...","hook_type":"contrarian|personal_story|data_backed|hot_take|how_to|case_study","why":"..."}`,
        `Research trending content topics for this LinkedIn creator:
CLIENT: ${client.full_name}
COMPANY: ${client.company || 'N/A'}
NICHE: ${client.niche || config?.industry || 'General business'}
${config?.unique_angle ? `THEIR UNIQUE ANGLE: ${config.unique_angle}` : ''}
${config?.target_audience ? `TARGET AUDIENCE: ${config.target_audience}` : ''}
${customContext ? `ADDITIONAL CONTEXT: ${customContext}` : ''}

Search current trends in their niche across LinkedIn, Reddit, Quora, industry blogs, and search trends from the last 2-4 weeks.${config?.research_keywords ? ` Pay special attention to these keywords: ${config.research_keywords}` : ''}${config?.subreddits ? ` Check these subreddits: ${config.subreddits}` : ''}
Return ONLY the JSON array.`,
        true
      )
      const parsed = parseJsonFromAI(raw)
      if (parsed) { setTopics(parsed); setStep('pick_topics') }
      else { setError('Failed to parse research results. Try again.'); setStep('select_client') }
    } catch (e) {
      setError(`Research failed: ${e.message}. Check your Anthropic API key.`)
      setStep('select_client')
    }
  }

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) return
    setError('')
    setStep('generating')
    const chosenTopics = selectedTopics.map(i => topics[i])
    const voicePrompt = buildVoicePrompt()
    try {
      const raw = await callClaude(
        `You are a LinkedIn ghostwriter creating posts for a specific client. Follow their voice profile EXACTLY.

${voicePrompt}

HOOK STRATEGY (first 2 lines make or break the post):
- Contrarian: Challenge accepted belief with a specific example
- Personal story: Real experience with specific detail (names, numbers, situations)
- Data-backed: Lead with a surprising number
- Hot take: Provocative opinion stated confidently
- Pattern interrupt: Start with something unexpected
${config?.day_themes ? `\nDAY-OF-WEEK THEMES:\n${config.day_themes}` : ''}

OUTPUT: Return EXACTLY a JSON array of post objects. No markdown, no preamble. Just JSON.
Each: {"content":"...","topic":"...","hook_type":"...","content_type":"Text|Carousel","day_suggestion":"Mon|Tue|Wed|Thu|Fri"}`,
        `Generate ${numDays} LinkedIn posts for:
CLIENT: ${client.full_name}
COMPANY: ${client.company || 'N/A'}
NICHE: ${client.niche || config?.industry || 'General business'}

TOPICS:
${chosenTopics.map((t, i) => `${i + 1}. ${t.title} — Angle: ${t.angle} — Hook: ${t.hook_type}`).join('\n')}

Create ${numDays} posts distributed across topics. Vary hook types.${config?.day_themes ? ` Match posts to the day themes: ${config.day_themes}` : ''} Return ONLY JSON.`,
        false
      )
      const parsed = parseJsonFromAI(raw)
      if (parsed) { setGeneratedPosts(parsed); setStep('review_posts') }
      else { setError('Failed to parse posts. Try again.'); setStep('pick_topics') }
    } catch (e) {
      setError(`Generation failed: ${e.message}`)
      setStep('pick_topics')
    }
  }

  const handleSavePosts = async (pushForReview = false) => {
    setSaving(true)
    const today = new Date()
    let dayOffset = 1
    for (let i = 0; i < generatedPosts.length; i++) {
      const p = generatedPosts[i]
      const schedDate = new Date(today)
      schedDate.setDate(today.getDate() + dayOffset)
      while (schedDate.getDay() === 0 || schedDate.getDay() === 6) schedDate.setDate(schedDate.getDate() + 1)
      dayOffset = Math.floor((schedDate - today) / 86400000) + 1
      await supabase.from('posts').insert({
        client_id: selClientId, content: p.content,
        scheduled_date: schedDate.toISOString().split('T')[0],
        platform: 'LinkedIn', content_type: p.content_type || 'Text',
        status: pushForReview ? 'pending_review' : 'draft', created_by: profile.id,
      })
    }
    setSaving(false)
    setStep('done')
  }

  const toggleTopic = (idx) => setSelectedTopics(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  const startEdit = (idx) => { setEditingIdx(idx); setEditContent(generatedPosts[idx].content) }
  const saveEdit = () => { setGeneratedPosts(prev => prev.map((p, i) => i === editingIdx ? { ...p, content: editContent } : p)); setEditingIdx(null) }
  const removePost = (idx) => setGeneratedPosts(prev => prev.filter((_, i) => i !== idx))
  const resetWizard = () => { setStep('select_client'); setTopics([]); setSelectedTopics([]); setGeneratedPosts([]); setError(''); setCustomContext('') }

  // ── QA Check (runs client-side, instant) ──
  const DEFAULT_BANNED = ['transformative','unlock','empower','leverage','elevate','game-changer','navigate','foster','delve','crucial','landscape','groundbreaking','cutting-edge','synergy','paradigm','holistic']
  const AI_TELLS = ['in today\'s','it\'s worth noting','it\'s important to','let\'s dive','at the end of the day','in conclusion','here\'s the thing','the reality is','let me be clear','without further ado','in this post']
  const ENGAGEMENT_BAIT = ['repost if','save this','comment below','follow me','p.s. follow','p.p.s','like if you agree','share if','tag someone']

  const qaCheck = (content) => {
    const issues = []
    const lower = content.toLowerCase()
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
    const bannedList = config?.banned_words ? config.banned_words.split(',').map(w => w.trim().toLowerCase()).filter(Boolean) : DEFAULT_BANNED

    // Banned words
    const foundBanned = bannedList.filter(w => lower.includes(w))
    if (foundBanned.length) issues.push({ type: 'error', msg: `Banned words: ${foundBanned.join(', ')}` })

    // AI-sounding phrases
    const foundAI = AI_TELLS.filter(p => lower.includes(p))
    if (foundAI.length) issues.push({ type: 'warning', msg: `AI-sounding phrases: "${foundAI.join('", "')}"` })

    // Engagement bait
    const foundBait = ENGAGEMENT_BAIT.filter(p => lower.includes(p))
    if (foundBait.length) issues.push({ type: 'error', msg: `Engagement bait detected: "${foundBait.join('", "')}"` })

    // Emoji check
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    const emojiPolicy = config?.emoji_policy || 'never'
    if (emojiPolicy === 'never' && emojiRegex.test(content)) issues.push({ type: 'error', msg: 'Contains emojis (client policy: never)' })

    // Length
    const minLen = config?.post_length_min || 100
    const maxLen = config?.post_length_max || 200
    if (wordCount < minLen * 0.7) issues.push({ type: 'warning', msg: `Too short: ${wordCount} words (target: ${minLen}-${maxLen})` })
    if (wordCount > maxLen * 1.3) issues.push({ type: 'warning', msg: `Too long: ${wordCount} words (target: ${minLen}-${maxLen})` })

    // Exclamation marks (often AI-generated)
    const exclamations = (content.match(/!/g) || []).length
    if (exclamations > 2) issues.push({ type: 'warning', msg: `${exclamations} exclamation marks (may sound AI-generated)` })

    return issues
  }

  const QAFlags = ({ content }) => {
    const issues = qaCheck(content)
    if (issues.length === 0) return <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: C.green }}><span>✓</span> Passed QA checks</div>
    return (
      <div style={{ marginTop: 8 }}>
        {issues.map((iss, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 0', fontSize: 12, color: iss.type === 'error' ? C.red : C.yellow }}>
            <span style={{ flexShrink: 0 }}>{iss.type === 'error' ? '✕' : '⚠'}</span>
            <span>{iss.msg}</span>
          </div>
        ))}
      </div>
    )
  }

  const stepDefs = [
    { id: 'select_client', label: '1. Client' }, { id: 'researching', label: '2. Research' },
    { id: 'pick_topics', label: '3. Topics' }, { id: 'generating', label: '4. Generate' },
    { id: 'review_posts', label: '5. Review' },
  ]
  const stepOrder = ['select_client', 'researching', 'pick_topics', 'generating', 'review_posts', 'done']
  const currentIdx = stepOrder.indexOf(step)

  return (
    <div className="fade-in">
      <PageHeader title="Create Content" subtitle="AI-powered research → topic selection → post generation" />

      {error && (
        <div style={{ padding: '14px 20px', background: C.redLight, borderRadius: 10, border: `1px solid ${C.red}33`, marginBottom: 20, fontSize: 13, color: C.red }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontWeight: 600 }}>✕</button>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {stepDefs.map((s) => {
          const sIdx = stepOrder.indexOf(s.id)
          const active = step === s.id; const done = sIdx < currentIdx
          return (
            <div key={s.id} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 4, borderRadius: 2, background: done ? C.green : active ? C.blue : C.g200, marginBottom: 6, transition: 'all 0.3s' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: done ? C.green : active ? C.blue : C.g400 }}>{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* STEP 1: Select Client */}
      {step === 'select_client' && (
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 20 }}>Select Client & Context</h3>
          <Sel label="Client" value={selClientId} onChange={setSelClientId}
            options={[{ value: '', label: 'Choose a client...' }, ...clients.map(c => ({ value: c.id, label: `${c.full_name} — ${c.company || ''} (${c.niche || 'General'})` }))]} />
          {selClientId && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
              background: config ? C.greenLight : C.yellowLight,
              border: `1px solid ${config ? C.green + '33' : C.yellow + '33'}`,
              color: config ? C.green : C.g700 }}>
              {config
                ? `✓ Voice profile configured — ${config.voice_tone || 'Custom voice'}, ${config.emoji_policy === 'never' ? 'no emojis' : config.emoji_policy}, ${config.post_length_min}-${config.post_length_max} words`
                : '⚠ No voice profile configured for this client. Posts will use default settings. Configure in Clients → Configure Voice & Content.'}
            </div>
          )}
          <Field label="Additional Context (optional)" value={customContext} onChange={setCustomContext} textarea rows={3}
            placeholder="e.g. Focus on cybersecurity topics, they launched a new product this week, avoid AI content..." />
          <Sel label="Number of Posts" value={numDays} onChange={setNumDays}
            options={[3,4,5,6,7].map(n => ({ value: String(n), label: `${n} posts` }))} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn onClick={handleResearch} disabled={!selClientId} sz="lg">⚡ Research Topics</Btn>
          </div>
        </Card>
      )}

      {/* STEP 2: Researching */}
      {step === 'researching' && (
        <Card style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Loader />
          <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginTop: 16 }}>Researching topics for {client?.full_name}...</div>
          <div style={{ fontSize: 13, color: C.g500, marginTop: 8 }}>Searching LinkedIn, Reddit, Quora, blogs, and trending queries in {client?.niche || 'their niche'}</div>
        </Card>
      )}

      {/* STEP 3: Pick Topics */}
      {step === 'pick_topics' && (
        <div>
          <Card style={{ marginBottom: 16, background: C.blueLight, border: `1px solid ${C.blue}33` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Select 2-3 topics for {client?.full_name}'s posts</div>
            <div style={{ fontSize: 13, color: C.g600, marginTop: 4 }}>These will be used to generate {numDays} posts.</div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {topics.map((t, i) => {
              const sel = selectedTopics.includes(i)
              return (
                <Card key={i} onClick={() => toggleTopic(i)} style={{
                  cursor: 'pointer', padding: 18, border: `2px solid ${sel ? C.blue : C.g200}`, background: sel ? C.blueLight : C.white,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{t.title}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.g100, color: C.g600 }}>{t.hook_type}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.g700, lineHeight: 1.5, marginBottom: 6 }}>{t.angle}</div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.g400 }}>
                        <span>Source: {t.source}</span>
                      </div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginLeft: 12,
                      border: `2px solid ${sel ? C.blue : C.g300}`, background: sel ? C.blue : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 14, fontWeight: 700,
                    }}>{sel && '✓'}</div>
                  </div>
                </Card>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn v="secondary" onClick={resetWizard}>← Start Over</Btn>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn v="secondary" onClick={handleResearch}>↻ Re-research</Btn>
              <Btn onClick={handleGenerate} disabled={selectedTopics.length === 0} sz="lg">
                Generate {numDays} Posts →
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Generating */}
      {step === 'generating' && (
        <Card style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Loader />
          <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginTop: 16 }}>Generating {numDays} posts...</div>
          <div style={{ fontSize: 13, color: C.g500, marginTop: 8 }}>Applying voice rules, hook strategies, and formatting guidelines</div>
        </Card>
      )}

      {/* STEP 5: Review Posts */}
      {step === 'review_posts' && (
        <div>
          {/* QA Summary Banner */}
          {(() => {
            const totalIssues = generatedPosts.reduce((s, p) => s + qaCheck(p.content).filter(i => i.type === 'error').length, 0)
            const totalWarnings = generatedPosts.reduce((s, p) => s + qaCheck(p.content).filter(i => i.type === 'warning').length, 0)
            const allClear = totalIssues === 0 && totalWarnings === 0
            return (
              <Card style={{ marginBottom: 16, background: allClear ? C.greenLight : totalIssues > 0 ? C.redLight : C.yellowLight, border: `1px solid ${allClear ? C.green : totalIssues > 0 ? C.red : C.yellow}33` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{generatedPosts.length} posts generated for {client?.full_name}</div>
                    <div style={{ fontSize: 13, color: C.g600, marginTop: 4 }}>
                      {allClear ? '✓ All posts passed QA checks — ready to review and push' :
                       `QA found ${totalIssues > 0 ? `${totalIssues} error${totalIssues !== 1 ? 's' : ''}` : ''}${totalIssues > 0 && totalWarnings > 0 ? ' and ' : ''}${totalWarnings > 0 ? `${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}` : ''} — review flagged items below`}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {generatedPosts.map((p, i) => {
              const issues = qaCheck(p.content)
              const hasErrors = issues.some(iss => iss.type === 'error')
              return (
              <Card key={i} style={{ padding: 20, borderLeft: `4px solid ${issues.length === 0 ? C.green : hasErrors ? C.red : C.yellow}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Post {i + 1}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.g100, color: C.g600 }}>{p.hook_type}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.blueLight, color: C.blue }}>{p.content_type || 'Text'}</span>
                    {p.day_suggestion && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.orangeLight, color: C.orange }}>{p.day_suggestion}</span>}
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: issues.length === 0 ? C.greenLight : hasErrors ? C.redLight : C.yellowLight, color: issues.length === 0 ? C.green : hasErrors ? C.red : C.yellow, fontWeight: 600 }}>
                      {issues.length === 0 ? '✓ Clean' : `${issues.length} issue${issues.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {editingIdx === i ? <Btn v="success" sz="sm" onClick={saveEdit}>Save</Btn> : <Btn v="secondary" sz="sm" onClick={() => startEdit(i)}>Edit</Btn>}
                    <Btn v="danger" sz="sm" onClick={() => removePost(i)}>✕</Btn>
                  </div>
                </div>
                {editingIdx === i ? (
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8}
                    style={{ width: '100%', padding: 14, borderRadius: 8, border: `1px solid ${C.blue}`, fontSize: 14, fontFamily: 'inherit', lineHeight: 1.7, resize: 'vertical' }} />
                ) : (
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: C.g800, whiteSpace: 'pre-wrap', background: C.g50, padding: 16, borderRadius: 10, border: `1px solid ${C.g200}` }}>
                    {p.content}
                  </div>
                )}
                <QAFlags content={p.content} />
                {p.topic && <div style={{ fontSize: 12, color: C.g400, marginTop: 8 }}>Topic: {p.topic}</div>}
              </Card>
            )})}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn v="secondary" onClick={() => setStep('pick_topics')}>← Back to Topics</Btn>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn v="secondary" onClick={() => handleSavePosts(false)} disabled={saving || generatedPosts.length === 0}>
                {saving ? 'Saving...' : 'Save as Drafts'}
              </Btn>
              <Btn v="orange" sz="lg" onClick={() => handleSavePosts(true)} disabled={saving || generatedPosts.length === 0}>
                {saving ? 'Saving...' : 'Push to Client for Review'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Done */}
      {step === 'done' && (
        <Card style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Posts Created!</div>
          <div style={{ fontSize: 14, color: C.g500, marginBottom: 24 }}>{generatedPosts.length} posts saved and visible in the Content Pipeline.</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Btn v="secondary" onClick={resetWizard}>Create More Content</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS PAGE
   ═══════════════════════════════════════════════════════════════ */

const NOTIF_LABELS = {
  content_ready_for_review: { label: 'Content ready for review', icon: '✎', color: C.orange },
  content_approved: { label: 'Content approved', icon: '✓', color: C.green },
  content_changes_requested: { label: 'Changes requested on content', icon: '↩', color: C.orange },
  graphic_ready_for_review: { label: 'Graphic ready for review', icon: '🖼', color: C.blue },
  graphic_approved: { label: 'Graphic approved', icon: '✓', color: C.green },
  graphic_changes_requested: { label: 'Changes requested on graphic', icon: '↩', color: C.orange },
  comment_added: { label: 'New comment', icon: '💬', color: C.blue },
}

function NotificationsPage({ profile }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = async () => {
    setLoading(true)
    const { data } = await supabase.from('notifications').select('*, posts(content, profiles!posts_client_id_fkey(full_name))')
      .eq('recipient_id', profile.id).order('created_at', { ascending: false }).limit(50)
    setNotifications(data || [])
    setLoading(false)
    // Mark all as read
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', profile.id).eq('read', false)
  }

  useEffect(() => { fetchNotifs() }, [profile.id])

  return (
    <div className="fade-in">
      <PageHeader title="Notifications" subtitle={`${notifications.filter(n => !n.read).length} unread`} />
      {loading ? <Loader /> : notifications.length === 0 ? <EmptyState icon="🔔" title="No notifications" sub="You'll see updates here when content moves through the workflow" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifications.map(n => {
            const meta = NOTIF_LABELS[n.type] || { label: n.type, icon: '•', color: C.g500 }
            const postPreview = n.posts?.content?.slice(0, 80) + (n.posts?.content?.length > 80 ? '...' : '')
            const clientName = n.posts?.profiles?.full_name
            return (
              <div key={n.id} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 10, background: n.read ? C.white : C.blueLight, border: `1px solid ${n.read ? C.g200 : C.blue + '33'}` }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: meta.color + '15', color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{meta.label}</div>
                  {clientName && <div style={{ fontSize: 12, color: C.g500, marginTop: 2 }}>{clientName}</div>}
                  {postPreview && <div style={{ fontSize: 13, color: C.g600, marginTop: 4, lineHeight: 1.4 }}>{postPreview}</div>}
                  <div style={{ fontSize: 11, color: C.g400, marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0, marginTop: 4 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const auth = useAuth()
  const [view, setView] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (auth.profile) {
      setView(auth.profile.role === 'admin' ? 'dashboard' : 'my_dashboard')
      // Fetch unread notification count
      const fetchUnread = async () => {
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true })
          .eq('recipient_id', auth.profile.id).eq('read', false)
        setUnreadCount(count || 0)
      }
      fetchUnread()
      // Poll every 30 seconds
      const interval = setInterval(fetchUnread, 30000)
      return () => clearInterval(interval)
    }
  }, [auth.profile])

  if (auth.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.g50 }}>
        <style>{globalStyles}</style>
        <Loader />
      </div>
    )
  }

  if (!auth.session || !auth.profile) {
    return (
      <>
        <style>{globalStyles}</style>
        <LoginPage onAuth={auth} />
      </>
    )
  }

  const isAdmin = auth.profile.role === 'admin'

  const renderView = () => {
    if (isAdmin) {
      switch (view) {
        case 'dashboard': return <AdminDashboard profile={auth.profile} />
        case 'create':    return <AdminCreateContent profile={auth.profile} />
        case 'content':   return <AdminContent profile={auth.profile} />
        case 'clients':   return <AdminClients profile={auth.profile} />
        case 'reports':   return <AdminReports profile={auth.profile} />
        case 'notifications': return <NotificationsPage profile={auth.profile} />
        default:          return <AdminDashboard profile={auth.profile} />
      }
    } else {
      switch (view) {
        case 'my_dashboard': return <ClientDashboard profile={auth.profile} />
        case 'my_content':  return <ClientContent profile={auth.profile} />
        case 'calendar':    return <ClientCalendar profile={auth.profile} />
        case 'my_reports':  return <ClientReports profile={auth.profile} />
        case 'notifications': return <NotificationsPage profile={auth.profile} />
        default:            return <ClientDashboard profile={auth.profile} />
      }
    }
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar profile={auth.profile} view={view} setView={setView} onLogout={auth.signOut} unreadCount={unreadCount} />
        <main style={{ flex: 1, padding: 32, overflow: 'auto', maxHeight: '100vh' }}>
          {renderView()}
        </main>
      </div>
    </>
  )
}
