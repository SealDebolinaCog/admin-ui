"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.authRouter = router;
// Mock authentication for demonstration
const mockUser = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin'
};
// POST /api/auth/login - Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
    // Mock authentication - in real app, verify against database
    if (email === 'admin@example.com' && password === 'admin123') {
        res.json({
            success: true,
            data: {
                user: mockUser,
                token: 'mock-jwt-token-' + Date.now()
            },
            message: 'Login successful'
        });
    }
    else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});
// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});
// GET /api/auth/me - Get current user
router.get('/me', (req, res) => {
    // In real app, verify JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }
    res.json({
        success: true,
        data: mockUser
    });
});
//# sourceMappingURL=auth.js.map