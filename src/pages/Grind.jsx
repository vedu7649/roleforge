import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DSAProblemCard from '../components/DSAProblemCard';
import ProjectSuggestionCard from '../components/ProjectSuggestionCard';
import RevisionCard from '../components/RevisionCard';
import VisibilityCard from '../components/VisibilityCard';
import SystemDesignCard from '../components/SystemDesignCard';
import TechAwarenessCard from '../components/TechAwarenessCard';
import CareerAwarenessCard from '../components/CareerAwarenessCard';
import GrindLoader from '../components/GrindLoader';
import './Grind.css';

const MODULE_SEQUENCE = [
  'dsa',
  'project',
  'revision',
  'visibility',
  'system',
  'tech',
  'career'
];

export default function Grind() {
  const location = useLocation();
  const state = location.state;
  
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const loadedModulesRef = useRef(new Set());

  const handleModuleLoad = useCallback((moduleId) => {
    // PREVENT INFINITE LOOP: If this module is already tracked as loaded, skip
    if (loadedModulesRef.current.has(moduleId)) return;
    
    loadedModulesRef.current.add(moduleId);

    // ADD JITTER DELAY: Wait 800-1800ms before activating next component
    // This breaks the "instant call" pattern that triggers AI caching
    const jitter = 800 + Math.random() * 1000;

    setTimeout(() => {
      setLoadedCount(prev => {
        const newCount = prev + 1;
        if (newCount < MODULE_SEQUENCE.length) {
          setActiveModuleIndex(newCount);
        } else {
          // All modules loaded
          setTimeout(() => {
            setIsFinishing(true);
            console.clear();
            console.log('%c RoleForge AI | Systems Ready ', 'background: #1e3a8a; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
          }, 1200);
        }
        return newCount;
      });
    }, jitter);
  }, []);

  // STABILIZE HANDLERS: Create stable callbacks for each module
  const moduleHandlers = useMemo(() => {
    const handlers = {};
    MODULE_SEQUENCE.forEach(mod => {
      handlers[mod] = () => handleModuleLoad(mod);
    });
    return handlers;
  }, [handleModuleLoad]);

  const progress = useMemo(() => {
    return (loadedCount / MODULE_SEQUENCE.length) * 100;
  }, [loadedCount]);

  const showLoader = !isFinishing;

  return (
    <div className="grind-page-wrapper">
      {showLoader && <GrindLoader progress={progress} />}
      
      <div className={`grind-container main-content ${showLoader ? 'content-hidden' : 'animate-fade-in'}`}>
        <div className="grind-header">
          <h1 className="page-title">Grind Mode</h1>
          <p className="page-subtitle">Personalized daily preparation engine active</p>
        </div>

        {/* LAYER 1: DAILY CORE */}
        <DSAProblemCard 
          role={state?.role} 
          completedTopics={state?.completedTopics || 0}
          isActive={MODULE_SEQUENCE[activeModuleIndex] === 'dsa'}
          onLoadComplete={moduleHandlers.dsa}
        />
        <ProjectSuggestionCard 
          stack={state?.stack} 
          completedPhases={state?.completedPhases || 0} 
          role={state?.role}
          isActive={MODULE_SEQUENCE[activeModuleIndex] === 'project'}
          onLoadComplete={moduleHandlers.project}
        />
        <RevisionCard 
          completedTopics={state?.completedTopics || 0} 
          role={state?.role}
          isActive={MODULE_SEQUENCE[activeModuleIndex] === 'revision'}
          onLoadComplete={moduleHandlers.revision}
        />

        {/* LAYER 2: WEEKLY GROWTH */}
        <VisibilityCard 
          completedTasks={state?.completedTasks || []} 
          role={state?.role || 'Developer'}
          isActive={MODULE_SEQUENCE[activeModuleIndex] === 'visibility'}
          onLoadComplete={moduleHandlers.visibility}
        />
        <SystemDesignCard 
          role={state?.role} 
          completedPhases={state?.completedPhases || 0} 
          stack={state?.stack}
          isActive={MODULE_SEQUENCE[activeModuleIndex] === 'system'}
          onLoadComplete={moduleHandlers.system}
        />

        {/* LAYER 3: STRATEGIC AWARENESS */}
        <TechAwarenessCard 
          role={state?.role} 
          stack={state?.stack}
          isActive={MODULE_SEQUENCE[activeModuleIndex] === 'tech'}
          onLoadComplete={moduleHandlers.tech}
        />
        <CareerAwarenessCard 
          currentRole={state?.role || 'Full Stack Developer'} 
          role={state?.role} 
          completedTopics={state?.completedTopics || 0} 
          stack={state?.stack}
          isActive={MODULE_SEQUENCE[activeModuleIndex] === 'career'}
          onLoadComplete={moduleHandlers.career}
        />
      </div>

      <style>{`
        .grind-page-wrapper {
          min-height: 100vh;
          background: var(--bg);
        }
        .content-hidden {
          opacity: 0;
          pointer-events: none;
          max-height: 100vh;
          overflow: hidden;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}