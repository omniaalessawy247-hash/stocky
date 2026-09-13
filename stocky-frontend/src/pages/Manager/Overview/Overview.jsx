import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, RadialBarChart, RadialBar, PolarAngleAxis,
  AreaChart, Area,
} from 'recharts'
import {
  Package, TrendingDown, TrendingUp, Truck, Wallet, ArrowUpRight, X, ChevronRight,
  RefreshCw, AlertTriangle, Layers, Gem, Filter, ChevronDown, Bug, Boxes, PackagePlus,
  Lightbulb, Bot,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../../api/client'
import { useAuth } from '../../../context/AuthContext'
import './Overview.css'

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9', '#84cc16']
const METRIC_ACCENTS = ['#818cf8', '#06b6d4', '#f43f5e', '#10b981']
const MAX_AI_ATTEMPTS = 40

const AI_SECTION_CONFIG = [
  { key: 'sales', title: 'Sales Performance', icon: TrendingUp, color: '#10b981' },
  { key: 'inventory', title: 'Inventory Status', icon: Boxes, color: '#f59e0b' },
  { key: 'new_products', title: 'New Products', icon: PackagePlus, color: '#8b5cf6' },
  { key: 'recommendations', title: 'Recommendations', icon: Lightbulb, color: '#f43f5e' },
]

/* ------------------------------------------------------------------ */
/* Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 130, damping: 18 } },
}
const sectionsContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const sectionItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

function AnimatedNumber({ value, prefix = '', decimals = 0 }) {
  const animated = useCountUp(value)
  return (
    <>
      {prefix}
      {animated.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
    </>
  )
}

function ChartSkeleton({ height = 220 }) {
  return (
    <div className="chart-skeleton" style={{ height }}>
      {[0, 120, 240, 360, 480].map((delay) => (
        <div key={delay} className="chart-skeleton-bar" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </div>
  )
}

function MetricCard({ accent, primary, children }) {
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }
  return (
    <div
      className={`metric-card ${primary ? 'metric-primary' : ''}`}
      style={{ '--card-accent': accent }}
      onMouseMove={handleMove}
    >
      {children}
    </div>
  )
}

function CategoryRing({ name, percent, color, index, active, onClick }) {
  const radius = 27
  const circumference = 2 * Math.PI * radius
  return (
    <motion.button
      type="button"
      className={`ring-item ${active ? 'ring-item-active' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.97 }}
      transition={{ delay: 0.08 * index, duration: 0.4 }}
      onClick={onClick}
    >
      <div className="ring-svg-wrap">
        <svg viewBox="0 0 64 64" className="ring-svg">
          <circle cx="32" cy="32" r={radius} className="ring-track" />
          <motion.circle
            cx="32" cy="32" r={radius}
            className="ring-progress"
            stroke={color}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
            transition={{ duration: 1, delay: 0.15 * index, ease: 'easeOut' }}
          />
        </svg>
        <span className="ring-percent">{percent}%</span>
      </div>
      <span className="ring-label">{name}</span>
    </motion.button>
  )
}

/**
 * Featured banner that surfaces the AI-generated inventory insight.
 * Deliberately placed right under the page header so it reads as a
 * first-class feature rather than something buried at the bottom.
 */
function AIInsightsBanner({ status, onOpen }) {
  const isError = status === 'error'
  const isLoading = status === 'loading'
  const isReady = status === 'ready'

  const subtitle = isError
    ? 'Something went wrong — tap to see what happened'
    : isLoading
    ? 'Analyzing your stock, sales and suppliers…'
    : 'Your latest inventory analysis is ready'

  return (
    <motion.button
      type="button"
      className={`ai-insights-banner ${isError ? 'ai-insights-banner-error' : ''}`}
      variants={itemVariants}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      aria-haspopup="dialog"
    >
      <span className="ai-insights-icon">
        {isError ? <AlertTriangle size={19} /> : <Bot size={19} />}
        {isLoading && <span className="ai-insights-icon-ring" aria-hidden="true" />}
        {isReady && <span className="ai-insights-dot" aria-hidden="true" />}
      </span>

      <span className="ai-insights-copy">
        <span className="ai-insights-title">AI Insights</span>
        <span className="ai-insights-subtitle">{subtitle}</span>
      </span>

      <span className="ai-insights-cta">
        <span className="ai-insights-cta-label">{isLoading ? 'Working' : 'View analysis'}</span>
        <ChevronRight size={16} />
      </span>
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Overview() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [aiSections, setAiSections] = useState(null)
  const [aiStatus, setAiStatus] = useState('loading')
  const [aiError, setAiError] = useState('')
  const [aiDebug, setAiDebug] = useState(null)
  const [aiLang] = useState('en')
  const [showInsightModal, setShowInsightModal] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  const [activeCategory, setActiveCategory] = useState(null)

  const mountedRef = useRef(true)
  const timeoutRef = useRef(null)

  /* ---------------------------- AI insight polling ---------------------------- */

  const pollInsight = async (lang, attempt = 0) => {
    if (!mountedRef.current) return
    try {
      const response = await api.get(`/dashboard/summary?lang=${lang}`)
      if (!mountedRef.current) return

      if (response.data.status === 'processing') {
        if (attempt >= MAX_AI_ATTEMPTS) {
          setAiStatus('error')
          setAiError('This is taking longer than expected. The backend kept returning "processing" without ever finishing.')
          setAiDebug({ lastStatus: response.status, lastPayload: response.data, attempts: attempt })
          return
        }
        const delay = Math.min(3000 + attempt * 150, 6000)
        timeoutRef.current = setTimeout(() => pollInsight(lang, attempt + 1), delay)
        return
      }

      const sections = response.data.ai_sections
      const hasContent = sections && Object.values(sections).some((v) => v && String(v).trim() !== '')

      if (hasContent) {
        setAiSections(sections)
        setAiStatus('ready')
      } else {
        setAiStatus('error')
        setAiError('The request succeeded but no usable AI content came back in the response.')
        setAiDebug({ lastStatus: response.status, lastPayload: response.data })
      }
    } catch (error) {
      if (!mountedRef.current) return
      setAiStatus('error')
      setAiError(
        error?.response?.data?.message ||
        error?.message ||
        'Could not reach the AI service. Check your connection and try again.'
      )
      setAiDebug({
        httpStatus: error?.response?.status ?? 'no response (network/CORS?)',
        responseBody: error?.response?.data ?? null,
        message: error?.message,
      })
    }
  }

  const retryInsight = (lang = aiLang) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setAiStatus('loading')
    setAiError('')
    setAiDebug(null)
    pollInsight(lang, 0)
  }

  useEffect(() => {
    mountedRef.current = true
    Promise.all([api.get('/products'), api.get('/suppliers')])
      .then(([productsRes, suppliersRes]) => {
        if (!mountedRef.current) return
        setProducts(productsRes.data.data || productsRes.data)
        setSuppliers(suppliersRes.data)
        setLoadingData(false)
      })
      .catch(() => {
        if (mountedRef.current) setLoadingData(false)
      })

    pollInsight(aiLang, 0)

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------- Derived data ---------------------------- */

  const lowStock = products.filter((p) => p.stock_status === 'low')
  const stockValue = products.reduce((sum, p) => sum + Number(p.price) * Number(p.quantity), 0)
  const healthyCount = products.length - lowStock.length
  const healthyPercent = products.length ? Math.round((healthyCount / products.length) * 100) : 100

  const categoryBreakdown = useMemo(() => {
    const grouped = {}
    products.forEach((product) => {
      const key = product.category || 'Uncategorized'
      if (!grouped[key]) grouped[key] = { name: key, value: 0, units: 0 }
      grouped[key].value += Number(product.price) * Number(product.quantity)
      grouped[key].units += Number(product.quantity)
    })
    const sorted = Object.values(grouped).sort((a, b) => b.value - a.value)
    if (sorted.length <= 6) return sorted
    const top = sorted.slice(0, 5)
    const restValue = sorted.slice(5).reduce((s, c) => s + c.value, 0)
    const restUnits = sorted.slice(5).reduce((s, c) => s + c.units, 0)
    return [...top, { name: 'Other', value: restValue, units: restUnits }]
  }, [products])

  const categoryShare = useMemo(() => {
    const total = categoryBreakdown.reduce((s, c) => s + c.value, 0) || 1
    return categoryBreakdown.slice(0, 4).map((c, i) => ({
      name: c.name,
      percent: Math.round((c.value / total) * 100),
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))
  }, [categoryBreakdown])

  const topValueProducts = useMemo(() => {
    const pool = activeCategory ? products.filter((p) => (p.category || 'Uncategorized') === activeCategory) : products
    return [...pool]
      .map((p) => ({ ...p, totalValue: Number(p.price) * Number(p.quantity) }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
  }, [products, activeCategory])
  const maxTopValue = topValueProducts[0]?.totalValue || 1

  const concentrationCurve = useMemo(() => {
    if (!products.length) return []
    const sortedValues = products
      .map((p) => Number(p.price) * Number(p.quantity))
      .sort((a, b) => b - a)
    const total = sortedValues.reduce((s, v) => s + v, 0) || 1
    let cumulative = 0
    return sortedValues.map((v, i) => {
      cumulative += v
      return { index: i + 1, cumulative: Math.round((cumulative / total) * 1000) / 10 }
    })
  }, [products])

  const concentrationHeadline = useMemo(() => {
    if (!concentrationCurve.length) return null
    const tenPercentCount = Math.max(1, Math.round(concentrationCurve.length * 0.2))
    const point = concentrationCurve[tenPercentCount - 1]
    return point ? { productShare: Math.round((tenPercentCount / concentrationCurve.length) * 100), valueShare: point.cumulative } : null
  }, [concentrationCurve])

  const stockDistribution = [
    { name: 'Healthy', value: healthyCount, color: 'var(--color-success)' },
    { name: 'Low stock', value: lowStock.length, color: 'var(--color-accent-warm)' },
  ]

  const healthGaugeData = [{ name: 'health', value: healthyPercent, fill: 'var(--color-primary)' }]

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  const toggleCategory = (name) => setActiveCategory((prev) => (prev === name ? null : name))

  const visibleSections = aiSections
    ? AI_SECTION_CONFIG.filter((s) => aiSections[s.key] && String(aiSections[s.key]).trim() !== '')
    : []

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <motion.div className="overview" variants={containerVariants} initial="hidden" animate="show">
      <div className="overview-glow overview-glow-1" aria-hidden="true" />
      <div className="overview-glow overview-glow-2" aria-hidden="true" />

      {/* Header */}
      <motion.div className="overview-header" variants={itemVariants}>
        <div>
          <span className="overview-eyebrow">Inventory Overview</span>
          <h1 className="overview-title">{greeting}, {firstName}</h1>
          <p className="overview-subtitle">A live snapshot of how your stock is performing right now</p>
        </div>
        <div className="health-badge">
          <span
            className={`health-dot ${healthyPercent <= 80 ? 'health-dot-pulse' : ''}`}
            style={{ backgroundColor: healthyPercent > 80 ? 'var(--color-success)' : 'var(--color-accent-warm)' }}
          />
          {healthyPercent}% of stock is healthy
        </div>
      </motion.div>

      {/* Featured AI insight, front and center */}
      <AIInsightsBanner status={aiStatus} onOpen={() => setShowInsightModal(true)} />

      {/* Key metrics */}
      <motion.div className="metrics-row" variants={itemVariants}>
        <MetricCard accent={METRIC_ACCENTS[0]} primary>
          <div className="metric-top">
            <span className="metric-label">Total inventory value</span>
            <span className="metric-icon-box"><Wallet size={16} /></span>
          </div>
          <p className="metric-value"><AnimatedNumber value={stockValue} prefix="$" /></p>
          <span className="metric-trend metric-trend-up">
            <ArrowUpRight size={12} /> Spread across {products.length} products
          </span>
        </MetricCard>

        <MetricCard accent={METRIC_ACCENTS[1]}>
          <div className="metric-top">
            <span className="metric-label">Products tracked</span>
            <span className="metric-icon-box"><Package size={16} /></span>
          </div>
          <p className="metric-value"><AnimatedNumber value={products.length} /></p>
          <span className="metric-trend">Across {categoryBreakdown.length} categories</span>
        </MetricCard>

        <MetricCard accent={METRIC_ACCENTS[2]}>
          <div className="metric-top">
            <span className="metric-label">Below threshold</span>
            <span className="metric-icon-box"><TrendingDown size={16} /></span>
          </div>
          <p className="metric-value"><AnimatedNumber value={lowStock.length} /></p>
          <span className={lowStock.length > 0 ? 'metric-trend metric-trend-down' : 'metric-trend metric-trend-up'}>
            {lowStock.length > 0 ? 'Restocking recommended' : 'Nothing needs attention'}
          </span>
        </MetricCard>

        <MetricCard accent={METRIC_ACCENTS[3]}>
          <div className="metric-top">
            <span className="metric-label">Supplier network</span>
            <span className="metric-icon-box"><Truck size={16} /></span>
          </div>
          <p className="metric-value"><AnimatedNumber value={suppliers.length} /></p>
          <span className="metric-trend">Vendors currently active</span>
        </MetricCard>
      </motion.div>

      {/* Primary charts */}
      <motion.div className="charts-grid" variants={itemVariants}>
        <div className="panel panel-bar">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Value by category</h3>
              <p className="panel-subtitle">Click a bar to filter the products below</p>
            </div>
            {activeCategory && (
              <button type="button" className="filter-chip" onClick={() => setActiveCategory(null)}>
                <Filter size={11} /> {activeCategory} <X size={12} />
              </button>
            )}
          </div>
          {loadingData ? (
            <ChartSkeleton height={260} />
          ) : categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-faint)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-faint)" fontSize={11} tickLine={false} axisLine={false} width={42} />
                <Tooltip
                  cursor={{ fill: 'var(--color-border-soft)' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', fontSize: 12 }}
                  formatter={(value) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Value']}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  animationDuration={900}
                  onClick={(data) => toggleCategory(data.name)}
                  cursor="pointer"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      opacity={!activeCategory || activeCategory === entry.name ? 1 : 0.28}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No category data yet</div>
          )}
        </div>

        <div className="panel panel-donut">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Stock status</h3>
              <p className="panel-subtitle">Healthy vs. low stock split</p>
            </div>
          </div>
          {loadingData ? (
            <ChartSkeleton height={200} />
          ) : (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stockDistribution}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      animationDuration={900}
                    >
                      {stockDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <span className="donut-number">{healthyPercent}%</span>
                  <span className="donut-caption">healthy</span>
                </div>
              </div>
              <div className="donut-legend">
                <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--color-success)' }} />Healthy ({healthyCount})</span>
                <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--color-accent-warm)' }} />Low stock ({lowStock.length})</span>
              </div>
            </>
          )}
        </div>

        <div className="panel panel-gauge">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Overall health</h3>
              <p className="panel-subtitle">Target: keep this above 80%</p>
            </div>
          </div>
          {loadingData ? (
            <ChartSkeleton height={180} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={healthGaugeData} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: 'var(--color-border-soft)' }} dataKey="value" cornerRadius={12} animationDuration={1000} />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="gauge-value"><AnimatedNumber value={healthyPercent} /><span className="gauge-percent">%</span></p>
            </>
          )}
        </div>
      </motion.div>

      {/* Secondary charts */}
      <motion.div className="charts-grid charts-grid-secondary" variants={itemVariants}>
        <div className="panel panel-rings">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Category share</h3>
              <p className="panel-subtitle">Tap a ring to filter</p>
            </div>
          </div>
          {loadingData ? (
            <ChartSkeleton height={140} />
          ) : categoryShare.length > 0 ? (
            <div className="rings-grid">
              {categoryShare.map((c, i) => (
                <CategoryRing
                  key={c.name}
                  name={c.name}
                  percent={c.percent}
                  color={c.color}
                  index={i}
                  active={activeCategory === c.name}
                  onClick={() => toggleCategory(c.name)}
                />
              ))}
            </div>
          ) : (
            <div className="chart-empty">No category data yet</div>
          )}
        </div>

        <div className="panel panel-toplist">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Highest value products</h3>
              <p className="panel-subtitle">
                {activeCategory ? `Filtered to ${activeCategory}` : 'The five products holding the most capital'}
              </p>
            </div>
            <Layers size={16} className="panel-header-icon" />
          </div>
          {loadingData ? (
            <ChartSkeleton height={160} />
          ) : topValueProducts.length > 0 ? (
            <div className="value-list">
              {topValueProducts.map((product, i) => (
                <div key={product.id} className="value-row">
                  <span className="value-row-name">{product.name}</span>
                  <div className="value-bar-track">
                    <motion.div
                      className="value-bar-fill"
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(6, (product.totalValue / maxTopValue) * 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.06 * i, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="value-row-amount">${product.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-empty">No products in this category</div>
          )}
        </div>

        <div className="panel panel-concentration">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Value concentration</h3>
              <p className="panel-subtitle">Share of value held by your top products</p>
            </div>
            <Gem size={16} className="panel-header-icon" />
          </div>
          {loadingData ? (
            <ChartSkeleton height={140} />
          ) : concentrationCurve.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={concentrationCurve} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="concentrationFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="index" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)', fontSize: 12 }}
                    formatter={(value) => [`${value}%`, 'Cumulative value']}
                    labelFormatter={(label) => `Top ${label} products`}
                  />
                  <Area type="monotone" dataKey="cumulative" stroke="var(--color-primary)" strokeWidth={2} fill="url(#concentrationFill)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
              {concentrationHeadline && (
                <p className="concentration-note">
                  Your top {concentrationHeadline.productShare}% of products hold {concentrationHeadline.valueShare}% of total value
                </p>
              )}
            </>
          ) : (
            <div className="chart-empty">No products yet</div>
          )}
        </div>
      </motion.div>

      {/* Action list */}
      <motion.div className="panel panel-list" variants={itemVariants}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Products that need restocking</h3>
            <p className="panel-subtitle">Currently below their minimum stock threshold</p>
          </div>
          <Link to="/products" className="panel-cta">Go to Products</Link>
        </div>

        {lowStock.length === 0 ? (
          <div className="panel-empty-state">
            <div className="panel-empty-icon" />
            <p>Everything is well stocked. No action needed right now.</p>
          </div>
        ) : (
          <div className="restock-list">
            <div className="restock-header-row">
              <span>Product</span>
              <span>Stock level</span>
              <span>Quantity</span>
            </div>
            {lowStock.map((product) => (
              <div key={product.id} className="restock-row">
                <div className="restock-info">
                  <span className="restock-name">{product.name}</span>
                  <span className="restock-sku">{product.sku}</span>
                </div>
                <div className="restock-bar-track">
                  <motion.div
                    className="restock-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (product.quantity / product.min_stock) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="restock-qty">{product.quantity} / {product.min_stock}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* AI insight modal */}
      <AnimatePresence>
        {showInsightModal && (
          <motion.div
            className="ai-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInsightModal(false)}
          >
            <motion.div
              className="ai-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-modal-title"
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ai-modal-header">
                <div className="ai-modal-header-left">
                  <span className="ai-modal-icon"><Bot size={16} /></span>
                  <h3 id="ai-modal-title">AI Insights</h3>
                </div>
                <button type="button" className="ai-modal-close" onClick={() => setShowInsightModal(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="ai-modal-scroll">
                {aiStatus === 'loading' && (
                  <div className="ai-modal-loading">
                    <div className="ai-skeleton-line" style={{ width: '96%' }} />
                    <div className="ai-skeleton-line" style={{ width: '88%' }} />
                    <div className="ai-skeleton-line" style={{ width: '92%' }} />
                    <div className="ai-skeleton-line" style={{ width: '60%' }} />
                    <p className="ai-modal-loading-caption">Analyzing your inventory patterns…</p>
                  </div>
                )}

                {aiStatus === 'error' && (
                  <div className="ai-modal-error">
                    <AlertTriangle size={22} />
                    <p>{aiError}</p>
                    <div className="ai-modal-error-actions">
                      <button type="button" className="ai-retry-btn" onClick={() => retryInsight()}>
                        <RefreshCw size={14} /> Try again
                      </button>
                      {aiDebug && (
                        <button type="button" className="ai-debug-btn" onClick={() => setShowDebug((v) => !v)}>
                          <Bug size={13} /> Technical details
                          <ChevronDown size={13} style={{ transform: showDebug ? 'rotate(180deg)' : 'none' }} />
                        </button>
                      )}
                    </div>
                    {aiDebug && showDebug && (
                      <pre className="ai-debug-block">{JSON.stringify(aiDebug, null, 2)}</pre>
                    )}
                  </div>
                )}

                {aiStatus === 'ready' && visibleSections.length > 0 && (
                  <motion.div
                    className="ai-sections"
                    initial="hidden"
                    animate="show"
                    variants={sectionsContainerVariants}
                  >
                    {visibleSections.map((section) => {
                      const Icon = section.icon
                      return (
                        <motion.div
                          key={section.key}
                          className="ai-section-card"
                          variants={sectionItemVariants}
                          style={{
                            borderColor: `${section.color}33`,
                            background: `linear-gradient(135deg, ${section.color}14, ${section.color}05)`,
                          }}
                        >
                          <div className="ai-section-head">
                            <span
                              className="ai-section-icon"
                              style={{ backgroundColor: `${section.color}26`, color: section.color }}
                            >
                              <Icon size={16} />
                            </span>
                            <h4>{section.title}</h4>
                          </div>
                          <p>{aiSections[section.key]}</p>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </div>

              <div className="ai-modal-footer">
                <span>Generated from current stock, sales and supplier data</span>
                {aiStatus === 'ready' && (
                  <button type="button" className="ai-regenerate-btn" onClick={() => retryInsight()}>
                    <RefreshCw size={12} /> Regenerate
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}