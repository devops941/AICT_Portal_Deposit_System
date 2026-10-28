"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const document_controller_1 = require("./document.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
});
router.use(auth_middleware_1.authenticateToken);
router.post('/upload', upload.single('file'), document_controller_1.documentController.uploadDocument);
router.get('/:id', document_controller_1.documentController.getDocumentMetadata);
router.get('/:id/download', document_controller_1.documentController.downloadDocument);
router.get('/:id/preview', document_controller_1.documentController.previewDocument);
router.get('/instrument/:instrumentId', document_controller_1.documentController.getDocumentsForInstrument);
exports.default = router;
