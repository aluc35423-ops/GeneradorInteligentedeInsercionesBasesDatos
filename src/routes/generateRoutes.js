const express = require('express');
const router = express.Router();
const generatorController = require('../controllers/generatorController');

router.get('/tables', generatorController.getTables);
router.get('/tables/:tableName/schema', generatorController.getTableSchema);

router.post('/generate', generatorController.generateData);
router.post('/preview', generatorController.generatePreview);
router.post('/insert-bulk', generatorController.insertBulk);

module.exports = router;