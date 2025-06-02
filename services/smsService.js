import twilio from 'twilio';
import axios from 'axios';
import { TWILIO_ACCOUNT_SID, TWILIO_PHONE_NUMBER, TWILIO_AUTH_TOKEN, HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET, AFRICAS_TALKING_API_KEY, AFRICAS_TALKING_USERNAME } from '../utils/config.js';

class SMSService {
  constructor() {
    this.twilioClient = null;
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize Twilio if credentials are provided
    // if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    //   this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    // }
  }

  async sendVerificationCode(phone, code, preferredLanguage = 'en') {
    const messages = {
      en: `Your LegalHelp GH verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`,
      twi: `Wo LegalHelp GH verification code ne: ${code}. Code yi bɛba awieɛ simma 10 akyi. Mfa code yi nka obiara.`,
      ewe: `Wò LegalHelp GH verification code enye: ${code}. Code sia ava nu le aɖabaƒoƒo 10 megbe. Megana ame aɖeke nakpɔ code sia o.`,
      dagbani: `A LegalHelp GH verification code ni: ${code}. Code ŋɔ di zaa miniti 10 daabo ni. Ka ma pam ŋɔ ni ka din.`
    };

    const message = messages[preferredLanguage] || messages.en;

    // Format phone number for international use
    const formattedPhone = this.formatPhoneNumber(phone);

    // Try multiple providers in order of preference
    const providers = [
      { name: 'twilio', method: this.sendViaTwilio.bind(this) },
      { name: 'hubtel', method: this.sendViaHubtel.bind(this) },
      { name: 'africatalking', method: this.sendViaAfricasTalking.bind(this) }
    ];

    let lastError = null;

    for (const provider of providers) {
      try {
        const result = await provider.method(formattedPhone, message);
        if (result.success) {
          console.log(`SMS sent successfully via ${provider.name}`);
          return { success: true, provider: provider.name, messageId: result.messageId };
        }
      } catch (error) {
        console.error(`Failed to send SMS via ${provider.name}:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If all providers fail
    console.error('All SMS providers failed');
    throw new Error(lastError?.message || 'Failed to send SMS verification code');
  }

  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with 0, replace with Ghana country code
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    }

    // If it doesn't start with country code, add Ghana code
    if (!cleaned.startsWith('233')) {
      cleaned = '233' + cleaned;
    }

    // Add + prefix for international format
    return '+' + cleaned;
  }

  // async sendViaTwilio(phone, message) {
  //   if (!this.twilioClient) {
  //     throw new Error('Twilio not configured');
  //   }

  //   try {
  //     const result = await this.twilioClient.messages.create({
  //       body: message,
  //       from: TWILIO_PHONE_NUMBER,
  //       to: phone
  //     });

  //     return { success: true, messageId: result.sid };
  //   } catch (error) {
  //     throw new Error(`Twilio error: ${error.message}`);
  //   }
  // }

  async sendViaHubtel(phone, message) {
    if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET) {
      throw new Error('Hubtel not configured');
    }

    try {
      const response = await axios.post('https://smsc.hubtel.com/v1/messages/send', {
        From: 'LegalHelp',
        To: phone,
        Content: message
      }, {
        auth: {
          username: HUBTEL_CLIENT_ID,
          password: HUBTEL_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.MessageId) {
        return { success: true, messageId: response.data.MessageId };
      } else {
        throw new Error('No message ID returned from Hubtel');
      }
    } catch (error) {
      throw new Error(`Hubtel error: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendViaAfricasTalking(phone, message) {
    if (!AFRICAS_TALKING_API_KEY || !AFRICAS_TALKING_USERNAME) {
      throw new Error('Africa\'s Talking not configured');
    }

    try {
      const response = await axios.post('https://api.africastalking.com/version1/messaging',
        new URLSearchParams({
          username: AFRICAS_TALKING_USERNAME,
          to: phone,
          message: message,
          from: 'LegalHelp'
        }), {
          headers: {
            'apiKey': AFRICAS_TALKING_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data && response.data.SMSMessageData && response.data.SMSMessageData.Recipients.length > 0) {
        const recipient = response.data.SMSMessageData.Recipients[0];
        if (recipient.status === 'Success') {
          return { success: true, messageId: recipient.messageId };
        } else {
          throw new Error(`Africa's Talking error: ${recipient.status}`);
        }
      } else {
        throw new Error('No recipients data returned from Africa\'s Talking');
      }
    } catch (error) {
      throw new Error(`Africa's Talking error: ${error.response?.data?.message || error.message}`);
    }
  }

  // For development/testing - log SMS instead of sending
  async sendViaDevelopment(phone, message) {
    if (config.NODE_ENV !== 'development') {
      throw new Error('Development SMS service only available in development mode');
    }

    console.log('📱 SMS SIMULATION (Development Mode)');
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log('This is a simulated SMS for development purposes.');

    return { success: true, messageId: 'dev_' + Date.now() };
  }

  async resendVerificationCode(phone, code, preferredLanguage = 'en') {
    // Add rate limiting logic here if needed
    return this.sendVerificationCode(phone, code, preferredLanguage);
  }

  validatePhoneNumber(phone) {
    // Basic validation for Ghanaian phone numbers
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid Ghana number
    if (cleaned.length < 9 || cleaned.length > 13) {
      return { valid: false, error: 'Invalid phone number length' };
    }

    // Ghana mobile prefixes (after country code 233)
    const validPrefixes = ['20', '23', '24', '25', '26', '27', '28', '29', '50', '54', '55', '56', '57', '59'];

    let numberToCheck = cleaned;
    if (numberToCheck.startsWith('233')) {
      numberToCheck = numberToCheck.substring(3);
    } else if (numberToCheck.startsWith('0')) {
      numberToCheck = numberToCheck.substring(1);
    }

    const prefix = numberToCheck.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      return { valid: false, error: 'Invalid Ghana mobile number prefix' };
    }

    return { valid: true, formatted: this.formatPhoneNumber(phone) };
  }
}

export default new SMSService();
