import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, DollarSign, TrendingUp, UserRound, Calendar, ShoppingBag, Download, FileSpreadsheet, FileText } from 'lucide-react'
import api from '../../../api/client'
import { useAuth } from '../../../context/AuthContext'
import './sales.css'

const ACCENTS = ['accent-indigo', 'accent-emerald', 'accent-cyan', 'accent-amber', 'accent-rose']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Sales() {
  const { role } = useAuth()
  const isManagerOrAdmin = role === 'admin' || role === 'manager'

  const [sales, setSales] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [exporting, setExporting] = useState('')
  const [exportError, setExportError] = useState('')

  const now = new Date()
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1)
  const [exportYear, setExportYear] = useState(now.getFullYear())

  const yearOptions = useMemo(() => {
    const current = now.getFullYear()
    return [current, current - 1, current - 2]
  }, [])

  useEffect(() => {
    setLoadingData(true)
    api.get('/sales')
      .then((res) => setSales(res.data.data || res.data))
      .finally(() => setLoadingData(false))
  }, [])

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  const averageSale = sales.length ? totalRevenue / sales.length : 0

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (type) => {
    setExporting(type)
    setExportError('')
    try {
      const response = await api.get(`/sales/export/${type}`, {
        params: { month: exportMonth, year: exportYear },
        responseType: 'blob',
      })
      const extension = type === 'pdf' ? 'pdf' : 'xlsx'
      downloadFile(response.data, `sales-${exportYear}-${exportMonth}.${extension}`)
    } catch (err) {
      const blob = err.response?.data
      if (blob instanceof Blob && blob.type.includes('json')) {
        const text = await blob.text()
        try {
          const parsed = JSON.parse(text)
          setExportError(parsed.message || 'No sales found for this period')
        } catch {
          setExportError('Could not generate the export')
        }
      } else {
        setExportError('Could not generate the export')
      }
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="sales-page">
      <div className="sales-header">
        <div>
          <span className="page-eyebrow">
            <Receipt size={13} /> Transactions
          </span>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">
            {isManagerOrAdmin
              ? 'Every sale recorded at the register, most recent first'
              : 'Your sales, most recent first'}
          </p>
        </div>
      </div>

      <div className="export-bar">
        <div className="export-bar-fields">
          <select value={exportMonth} onChange={(e) => setExportMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>{name}</option>
            ))}
          </select>
          <select value={exportYear} onChange={(e) => setExportYear(Number(e.target.value))}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="export-bar-actions">
          <button type="button" className="export-btn" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
            {exporting === 'pdf' ? <Download size={14} className="export-spin" /> : <FileText size={14} />}
            PDF
          </button>
          <button type="button" className="export-btn" disabled={exporting !== ''} onClick={() => handleExport('excel')}>
            {exporting === 'excel' ? <Download size={14} className="export-spin" /> : <FileSpreadsheet size={14} />}
            Excel
          </button>
        </div>
      </div>

      {exportError && <p className="export-error">{exportError}</p>}

      {!loadingData && sales.length > 0 && (
        <div className="sales-summary-row">
          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="summary-icon summary-icon-indigo"><ShoppingBag size={16} /></div>
            <div>
              <p className="summary-value">{sales.length}</p>
              <p className="summary-label">{isManagerOrAdmin ? 'Total sales' : 'Your sales'}</p>
            </div>
          </motion.div>

          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="summary-icon summary-icon-emerald"><DollarSign size={16} /></div>
            <div>
              <p className="summary-value">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="summary-label">{isManagerOrAdmin ? 'Total revenue' : 'Your revenue'}</p>
            </div>
          </motion.div>

          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="summary-icon summary-icon-cyan"><TrendingUp size={16} /></div>
            <div>
              <p className="summary-value">${averageSale.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="summary-label">Average sale</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="sales-list">
        {loadingData ? (
          <div className="sales-loading">
            <div className="loading-card" />
            <div className="loading-card" />
            <div className="loading-card" />
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Receipt size={26} /></div>
            <p>No sales recorded yet</p>
            <span>
              {isManagerOrAdmin
                ? 'Sales made at the register will show up here as they come in'
                : 'Sales you make at the register will show up here'}
            </span>
          </div>
        ) : (
          sales.map((sale, index) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -2 }}
              className={`sale-card ${ACCENTS[index % ACCENTS.length]}`}
            >
              <div className="sale-card-icon">
                <Receipt size={18} />
              </div>
              <div className="sale-card-body">
                <div className="sale-card-top">
                  <span className="sale-id">Sale #{sale.id}</span>
                  <span className="sale-total">${sale.total}</span>
                </div>
                <div className="sale-meta">
                  {isManagerOrAdmin && (
                    <span className="sale-meta-item">
                      <UserRound size={11} />
                      {sale.cashier}
                    </span>
                  )}
                  <span className="sale-meta-item">
                    <Calendar size={11} />
                    {new Date(sale.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}