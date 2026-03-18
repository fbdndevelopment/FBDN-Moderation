const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
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
      const search = await yts(query);

      if (!search.videos.length) {
        return interaction.editReply("❌ No results found.");
      }

      const video = search.videos[0];

      const stream = ytdl(video.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25
      });

      const resource = createAudioResource(stream);
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

      player.on("error", err => {
        console.error("Player error:", err);
      });

      interaction.editReply(`🎵 Now playing: **${video.title}**`);

    } catch (err) {
      console.error("ERROR:", err);
      interaction.editReply("❌ Error playing song.");
    }
  }
};
