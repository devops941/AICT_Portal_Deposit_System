"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const ai_controller_1 = require("./ai.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const ai_validation_1 = require("./ai.validation");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
});
router.use(auth_middleware_1.authenticateToken);
router.post('/ocr/extract', upload.single('file'), ai_controller_1.aiController.extractOcr);
router.post('/documents/classify', upload.single('file'), ai_controller_1.aiController.classifyDocument);
router.post('/documents/compare', (0, validate_middleware_1.validateRequest)(ai_validation_1.aiCompareSchema), ai_controller_1.aiController.compareDocument);
router.get('/extractions/:id', ai_controller_1.aiController.getExtraction);
router.post('/extractions/:id/correct', (0, validate_middleware_1.validateRequest)(ai_validation_1.aiManualCorrectionSchema), ai_controller_1.aiController.manualCorrection);
router.get('/risk-flags', ai_controller_1.aiController.getRiskFlags);
router.post('/search', (0, validate_middleware_1.validateRequest)(ai_validation_1.aiSearchSchema), ai_controller_1.aiController.search);
exports.default = router;
