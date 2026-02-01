const express = require("express");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const path = require("path");
const app = express();

app.use(express.static("public"));

async function startBot(userId, res) {
  const sessionPath = `./bots/${userId}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      res.json({ qr });
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason !== 401) startBot(userId, res);
    }
  });
}

app.get("/generate", async (req, res) => {
  const userId = Date.now().toString();
  await startBot(userId, res);
});

app.listen(3000, () => console.log("Server running"));
