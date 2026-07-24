/**
 * WhatsApp MD Bot - Main Entry Point
 * QR Code + Pairing Code Support
 */

process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR =
  process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

const { initializeTempSystem } = require('./utils/tempManager');
const { startCleanup } = require('./utils/cleanup');

initializeTempSystem();
startCleanup();

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const forbiddenPatternsConsole = [
  'closing session',
  'closing open session',
  'sessionentry',
  'prekey bundle',
  'pendingprekey',
  '_chains',
  'registrationid',
  'currentratchet',
  'chainkey',
  'ratchet',
  'signal protocol',
  'ephemeralkeypair',
  'indexinfo',
  'basekey'
];

function stringifyLog(args) {
  return args
    .map(a =>
      typeof a === 'string'
        ? a
        : typeof a === 'object'
          ? JSON.stringify(a)
          : String(a)
    )
    .join(' ')
    .toLowerCase();
}

console.log = (...args) => {
  const message = stringifyLog(args);

  if (
    !forbiddenPatternsConsole.some(pattern =>
      message.includes(pattern)
    )
  ) {
    originalConsoleLog.apply(console, args);
  }
};

console.error = (...args) => {
  const message = stringifyLog(args);

  if (
    !forbiddenPatternsConsole.some(pattern =>
      message.includes(pattern)
    )
  ) {
    originalConsoleError.apply(console, args);
  }
};

console.warn = (...args) => {
  const message = stringifyLog(args);

  if (
    !forbiddenPatternsConsole.some(pattern =>
      message.includes(pattern)
    )
  ) {
    originalConsoleWarn.apply(console, args);
  }
};

// --------------------------------------------------
// LIBRARIES
// --------------------------------------------------

const pino = require('pino');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');

const config = require('./config');
const handler = require('./handler');

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');

// --------------------------------------------------
// PUPPETEER CACHE CLEANUP
// --------------------------------------------------