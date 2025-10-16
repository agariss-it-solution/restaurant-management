import React, { useState, useEffect } from "react";
import "./TranslateButton.css";

const LANGUAGES = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી"
};

const TranslateButton = () => {
  const [open, setOpen] = useState(false);

  // Wait until Google Translate is ready
  useEffect(() => {
    const checkTranslateReady = setInterval(() => {
      const combo = document.querySelector(".goog-te-combo");
      if (combo) clearInterval(checkTranslateReady);
    }, 1000);
  }, []);

  const handleLanguageChange = (langCode) => {
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change"));
      setOpen(false);
    }
  };

  return (
    <div className="translate-wrapper">
      <button className="translate-toggle" onClick={() => setOpen(!open)}>
        🌐 Language ▼
      </button>
      {open && (
        <ul className="translate-dropdown">
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <li key={code} onClick={() => handleLanguageChange(code)}>
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TranslateButton;
