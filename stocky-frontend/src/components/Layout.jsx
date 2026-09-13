import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import {
  Moon, Sun, LogOut, LayoutDashboard, Package, Truck, Building2, Receipt, UsersRound,
  Menu, X,
} from 'lucide-react'
import './Layout.css'

const ICONS = {
  '/': LayoutDashboard,
  '/products': Package,
  '/purchases': Truck,
  '/suppliers': Building2,
  '/sales': Receipt,
  '/users': UsersRound,
}

const ACCENTS = {
  '/': '#4338ca',
  '/products': '#0891b2',
  '/purchases': '#059669',
  '/suppliers': '#b45309',
  '/sales': '#be123c',
  '/users': '#7c3aed',
}

export default function Layout({ children }) {
  const { mode, toggleMode } = useTheme()
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation and on viewport resize past the breakpoint.
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 900) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const links = [{ to: '/', label: 'Overview' }]
  if (role === 'admin' || role === 'manager') {
    links.push({ to: '/products', label: 'Products' })
    links.push({ to: '/purchases', label: 'Purchases' })
    links.push({ to: '/suppliers', label: 'Suppliers' })
  }
  links.push({ to: '/sales', label: 'Sales' })
  if (role === 'admin') {
    links.push({ to: '/users', label: 'Team' })
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const year = new Date().getFullYear()

  return (
    <div className="app-shell">
      <nav className={`app-nav ${scrolled ? 'app-nav-scrolled' : ''}`}>
        <NavLink to="/" className="brand" aria-label="Stocky home">
          <motion.span
            className="brand-logo-chip"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            whileHover={{ scale: 1.08, rotate: -4 }}
          >
            <img src="/images/stocky-logo.svg" alt="" className="brand-logo" />
          </motion.span>
          <motion.span
            className="brand-name"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          >
            Stocky
          </motion.span>
        </NavLink>

        <div className="nav-links">
          {links.map((link) => {
            const Icon = ICONS[link.to]
            const accent = ACCENTS[link.to]
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                style={{ '--link-accent': accent }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="nav-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="nav-link-content">
                      <Icon size={15} />
                      {link.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        <div className="nav-toolbar">
          <button type="button" className="icon-btn" onClick={toggleMode} aria-label="Toggle theme">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="icon-swap"
              >
                {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <div className="nav-divider" />

          <div className="user-chip">
            <span className="user-avatar">
              {initials}
              <span className="user-status-dot" aria-hidden="true" />
            </span>
            <span className="user-chip-text">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{role}</span>
            </span>
          </div>

          <motion.button
            type="button"
            className="icon-btn icon-btn-danger"
            onClick={handleLogout}
            aria-label="Log out"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            <LogOut size={16} />
          </motion.button>

          <div className="nav-divider nav-divider-mobile" />

          <button
            type="button"
            className="icon-btn hamburger-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="icon-swap"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="mobile-menu-inner">
              <div className="mobile-menu-links">
                {links.map((link) => {
                  const Icon = ICONS[link.to]
                  const accent = ACCENTS[link.to]
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) => `mobile-menu-link ${isActive ? 'mobile-menu-link-active' : ''}`}
                      style={{ '--link-accent': accent }}
                    >
                      <span className="mobile-menu-link-icon"><Icon size={16} /></span>
                      {link.label}
                    </NavLink>
                  )
                })}
              </div>

              <div className="mobile-menu-user">
                <span className="user-avatar">
                  {initials}
                  <span className="user-status-dot" aria-hidden="true" />
                </span>
                <span className="user-chip-text">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{role}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <div className="footer-main">
          <div className="footer-brand-col">
            <motion.div
              className="footer-brand-row"
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <span className="footer-logo-chip">
                <img src="/images/stocky-logo.svg" alt="" className="footer-logo" />
              </span>
              <span className="footer-brand-name">Stocky</span>
            </motion.div>
            <p className="footer-tagline">
              Inventory, purchases and sales, tracked in one place for your whole team.
            </p>
            <div className="footer-status">
              <span className="footer-status-dot" />
              All systems operational
            </div>
          </div>

          <div className="footer-links-col">
            <span className="footer-col-title">Workspace</span>
            <NavLink to="/" className="footer-link">Overview</NavLink>
            <NavLink to="/sales" className="footer-link">Sales</NavLink>
            {(role === 'admin' || role === 'manager') && (
              <NavLink to="/products" className="footer-link">Products</NavLink>
            )}
          </div>

        </div>

        <div className="footer-bottom">
          <span>© {year} Stocky. All rights reserved.</span>
          <span className="footer-bottom-meta">Signed in as {user?.name}</span>
        </div>
      </footer>
    </div>
  )
}