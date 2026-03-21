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
  const [fullName, setFullName] = useState('')
  const [signUpRole, setSignUpRole] = useState('client')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.navy} 0%, #1a2744 50%, ${C.darkNavy} 100%)` }}>
      <div style={{ width: 420, maxWidth: '90vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: C.white, letterSpacing: -2 }}>DPT</div>
          <div style={{ fontSize: 13, color: C.g400, letterSpacing: 5, textTransform: 'uppercase', marginTop: 4 }}>Content Hub</div>
        </div>
        <Card style={{ padding: 36 }}>
          <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 700, color: C.navy }}>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: error.includes('Check your email') ? C.greenLight : C.redLight, color: error.includes('Check your email') ? C.green : C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {isSignUp && <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Jane Smith" />}
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
          <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          {isSignUp && (
            <Sel label="Account Type" value={signUpRole} onChange={setSignUpRole} options={[
              { value: 'client', label: 'Client' },
              { value: 'admin', label: 'DPT Admin' },
            ]} />
          )}
          <Btn onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: 8 }} sz="lg">
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Btn>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => { setIsSignUp(!isSignUp); setError('') }} style={{ background: 'none', border: 'none', color: C.blue, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
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

function Sidebar({ profile, view, setView, onLogout }) {
  const isAdmin = profile?.role === 'admin'
  const items = isAdmin
    ? [{ id: 'dashboard', label: 'Dashboard', icon: '◉' }, { id: 'create', label: 'Create Content', icon: '⚡' }, { id: 'content', label: 'Content', icon: '✎' }, { id: 'clients', label: 'Clients', icon: '◎' }, { id: 'reports', label: 'Reports', icon: '▤' }]
    : [{ id: 'my_content', label: 'My Content', icon: '✎' }, { id: 'my_reports', label: 'My Reports', icon: '▤' }]

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
            <span style={{ fontSize: 14, fontWeight: view === it.id ? 600 : 400 }}>{it.label}</span>
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
    </div>
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
  const isAdmin = profile?.role === 'admin'
  const isClient = profile?.role === 'client'

  if (!post) return null

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
          <div style={{ fontSize: 14, lineHeight: 1.7, color: C.g800, whiteSpace: 'pre-wrap', background: C.g50, padding: 16, borderRadius: 10, border: `1px solid ${C.g200}` }}>
            {post.content}
          </div>
        </div>

        {/* Graphic */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 8 }}>Graphic</div>
          {post.graphic_url ? (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.g200}` }}>
              <img src={post.graphic_url} alt="Post graphic" style={{ width: '100%', display: 'block' }} />
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
                {post.status === 'draft' && <Btn v="orange" sz="sm" onClick={() => updateStatus('pending_review')}>Send for Review</Btn>}
                {post.status === 'approved' && <Btn v="primary" sz="sm" onClick={() => updateStatus('scheduled')}>Mark Scheduled</Btn>}
                {post.status === 'scheduled' && <Btn v="success" sz="sm" onClick={() => updateStatus('posted')}>Mark Posted</Btn>}
                {post.status === 'changes_requested' && <Btn v="orange" sz="sm" onClick={() => updateStatus('pending_review')}>Resubmit for Review</Btn>}
              </>
            )}
            {isClient && (
              <>
                {post.status === 'pending_review' && !showChangesFeedback && (
                  <>
                    <Btn v="success" sz="sm" onClick={() => updateStatus('approved')}>✓ Approve</Btn>
                    <Btn v="orange" sz="sm" onClick={() => setShowChangesFeedback(true)}>Request Changes</Btn>
                  </>
                )}
              </>
            )}
          </div>

          {/* Changes Requested Feedback Form */}
          {isClient && showChangesFeedback && (
            <div style={{ marginTop: 12, padding: 16, background: C.orangeLight, borderRadius: 10, border: `1px solid ${C.orange}33` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 8 }}>What changes do you need?</div>
              <textarea
                value={changesFeedback}
                onChange={e => setChangesFeedback(e.target.value)}
                placeholder="Describe the changes you'd like — e.g. soften the tone, change the hook, remove a specific line..."
                rows={4}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${C.orange}55`, fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', background: C.white }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <Btn v="secondary" sz="sm" onClick={() => { setShowChangesFeedback(false); setChangesFeedback('') }}>Cancel</Btn>
                <Btn v="orange" sz="sm" onClick={submitChangesRequested} disabled={!changesFeedback.trim()}>Submit Feedback</Btn>
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
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'

  // Quick action states
  const [datePickerPostId, setDatePickerPostId] = useState(null)
  const [datePickerAction, setDatePickerAction] = useState(null) // 'schedule' or 'post'
  const [pickedDate, setPickedDate] = useState('')

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
          <Btn onClick={() => setShowCreate(true)}>+ New Post</Btn>
        </div>} />

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
            <Card key={p.id} onClick={() => setSelectedPost(p)} style={{ padding: 16, cursor: 'pointer', transition: 'all 0.15s', border: `1px solid ${selectedPost?.id === p.id ? C.blue : C.g200}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
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

function AdminClients({ profile }) {
  const { clients, loading, refresh } = useClients()
  const [showInvite, setShowInvite] = useState(false)
  const [invEmail, setInvEmail] = useState('')
  const [invName, setInvName] = useState('')
  const [invCompany, setInvCompany] = useState('')
  const [invNiche, setInvNiche] = useState('')
  const [inviting, setInviting] = useState(false)
  const [invMsg, setInvMsg] = useState('')

  const handleInvite = async () => {
    if (!invEmail || !invName) return
    setInviting(true)
    setInvMsg('')
    // Create user via signup with temp password (client changes later)
    const tempPw = 'Welcome123!'
    const { error } = await supabase.auth.signUp({
      email: invEmail,
      password: tempPw,
      options: { data: { full_name: invName, role: 'client' } }
    })
    if (error) {
      setInvMsg(error.message)
    } else {
      // Update profile with extra details
      // Note: profile is created by trigger, we update it after a brief delay
      setTimeout(async () => {
        await supabase.from('profiles').update({ company: invCompany, niche: invNiche, avatar_initials: invName.split(' ').map(w => w[0]).join('').slice(0, 2) }).eq('email', invEmail)
        refresh()
      }, 1000)
      setInvMsg(`Invite sent to ${invEmail}. Temp password: ${tempPw}`)
      setInvEmail('')
      setInvName('')
      setInvCompany('')
      setInvNiche('')
    }
    setInviting(false)
  }

  return (
    <div className="fade-in">
      <PageHeader title="Clients" subtitle={`${clients.length} active clients`}
        action={<Btn onClick={() => setShowInvite(true)}>+ Add Client</Btn>} />

      {loading ? <Loader /> : clients.length === 0 ? <EmptyState icon="◎" title="No clients" sub="Add your first client to get started" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {clients.map(c => (
            <Card key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <Avatar initials={c.avatar_initials || c.full_name?.split(' ').map(w => w[0]).join('')} size={44} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{c.full_name}</div>
                  <div style={{ fontSize: 13, color: C.g500 }}>{c.company || 'No company'}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.g400 }}>
                {c.email}<br />
                {c.niche && <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4, background: C.g100, fontSize: 11, color: C.g600 }}>{c.niche}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

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
  const [showPostMetrics, setShowPostMetrics] = useState(false)
  const [tab, setTab] = useState('weekly') // 'weekly' or 'posts'

  // Date range for report
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Posted posts in date range (for per-post metrics)
  const [postedPosts, setPostedPosts] = useState([])
  const [postMetrics, setPostMetrics] = useState({}) // { postId: { impressions, likes, ... } }
  const [loadingPosts, setLoadingPosts] = useState(false)

  // Form fields for weekly data
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

  const client = clients.find(c => c.id === selClient)

  // Fetch posted posts in date range
  const fetchPostedPosts = async () => {
    if (!selClient || !dateFrom || !dateTo) return
    setLoadingPosts(true)
    const { data: posts } = await supabase
      .from('posts')
      .select('*, post_metrics(*)')
      .eq('client_id', selClient)
      .eq('status', 'posted')
      .gte('posted_date', dateFrom)
      .lte('posted_date', dateTo)
      .order('posted_date', { ascending: true })

    setPostedPosts(posts || [])

    // Pre-fill existing metrics
    const metrics = {}
    ;(posts || []).forEach(p => {
      if (p.post_metrics && p.post_metrics.length > 0) {
        const m = p.post_metrics[0]
        metrics[p.id] = { impressions: m.impressions || '', likes: m.likes || '', comments: m.comments || '', shares: m.shares || '', reposts: m.reposts || '', clicks: m.clicks || '', saves: m.saves || '', video_views: m.video_views || '', engagement_rate: m.engagement_rate || '', notes: m.notes || '' }
      }
    })
    setPostMetrics(metrics)
    setLoadingPosts(false)
  }

  useEffect(() => { if (selClient && dateFrom && dateTo) fetchPostedPosts() }, [selClient, dateFrom, dateTo])

  const handleSaveWeekly = async () => {
    if (!selClient || !wStart) return
    setSaving(true)
    await supabase.from('report_data').upsert({
      client_id: selClient, week_label: wLabel || `Week of ${wStart}`, week_start: wStart,
      impressions: parseInt(wImpressions) || 0, likes: parseInt(wLikes) || 0, comments: parseInt(wComments) || 0,
      shares: parseInt(wShares) || 0, profile_views: parseInt(wProfileViews) || 0,
      followers: parseInt(wFollowers) || 0, search_appearances: parseInt(wSearch) || 0,
    }, { onConflict: 'client_id,week_start' })
    setShowAdd(false)
    setWLabel(''); setWStart(''); setWImpressions(''); setWLikes(''); setWComments(''); setWShares(''); setWProfileViews(''); setWFollowers(''); setWSearch('')
    setSaving(false)
    refresh()
  }

  const updatePostMetric = (postId, field, value) => {
    setPostMetrics(prev => ({ ...prev, [postId]: { ...(prev[postId] || {}), [field]: value } }))
  }

  const savePostMetrics = async (postId) => {
    const m = postMetrics[postId]
    if (!m) return
    await supabase.from('post_metrics').upsert({
      post_id: postId,
      impressions: parseInt(m.impressions) || 0, likes: parseInt(m.likes) || 0,
      comments: parseInt(m.comments) || 0, shares: parseInt(m.shares) || 0,
      reposts: parseInt(m.reposts) || 0, clicks: parseInt(m.clicks) || 0,
      saves: parseInt(m.saves) || 0, video_views: parseInt(m.video_views) || 0,
      engagement_rate: parseFloat(m.engagement_rate) || 0, notes: m.notes || '',
    }, { onConflict: 'post_id' })
  }

  const saveAllPostMetrics = async () => {
    setSaving(true)
    for (const postId of Object.keys(postMetrics)) {
      await savePostMetrics(postId)
    }
    setSaving(false)
    fetchPostedPosts()
  }

  // Report KPIs
  const totalImps = reportData.reduce((s, d) => s + (d.impressions || 0), 0)
  const totalEng = reportData.reduce((s, d) => s + (d.likes || 0) + (d.comments || 0) + (d.shares || 0), 0)
  const avgEngRate = totalImps ? ((totalEng / totalImps) * 100).toFixed(1) : '0'
  const latestFollowers = reportData.length ? reportData[reportData.length - 1].followers : 0
  const firstFollowers = reportData.length ? reportData[0].followers : 0
  const followerGrowth = firstFollowers ? (((latestFollowers - firstFollowers) / firstFollowers) * 100).toFixed(0) : 0

  const metricFields = ['impressions', 'likes', 'comments', 'shares', 'reposts', 'clicks', 'saves', 'video_views']

  return (
    <div className="fade-in">
      <PageHeader title="Reports" subtitle="Weekly account metrics + per-post performance" />

      <Sel label="Select Client" value={selClient} onChange={v => { setSelClient(v); setPostedPosts([]) }}
        options={[{ value: '', label: 'Choose a client...' }, ...clients.map(c => ({ value: c.id, label: `${c.full_name} — ${c.company || ''}` }))]} />

      {selClient && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${C.g200}`, paddingBottom: 0 }}>
            {[{ id: 'weekly', label: 'Weekly Account Data' }, { id: 'posts', label: 'Per-Post Metrics' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '10px 20px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: tab === t.id ? C.white : 'transparent', color: tab === t.id ? C.navy : C.g400,
                borderBottom: tab === t.id ? `3px solid ${C.blue}` : '3px solid transparent', marginBottom: -2,
              }}>{t.label}</button>
            ))}
          </div>

          {/* WEEKLY TAB */}
          {tab === 'weekly' && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <Btn onClick={() => setShowAdd(true)}>+ Add Weekly Data</Btn>
                <Btn v="orange" onClick={() => setShowReport(true)} disabled={reportData.length === 0}>Generate Report</Btn>
              </div>
              {loading ? <Loader /> : reportData.length === 0 ? <EmptyState icon="▤" title="No data yet" sub="Add weekly LinkedIn metrics" /> : (
                <Card style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.navy, color: C.white }}>
                        {['Week', 'Impressions', 'Likes', 'Comments', 'Shares', 'Profile Views', 'Followers', 'Search'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((d, i) => (
                        <tr key={d.id} style={{ background: i % 2 ? C.g50 : C.white }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{d.week_label}</td>
                          <td style={{ padding: '10px 14px' }}>{d.impressions?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>{d.likes?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>{d.comments?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>{d.shares?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>{d.profile_views?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>{d.followers?.toLocaleString()}</td>
                          <td style={{ padding: '10px 14px' }}>{d.search_appearances?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </>
          )}

          {/* PER-POST TAB */}
          {tab === 'posts' && (
            <>
              <Card style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 12 }}>Select date range to see posted content</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <Field label="From" value={dateFrom} onChange={setDateFrom} type="date" style={{ marginBottom: 0 }} />
                  <Field label="To" value={dateTo} onChange={setDateTo} type="date" style={{ marginBottom: 0 }} />
                  <Btn onClick={fetchPostedPosts} disabled={!dateFrom || !dateTo} style={{ marginBottom: 16 }}>Load Posts</Btn>
                </div>
              </Card>

              {loadingPosts ? <Loader /> : postedPosts.length === 0 ? (
                <EmptyState icon="✎" title={dateFrom ? 'No posted content in this range' : 'Select a date range'} sub="Only posts marked as Posted with a posted date will appear here" />
              ) : (
                <>
                  <div style={{ fontSize: 13, color: C.g500, marginBottom: 12 }}>{postedPosts.length} posted posts found. Enter metrics for each, then save.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {postedPosts.map(p => {
                      const m = postMetrics[p.id] || {}
                      const hasMetrics = p.post_metrics && p.post_metrics.length > 0
                      return (
                        <Card key={p.id} style={{ padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: C.g400 }}>{p.posted_date && new Date(p.posted_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.g100, color: C.g600 }}>{p.content_type}</span>
                                {hasMetrics && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.greenLight, color: C.green }}>Has metrics</span>}
                              </div>
                              <div style={{ fontSize: 13, color: C.g700, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.content}</div>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                            {metricFields.map(f => (
                              <div key={f}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'capitalize' }}>{f.replace('_', ' ')}</label>
                                <input type="number" value={m[f] || ''} onChange={e => updatePostMetric(p.id, f, e.target.value)} placeholder="0"
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: C.g500 }}>Notes</label>
                            <input value={m.notes || ''} onChange={e => updatePostMetric(p.id, 'notes', e.target.value)} placeholder="e.g. Went viral, reshared by..."
                              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: 'inherit' }} />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Btn v="success" sz="lg" onClick={saveAllPostMetrics} disabled={saving}>
                      {saving ? 'Saving...' : 'Save All Post Metrics'}
                    </Btn>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Add Weekly Data Modal */}
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

      {/* Report Preview */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title="Performance Report" width={700}>
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ background: C.navy, color: C.white, padding: 32, borderRadius: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: C.g400, marginBottom: 8 }}>DPT Content Hub</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>LinkedIn Performance Report</div>
            <div style={{ fontSize: 14, color: C.g300 }}>
              {client?.full_name} — {client?.company}<br />
              {reportData.length > 0 && `${reportData[0].week_label} to ${reportData[reportData.length - 1].week_label}`}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Followers', value: latestFollowers.toLocaleString(), sub: `+${followerGrowth}% growth`, color: C.blue },
              { label: 'Total Impressions', value: totalImps.toLocaleString(), sub: `${reportData.length} weeks`, color: C.orange },
              { label: 'Total Engagements', value: totalEng.toLocaleString(), sub: 'Likes + Comments + Shares', color: C.green },
              { label: 'Avg Eng Rate', value: `${avgEngRate}%`, sub: 'Engagements / Impressions', color: C.navy },
            ].map((k, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, border: `1px solid ${C.g200}`, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.g600, marginTop: 2 }}>{k.label}</div>
                <div style={{ fontSize: 11, color: C.g400, marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Weekly Impressions</h3>
            {reportData.map((d, i) => {
              const maxImp = Math.max(...reportData.map(r => r.impressions || 0))
              const pct = maxImp ? ((d.impressions || 0) / maxImp) * 100 : 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 100, fontSize: 12, color: C.g500, flexShrink: 0 }}>{d.week_label}</div>
                  <div style={{ flex: 1, height: 24, background: C.g100, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${C.blue}, ${C.orange})`, borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 70, fontSize: 13, fontWeight: 600, color: C.navy, textAlign: 'right' }}>{(d.impressions || 0).toLocaleString()}</div>
                </div>
              )
            })}
          </div>

          {/* Top Posts Section (if post metrics exist) */}
          {postedPosts.filter(p => p.post_metrics?.length > 0).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Top Performing Posts</h3>
              {[...postedPosts].filter(p => p.post_metrics?.length > 0).sort((a, b) => (b.post_metrics?.[0]?.impressions || 0) - (a.post_metrics?.[0]?.impressions || 0)).slice(0, 5).map((p, i) => {
                const m = p.post_metrics[0]
                return (
                  <div key={i} style={{ padding: 14, marginBottom: 8, borderRadius: 8, border: `1px solid ${C.g200}`, background: i === 0 ? C.yellowLight : C.white }}>
                    <div style={{ fontSize: 13, color: C.g700, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>{p.content}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.g500 }}>
                      <span>{(m.impressions || 0).toLocaleString()} impr</span>
                      <span>{m.likes || 0} likes</span>
                      <span>{m.comments || 0} comments</span>
                      <span>{m.shares || 0} shares</span>
                      {m.clicks > 0 && <span>{m.clicks} clicks</span>}
                      {m.saves > 0 && <span>{m.saves} saves</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 24, padding: 16, background: C.g50, borderRadius: 8, textAlign: 'center', fontSize: 12, color: C.g400 }}>
            Confidential — Prepared by DPT Agency — {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.g200}` }}>
          <Btn v="secondary" onClick={() => setShowReport(false)}>Close</Btn>
          <Btn onClick={() => window.print()}>Print / Save PDF</Btn>
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

  const handleResearch = async () => {
    if (!selClientId) return
    setError('')
    setStep('researching')
    try {
      const raw = await callClaude(
        `You are a senior social media strategist researching trending content topics for a LinkedIn thought leader.

RESEARCH APPROACH:
- Search LinkedIn trends, industry blogs, Reddit discussions, Quora questions, and trending search queries
- Look for contrarian angles, not obvious takes everyone posts
- Prioritise topics that spark debate or have a strong personal story angle
- Avoid generic motivational content, listicles, and "5 tips" style topics

OUTPUT: Return EXACTLY a JSON array of 6-8 topic objects. No markdown, no preamble. Just the JSON array.
Each object: {"title":"...","angle":"...","source":"...","hook_type":"contrarian|personal_story|data_backed|hot_take|how_to|case_study","why":"..."}`,
        `Research trending content topics for this LinkedIn creator:
CLIENT: ${client.full_name}
COMPANY: ${client.company || 'N/A'}
NICHE: ${client.niche || 'General business'}
${customContext ? `ADDITIONAL CONTEXT: ${customContext}` : ''}

Search current trends in their niche across LinkedIn, Reddit, Quora, industry blogs, and search trends from the last 2-4 weeks. Return ONLY the JSON array.`,
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
    try {
      const raw = await callClaude(
        `You are a LinkedIn ghostwriter. Follow these rules EXACTLY:

VOICE RULES:
- First person as the client. Direct, practitioner voice — not a coach or motivational speaker
- Short lines. Lots of white space. No walls of text
- NO emojis. Ever
- BANNED WORDS: "transformative", "unlock", "empower", "leverage", "elevate", "game-changer", "navigate", "foster", "delve", "crucial", "landscape"
- NO engagement bait: no "REPOST if you agree", "SAVE this", "Comment FRAMEWORK below", "P.S. Follow me"
- Only acceptable CTA: "Link in comments" if sharing a resource
- Posts should be 100-200 words
- If it sounds like a TED talk or SaaS blog, rewrite it to sound like explaining to a colleague at a bar

HOOK STRATEGY (first 2 lines make or break the post):
- Contrarian: Challenge accepted belief with a specific example
- Personal story: Real experience with specific detail (names, numbers, situations)
- Data-backed: Lead with a surprising number
- Hot take: Provocative opinion stated confidently
- Pattern interrupt: Start with something unexpected

FORMAT:
- Short paragraphs (1-3 lines max)
- Line breaks between thoughts
- No bullet points in post body
- End with thought-provoking statement, NOT a CTA

OUTPUT: Return EXACTLY a JSON array of post objects. No markdown, no preamble. Just JSON.
Each: {"content":"...","topic":"...","hook_type":"...","content_type":"Text|Carousel","day_suggestion":"Mon|Tue|Wed|Thu|Fri"}`,
        `Generate ${numDays} LinkedIn posts for:
CLIENT: ${client.full_name}
COMPANY: ${client.company || 'N/A'}
NICHE: ${client.niche || 'General business'}
${customContext ? `CONTEXT: ${customContext}` : ''}

TOPICS:
${chosenTopics.map((t, i) => `${i + 1}. ${t.title} — Angle: ${t.angle} — Hook: ${t.hook_type}`).join('\n')}

Create ${numDays} posts distributed across topics. Vary hook types. Return ONLY JSON.`,
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
          <Card style={{ marginBottom: 16, background: C.greenLight, border: `1px solid ${C.green}33` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{generatedPosts.length} posts generated for {client?.full_name}</div>
            <div style={{ fontSize: 13, color: C.g600, marginTop: 4 }}>Review and edit below. Then save as drafts or push to client for review.</div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {generatedPosts.map((p, i) => (
              <Card key={i} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Post {i + 1}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.g100, color: C.g600 }}>{p.hook_type}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.blueLight, color: C.blue }}>{p.content_type || 'Text'}</span>
                    {p.day_suggestion && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: C.orangeLight, color: C.orange }}>{p.day_suggestion}</span>}
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
                {p.topic && <div style={{ fontSize: 12, color: C.g400, marginTop: 8 }}>Topic: {p.topic}</div>}
              </Card>
            ))}
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

export default function App() {
  const auth = useAuth()
  const [view, setView] = useState('')

  useEffect(() => {
    if (auth.profile) {
      setView(auth.profile.role === 'admin' ? 'dashboard' : 'my_content')
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
        default:          return <AdminDashboard profile={auth.profile} />
      }
    } else {
      switch (view) {
        case 'my_content':  return <ClientContent profile={auth.profile} />
        case 'calendar':    return <ClientCalendar profile={auth.profile} />
        case 'my_reports':  return <ClientReports profile={auth.profile} />
        default:            return <ClientContent profile={auth.profile} />
      }
    }
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar profile={auth.profile} view={view} setView={setView} onLogout={auth.signOut} />
        <main style={{ flex: 1, padding: 32, overflow: 'auto', maxHeight: '100vh' }}>
          {renderView()}
        </main>
      </div>
    </>
  )
}
