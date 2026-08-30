"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
var crypto_1 = __importDefault(require("crypto"));
// The key must be 32 bytes (256 bits).
var IV_LENGTH = 12; // AES-GCM standard IV size
function getKey() {
    var key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
        throw new Error('Critical Error: ENCRYPTION_KEY must be exactly 32 characters in the environment.');
    }
    return key;
}
function encrypt(text) {
    var iv = crypto_1.default.randomBytes(IV_LENGTH);
    var cipher = crypto_1.default.createCipheriv('aes-256-gcm', Buffer.from(getKey()), iv);
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encrypted
    return "".concat(iv.toString('hex'), ":").concat(authTag, ":").concat(encrypted);
}
function decrypt(text) {
    var parts = text.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format. Expected iv:authTag:encrypted');
    }
    var iv = Buffer.from(parts[0], 'hex');
    var authTag = Buffer.from(parts[1], 'hex');
    var encryptedText = Buffer.from(parts[2], 'hex');
    var decipher = crypto_1.default.createDecipheriv('aes-256-gcm', Buffer.from(getKey()), iv);
    decipher.setAuthTag(authTag);
    var decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}
