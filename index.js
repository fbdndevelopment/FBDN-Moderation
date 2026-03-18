const { Client, GatewayIntentBits } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/ytdl-core");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// 🎵 DisTube setup
const distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 🎧 Slash command handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const song = interaction.options.getString("song");
    const vc = interaction.member.voice.channel;

    if (!vc) {
      return interaction.reply("❌ Join a voice channel first.");
    }

    try {
      await interaction.reply(`🎵 Loading: **${song}**`);
      distube.play(vc, song, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
    } catch (e) {
      console.error(e);
      interaction.editReply("❌ Error playing song.");
    }
  }
});

// 🎵 Events
distube.on("playSong", (queue, song) => {
  queue.textChannel.send(`🎵 Now playing: **${song.name}**`);
});

distube.on("error", (channel, error) => {
  console.error("DisTube error:", error);
  channel.send("❌ Error playing song.");
});

client.login(process.env.TOKEN);
