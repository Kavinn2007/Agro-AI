import { supabase } from '../config/supabase';

export async function getNotifications(userId) {
  const allNotifs = JSON.parse(localStorage.getItem('agroai_notifications') || '[]');
  const userNotifs = allNotifs.filter(n => n.user_id === userId);
  
  if (userNotifs.length > 0) {
    return userNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  return [];
}

export async function createNotification(userId, message) {
  const allNotifs = JSON.parse(localStorage.getItem('agroai_notifications') || '[]');
  
  const newNotif = {
    id: `notif-${Date.now()}`,
    user_id: userId,
    message,
    created_at: new Date().toISOString()
  };
  
  allNotifs.push(newNotif);
  localStorage.setItem('agroai_notifications', JSON.stringify(allNotifs));
  
  return newNotif;
}

export function getDefaultNotifications() {
  return [
    {
      id: 1,
      message: '🌱 Welcome to AgroAI! Upload your first crop image to get started with AI-powered disease detection.',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      message: '🌤️ Seasonal Tip: Apply pre-monsoon fungicide treatment to protect crops from common rainy season diseases.',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      message: '💡 Did you know? Early detection of crop diseases can save up to 40% of potential yield losses.',
      created_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 4,
      message: '🌾 New Feature: Multi-language support is now available! Switch between English and Tamil anytime.',
      created_at: new Date(Date.now() - 259200000).toISOString()
    }
  ];
}

export function getSeasonalAdvice(language = 'en') {
  if (language === 'ta') {
    return [
      {
        id: 1,
        category: 'பருவகாலம்',
        title: 'மழைக்கால பயிர் பாதுகாப்பு',
        content: 'மழைக்காலத்தில் பூஞ்சை நோய்கள் பரவுவதை தடுக்க, சரியான வடிகால் உறுதி செய்யுங்கள், செம்பு அடிப்படையிலான பூஞ்சைக்கொல்லிகளை தடுப்பு நடவடிக்கையாக பயன்படுத்தவும், பாதிக்கப்பட்ட செடிகளை உடனடியாக அகற்றவும்.'
      },
      {
        id: 2,
        category: 'பயிர் மேலாண்மை',
        title: 'பயிர் சுழற்சி சிறந்த நடைமுறைகள்',
        content: 'மண்ணில் பரவும் நோய்களை குறைக்கவும் மண் வளத்தை மேம்படுத்தவும் வருடாந்தர பயிர் சுழற்சியை நடைமுறைப்படுத்துங்கள். பக்கவாட்டு பயிர்களாக பருப்பு வகைகளை வளர்க்கவும்.'
      },
      {
        id: 3,
        category: 'பூச்சி கட்டுப்பாடு',
        title: 'இயற்கை பூச்சி மேலாண்மை',
        content: 'வேப்ப எண்ணெய் கரைசல் மற்றும் நன்மை செய்யும் பூச்சிகளை பயன்படுத்தி இரசாயன பூச்சிக்கொல்லிகளுக்கு பதிலாக ஒருங்கிணைந்த பூச்சி மேலாண்மை நடைமுறைகளை பின்பற்றவும்.'
      },
      {
        id: 4,
        category: 'மண் ஆரோக்கியம்',
        title: 'மண் வளத்தை பராமரிக்கவும்',
        content: 'மண் ஆரோக்கியத்தை மேம்படுத்த கம்போஸ்ட் மற்றும் உயிர் உரங்களை பயன்படுத்தவும். மண் ஈரப்பதத்தை பாதுகாக்க மல்ச்சிங் பயன்படுத்தவும்.'
      },
      {
        id: 5,
        category: 'நீர் மேலாண்மை',
        title: 'திறமையான நீர்ப்பாசன குறிப்புகள்',
        content: 'சொட்டு நீர்ப்பாசனம் நீர் பயன்பாட்டை 40% வரை குறைக்கலாம். நீர்த்தேக்க நோய்களை தடுக்க குறிப்பாக இலைகளில் நீர் தேங்குவதை தவிர்க்கவும்.'
      },
      {
        id: 6,
        category: 'அறுவடை',
        title: 'அறுவடை பின் மேலாண்மை',
        content: 'உற்பத்தியின் தரத்தைப் பாதுகாக்க சரியான உலர்த்துதல் மற்றும் சேமிப்பு நிலைகளை உறுதி செய்யுங்கள். சேமிப்பு பகுதிகளில் பூச்சி தாக்குதலை கண்காணியுங்கள்.'
      }
    ];
  }

  return [
    {
      id: 1,
      category: 'Seasonal',
      title: 'Monsoon Crop Protection',
      content: 'During monsoon season, prevent fungal disease spread by ensuring proper drainage, using copper-based fungicides as preventive measure, and removing affected plants immediately. Monitor humidity levels closely.'
    },
    {
      id: 2,
      category: 'Crop Management',
      title: 'Crop Rotation Best Practices',
      content: 'Implement annual crop rotation to reduce soil-borne diseases and improve soil fertility. Grow legumes as companion crops to fix nitrogen naturally. Plan rotation cycles of 3-4 years for optimal results.'
    },
    {
      id: 3,
      category: 'Pest Control',
      title: 'Natural Pest Management',
      content: 'Use neem oil solution and beneficial insects for integrated pest management instead of chemical pesticides. Install pheromone traps for monitoring pest populations. Encourage natural predators like ladybugs.'
    },
    {
      id: 4,
      category: 'Soil Health',
      title: 'Maintaining Soil Fertility',
      content: 'Use compost and bio-fertilizers to improve soil health. Apply mulching to preserve soil moisture and suppress weeds. Test soil pH regularly and amend as needed for optimal nutrient availability.'
    },
    {
      id: 5,
      category: 'Water Management',
      title: 'Efficient Irrigation Tips',
      content: 'Drip irrigation can reduce water usage by up to 40% compared to flood irrigation. Water early morning or late evening to minimize evaporation. Avoid waterlogging to prevent root diseases.'
    },
    {
      id: 6,
      category: 'Harvest',
      title: 'Post-Harvest Management',
      content: 'Ensure proper drying and storage conditions to protect produce quality. Monitor for pest infestations in storage areas. Use hermetic storage bags for grains to prevent moisture damage and pest entry.'
    }
  ];
}
