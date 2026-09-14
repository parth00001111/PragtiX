export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const ensure = (condition, status, message) => {
  if (!condition) throw new HttpError(status, message);
};
export const endpoint = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
export const ok = (res, data, status = 200, message) => res.status(status).json({ success: true, ...(message && { message }), data });

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const databaseErrors = {
    P2002: [409, "This record already exists"],
    P2003: [400, "A referenced record is missing or still in use"],
    P2025: [404, "Record not found"],
    P2034: [409, "Concurrent update; please retry"],
    P1001: [503, "Database is temporarily unavailable"],
    P2024: [503, "Database is busy; please retry"],
  };
  let [status, message] = databaseErrors[error.code] || [error.status || 500, error.message];
  if (error.name === "MulterError" || error.message === "Unsupported file type") {
    status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = error.message;
  }
  if (error.type === "entity.parse.failed") { status = 400; message = "Invalid JSON body"; }
  if (error.name === "PrismaClientInitializationError") { status = 503; message = "Database is temporarily unavailable"; }
  if (status === 500) { console.error("Request failed:", error.name, error.code || ""); message = "An unexpected server error occurred"; }
  res.status(status).json({ success: false, message });
};
