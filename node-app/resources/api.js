const nodemailer = require('nodemailer')

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const OWNED_PHONE = process.env.TWILIO_OWNED_PHONE;
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


async function sendSMSMessage (message="test message unset", to="+21622409396"){
  let return_message = 'Not set yet';
  await client.messages.create({
    body: `"${message}"`,
    from: OWNED_PHONE,
    to:   to
  }).then(message => return_message = message);
  return message;
}


async function sendEMail(){
  // let testAccount = await nodemailer.createTestAccount();
  // console.log(`user ${testAccount.user}`)
  // console.log(`pass ${testAccount.pass}`)
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_APP_MAIL,
      pass: process.env.GMAIL_NODE_APP_PASS
    }
  });
  // now send 
  let info = await transporter.sendMail({
    from: '"SmartBakou Dashboard 👻" <wild@walid.com>', // sender address
    to: process.env.RECEIVER_EMAIL_ADDRESS, //"dude1@gmail.com, dudette1@gmail.com", // list of receivers
    subject: "ALERT: Threshold exceeded", // Subject line
    text: "TEMP Threshold exceeded", // plain text body
    html: "<b>TEMP Threshold exceeded</b>", // html body

  })

  return info;

}



module.exports = {sendSMSMessage, sendEMail}