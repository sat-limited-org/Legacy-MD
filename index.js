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


      if (
        connection ===
        'close'
      ) {
        clearInterval(
          watchdogInterval
        );

        const statusCode =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

        const errorMessage =
          lastDisconnect
            ?.error
            ?.message ||
          'Unknown error';

        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;

        if (
          statusCode ===
            515 ||
          statusCode ===
            503 ||
          statusCode ===
            408
        ) {
          console.log(
            `⚠️ Connection closed (${statusCode}). Reconnecting...`
          );
        } else {
          console.log(
            'Connection closed due to:',
            errorMessage,
            '\nReconnecting:',
            shouldReconnect
          );
        }

        if (
          shouldReconnect
        ) {
          setTimeout(
            () =>
              startBot(),
            3000
          );
        }
      }

      // ----------------------------------------------
      // CONNECTION OPEN
      // ----------------------------------------------

      else if (
        connection ===
        'open'
      ) {
        lastActivity =
          Date.now();

        console.log(
          '\n✅ Bot connected successfully!'
        );

        console.log(
          `📱 Bot Number: ${sock.user.id.split(':')[0]}`
        );

        console.log(
          `🤖 Bot Name: ${config.botName}`
        );

        console.log(
          `⚡ Prefix: ${config.prefix}`
        );

        const ownerNames =
          Array.isArray(
            config.ownerName
          )
            ? config.ownerName.join(
                ','
              )
            : config.ownerName;

        console.log(
          `👑 Owner: ${ownerNames}\n`
        );

        console.log(
          'Bot is ready to receive messages!\n'
        );

        // ------------------------------------------
        // DEPLOYMENT GROUP MESSAGE
        // ------------------------------------------

        await sendDeploymentMessage(
          sock
        );

        // ------------------------------------------
        // BOT STATUS
        // ------------------------------------------

if (
          config.autoBio
        ) {
          await sock.updateProfileStatus(
            `${config.botName} | Active 24/7`
          );
        }

        // ------------------------------------------
        // ANTICALL
        // ------------------------------------------

        handler.initializeAntiCall(
          sock
        );

        // ------------------------------------------
        // STORE CLEANUP
        // ------------------------------------------

        const now =
          Date.now();

        for (
          const [
            jid,
            chatMsgs
          ]
          of store.messages
            .entries()
        ) {
          const timestamps =
            Array.from(
              chatMsgs.values()
            ).map(
              m =>
                m.messageTimestamp *
                  1000 ||
                0
            );

          if (
            timestamps.length >
              0 &&
            now -
              Math.max(
                ...timestamps
              ) >
              24 *
                60 *
                60 *
                1000
          ) {
            store.messages.delete(
              jid
            );
          }
        }

        console.log(
          `🧹 Store cleaned. Active chats: ${store.messages.size}`
        );
      }
    }
  );

  // --------------------------------------------------
  // CREDENTIALS
  // --------------------------------------------------

  sock.ev.on(
    'creds.update',
    saveCreds
  );

  // --------------------------------------------------
  // SYSTEM JID FILTER
  // --------------------------------------------------

  const isSystemJid =
    jid => {
      if (
        !jid
      ) {
        return true;
      }

      return (
        jid.includes(
          '@broadcast'
        ) ||
        jid.includes(
          'status.broadcast'
        ) ||
        jid.includes(
          '@newsletter'
        ) ||
        jid.includes(
          '@newsletter.'
        )
      );
    };

  // --------------------------------------------------
  // MESSAGE HANDLER
  // --------------------------------------------------

  sock.ev.on(
    'messages.upsert',
    ({
      messages,
      type
    }) => {
      if (
        type !==
        'notify'
      ) {
        return;
      }

      for (
        const msg
        of messages
      ) {
        if (
          !msg.message ||
          !msg.key?.id
        ) {
          continue;
        }

        const from =
          msg.key.remoteJid;

        if (
          !from
        ) {
          continue;
        }

        if (
          isSystemJid(
            from
          )
        ) {
          continue;
        }

        const msgId =
          msg.key.id;

        if (
          processedMessages.has(
            msgId
          )
        ) {
          continue;
        }

        const MESSAGE_AGE_LIMIT =
          5 *
          60 *
          1000;

        let messageAge =
          0;

        if (
          msg.messageTimestamp
        ) {
          messageAge =
            Date.now() -
            msg.messageTimestamp *
              1000;

          if (
            messageAge >
            MESSAGE_AGE_LIMIT
          ) {
            continue;
          }
        }

        processedMessages.add(
          msgId
        );

        // Store message
        if (
          msg.key &&
          msg.key.id
        ) {
          if (
            !store.messages.has(
              from
            )
          ) {
            store.messages.set(
              from,
              new Map()
            );
          }

          const chatMsgs =
            store.messages.get(
              from
            );

          chatMsgs.set(
            msg.key.id,
            msg
          );

          if (
            chatMsgs.size >
            store.maxPerChat
          ) {
            const sortedIds =
              Array.from(
                chatMsgs.entries()
              )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    (
                      a[1]
                        .messageTimestamp ||
                      0
                    ) -
                    (
                      b[1]
                        .messageTimestamp ||
                      0
                    )
                )
                .map(
                  (
                    [
                      id
                    ]
                  ) =>
                    id
                );

            for (
              let i =
                0;

              i <
              sortedIds.length -
                store.maxPerChat;

              i++
            ) {
              chatMsgs.delete(
                sortedIds[i]
              );
            }
          }
        }

        // Process command
        handler
          .handleMessage(
            sock,
            msg
          )
          .catch(
            err => {
              if (
                !err.message?.includes(
                  'rate-overlimit'
                ) &&
                !err.message?.includes(
                  'not-authorized'
                )
              ) {
                console.error(
                  'Error handling message:',
                  err.message
                );
              }
            }
          );

        // Background operations
        setImmediate(
          async () => {
            if (
              config.autoRead &&
              from.endsWith(
                '@g.us'
              )
            ) {
              try {
                await sock.readMessages(
                  [
                    msg.key
                  ]
                );
              } catch {}
            }

            if (
              from.endsWith(
                '@g.us'
              )
            ) {
              try {
                const groupMetadata =
                  await handler.getGroupMetadata(
                    sock,
                    msg.key.remoteJid
                  );

                if (
                  groupMetadata
                ) {
                  await handler.handleAntilink(
                    sock,
                    msg,
                    groupMetadata
                  );
                }
              } catch {}
            }
          }
        );
      }
    }
  );

  // --------------------------------------------------
  // MESSAGE UPDATES
  // --------------------------------------------------

sock.ev.on(
    'message-receipt.update',
    () => {}
  );

  sock.ev.on(
    'messages.update',
    () => {}
  );

  // --------------------------------------------------
  // GROUP PARTICIPANTS
  // --------------------------------------------------

  sock.ev.on(
    'group-participants.update',
    async update => {
      await handler.handleGroupUpdate(
        sock,
        update
      );
    }
  );

  // --------------------------------------------------
  // SOCKET ERRORS
  // --------------------------------------------------

  sock.ev.on(
    'error',
    error => {
      const statusCode =
        error?.output
          ?.statusCode;

      if (
        statusCode ===
          515 ||
        statusCode ===
          503 ||
        statusCode ===
          408
      ) {
        return;
      }

      console.error(
        'Socket error:',
        error.message ||
          error
      );
    }
  );

  return sock;
}

// --------------------------------------------------
// START BOT
// --------------------------------------------------

console.log(
  '🚀 Starting WhatsApp MD Bot...\n'
);

console.log(
  `📦 Bot Name: ${config.botName}`
);

console.log(
  `⚡ Prefix: ${config.prefix}`
);

const ownerNames =
  Array.isArray(
    config.ownerName
  )
    ? config.ownerName.join(
        ','
      )
    : config.ownerName;

console.log(
  `👑 Owner: ${ownerNames}\n`
);

cleanupPuppeteerCache();

startBot().catch(
  err => {
    console.error(
      'Error starting bot:',
      err
    );

    process.exit(
      1
    );
  }
);

// --------------------------------------------------
// PROCESS TERMINATION
// --------------------------------------------------

process.on(
  'uncaughtException',
  err => {
    if (
      err.code ===
        'ENOSPC' ||
      err.errno ===
        -28 ||
      err.message?.includes(
        'no space left on device'
      )
    ) {
      console.error(
        '⚠️ ENOSPC Error. Attempting cleanup...'
      );

      const {
        cleanupOldFiles
      } =
        require(
          './utils/cleanup'
        );

      cleanupOldFiles();

      return;
    }

    console.error(
      'Uncaught Exception:',
      err
    );
  }
);

process.on(
  'unhandledRejection',
  err => {
    if (
      err.code ===
        'ENOSPC' ||
      err.errno ===
        -28 ||
      err.message?.includes(
        'no space left on device'
      )
    ) {
      console.warn(
        '⚠️ ENOSPC Error. Attempting cleanup...'
      );

      const {
        cleanupOldFiles
      } =
        require(
          './utils/cleanup'
        );

      cleanupOldFiles();

      return;
    }

    if (
      err.message &&
      err.message.includes(
        'rate-overlimit'
      )
    ) {
      console.warn(
        '⚠️ Rate limit reached.'
      );

      return;
    }

    console.error(
      'Unhandled Rejection:',
      err
    );
  }
);

// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = {
  store
};

