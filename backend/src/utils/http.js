function sendSuccess(res, data, status = 200, meta) {
  const payload = { data };
  if (meta && typeof meta === "object") {
    payload.meta = meta;
  }
  return res.status(status).json(payload);
}

function sendError(res, {
  status = 500,
  error = "Internal server error",
  code,
  details,
  hint,
} = {}) {
  const payload = {
    error,
    message: error,
  };

  if (code) payload.code = code;
  if (details) payload.details = details;
  if (hint) payload.hint = hint;

  return res.status(status).json(payload);
}

function parseBoundedInt(rawValue, {
  defaultValue,
  min,
  max,
} = {}) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function getTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

module.exports = {
  sendSuccess,
  sendError,
  parseBoundedInt,
  getTrimmedString,
  isUuid,
};
