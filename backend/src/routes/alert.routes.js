const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/alert.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.getAlerts);

router.use(protect);
router.post('/',          ctrl.createAlert);
router.put('/:id/resolve',authorize('admin','dispatcher'), ctrl.resolveAlert);
router.delete('/:id',     authorize('admin'),              ctrl.deleteAlert);

module.exports = router;
