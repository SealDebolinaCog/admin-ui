"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const users_1 = __importDefault(require("./users"));
const auth_1 = require("./auth");
const clients_1 = __importDefault(require("./clients"));
const shops_1 = __importDefault(require("./shops"));
const accounts_1 = __importDefault(require("./accounts"));
const shopClients_1 = __importDefault(require("./shopClients"));
const router = (0, express_1.Router)();
exports.apiRouter = router;
// API version info
router.get('/', (req, res) => {
    res.json({
        message: 'Admin UI API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            clients: '/api/clients',
            shops: '/api/shops',
            accounts: '/api/accounts',
            shopClients: '/api/shop-clients',
            health: '/health'
        }
    });
});
// Route modules
router.use('/auth', auth_1.authRouter);
router.use('/users', users_1.default);
router.use('/clients', clients_1.default);
router.use('/shops', shops_1.default);
router.use('/accounts', accounts_1.default);
router.use('/shop-clients', shopClients_1.default);
//# sourceMappingURL=api.js.map