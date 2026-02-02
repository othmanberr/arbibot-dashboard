# 🚀 Arbibot - Arbitrage Tracker

Application complète de tracking d'arbitrage crypto en temps réel, inspirée de Timber Arbitrage.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

## ✨ Fonctionnalités

### 📊 Page Arbitrage
- Graphique interactif en temps réel (Recharts)
- Comparaison des prix entre Paradex, Hyperliquid et Lighter
- Filtres d'exchanges dynamiques
- Affichage du spread moyen et maximum

### 💰 Page Arbitrage Prices
- Identification automatique des meilleures opportunités
- Cartes détaillées avec prix Long/Short
- Calcul des profits potentiels
- Filtres par tokens (BTC, ETH, BNB, HYPE, ASTER)
- Taux de rafraîchissement configurable

### 📈 Page Fundings Rate
- Top 3 des meilleures opportunités APR
- Tableau complet de 82+ paires
- Recherche dynamique de paires
- Stratégies long/short détaillées
- Liens directs vers les exchanges

### 📉 Page Trading Analysis
- Statistiques en temps réel (Volume 24h, Total Trades, etc.)
- Top 5 des paires les plus tradées
- Métriques de spread moyen

### 🎯 Page Open Interest
- Suivi de l'open interest total ($122.3M)
- Répartition par exchange
- Alertes de risque de liquidation
- Tendances 24h

### 🎨 Design & UX
- Interface dark mode élégante
- Navigation sidebar responsive
- Animations et transitions fluides
- Composants réutilisables

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
arbibot/
├── app/
│   ├── arbitrage-prices/    # Opportunités d'arbitrage
│   ├── fundings-rate/       # Taux de financement APR
│   ├── trading-analysis/    # Analyse de trading
│   ├── open-interest/       # Open Interest tracker
│   ├── layout.tsx           # Layout avec sidebar
│   ├── page.tsx             # Page Arbitrage (graphiques)
│   └── globals.css          # Styles globaux
├── components/
│   ├── Sidebar.tsx          # Navigation
│   ├── PriceChart.tsx       # Graphique Recharts
│   ├── OpportunityCard.tsx  # Carte opportunité
│   └── FundingCard.tsx      # Carte funding rate
├── lib/
│   └── mockData.ts          # Données de démonstration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## 🎯 Roadmap / Prochaines étapes

### APIs en temps réel
- [ ] Connexion WebSocket aux exchanges
- [ ] Intégration API Paradex
- [ ] Intégration API Hyperliquid
- [ ] Intégration API Lighter

### Fonctionnalités avancées
- [ ] Alertes push/email pour opportunités
- [ ] Historique des opportunités
- [ ] Backtesting de stratégies
- [ ] Export CSV/Excel des données
- [ ] Dashboard personnalisable

### Optimisations
- [ ] Server-Side Rendering (SSR)
- [ ] Caching intelligent
- [ ] Mode hors-ligne (PWA)

## 🎨 Technologies utilisées

- **Next.js 15** - Framework React avec App Router
- **React 19** - Library UI moderne
- **TypeScript** - Typage statique
- **Tailwind CSS** - Utility-first CSS
- **Recharts** - Graphiques interactifs
- **Lucide React** - Icônes SVG
- **date-fns** - Manipulation de dates

## 📝 Commandes

```bash
# Développement
npm run dev          # Démarrer en mode dev (avec Turbopack)

# Production
npm run build        # Build de production
npm run start        # Démarrer le serveur prod

# Qualité de code
npm run lint         # Vérifier le code
```

## 📸 Screenshots

### Page Arbitrage
Graphiques en temps réel comparant les prix entre exchanges

### Page Arbitrage Prices
Cartes d'opportunités avec calculs de profits détaillés

### Page Fundings Rate
Top opportunités APR avec tableau complet

## 🔧 Configuration

### Ajouter de nouvelles paires
Modifiez `lib/mockData.ts` pour ajouter des paires personnalisées.

### Personnaliser les exchanges
Ajoutez vos exchanges dans `components/Sidebar.tsx`.

### Modifier le thème
Configurez les couleurs dans `tailwind.config.ts`.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

MIT License - voir le fichier LICENSE pour plus de détails.

## 👤 Auteur

**Othman Berrada**
- GitHub: [@othmanberr](https://github.com/othmanberr)

---

⭐ N'oubliez pas de star le projet si vous l'aimez !

Développé avec ❤️ pour la communauté crypto
