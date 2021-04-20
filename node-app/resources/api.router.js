const {sendSMSMessage, sendEMail} = require('./api');
const router = require('express').Router();

router.get('/sms', (req, resp) => {
    sendSMSMessage('Sup world', '+21622409396').then((message)=> resp.json(message))
});

router.get('/mail', (req, resp) => {
  sendEMail().then((info)=> resp.json(info));
})


module.exports = router