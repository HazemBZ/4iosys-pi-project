const {sendMessage, sendMail} = require('./api');
const router = require('express').Router();

router.get('/sms', (req, resp) => {
    sendMessage('Sup world', '+21622409396').then((message)=> resp.json(message))
});

router.get('/mail', (req, resp) => {
  sendMail().then((info)=> resp.json(info));
})


module.exports = router