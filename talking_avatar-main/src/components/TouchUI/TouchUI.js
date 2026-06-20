import React, { useState, useEffect } from 'react';
import './TouchUI.css';
import kbData from '../../data/knowledge_base.json';

export default function TouchUI({ avatarState, onAskQuestion, onResetTimeout, hasError, onClearError, isIntro, currentReplyText, onStopInteraction }) {
  // States: 'HOME', 'CATEGORY', 'RELATED'
  const [view, setView] = useState('HOME');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [lastQuestionId, setLastQuestionId] = useState(null);

  const categoriesMap = {
    'Analista en Sistemas': 'Analista en Sistemas',
    'Licenciatura en Sistemas': 'Licenciatura en Sistemas',
    'Salida Laboral': 'Salida Laboral',
    'Ingreso': 'Ingreso',
    'Facultad y Servicios': 'Facultad y Servicios',
    'Sobre Cyto': 'Cyto'
  };

  const handleCategorySelect = (catKey) => {
    onResetTimeout();
    setSelectedCategory(categoriesMap[catKey]);
    setView('CATEGORY');
  };

  const handleQuestionSelect = (qId) => {
    // Prevención de múltiple click si ya está pensando, escuchando o hablando (y no es la intro)
    if ((avatarState === 'thinking' || avatarState === 'talking' || avatarState === 'listening') && !isIntro) return;
    
    onResetTimeout();
    setLastQuestionId(qId);
    onAskQuestion(qId);
  };

  const handleHomeClick = () => {
    onResetTimeout();
    setView('HOME');
    setSelectedCategory(null);
    setLastQuestionId(null);
  };

  const handleCategoryBack = () => {
    onResetTimeout();
    setLastQuestionId(null);
    if (selectedCategory) {
      setView('CATEGORY');
    } else {
      setView('HOME');
    }
  };

  const isListening = avatarState === 'listening';
  const isProcessing = avatarState === 'thinking';
  const isSpeaking = avatarState === 'talking' && !isIntro;

  // Cuando termina de hablar y no hay error, pasamos a RELATED
  useEffect(() => {
    if (avatarState === 'idle' && lastQuestionId && view !== 'RELATED' && !hasError && !isIntro) {
      setView('RELATED');
    }
  }, [avatarState, lastQuestionId, view, hasError, isIntro]);

  if (hasError) {
    return (
      <div className="touch-ui-overlay">
        <div className="error-panel glass-panel">
          <h2>Cyto tuvo un inconveniente al responder.</h2>
          <p>Podés intentar nuevamente o explorar otra pregunta.</p>
          <button className="touch-btn retry-btn" onClick={onClearError}>Entendido</button>
        </div>
      </div>
    );
  }

  // Estado LISTENING, THINKING o TALKING bloquea pantalla pero muestra status
  if (isListening || isProcessing || isSpeaking) {
    let msg = "";
    if (isListening) msg = "Cyto está escuchando...";
    if (isProcessing) msg = "Cyto está pensando...";
    if (isSpeaking) msg = "Cyto está hablando...";

    return (
      <div className="touch-ui-overlay speaking-overlay">
        <div className="speaking-box">
          <div className="speaking-indicator">
             <div className="bar"></div>
             <div className="bar"></div>
             <div className="bar"></div>
          </div>
          <div className="speaking-content">
            <h2>{msg}</h2>
            {isSpeaking && currentReplyText && (
              <p className="subtitle-text">"{currentReplyText}"</p>
            )}
            <button className="touch-btn back-btn" onClick={onStopInteraction} style={{marginTop: '20px'}}>
              ⟵ Volver al Menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'HOME') {
    return (
      <div className="touch-ui-overlay">
        <div className="home-panel glass-panel">
          <h1>Cyto</h1>
          <p className="intro-text">
            Hola, soy Cyto, un avatar interactivo desarrollado por analistas en sistemas de la UADER FCyT. 
            Para interactuar conmigo, tocá uno de los botones en la pantalla con tu dedo para elegir un tema y hacerme una pregunta.
          </p>
          <h2 className="title-section">¿Qué querés conocer?</h2>
          <div className="buttons-grid">
            {Object.keys(categoriesMap).map(cat => (
              <button key={cat} className="touch-btn" onClick={() => handleCategorySelect(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'CATEGORY') {
    const questions = kbData.filter(q => q.category === selectedCategory);
    return (
      <div className="touch-ui-overlay">
        <div className="category-panel glass-panel">
          <div className="nav-buttons">
            <button className="back-btn" onClick={handleHomeClick}>
              <span className="icon">⟵</span> Menú Principal
            </button>
          </div>
          <h2>{selectedCategory}</h2>
          <div className="questions-list">
            {questions.map(q => (
              <button key={q.id} className="touch-btn question-btn" onClick={() => handleQuestionSelect(q.id)}>
                {q.question}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'RELATED') {
    const lastQ = kbData.find(q => q.id === lastQuestionId);
    let related = [];
    if (lastQ && lastQ.related_questions) {
      related = kbData.filter(q => lastQ.related_questions.includes(q.id));
    }
    
    return (
      <div className="touch-ui-overlay">
        <div className="related-panel glass-panel">
          <div className="nav-buttons">
            <button className="back-btn" onClick={handleHomeClick}>
              <span className="icon">⟵</span> Menú Principal
            </button>
            {selectedCategory && (
              <button className="back-btn" onClick={handleCategoryBack}>
                <span className="icon">⟵</span> {selectedCategory}
              </button>
            )}
          </div>
          <h2 className="title-section">Podés seguir explorando:</h2>
          <div className="questions-list">
            {related.map(q => (
              <button key={q.id} className="touch-btn question-btn" onClick={() => handleQuestionSelect(q.id)}>
                {q.question}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
