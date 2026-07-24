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

function cleanupPuppeteerCache() {
  try {
    const home = os.homedir();

    const cacheDir = path.join(
      home,
      '.cache',
      'puppeteer'
    );

    if (fs.existsSync(cacheDir)) {
      console.log(
        '🧹 Removing Puppeteer cache at:',
        cacheDir
      );

      fs.rmSync(cacheDir, {
        recursive: true,
        force: true
      });

      console.log(
        '✅ Puppeteer cache removed'
      );
    }
  } catch (err) {
    console.error(
      '⚠️ Failed to cleanup Puppeteer cache:',
      err.message || err
    );
  }
}

// --------------------------------------------------
// MESSAGE STORE
// --------------------------------------------------

const store = {
  messages: new Map(),

  maxPerChat: 20,

  bind: ev => {
    ev.on(
      'messages.upsert',
      ({ messages }) => {
        for (
          const msg of messages
        ) {
          if (!msg.key?.id) {
            continue;
          }

          const jid =
            msg.key.remoteJid;

          if (
            !store.messages.has(jid)
          ) {
            store.messages.set(
              jid,
              new Map()
            );
          }

          const chatMsgs =
            store.messages.get(jid);

          chatMsgs.set(
            msg.key.id,
            msg
          );

          if (
            chatMsgs.size >
            store.maxPerChat
          ) {
            const oldestKey =
              chatMsgs.keys()
                .next()
                .value;

            chatMsgs.delete(
              oldestKey
            );
          }
        }
      }
    );
  },

  loadMessage: async (
    jid,
    id
  ) => {
    return (
      store.messages
        .get(jid)
        ?.get(id) ||
      null
    );
  }
};

// --------------------------------------------------
// MESSAGE DEDUPLICATION
// --------------------------------------------------

const processedMessages =
  new Set();

setInterval(
  () => {
    processedMessages.clear();
  },
  5 * 60 * 1000
);

// --------------------------------------------------
// LOGGER
// --------------------------------------------------

const createSuppressedLogger =
  (
    level = 'silent'
  ) => {
    const forbiddenPatterns = [
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
      'basekey',
      'ratchetkey'
    ];

    let logger;

    try {
      logger = pino({
        level,

        transport:
          process.env.NODE_ENV ===
          'production'
            ? undefined
            : {
                target:
                  'pino-pretty',

                options: {
                  colorize: true,
                  ignore:
                    'pid,hostname'
                }
              },

        customLevels: {
          trace: 0,
          debug: 1,
          info: 2,
          warn: 3,
          error: 4,
          fatal: 5
        },

        redact: [
          'registrationId',
          'ephemeralKeyPair',
          'rootKey',
          'chainKey',
          'baseKey'
        ]
      });
    } catch (err) {
      logger = pino({
        level
      });
    }

    const originalInfo =
      logger.info.bind(
        logger
      );

    logger.info = (
      ...args
    ) => {
      const msg =
        args
          .map(a =>
            typeof a ===
            'string'
              ? a
              : JSON.stringify(a)
          )
          .join(' ')
          .toLowerCase();

      if (
        !forbiddenPatterns.some(
          pattern =>
            msg.includes(pattern)
        )
      ) {
        originalInfo(
          ...args
        );
      }
    };

    logger.debug = () => {};
    logger.trace = () => {};

    return logger;
  };

// --------------------------------------------------
// DEPLOYMENT MESSAGE
// --------------------------------------------------


if (
    config.sessionID &&
    config.sessionID.startsWith(
      'Legacy!'
    )
  ) {
    try {
      const [
        header,
        b64data
      ] =
        config.sessionID.split(
          '!'
        );

      if (
        header !==
          'Legacy' ||
        !b64data
      ) {
        throw new Error(
          "Invalid session format. Expected 'Legacy!.....'"
        );
      }

      const cleanB64 =
        b64data.replace(
          '...',
          ''
        );

      const compressedData =
        Buffer.from(
          cleanB64,
          'base64'
        );

      const decompressedData =
        zlib.gunzipSync(
          compressedData
        );

      if (
        !fs.existsSync(
          sessionFolder
        )
      ) {
        fs.mkdirSync(
          sessionFolder,
          {
            recursive: true
          }
        );
      }

      fs.writeFileSync(
        sessionFile,
        decompressedData,
        'utf8'
      );

      console.log(
        '📡 Session: 🔑 Retrieved from SAT Limited Session'
      );

    } catch (e) {
      console.error(
        '📡 Session: ❌ Error processing session:',
        e.message
      );
    }
  }

  // --------------------------------------------------
  // AUTH STATE
  // --------------------------------------------------


