/**
 * Certification Module — Main Entry Point
 *
 * Import this file for a complete, plug-and-play certification system.
 *
 * Quick start (standalone):
 *   import { certificationModal } from 'src/certification';
 *   certificationModal.open(certificationData);
 *
 * Custom config / template:
 *   import { CertificationModal, CertificateRenderer, CertificationEngine } from 'src/certification';
 *   const engine   = new CertificationEngine(myConfig);
 *   const renderer = new CertificateRenderer(myConfig);
 *   const modal    = new CertificationModal(myConfig, renderer);
 *   modal.open(engine.calculate(myDataProvider));
 */

// Core classes (for custom instantiation)
export { CertificationEngine }      from './CertificationEngine.js';
export { CertificateRenderer }      from './CertificateRenderer.js';
export { CertificationModal }       from './CertificationModal.js';

// Default singletons (ready to use)
export { certificateRenderer }      from './CertificateRenderer.js';
export { certificationModal }       from './CertificationModal.js';

// Config & theme helpers
export { default as defaultConfig } from './config/default.js';
export { default as formalStyles }  from './styles/formal.js';
export { default as formalTemplate } from './templates/formal.js';
