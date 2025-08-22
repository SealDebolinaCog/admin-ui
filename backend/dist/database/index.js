"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopClientRepository = exports.AccountRepository = exports.ShopRepository = exports.ClientRepository = exports.closeDatabase = exports.getDatabase = exports.initializeDatabase = void 0;
var database_1 = require("./database");
Object.defineProperty(exports, "initializeDatabase", { enumerable: true, get: function () { return database_1.initializeDatabase; } });
Object.defineProperty(exports, "getDatabase", { enumerable: true, get: function () { return database_1.getDatabase; } });
Object.defineProperty(exports, "closeDatabase", { enumerable: true, get: function () { return database_1.closeDatabase; } });
var clients_1 = require("./clients");
Object.defineProperty(exports, "ClientRepository", { enumerable: true, get: function () { return clients_1.ClientRepository; } });
var shops_1 = require("./shops");
Object.defineProperty(exports, "ShopRepository", { enumerable: true, get: function () { return shops_1.ShopRepository; } });
var accounts_1 = require("./accounts");
Object.defineProperty(exports, "AccountRepository", { enumerable: true, get: function () { return accounts_1.AccountRepository; } });
var shopClients_1 = require("./shopClients");
Object.defineProperty(exports, "ShopClientRepository", { enumerable: true, get: function () { return shopClients_1.ShopClientRepository; } });
//# sourceMappingURL=index.js.map