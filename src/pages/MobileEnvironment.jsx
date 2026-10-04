import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getSeasonalAdvice } from '../services/notificationService';
import { 
  Droplets, 
  Wind, 
  Thermometer, 
  Sprout 
} from 'lucide-react';

export default function MobileEnvironment() {
  const { language } = useLanguage();
  const [adviceList, setAdviceList] = useState([]);

  useEffect(() => {
    try {
      const tips = getSeasonalAdvice(language);
      setAdviceList(tips ? tips.slice(0, 3) : []);
    } catch (e) {
      console.error(e);
      setAdviceList([]);
    }
  }, [language]);

  return (
    <div className="mobile-page-content mobile-environment-screen">
      <h2 className="mobile-screen-title">Environment</h2>

      {/* Climate Metrics Grid */}
      <div className="clean-climate-grid">
        <div className="clean-climate-card">
          <div className="climate-card-icon">
            <Thermometer size={18} />
          </div>
          <span className="climate-value">28°C</span>
          <span className="climate-label">Temperature</span>
        </div>

        <div className="clean-climate-card">
          <div className="climate-card-icon">
            <Droplets size={18} />
          </div>
          <span className="climate-value">64%</span>
          <span className="climate-label">Humidity</span>
        </div>

        <div className="clean-climate-card">
          <div className="climate-card-icon">
            <Sprout size={18} />
          </div>
          <span className="climate-value">72%</span>
          <span className="climate-label">Moisture</span>
        </div>

        <div className="clean-climate-card">
          <div className="climate-card-icon">
            <Wind size={18} />
          </div>
          <span className="climate-value">9 km/h</span>
          <span className="climate-label">Wind</span>
        </div>
      </div>

      {/* Field Health Status */}
      <div className="clean-field-card">
        <div className="clean-field-row">
          <span className="field-metric-name">Soil NPK</span>
          <span className="field-metric-value">Balanced</span>
        </div>
        <div className="clean-field-row">
          <span className="field-metric-name">Soil pH</span>
          <span className="field-metric-value">6.8</span>
        </div>
      </div>

      {/* Seasonal Advice */}
      {adviceList.length > 0 && (
        <div className="clean-advice-list">
          {adviceList.map((item, idx) => (
            <div key={item.id || idx} className="clean-advice-card">
              <h4 className="clean-advice-title">{item.title}</h4>
              <p className="clean-advice-text">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
