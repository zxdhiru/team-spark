import { Router } from 'express';
import { AnalysisController } from '../controllers/AnalysisController';

const router = Router();
const analysisController = new AnalysisController();

// Text analysis endpoint
router.post('/text', analysisController.analyzeText);

// Image analysis endpoint
router.post('/image', analysisController.analyzeImage);

// Get analysis history
router.get('/history', analysisController.getAnalysisHistory);

// Get specific analysis by ID
router.get('/:id', analysisController.getAnalysisById);

// Get statistics
router.get('/stats/overview', analysisController.getStatistics);

// Health check
router.get('/health', analysisController.healthCheck);

export default router;

