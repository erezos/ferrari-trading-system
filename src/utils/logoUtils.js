import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LogoUtils {
  constructor() {
    // Simple fallback logos using emoji data URIs
    this.defaultStockLogo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%234B7498"/><text x="32" y="40" font-family="Arial" font-size="24" fill="white" text-anchor="middle">📈</text></svg>';
    
    this.defaultCryptoLogo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%23F7921A"/><text x="32" y="40" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🪙</text></svg>';
  }

  /**
   * Get the logo asset path for a stock symbol with fallback handling
   */
  getStockLogoUrl(symbol) {
    const logoPath = path.join(__dirname, '../../public/logos/stocks', `${symbol}.png`);
    
    if (fs.existsSync(logoPath)) {
      return `assets/logos/stocks/${symbol}.png`; // Flutter asset path
    }
    
    // Return default stock logo with trading chart emoji
    return this.defaultStockLogo;
  }

  /**
   * Get the logo asset path for a crypto symbol with fallback handling
   */
  getCryptoLogoUrl(symbol) {
    // Extract crypto symbol from pairs like BTC/USD -> BTC
    const cryptoSymbol = symbol.includes('/') ? symbol.split('/')[0] : symbol;
    const logoPath = path.join(__dirname, '../../public/logos/crypto', `${cryptoSymbol}.png`);
    
    if (fs.existsSync(logoPath)) {
      return `assets/logos/crypto/${cryptoSymbol}.png`; // Flutter asset path
    }
    
    // Return default crypto logo with coin emoji
    return this.defaultCryptoLogo;
  }

  /**
   * Get company information with logo fallback
   */
  getStockCompanyInfo(symbol) {
    const companyInfo = {
      'AAPL': { name: 'Apple Inc.', sector: 'Technology', business: 'Consumer Electronics' },
      'MSFT': { name: 'Microsoft', sector: 'Technology', business: 'Software & Cloud' },
      'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology', business: 'Internet Services' },
      'GOOG': { name: 'Alphabet Inc.', sector: 'Technology', business: 'Internet Services' },
      'TSLA': { name: 'Tesla', sector: 'Automotive', business: 'Electric Vehicles' },
      'AMZN': { name: 'Amazon', sector: 'E-commerce', business: 'Online Retail & Cloud' },
      'META': { name: 'Meta', sector: 'Technology', business: 'Social Media' },
      'NVDA': { name: 'NVIDIA', sector: 'Technology', business: 'AI & Graphics' },
      'NFLX': { name: 'Netflix', sector: 'Entertainment', business: 'Streaming' },
      'DIS': { name: 'Disney', sector: 'Entertainment', business: 'Media & Parks' },
      'CRM': { name: 'Salesforce', sector: 'Technology', business: 'CRM Software' },
      'AMD': { name: 'Advanced Micro Devices', sector: 'Technology', business: 'Semiconductors' },
      'INTC': { name: 'Intel', sector: 'Technology', business: 'Processors' },
      'ORCL': { name: 'Oracle', sector: 'Technology', business: 'Database Software' },
      'ADBE': { name: 'Adobe', sector: 'Technology', business: 'Creative Software' },
      'PYPL': { name: 'PayPal', sector: 'Fintech', business: 'Digital Payments' },
      'UBER': { name: 'Uber', sector: 'Transportation', business: 'Ride Sharing' },
      'ZOOM': { name: 'Zoom', sector: 'Technology', business: 'Video Conferencing' },
      'SQ': { name: 'Block', sector: 'Fintech', business: 'Payment Processing' },
      'SPOT': { name: 'Spotify', sector: 'Entertainment', business: 'Music Streaming' },
      'SHOP': { name: 'Shopify', sector: 'E-commerce', business: 'Online Store Platform' },
      
      // Additional stocks from Ferrari watchlist
      'IBM': { name: 'IBM', sector: 'Technology', business: 'Enterprise Software' },
      'JPM': { name: 'JPMorgan Chase', sector: 'Financial Services', business: 'Investment Banking' },
      'BAC': { name: 'Bank of America', sector: 'Financial Services', business: 'Commercial Banking' },
      'WMT': { name: 'Walmart', sector: 'Retail', business: 'Discount Retail' },
      'V': { name: 'Visa', sector: 'Fintech', business: 'Payment Networks' },
      'MA': { name: 'Mastercard', sector: 'Fintech', business: 'Payment Networks' },
      'JNJ': { name: 'Johnson & Johnson', sector: 'Healthcare', business: 'Pharmaceuticals' },
      'PG': { name: 'Procter & Gamble', sector: 'Consumer Goods', business: 'Personal Care' },
      'KO': { name: 'Coca-Cola', sector: 'Consumer Goods', business: 'Beverages' },
      'PEP': { name: 'PepsiCo', sector: 'Consumer Goods', business: 'Food & Beverages' },
      'CSCO': { name: 'Cisco Systems', sector: 'Technology', business: 'Networking Equipment' },
      'HD': { name: 'Home Depot', sector: 'Retail', business: 'Home Improvement' },
      'MCD': { name: 'McDonald\'s', sector: 'Consumer Services', business: 'Fast Food' },
      'NKE': { name: 'Nike', sector: 'Consumer Goods', business: 'Athletic Footwear' },
      'UNH': { name: 'UnitedHealth Group', sector: 'Healthcare', business: 'Health Insurance' },
      'XOM': { name: 'Exxon Mobil', sector: 'Energy', business: 'Oil & Gas' },
      'GE': { name: 'General Electric', sector: 'Industrial', business: 'Conglomerate' },
      'F': { name: 'Ford Motor', sector: 'Automotive', business: 'Vehicle Manufacturing' },
      'GM': { name: 'General Motors', sector: 'Automotive', business: 'Vehicle Manufacturing' },
      'BABA': { name: 'Alibaba Group', sector: 'E-commerce', business: 'Online Marketplace' },
      'ROKU': { name: 'Roku', sector: 'Technology', business: 'Streaming Platform' },
      'TWTR': { name: 'Twitter', sector: 'Technology', business: 'Social Media' },
      'DOCU': { name: 'DocuSign', sector: 'Technology', business: 'Digital Signatures' },
      'SNOW': { name: 'Snowflake', sector: 'Technology', business: 'Cloud Data Platform' },
      'PLTR': { name: 'Palantir', sector: 'Technology', business: 'Big Data Analytics' },
      'QCOM': { name: 'Qualcomm', sector: 'Technology', business: 'Mobile Chips' },
      'AVGO': { name: 'Broadcom', sector: 'Technology', business: 'Semiconductors' },
      'BRK.B': { name: 'Berkshire Hathaway', sector: 'Financial Services', business: 'Investment Holding' },
      'SPY': { name: 'SPDR S&P 500 ETF', sector: 'ETF', business: 'S&P 500 Index Fund' },
      'QQQ': { name: 'Invesco QQQ ETF', sector: 'ETF', business: 'Nasdaq-100 Index Fund' },
      'IWM': { name: 'iShares Russell 2000 ETF', sector: 'ETF', business: 'Small Cap Index Fund' },
      'VTI': { name: 'Vanguard Total Stock Market ETF', sector: 'ETF', business: 'Total Market Index Fund' },
      'ARKK': { name: 'ARK Innovation ETF', sector: 'ETF', business: 'Innovation Index Fund' },
      'XLK': { name: 'Technology Select Sector SPDR Fund', sector: 'ETF', business: 'Technology Sector Fund' },
      'XLF': { name: 'Financial Select Sector SPDR Fund', sector: 'ETF', business: 'Financial Sector Fund' },
      'XLE': { name: 'Energy Select Sector SPDR Fund', sector: 'ETF', business: 'Energy Sector Fund' },
      'GME': { name: 'GameStop', sector: 'Retail', business: 'Video Game Retail' },
      'AMC': { name: 'AMC Entertainment', sector: 'Entertainment', business: 'Movie Theaters' },
      'BB': { name: 'BlackBerry', sector: 'Technology', business: 'Cybersecurity Software' },
      'WISH': { name: 'ContextLogic', sector: 'E-commerce', business: 'Online Marketplace' },
      'CLOV': { name: 'Clover Health', sector: 'Healthcare', business: 'Health Insurance' },
      'SPCE': { name: 'Virgin Galactic', sector: 'Aerospace', business: 'Space Tourism' },
      'RIVN': { name: 'Rivian', sector: 'Automotive', business: 'Electric Trucks' },
      'LCID': { name: 'Lucid Motors', sector: 'Automotive', business: 'Electric Luxury Cars' }
    };

    const company = companyInfo[symbol] || {
      name: symbol,
      sector: 'Financial Markets',
      business: 'Public Company'
    };

    return {
      name: company.name,
      symbol: symbol,
      logoUrl: this.getStockLogoUrl(symbol),
      sector: company.sector,
      business: company.business,
      isCrypto: false
    };
  }

  /**
   * Get crypto information with logo fallback
   */
  getCryptoCompanyInfo(symbol) {
    const cryptoInfo = {
      'BTC/USD': { name: 'Bitcoin', type: 'Store of Value', business: 'Digital Gold' },
      'ETH/USD': { name: 'Ethereum', type: 'Smart Contracts', business: 'DeFi Platform' },
      'BNB/USD': { name: 'Binance Coin', type: 'Exchange Token', business: 'Trading Fees' },
      'ADA/USD': { name: 'Cardano', type: 'Proof of Stake', business: 'Sustainable Blockchain' },
      'SOL/USD': { name: 'Solana', type: 'High Speed', business: 'DeFi & NFTs' },
      'XRP/USD': { name: 'Ripple', type: 'Payments', business: 'Cross-border Transfers' },
      'DOT/USD': { name: 'Polkadot', type: 'Interoperability', business: 'Blockchain Bridge' },
      'DOGE/USD': { name: 'Dogecoin', type: 'Meme Coin', business: 'Digital Currency' },
      'AVAX/USD': { name: 'Avalanche', type: 'DeFi Platform', business: 'Fast Transactions' },
      'LUNA/USD': { name: 'Terra Luna', type: 'Algorithmic Stablecoin', business: 'DeFi Ecosystem' },
      'LINK/USD': { name: 'Chainlink', type: 'Oracle Network', business: 'Real-world Data' },
      'UNI/USD': { name: 'Uniswap', type: 'DEX Token', business: 'Decentralized Exchange' },
      'ALGO/USD': { name: 'Algorand', type: 'Pure Proof of Stake', business: 'Carbon Negative' },
      'ATOM/USD': { name: 'Cosmos', type: 'Internet of Blockchains', business: 'Interoperability' },
      'FTT/USD': { name: 'FTX Token', type: 'Exchange Token', business: 'Trading Platform' },
      'NEAR/USD': { name: 'Near Protocol', type: 'Developer Platform', business: 'Web3 Infrastructure' },
      'MANA/USD': { name: 'Decentraland', type: 'Metaverse', business: 'Virtual Real Estate' },
      'SAND/USD': { name: 'The Sandbox', type: 'Gaming Metaverse', business: 'Virtual Worlds' },
      'MATIC/USD': { name: 'Polygon', type: 'Layer 2', business: 'Ethereum Scaling' },
      'CRO/USD': { name: 'Cronos', type: 'Exchange Token', business: 'Crypto.com Platform' },
      'LRC/USD': { name: 'Loopring', type: 'Layer 2 DEX', business: 'Decentralized Trading' },
      'ENJ/USD': { name: 'Enjin Coin', type: 'Gaming Token', business: 'NFT Gaming Platform' },
      'GALA/USD': { name: 'Gala Games', type: 'Gaming Token', business: 'Blockchain Gaming' },
      'CHZ/USD': { name: 'Chiliz', type: 'Sports Token', business: 'Fan Engagement' }
    };

    const crypto = cryptoInfo[symbol] || {
      name: symbol,
      type: 'Cryptocurrency',
      business: 'Digital Asset'
    };

    return {
      name: crypto.name,
      symbol: symbol,
      logoUrl: this.getCryptoLogoUrl(symbol),
      sector: crypto.type,
      business: crypto.business,
      isCrypto: true
    };
  }

  /**
   * Get company info for any symbol (auto-detects crypto vs stock)
   */
  getCompanyInfo(symbol) {
    const isCrypto = symbol.includes('/');
    
    if (isCrypto) {
      return this.getCryptoCompanyInfo(symbol);
    } else {
      return this.getStockCompanyInfo(symbol);
    }
  }

  /**
   * Check if a logo file exists for debugging
   */
  checkLogoExists(symbol, isCrypto = false) {
    const logoPath = isCrypto 
      ? path.join(__dirname, '../../public/logos/crypto', `${symbol.split('/')[0]}.png`)
      : path.join(__dirname, '../../public/logos/stocks', `${symbol}.png`);
    
    return fs.existsSync(logoPath);
  }
}

export default new LogoUtils(); 