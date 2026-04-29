// Utility functions for API interactions with Wuz API

const WUZ_API_BASE_URL = process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || 'https://wuzapi.guaranteeadmit.com';
const WUZ_API_KEY = process.env.WUZ_API_KEY;

export async function generateQRCode() {
  try {
    const response = await fetch(`${WUZ_API_BASE_URL}/sessions/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WUZ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate QR: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating QR:', error);
    throw error;
  }
}

export async function checkSessionStatus(sessionId: string) {
  try {
    const response = await fetch(`${WUZ_API_BASE_URL}/sessions/${sessionId}/status`, {
      headers: {
        'Authorization': `Bearer ${WUZ_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking session status:', error);
    throw error;
  }
}

export async function getChats(sessionId: string) {
  try {
    const response = await fetch(`${WUZ_API_BASE_URL}/sessions/${sessionId}/chats`, {
      headers: {
        'Authorization': `Bearer ${WUZ_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get chats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.chats || [];
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
}

export async function getMessages(sessionId: string, chatId: string) {
  try {
    const response = await fetch(
      `${WUZ_API_BASE_URL}/sessions/${sessionId}/chats/${chatId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${WUZ_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(
  sessionId: string,
  chatId: string,
  message: string
) {
  try {
    const response = await fetch(
      `${WUZ_API_BASE_URL}/sessions/${sessionId}/chats/${chatId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WUZ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function testAPIConnection() {
  try {
    const response = await fetch(`${WUZ_API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}
