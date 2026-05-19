const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

// =============================
// EXPRESS (UptimeRobot)
// =============================
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive");
});

app.listen(3000, () => {
  console.log("🌐 Web server running on port 3000");
});

// =============================
// DISCORD BOT
// =============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

// ⚠️ mets ton token dans variable d’environnement si possible
require('dotenv').config();
const BOT_TOKEN = process.env.BOT_TOKEN;
// 🎯 salons caméra
const CAM_CHANNELS = [
  "1506240731336015962",
  "1506240755956711544",
  "1506240780946243594",
];

// anti spam
const cooldown = new Map();

client.once("ready", () => {
  console.log(`✅ Bot connecté: ${client.user.tag}`);
  console.log("📷 Salons surveillés:", CAM_CHANNELS);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  try {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    const wasInCam = CAM_CHANNELS.includes(oldChannel);
    const isInCam = CAM_CHANNELS.includes(newChannel);

    // =============================
    // SORTIE SALON CAM
    // =============================
    if (wasInCam && !isInCam) {
      await member.voice.setMute(false).catch(() => {});
      await member.voice.setDeaf(false).catch(() => {});

      console.log(`👋 ${member.user.tag} quitté → UNMUTE + UNDEAF`);
      return;
    }

    // =============================
    // DANS SALON CAM
    // =============================
    if (isInCam) {
      const now = Date.now();
      const last = cooldown.get(member.id) || 0;

      if (now - last < 1200) return;
      cooldown.set(member.id, now);

      const camOn = newState.selfVideo;

      if (camOn) {
        await member.voice.setMute(false).catch(() => {});
        await member.voice.setDeaf(false).catch(() => {});

        console.log(`📷 ${member.user.tag} CAM ON → UNMUTE + UNDEAF`);
      } else {
        await member.voice.setMute(true).catch(() => {});
        await member.voice.setDeaf(true).catch(() => {});

        console.log(`🚫 ${member.user.tag} CAM OFF → MUTE + DEAF`);
      }
    }
  } catch (err) {
    console.error("Erreur voiceStateUpdate:", err);
  }
});

client.login(BOT_TOKEN);