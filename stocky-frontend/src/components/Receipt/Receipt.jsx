import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Printer, CheckCircle2 } from 'lucide-react'
import './Receipt.css'

const STORE_NAME = 'STOCKY'
const STORE_TAGLINE = 'Inventory & Point of Sale'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatReceiptDate(value) {
  const date = new Date(value || Date.now())
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
}

export default function Receipt({ sale, onClose }) {
  const handlePrint = () => {
    window.print()
  }

  const receiptNumber = String(sale.id).padStart(6, '0')

  return createPortal(
    <div className="receipt-overlay">
      <motion.div
        className="receipt-card"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
      >
        <div className="receipt-toolbar">
          <div className="receipt-success">
            <CheckCircle2 size={16} />
            Sale completed
          </div>
          <button type="button" className="receipt-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="receipt-print-area">
          <div className="receipt-header">
            <h2>{STORE_NAME}</h2>
            <p>{STORE_TAGLINE}</p>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-meta">
            <div>
              <span>Receipt No.</span>
              <strong>#{receiptNumber}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>{formatReceiptDate(sale.created_at)}</strong>
            </div>
            <div>
              <span>Cashier</span>
              <strong>{sale.cashier}</strong>
            </div>
          </div>

          <div className="receipt-divider receipt-divider-dashed" />

          <table className="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unit_price).toFixed(2)}</td>
                  <td>${(item.unit_price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider receipt-divider-dashed" />

          <div className="receipt-total-row">
            <span>Total</span>
            <strong>${Number(sale.total).toFixed(2)}</strong>
          </div>

          <p className="receipt-footer">Thank you for shopping with us</p>

          <div className="receipt-barcode" />
          <p className="receipt-barcode-number">{receiptNumber}</p>
        </div>

        <button type="button" className="receipt-print-btn" onClick={handlePrint}>
          <Printer size={16} /> Print receipt
        </button>
      </motion.div>
    </div>,
    document.body
  )
}