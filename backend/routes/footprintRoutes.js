const express = require('express');
const { analyzePassword, checkBreach } = require('../controllers/footprintController');

const router = express.Router();

router.post('/analyze-password', analyzePassword);
router.post('/check-breach', checkBreach);

module.exports = router;
