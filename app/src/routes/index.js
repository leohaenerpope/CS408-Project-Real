var express = require('express');
var router = express.Router();

/* GET home (landing) page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Full Stack Starter Code' });
});
module.exports = router;
