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

async function sendDeploymentMessage(
  sock
) {
  try {
    const groupJid =
      config.deploymentGroupJid;

    if (
      !groupJid
    ) {
      console.log(
        '⚠️ No deploymentGroupJid configured.'
      );

      return;
    }

    const botNumber =
      sock.user?.id
        ?.split(':')[0] ||
      'Unknown';

    const message =
`🚀 *${config.botName} DEPLOYED SUCCESSFULLY!*

✅ WhatsApp connection established
📱 Bot Number: ${botNumber}
⚡ Prefix: ${config.prefix}
🟢 Status: Online

🎉 Deployment completed successfully!`;

    await sock.sendMessage(
      groupJid,
      {
        text: message
      }
    );

    console.log(
      '📨 Deployment message sent successfully.'
    );

  } catch (error) {
    console.error(
      '❌ Failed to send deployment message:',
      error.message
    );
  }
}

// --------------------------------------------------
// MAIN CONNECTION
// --------------------------------------------------

async function startBot() {
  const sessionFolder =
    `./${config.sessionName}`;

  const sessionFile =
    path.join(
      sessionFolder,
      'creds.json'
    );

  // --------------------------------------------------
  // SESSION ID PROCESSING
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

const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      sessionFolder
    );

  const {
    version
  } =
    await fetchLatestBaileysVersion();

  const suppressedLogger =
    createSuppressedLogger(
      'silent'
    );

  // --------------------------------------------------
  // SOCKET
  // --------------------------------------------------

  const sock =
    makeWASocket({
      version,

      logger:
        suppressedLogger,

      printQRInTerminal:
        false,

      browser: [
        'Chrome',
        'Windows',
        '10.0'
      ],

      auth: state,

      syncFullHistory:
        false,

      downloadHistory:
        false,

      markOnlineOnConnect:
        false,

      getMessage:
        async () =>
          undefined
    });

  // Bind store
  store.bind(
    sock.ev
  );

  // --------------------------------------------------
  // WATCHDOG
  // --------------------------------------------------

let lastActivity =
    Date.now();

  const INACTIVITY_TIMEOUT =
    30 * 60 * 1000;

  const watchdogInterval =
    setInterval(
      async () => {
        try {
          if (
            Date.now() -
              lastActivity >
              INACTIVITY_TIMEOUT &&
            sock.ws?.readyState ===
              1
          ) {
            console.log(
              '⚠️ No activity detected. Forcing reconnect...'
            );

            await sock.end(
              undefined,
              undefined,
              {
                reason:
                  'inactive'
              }
            );

            clearInterval(
              watchdogInterval
            );

            setTimeout(
              () =>
                startBot(),
              5000
            );
          }
        } catch (error) {
          console.error(
            'Watchdog error:',
            error.message
          );
        }
      },
      5 * 60 * 1000
    );

  // --------------------------------------------------
  // CONNECTION UPDATE
  // QR + PAIRING CODE
  // --------------------------------------------------

  let pairingCodeRequested =
    false;

  sock.ev.on(
    'connection.update',
    async update => {
      const {
        connection,
        lastDisconnect,
        qr
      } = update;

      // ----------------------------------------------
      // QR CODE
      // ----------------------------------------------

if (
        qr &&
        config.usePairingCode !==
          true
      ) {
        console.log(
          '\n📱 Scan this QR code with WhatsApp:\n'
        );

        qrcode.generate(
          qr,
          {
            small: true
          }
        );
      }

      // ----------------------------------------------
      // PAIRING CODE
      // ----------------------------------------------

      if (
        !state.creds.registered &&
        config.usePairingCode ===
          true &&
        config.pairingNumber &&
        !pairingCodeRequested
      ) {
        pairingCodeRequested =
          true;

        try {
          const phoneNumber =
            config.pairingNumber
              .replace(
                /[^0-9]/g,
                ''
              );

          console.log(
            `\n📞 Requesting pairing code for: ${phoneNumber}`
          );

          const code =
            await sock.requestPairingCode(
              phoneNumber
            );

          console.log(
            '\n╭────────────────────────────╮'
          );

          console.log(
            `│ 🔐 PAIRING CODE: ${code} │`
          );

          console.log(
            '╰────────────────────────────╯\n'
          );

          console.log(
            '📱 Open WhatsApp'
          );

          console.log(
            '⚙️ Settings → Linked Devices'
          );

          console.log(
            '➕ Link a Device'
          );

          console.log(
            '🔗 Link with phone number instead'
          );

          console.log(
            `🔐 Enter code: ${code}\n`
          );

        } catch (error) {
          pairingCodeRequested =
            false;

          console.error(
            '❌ Error generating pairing code:',
            error.message
          );
        }
      }

      // ----------------------------------------------
      // CONNECTION CLOSED
      // ----------------------------------------------