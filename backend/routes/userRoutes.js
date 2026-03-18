const express = require('express');
const { getProfile, updateProfile, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes below this will be protected

router.get('/profile', getProfile);
router.put('/update', updateProfile);
router.delete('/delete', deleteUser);

module.exports = router;
