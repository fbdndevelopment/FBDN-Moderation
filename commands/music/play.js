const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
  AudioPlayerStatus
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");
const yts = require("yt-search");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("Song name")
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString("song");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply("❌ Join a voice channel first.");
    }

    await interaction.deferReply();

    try {
      // 🔍 Search
      const search = await yts(query);

      if (!search.videos.length) {
        return interaction.editReply("❌ No results found.");
      }

      const video = search.videos[0];

      // 🎧 Join VC
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      // ✅ WAIT UNTIL READY (IMPORTANT FIX)
      await entersState(connection, VoiceConnectionStatus.Ready, 20000);

      // 🎵 Stream
      const stream = ytdl(video.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25
      });

      const resource = createAudioResource(stream);
      const player = createAudioPlayer();

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("🎵 Playing:", video.title);
      });

      player.on("error", error => {
        console.error("Player error:", error);
      });

      await interaction.editReply(`🎵 Now playing: **${video.title}**`);

    } catch (err) {
      console.error("FULL ERROR:", err);
      await interaction.editReply("❌ Error playing song.");
    }
  }
};
