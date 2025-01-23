var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* GET menu page. */
router.get('/menu', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/menu.html'));
});

/* GET about page. */
router.get('/aboutUs', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/aboutUs.html'));
});

/* GET dialogue page. */
router.get('/dialogue', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/dialogue.html'));
});

module.exports = router;