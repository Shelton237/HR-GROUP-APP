const router = require("express").Router();
const ctrl = require("../controllers/dashboard.controller");
const { authenticate } = require("../middlewares/auth");
const { ApiError } = require("../middlewares/error");

/** "Operateur" is scoped to day-to-day operations only — no consolidated Dashboard view. */
function blockOperateur(req, res, next) {
  if (req.user?.role === "Operateur") return next(new ApiError(403, "Non disponible pour ce rôle."));
  next();
}

router.get("/alerts", authenticate, blockOperateur, ctrl.alerts);
router.get("/summary", authenticate, blockOperateur, ctrl.summary);

module.exports = router;
