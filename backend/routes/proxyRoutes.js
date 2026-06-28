import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * Email Service Route - Using Brevo (Sendinblue) API
 * Prevents exposing email service credentials in frontend
 */
router.post('/send-email', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and message are required' 
      });
    }

    // Check if Brevo is configured
    if (!process.env.BREVO_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email service not configured' 
      });
    }

    // Send email via Brevo API
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: process.env.BREVO_FROM_NAME || 'ChefHub',
          email: process.env.BREVO_FROM_EMAIL
        },
        to: [
          {
            email: process.env.BREVO_FROM_EMAIL, // Send to yourself
            name: process.env.BREVO_FROM_NAME || 'ChefHub'
          }
        ],
        replyTo: {
          email: email,
          name: name
        },
        subject: subject || 'Contact Form Submission from ChefHub',
        htmlContent: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
          <hr>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
        textContent: `
New Contact Form Submission

From: ${name}
Email: ${email}
Subject: ${subject || 'No subject'}

Message:
${message}
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: response.data.messageId
    });
  } catch (error) {
    console.error('Email sending error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email',
      details: error.response?.data?.message || error.message
    });
  }
});

/**
 * Razorpay Configuration Route
 * Returns only the public key needed for frontend
 */
router.get('/razorpay-config', (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID) {
      return res.status(500).json({ 
        success: false, 
        error: 'Razorpay configuration not found' 
      });
    }

    res.json({ 
      success: true, 
      keyId: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error('Razorpay config error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payment configuration' 
    });
  }
});

/**
 * Geocoding Proxy
 * Proxies geocoding requests to prevent API key exposure
 * Falls back to OpenStreetMap Nominatim when OpenRouteService is not configured.
 */
const fetchNominatimGeocode = async (address) => {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: address,
      format: 'json',
      limit: 1
    },
    headers: {
      'User-Agent': 'ChefHub/1.0 (contact@chefhub.example)'
    }
  });

  if (Array.isArray(response.data) && response.data.length > 0) {
    const result = response.data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      source: 'nominatim'
    };
  }
  return null;
};

router.get('/geocode', async (req, res) => {
  try {
    const address = req.query.address?.trim();

    if (!address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Address parameter is required' 
      });
    }

    let geocodeResult = null;
    let source = 'openrouteservice';
    let lastError = null;

    if (process.env.ORS_API_KEY) {
      try {
        const response = await axios.get(
          `https://api.openrouteservice.org/geocode/search`,
          {
            params: {
              api_key: process.env.ORS_API_KEY,
              text: address
            }
          }
        );

        if (response.data.features && response.data.features.length > 0) {
          const coordinates = response.data.features[0].geometry.coordinates;
          geocodeResult = {
            latitude: coordinates[1],
            longitude: coordinates[0],
            fullResponse: response.data,
            source: 'openrouteservice'
          };
        }
      } catch (error) {
        lastError = error;
        console.warn('OpenRouteService geocoding failed, falling back to Nominatim:', error.response?.data || error.message);
      }
    } else {
      source = 'nominatim';
    }

    if (!geocodeResult) {
      geocodeResult = await fetchNominatimGeocode(address);
      source = 'nominatim';
    }

    if (!geocodeResult) {
      return res.status(404).json({ 
        success: false, 
        error: 'No results found for the given address',
        details: lastError?.response?.data || lastError?.message
      });
    }

    res.json({ 
      success: true, 
      data: geocodeResult
    });
  } catch (error) {
    console.error('Geocoding error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Geocoding request failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * OpenRouteService Reverse Geocoding Proxy
 * Converts coordinates to address
 */
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude parameters are required' 
      });
    }

    if (!process.env.ORS_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Geocoding service not configured' 
      });
    }

    const response = await axios.get(
      `https://api.openrouteservice.org/geocode/reverse`,
      {
        params: {
          api_key: process.env.ORS_API_KEY,
          'point.lon': lon,
          'point.lat': lat
        }
      }
    );

    res.json({ 
      success: true, 
      data: response.data 
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Reverse geocoding request failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * OpenRouteService Directions/Routing Proxy
 * For getting directions between two points
 */
router.post('/directions', async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least two coordinate pairs are required' 
      });
    }

    if (!process.env.ORS_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Routing service not configured' 
      });
    }

    const response = await axios.post(
      `https://api.openrouteservice.org/v2/directions/driving-car`,
      {
        coordinates: coordinates
      },
      {
        headers: {
          'Authorization': process.env.ORS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ 
      success: true, 
      data: response.data 
    });
  } catch (error) {
    console.error('Directions error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Directions request failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

export default router;
