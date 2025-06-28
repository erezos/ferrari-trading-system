const fs = require('fs');
const path = require('path');

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
    // Extract crypto symbol from pairs like BTC/USDT -> BTC
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
      'AMD': { name: 'AMD', sector: 'Technology', business: 'Semiconductors' },
      'INTC': { name: 'Intel', sector: 'Technology', business: 'Processors' },
      'ORCL': { name: 'Oracle', sector: 'Technology', business: 'Database Software' },
      'ADBE': { name: 'Adobe', sector: 'Technology', business: 'Creative Software' },
      'PYPL': { name: 'PayPal', sector: 'Fintech', business: 'Digital Payments' },
      'UBER': { name: 'Uber', sector: 'Transportation', business: 'Ride Sharing' },
      'ZOOM': { name: 'Zoom', sector: 'Technology', business: 'Video Conferencing' },
      'SQ': { name: 'Block', sector: 'Fintech', business: 'Payment Processing' },
      'SPOT': { name: 'Spotify', sector: 'Entertainment', business: 'Music Streaming' },
      'SHOP': { name: 'Shopify', sector: 'E-commerce', business: 'Online Store Platform' },
      
      // Additional stocks from scan scripts
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
      'TWTR': { name: 'Twitter', sector: 'Technology', business: 'Social Media' }
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
      'BTC/USDT': { name: 'Bitcoin', type: 'Store of Value', business: 'Digital Gold' },
      'ETH/USDT': { name: 'Ethereum', type: 'Smart Contracts', business: 'DeFi Platform' },
      'BNB/USDT': { name: 'Binance Coin', type: 'Exchange Token', business: 'Trading Fees' },
      'ADA/USDT': { name: 'Cardano', type: 'Proof of Stake', business: 'Sustainable Blockchain' },
      'SOL/USDT': { name: 'Solana', type: 'High Speed', business: 'DeFi & NFTs' },
      'XRP/USDT': { name: 'Ripple', type: 'Payments', business: 'Cross-border Transfers' },
      'DOT/USDT': { name: 'Polkadot', type: 'Interoperability', business: 'Blockchain Bridge' },
      'LINK/USDT': { name: 'Chainlink', type: 'Oracle Network', business: 'Real-world Data' },
      'AVAX/USDT': { name: 'Avalanche', type: 'DeFi Platform', business: 'Fast Transactions' },
      'MATIC/USDT': { name: 'Polygon', type: 'Layer 2', business: 'Ethereum Scaling' },
      'LTC/USDT': { name: 'Litecoin', type: 'Digital Silver', business: 'Fast Payments' },
      'ATOM/USDT': { name: 'Cosmos', type: 'Internet of Blockchains', business: 'Interoperability' },
      'ALGO/USDT': { name: 'Algorand', type: 'Pure Proof of Stake', business: 'Carbon Negative' },
      'VET/USDT': { name: 'VeChain', type: 'Supply Chain', business: 'Product Verification' },
      'FIL/USDT': { name: 'Filecoin', type: 'Decentralized Storage', business: 'Data Preservation' },
      'TRX/USDT': { name: 'TRON', type: 'Content Entertainment', business: 'Creator Economy' }
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
   * Check if a logo file exists for debugging
   */
  checkLogoExists(symbol, isCrypto = false) {
    const logoPath = isCrypto 
      ? path.join(__dirname, '../../public/logos/crypto', `${symbol.split('/')[0]}.png`)
      : path.join(__dirname, '../../public/logos/stocks', `${symbol}.png`);
    
    return fs.existsSync(logoPath);
  }
}

module.exports = new LogoUtils(); 