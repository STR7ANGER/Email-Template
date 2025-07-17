const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// Read logo.png as base64 for embedding in email
const logoPath = path.join(__dirname, 'logo.png');
let logoBase64 = '';
try {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = logoBuffer.toString('base64');
} catch (err) {
  console.error('Could not read logo.png:', err.message);
}

// Predefined black and white email template
const getEmailTemplate = (name, company) => {
  // Strict black and white theme
  const mainBg = '#000000';
  const cardBg = '#181818';
  const cardText = '#ffffff';
  const accent = '#19ffe0';
  const border = '#333333';
  const shadow = '0 4px 24px rgba(0,0,0,0.30)';
  const logoImg = `<img src="https://astrafloww.com/assets/image/logo.png" alt="AstraFloww Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.20); background: #181818; padding: 8px;" />`;
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AstraFloww - Let's Scale Your Business</title>
</head>
<body style="margin:0; padding:0; background:${mainBg}; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${mainBg};">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:${cardBg}; color:${cardText}; border-radius:24px; box-shadow:${shadow}; padding:0; border:1px solid ${border}; margin: 40px 0;">
          <tr>
            <td style="padding:40px 32px 32px 32px;">
              <div style="text-align:center; margin-bottom:28px;">
                ${logoImg}
                <h1 style="color:${accent}; font-size:2.1rem; margin:0 0 6px 0; font-weight:800; letter-spacing:1px;">AstraFloww</h1>
                <p style="color:#cccccc; margin:0; font-size:1.1rem; font-weight:500;">Business Growth Solutions</p>
              </div>
              <div style="line-height:1.7; color:${cardText}; font-size:1.08rem;">
                <p style="margin-top:0;">Hi <strong>${name}</strong>,</p>
                <p>I'm reaching out because I see you're building something impressive with <strong>${company}</strong>. As a business owner, I know you're likely juggling a dozen roles at once, from sales to customer support.</p>
                <p>Many small businesses struggle with generating a steady flow of leads while managing day-to-day operations. It's a constant battle for time and resources.</p>
                <div style="background:#222; padding:22px; margin:28px 0 24px 0; border-left:5px solid ${accent}; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                  <p style="margin:0; color:${cardText}; font-size:1.05rem;">At AstraFloww, we specialize in building systems that put your growth on autopilot. We create high-performance websites and AI-powered bots that handle the heavy lifting—nurturing leads, answering FAQs, and booking appointments—so you can focus on what you do best.</p>
                </div>
                <p>For instance, we helped Lotus Wellness triple their lead flow in under a month with a new website and an AI chatbot. Urban Realty now saves over 10 hours a week on support tasks.</p>
                <p>Could a system that saves you time and doubles your leads be a game-changer for you? I'd be happy to share a few specific ideas for <strong>${company}</strong> on a brief 15-minute call next week.</p>
                <div style="text-align:center; margin:38px 0 30px 0;">
                  <a href="https://astrafloww.com/contact" style="background:${accent}; color:#000; padding:16px 36px; text-decoration:none; border-radius:8px; font-weight:700; font-size:1.08rem; display:inline-block; border:none; box-shadow:0 2px 8px rgba(0,0,0,0.10); letter-spacing:0.5px; transition:background 0.2s;">Schedule a Call</a>
                </div>
                <p style="margin-bottom:0;">Best regards,<br><strong>Team AstraFloww</strong></p>
              </div>
              <div style="text-align:center; margin-top:36px; padding-top:18px; border-top:1px solid #222;">
                <p style="color:#bbbbbb; font-size:0.98rem; margin:0;">
                  <a href="https://astrafloww.com" style="color:${accent}; text-decoration:none; font-weight:600;">https://astrafloww.com</a><br>
                  Building the future of business automation
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Email Server is running!',
    endpoints: {
      'POST /send': 'Send mass emails using JSON data',
      'POST /test': 'Send test email',
      'GET /template': 'View email template'
    }
  });
});

// View template
app.get('/template', (req, res) => {
  const sampleTemplate = getEmailTemplate('John Doe', 'Sample Company');
  res.send(sampleTemplate);
});

// Send mass emails
app.post('/send', async (req, res) => {
  try {
    const { recipients } = req.body;
    
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipients array with name, email, and company fields'
      });
    }

    const results = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      if (!recipient.name || !recipient.email || !recipient.company) {
        results.push({
          email: recipient.email || 'unknown',
          success: false,
          error: 'Missing required fields: name, email, or company'
        });
        continue;
      }

      try {
        const htmlContent = getEmailTemplate(recipient.name, recipient.company);
        
        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: recipient.email,
          subject: `Let's Scale ${recipient.company} Together`,
          html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        
        results.push({
          email: recipient.email,
          success: true,
          messageId: info.messageId
        });

        console.log(`✅ Email sent to ${recipient.name} (${recipient.email})`);
        
        // Add 1 second delay between emails
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        results.push({
          email: recipient.email,
          success: false,
          error: error.message
        });
        console.error(`❌ Failed to send to ${recipient.email}:`, error.message);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Mass email completed: ${successCount} sent, ${failCount} failed`,
      results: results,
      summary: {
        total: recipients.length,
        sent: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('Mass email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending emails',
      error: error.message
    });
  }
});

// Send test email
app.post('/test', async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide testEmail address'
      });
    }

    const htmlContent = getEmailTemplate('Test User', 'Test Company');
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: testEmail,
      subject: 'Test Email - AstraFloww System',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Simple Email Server is running on port ${PORT}
📧 Gmail User: ${process.env.GMAIL_USER}
📋 Ready to send mass emails!

Example JSON format:
{
  "recipients": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Tech Solutions"
    }
  ]
}
  `);
});