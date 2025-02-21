const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const wait = require('node:timers/promises').setTimeout;

async function buttonPages(interaction, pages, time = 60000) {
    if (!interaction) throw new Error("Please provide an interaction argument");
    if (!pages) throw new Error("Please provide a pages argument");
    if (!Array.isArray(pages)) throw new Error("Pages must be an array");

    if (typeof time !== "number") throw new Error("Time must be a number");
    if (parseInt(time) < 30000)
        throw new Error("Time must be greater than 30 seconds");

    if (pages.length === 1) {
        const page = await interaction.reply({
            embeds: pages,
            components: [],
            fetchReply: true,
        });

        return page;
    }

    const confirm = new ButtonBuilder()
        .setCustomId("confirm:button")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Danger);
    
    const cancel = new ButtonBuilder()
        .setCustomId("cancel:button")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder().addComponents(confirm, cancel);
    let index = 0;

    const currentPage = await interaction.reply({
        embeds: [pages[index]],
        components: [buttonRow],
        fetchReply: true,
    });

    const collector = currentPage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time,
    });

    collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: "Uh oh! You can't use these buttons", ephemeral: true });
        }
    
        if (i.customId === "confirm:button") {
            index = 1; // Success embed index

            // Ban the target member here
            const target = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: reason }).catch(err => {
                    console.error(`Failed to ban ${target.tag}:`, err);
                });
            } else {
                return i.reply({ content: `I cannot ban ${target.username}.`, ephemeral: true });
            }

        } else if (i.customId === "cancel:button") {
            index = 2; // Cancellation embed index
        }

        confirm.setDisabled(true);
        cancel.setDisabled(true);

        i.deferUpdate();

        await interaction.editReply({
            embeds: [pages[index]],
            components: [buttonRow],
        });
        collector.resetTimer();
    });

    collector.on("end", async (i) => {
        await currentPage.edit({
            embeds: [pages[index]],
            components: [],
        });
    });
    return currentPage;
}

module.exports = buttonPages;
