"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthClientFactory = void 0;
var meta_client_1 = require("./meta.client");
var tiktok_client_1 = require("./tiktok.client");
var OAuthClientFactory = /** @class */ (function () {
    function OAuthClientFactory() {
    }
    OAuthClientFactory.getClient = function (platform) {
        switch (platform.toUpperCase()) {
            case 'INSTAGRAM':
            case 'META':
            case 'FACEBOOK':
                return meta_client_1.metaOAuthClient;
            case 'TIKTOK':
                return tiktok_client_1.tiktokOAuthClient;
            default:
                throw new Error("OAuthClient for platform ".concat(platform, " is not implemented."));
        }
    };
    return OAuthClientFactory;
}());
exports.OAuthClientFactory = OAuthClientFactory;
