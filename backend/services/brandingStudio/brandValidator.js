class BrandValidator {
  constructor(brandId) {
    this.brand = loadBrand(brandId);
    this.embedding = this.loadEmbedding();
  }

  async checkConsistency(assetUrl) {
    const assetEmbedding = await getEmbedding(assetUrl);
    const similarity = cosineSimilarity(this.embedding, assetEmbedding);
    return {
      score: similarity,
      passed: similarity > 0.85,
      suggestions: similarity < 0.85 ? await this.generateSuggestions(assetUrl) : []
    };
  }
}
