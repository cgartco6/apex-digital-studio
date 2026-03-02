const geoip = require('geoip-lite');

class ComplianceService {
  check(product, userCountry = null) {
    // This is a simplified check. In production, you'd have full logic for each regulation.
    const issues = [];
    let compliant = true;

    // Check if product contains personal data (if applicable)
    if (product.containsPersonalData) {
      if (userCountry === 'ZA') {
        // POPIA requires consent and purpose limitation
        if (!product.consentObtained) {
          compliant = false;
          issues.push('Missing consent for personal data (POPIA)');
        }
      }
      if (userCountry === 'DE' || userCountry === 'FR') {
        // GDPR requires explicit consent and data processing agreement
        if (!product.gdprCompliant) {
          compliant = false;
          issues.push('GDPR compliance not met');
        }
      }
    }

    // Age restriction for adult content
    if (product.category === 'adult' && (!product.ageRestriction || product.ageRestriction < 18)) {
      compliant = false;
      issues.push('Adult content must be age-restricted (18+)');
    }

    // Tax handling (simplified)
    if (userCountry === 'ZA') {
      product.vatIncluded = true; // assume prices include VAT
    }

    return { compliant, issues };
  }

  async getCountryFromIP(ip) {
    const geo = geoip.lookup(ip);
    return geo ? geo.country : null;
  }
}
module.exports = new ComplianceService();
