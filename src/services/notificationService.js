const { admin } = require('../config/firebase');

class NotificationService {
  constructor() {
    this.messaging = admin.messaging();
  }

  /**
   * Send push notification for new trading tip
   * @param {Object} tipData - The trading tip data
   * @param {Object} company - Company information with logo
   */
  async sendTipNotification(tipData, company) {
    try {
      console.log('📱 Preparing push notification...');
      
      const { symbol, timeframe, sentiment, strength, entryPrice } = tipData;
      const companyName = company.name || symbol;
      
      // Format timeframe for display
      const timeframeDisplay = timeframe.replace('_', ' ').toUpperCase();
      
      // Create notification content
      const title = `🚀 New ${timeframeDisplay} Tip: ${companyName}`;
      const body = `${sentiment.toUpperCase()} signal (${Math.abs(strength).toFixed(1)}) - Entry: $${entryPrice?.toFixed(2) || 'TBD'}`;
      
      // Use local company logo asset path for rich notification
      const logoAssetPath = company.logoUrl;
      
      // Build the notification message with iOS-optimized settings
      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: 'trading_tip',
          symbol: symbol,
          timeframe: timeframe,
          sentiment: sentiment,
          strength: strength.toString(),
          companyName: companyName,
          companyLogo: logoAssetPath, // Pass for in-app display
          entryPrice: entryPrice?.toString() || '',
          timestamp: new Date().toISOString(),
          // Add navigation data for tap handling
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          route: '/trading_tip', // Route to navigate to when tapped
          // Add timeframe-specific routing data
          target_timeframe: timeframe // This will be used by Flutter to navigate to the specific timeframe screen
        },
        android: {
          notification: {
            icon: 'ic_notification', // Default notification icon
            color: sentiment === 'bullish' ? '#4CAF50' : '#F44336',
            channelId: 'trading_tips',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          },
          data: {
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10', // High priority for immediate delivery
            'apns-push-type': 'alert', // Required for visible notifications
          },
          payload: {
            aps: {
              alert: {
                title: title,
                body: body
              },
              sound: 'default',
              badge: 1,
              category: 'TRADING_TIP',
              'content-available': 1, // Enable background processing
              'mutable-content': 1, // Allow notification service extension
            },
            // Custom data for iOS
            customData: {
              type: 'trading_tip',
              symbol: symbol,
              timeframe: timeframe,
              sentiment: sentiment,
              target_timeframe: timeframe // For iOS-specific timeframe routing
            }
          }
        },
        // Send to topic for all users (we'll implement user-specific tokens later)
        topic: 'trading_tips'
      };
      
      console.log('📤 Sending notification:', {
        title: message.notification.title,
        body: message.notification.body,
        symbol: symbol,
        sentiment: sentiment,
        apnsHeaders: message.apns.headers
      });
      
      // Send the notification
      const response = await this.messaging.send(message);
      console.log('✅ Notification sent successfully:', response);
      
      return {
        success: true,
        messageId: response,
        title: title,
        body: body
      };
      
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      
      // Log specific error details for debugging
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.details) {
        console.error('Error details:', error.details);
      }
      
      return {
        success: false,
        error: error.message,
        errorCode: error.code
      };
    }
  }

  /**
   * Send test notification with iOS-optimized settings
   */
  async sendTestNotification() {
    try {
      const message = {
        notification: {
          title: '🧪 Trading Tip Generator Test',
          body: 'Push notifications are working! 🎉'
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#00D4AA',
            channelId: 'trading_tips',
            priority: 'high',
            defaultSound: true,
          }
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: '🧪 Trading Tip Generator Test',
                body: 'Push notifications are working! 🎉'
              },
              sound: 'default',
              badge: 1,
              'content-available': 1,
              'mutable-content': 1,
            }
          }
        },
        topic: 'trading_tips'
      };
      
      console.log('📤 Sending test notification with iOS optimization...');
      const response = await this.messaging.send(message);
      console.log('✅ Test notification sent:', response);
      return { success: true, messageId: response };
      
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { 
        success: false, 
        error: error.message,
        errorCode: error.code 
      };
    }
  }

  /**
   * Send notification to specific device token (for testing)
   */
  async sendNotificationToToken(token, title = 'Test Notification', body = 'This is a test message') {
    try {
      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#00D4AA',
            channelId: 'trading_tips',
            priority: 'high',
            defaultSound: true,
          }
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: title,
                body: body
              },
              sound: 'default',
              badge: 1,
              'content-available': 1,
              'mutable-content': 1,
            }
          }
        },
        token: token
      };
      
      console.log(`📤 Sending notification to token: ${token.substring(0, 20)}...`);
      const response = await this.messaging.send(message);
      console.log('✅ Token notification sent:', response);
      return { success: true, messageId: response };
      
    } catch (error) {
      console.error('❌ Error sending token notification:', error);
      return { 
        success: false, 
        error: error.message,
        errorCode: error.code 
      };
    }
  }
}

module.exports = new NotificationService(); 