<div align="center">

<img src="docs/screenshots/06-dashboard.png" alt="Stocky" width="100%" />

<br />
<br />

<h1>Stocky</h1>

<p><b>Inventory and point-of-sale system with role-based dashboards and AI-assisted reporting.</b></p>

<p>
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</p>

<p>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/github/last-commit/omniaalessawy247-hash/stocky?style=flat-square" alt="Last commit" />
  <img src="https://img.shields.io/github/stars/omniaalessawy247-hash/stocky?style=flat-square" alt="Stars" />
</p>

<p>
  <a href="#-screenshots">Screenshots</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-roadmap">Roadmap</a>
</p>

</div>

<br />

## Overview

Most inventory demos show one screen and call it done. Stocky is built the way a real retail system has to work: stock arriving from suppliers, inventory levels tracked in real time, checkout at the register, and sales reporting at month end — with a genuinely different interface for every role, not one dashboard with hidden buttons.

Three roles, three different applications, one shared source of truth:

<div align="center">

| Role | What they see |
|:---|:---|
| 🛡️ **Admin** | Everything a manager sees, plus team and role management |
| 📊 **Manager** | Products, purchases, suppliers, inventory value, analytics dashboard |
| 🛒 **Cashier** | A focused point-of-sale screen and their own sales history — nothing else |

</div>

Every one of those boundaries is enforced twice: once in the React router, and again in the Laravel middleware on every single endpoint. A cashier can't see manager data by guessing a URL — the API refuses the request regardless of what the UI shows.

<br />

## 📸 Screenshots

**Dashboard — light and dark**

<table>
<tr>
<td width="50%"><img src="docs/screenshots/12-dashboard-light.png" width="100%" /></td>
<td width="50%"><img src="docs/screenshots/06-dashboard.png" width="100%" /></td>
</tr>
<tr>
<td align="center"><sub>Light mode</sub></td>
<td align="center"><sub>Dark mode</sub></td>
</tr>
</table>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/01-login.png" width="100%" /></td>
<td width="50%"><img src="docs/screenshots/02-pos.png" width="100%" /></td>
</tr>
<tr>
<td align="center"><sub><b>Role-based sign in</b></sub></td>
<td align="center"><sub><b>Point of sale</b></sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/03-receipt.png" width="100%" /></td>
<td width="50%"><img src="docs/screenshots/07-products.png" width="100%" /></td>
</tr>
<tr>
<td align="center"><sub><b>Printable receipt</b></sub></td>
<td align="center"><sub><b>Product catalog</b></sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/08-purchases.png" width="100%" /></td>
<td width="50%"><img src="docs/screenshots/09-suppliers.png" width="100%" /></td>
</tr>
<tr>
<td align="center"><sub><b>Purchases from suppliers</b></sub></td>
<td align="center"><sub><b>Supplier management</b></sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/11-team.png" width="100%" /></td>
<td width="50%"></td>
</tr>
<tr>
<td align="center"><sub><b>Team & role management (Admin only)</b></sub></td>
<td></td>
</tr>
</table>

<br />

## 🧱 Tech Stack

<table>
<tr>
<td valign="top" width="33%">

**Backend**
- Laravel 13 · PHP 8.3
- MySQL
- Sanctum (auth)
- Spatie Laravel-Permission
- Queues, Events & Listeners
- API Resources
- Pest

</td>
<td valign="top" width="33%">

**Frontend**
- React 19 · Vite
- Tailwind CSS
- Custom CSS design system
- Framer Motion
- Recharts
- Axios · Context API

</td>
<td valign="top" width="33%">

**AI**
- Google Gemini API
- Natural-language inventory insights
- Queued, cached, non-blocking

</td>
</tr>
</table>

<br />

## 🏗️ Architecture

**Role-based access control**, enforced at both layers — route guards on the frontend, permission middleware on every API endpoint on the backend.

**Events instead of tangled logic.** A completed sale doesn't update stock directly inside a controller. It fires an event, and a dedicated listener reacts to it:

```mermaid
flowchart LR
    A[Cashier completes sale] --> B(("SaleCompleted<br/>event"))
    B --> C[UpdateStockAfterSale<br/>listener]
    C --> D[(Stock decremented)]
    B -.future.-> E[Notify manager]
    B -.future.-> F[Write audit log]
```

New behavior — notifications, audit logs, loyalty points — can listen to the same event without touching a single line of existing, working code.

**AI analysis runs off the request path.** Calling an external LLM inline would block the dashboard on every load, so it doesn't:

```mermaid
sequenceDiagram
    participant UI as Dashboard
    participant API as Laravel API
    participant Q as Queue Worker
    participant AI as Gemini API

    UI->>API: GET /insights
    API-->>UI: 202 processing
    API->>Q: dispatch AnalyzeInventory job
    Q->>AI: request analysis
    AI-->>Q: insight text
    Q->>API: cache result (30 min)
    UI->>API: poll /insights
    API-->>UI: 200 ready
```

**Cached reports.** Dashboard analytics are cached for 30 minutes so a burst of page refreshes doesn't hammer the database or the Gemini API.

<br />

## ✨ Features

- 📊 Interactive dashboard — category breakdown, stock health, top products, AI-generated summary
- 📦 Full CRUD for products, suppliers, and team members, including image uploads
- 🛒 Point of sale with a live cart and real-time stock validation
- 🧾 Printable receipts generated automatically per sale
- 📤 Monthly sales export to PDF and Excel
- 🚚 Supplier purchases with automatic stock updates
- 🌗 Light and dark mode across every screen
- 🔒 Referential guards — e.g. a supplier with linked products can't be deleted

<br />

## 🚀 Getting Started

### Prerequisites

- PHP 8.3+ and Composer
- Node.js 18+
- MySQL

### Backend

```bash
cd stocky-backend
composer install
cp .env.example .env
php artisan key:generate
# set your database credentials in .env
php artisan migrate --seed
php artisan serve
```

### Frontend

```bash
cd stocky-frontend
npm install
npm run dev
```

| Service | URL |
|:---|:---|
| API | `http://127.0.0.1:8000` |
| App | `http://localhost:5173` |

<br />

## 📁 Project Structure

```
stocky/
├── stocky-backend/     Laravel API — auth, business logic, AI jobs
└── stocky-frontend/    React app — role-based dashboards and POS
```

<br />

## 🗺️ Roadmap

- [ ] Real-time low-stock notifications (Laravel Echo + Pusher)
- [ ] Configurable store settings (name, logo, currency)
- [ ] Multi-branch support
- [ ] Barcode scanner hardware integration

<br />

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](../../issues).

<br />

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

<br />

<div align="center">
<sub>Built with Laravel and React</sub>
</div>
