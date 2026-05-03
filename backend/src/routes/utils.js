const express = require("express");
const db = require("../db");
const { generateCitation } = require("../services/utilityService");
const { getTrimmedString, sendError, sendSuccess } = require("../utils/http");

const router = express.Router();
const VALID_CITATION_FORMATS = new Set(["apa", "mla", "bibtex"]);

router.get("/cite/:id", async (req, res) => {
  const id = getTrimmedString(req.params.id);
  const requestedFormat = getTrimmedString(req.query.format || "apa").toLowerCase();

  if (!id) {
    return sendError(res, {
      status: 400,
      error: "Citation id is required.",
      code: "UTILS_CITE_ID_REQUIRED",
    });
  }

  const format = VALID_CITATION_FORMATS.has(requestedFormat)
    ? requestedFormat
    : "apa";

  try {
    const paper = await db.knowledge.findUnique({
      where: { id },
    });

    if (!paper) {
      return sendError(res, {
        status: 404,
        error: "Paper not found.",
        code: "UTILS_CITE_NOT_FOUND",
      });
    }

    const citation = generateCitation(paper, format);
    return sendSuccess(res, citation, 200, { format });
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Failed to generate citation.",
      code: "UTILS_CITE_FAILED",
      details: error.message,
    });
  }
});

module.exports = router;
