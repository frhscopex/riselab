/**
 * Utility Service
 * Handles citation generation and other helper functions.
 */

function generateCitation(paper, format = 'apa') {
  const year = new Date(paper.date).getFullYear();
  const authors = paper.source.includes("arXiv") ? "arXiv Community" : "RiseLab Research Team";

  switch (format.toLowerCase()) {
    case 'bibtex':
      return `@article{riselab${paper.id.split('-')[0]},\n  title={${paper.title}},\n  author={${authors}},\n  year={${year}},\n  journal={${paper.source}}\n}`;
    case 'mla':
      return `${authors}. "${paper.title}." ${paper.source}, ${year}.`;
    case 'apa':
    default:
      return `${authors}. (${year}). ${paper.title}. ${paper.source}.`;
  }
}

module.exports = { generateCitation };
