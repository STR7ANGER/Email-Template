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

// Predefined black and white email template
const getEmailTemplate = (name, company) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AstraFloww - Let's Scale Your Business</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #000000; color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111111; padding: 30px; border: 1px solid #333333;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333333;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: bold;">AstraFloww</h1>
            <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 16px;">Business Growth Solutions</p>
        </div>

        <!-- Main Content -->
        <div style="line-height: 1.6; color: #ffffff;">
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>I'm reaching out because I see you're building something impressive with <strong>${company}</strong>. As a business owner, I know you're likely juggling a dozen roles at once, from sales to customer support.</p>
            
            <p>Many small businesses struggle with generating a steady flow of leads while managing day-to-day operations. It's a constant battle for time and resources.</p>
            
            <!-- Highlight Box -->
            <div style="background-color: #222222; padding: 20px; margin: 20px 0; border-left: 4px solid #555555; border-radius: 5px;">
                <p style="margin: 0; color: #ffffff;">At AstraFloww, we specialize in building systems that put your growth on autopilot. We create high-performance websites and AI-powered bots that handle the heavy lifting—nurturing leads, answering FAQs, and booking appointments—so you can focus on what you do best.</p>
            </div>
            
            <p>For instance, we helped Lotus Wellness triple their lead flow in under a month with a new website and an AI chatbot. Urban Realty now saves over 10 hours a week on support tasks.</p>
            
            <p>Could a system that saves you time and doubles your leads be a game-changer for you? I'd be happy to share a few specific ideas for <strong>${company}</strong> on a brief 15-minute call next week.</p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://astrafloww.com/contact" style="background-color: #333333; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; border: 1px solid #555555;">Schedule a Call</a>
            </div>
            
            <p>Best regards,<br>
            <strong>Team AstraFloww</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333333;">
            <p style="color: #999999; font-size: 14px; margin: 0;">
                <a href="https://astrafloww.com" style="color: #cccccc; text-decoration: none;">https://astrafloww.com</a><br>
                Building the future of business automation
            </p>
        </div>
    </div>
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