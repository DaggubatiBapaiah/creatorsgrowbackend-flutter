"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherFactory = void 0;
var meta_publisher_1 = require("./meta.publisher");
var tiktok_publisher_1 = require("./tiktok.publisher");
var PublisherFactory = /** @class */ (function () {
    function PublisherFactory() {
    }
    PublisherFactory.getPublisher = function (platform) {
        switch (platform.toUpperCase()) {
            case 'INSTAGRAM':
            case 'FACEBOOK':
            case 'META':
                return new meta_publisher_1.MetaPublisher();
            case 'TIKTOK':
                return new tiktok_publisher_1.TikTokPublisher();
            default:
                throw new Error("Publisher for platform ".concat(platform, " is not implemented."));
        }
    };
    return PublisherFactory;
}());
exports.PublisherFactory = PublisherFactory;
