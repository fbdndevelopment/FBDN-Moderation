const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require("@discordjs/voice");
const play = require("play-dl");

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
      // 🔍 Search for song
      const results = await play.search(query, { limit: 1 });

      if (!results || results.length === 0) {
        return interaction.editReply("❌ No results found.");
      }

      const video = results[0];

      // 🎧 Get stream
      const stream = await play.stream(video.url, {
        quality: 2
      });

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      const player = createAudioPlayer();

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

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
      await interaction.editReply("❌ Error playing the song.");
    }
  }
};
