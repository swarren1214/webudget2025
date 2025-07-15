![CI](https://github.com/your-org/webudget/actions/workflows/ci.yml/badge.svg)
![Coverage](https://codecov.io/gh/your-org/webudget/branch/main/graph/badge.svg)

# WeBudget

**WeBudget is an open-source personal-finance dashboard that unifies all of your accounts in one place.**

## 🚀 Quick Start (One-Click Setup)

### For Beginners - Run the setup script:

**Mac/Linux:**
```bash
./setup.sh
```

**Windows:**
```cmd
setup.cmd
```

These scripts will:
- ✅ Check system requirements
- ✅ Set up environment variables
- ✅ Install all dependencies
- ✅ Start the complete development environment

### For Advanced Users - Manual setup:

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start development environment
npm run dev:docker        # Full Docker mode
# OR
npm run dev:hybrid        # Hybrid mode (recommended)
```

## Documentation

- **🐣 Quick Start:** [Local setup in 5 minutes](docs/quick-start/local-setup.md)
- **⚡ Development Guide:** [Commands & troubleshooting](DEVELOPMENT.md)
- **📖 Architecture:** [System overview](docs/overview/architecture.md)

> Looking for full API details or environment variables? See the **Reference** section inside `docs/`.

---

### Contributing

We gladly welcome Pull Requests! Please review our
[style guide](docs/meta/style-guide/README.md) and open an issue if you’re unsure
where to start.

---

