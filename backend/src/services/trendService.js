const db = require("../db");

/**
 * Trend Analysis Service
 * Calculates the "velocity" and trending status of research papers.
 */

async function calculateTrends() {
  console.log("📈 Calculating research trends...");

  try {
    // Fetch all knowledge items to calculate scores
    const papers = await db.knowledge.findMany({
      orderBy: { date: 'desc' }
    });

    // Simple velocity scoring logic:
    // Score = 100 - (days since publication) + (Source weight)
    const scoredPapers = papers.map(paper => {
      const now = new Date();
      const pubDate = new Date(paper.date);
      const diffDays = Math.ceil((now - pubDate) / (1000 * 60 * 60 * 24));
      
      let sourceWeight = 10;
      if (paper.source.includes("arXiv")) sourceWeight = 20;
      if (paper.source.includes("Internal")) sourceWeight = 30;

      const velocityScore = Math.max(0, 100 - (diffDays * 5) + sourceWeight);

      return {
        ...paper,
        velocityScore
      };
    });

    // Sort by velocity score
    return scoredPapers.sort((a, b) => b.velocityScore - a.velocityScore).slice(0, 5);
  } catch (error) {
    console.error("❌ Error calculating trends:", error.message);
    return [];
  }
}

module.exports = { calculateTrends };
