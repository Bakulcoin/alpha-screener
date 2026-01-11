import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { AnalysisOrchestrator } from '../../application/services/AnalysisOrchestrator';
import { AnalysisState } from '../../domain/value-objects/AnalysisState';

const STATE_MESSAGES: Record<AnalysisState, string> = {
  IDLE: 'Starting analysis...',
  FETCHING_DOCUMENTATION: 'Fetching documentation...',
  ANALYZING_DOCUMENTATION: 'Analyzing documentation with AI...',
  CHECKING_FUNDING_SIGNAL: 'Checking for funding signals...',
  FETCHING_FUNDING: 'Fetching funding data...',
  ANALYZING_FUNDING: 'Analyzing funding rounds...',
  FETCHING_MARKET_DATA: 'Fetching market data...',
  ANALYZING_MARKET: 'Analyzing market opportunity...',
  FETCHING_TEAM_DATA: 'Gathering team information...',
  ANALYZING_TEAM: 'Analyzing team background...',
  FETCHING_CODE: 'Fetching repository data...',
  ANALYZING_CODE: 'Analyzing codebase...',
  GENERATING_RATING: 'Generating final rating...',
  FORMATTING_OUTPUT: 'Preparing results...',
  COMPLETED: 'Analysis complete!',
  FAILED: 'Analysis failed',
  NO_FUNDING: 'No funding signals detected',
};

export class DiscordBot {
  private client: Client;
  private rest: REST;

  constructor(
    private token: string,
    private clientId: string,
    private orchestrator: AnalysisOrchestrator
  ) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    this.rest = new REST({ version: '10' }).setToken(token);

    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    await this.registerCommands();
    await this.client.login(this.token);
    console.log('Discord bot started');
  }

  async stop(): Promise<void> {
    this.client.destroy();
  }

  private async registerCommands(): Promise<void> {
    const commands = [
      new SlashCommandBuilder()
        .setName('analyze')
        .setDescription('Analyze a crypto/Web3 project')
        .addStringOption((option) =>
          option
            .setName('project')
            .setDescription('Project name, symbol, or identifier')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('docs').setDescription('Documentation URL').setRequired(false)
        )
        .addStringOption((option) =>
          option.setName('github').setDescription('GitHub repository URL').setRequired(false)
        )
        .addStringOption((option) =>
          option.setName('website').setDescription('Project website URL').setRequired(false)
        )
        .toJSON(),
    ];

    await this.rest.put(Routes.applicationCommands(this.clientId), { body: commands });
  }

  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user?.tag}`);
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'analyze') {
        await this.handleAnalyzeCommand(interaction);
      }
    });
  }

  private async handleAnalyzeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const project = interaction.options.getString('project', true);
    const docsUrl = interaction.options.getString('docs') || undefined;
    const githubUrl = interaction.options.getString('github') || undefined;
    const website = interaction.options.getString('website') || undefined;

    await interaction.deferReply();

    try {
      const progressEmbed = new EmbedBuilder()
        .setTitle(`Analyzing: ${project}`)
        .setDescription(STATE_MESSAGES.IDLE)
        .setColor(0x5865f2)
        .setTimestamp();

      await interaction.editReply({ embeds: [progressEmbed] });

      const result = await this.orchestrator.analyze(
        {
          name: project,
          docsUrl,
          githubUrl,
          website,
        },
        async (state) => {
          progressEmbed.setDescription(STATE_MESSAGES[state]);
          await interaction.editReply({ embeds: [progressEmbed] }).catch(() => {});
        }
      );

      if (result.noFunding) {
        const noFundingEmbed = new EmbedBuilder()
          .setTitle(`Analysis: ${project}`)
          .setDescription('**no funding**')
          .setColor(0xfee75c)
          .setTimestamp();

        await interaction.editReply({ embeds: [noFundingEmbed] });
        return;
      }

      const resultEmbed = this.createResultEmbed(result);
      const jsonAttachment = new AttachmentBuilder(Buffer.from(result.json, 'utf-8'), {
        name: `${project}-analysis.json`,
      });
      const mdAttachment = new AttachmentBuilder(Buffer.from(result.markdown, 'utf-8'), {
        name: `${project}-analysis.md`,
      });

      await interaction.editReply({
        embeds: [resultEmbed],
        files: [jsonAttachment, mdAttachment],
      });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle(`Analysis Failed: ${project}`)
        .setDescription(error instanceof Error ? error.message : 'Unknown error occurred')
        .setColor(0xed4245)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }

  private createResultEmbed(result: {
    analysis: {
      projectId: string;
      rating: {
        finalGrade: string;
        consistencyScore: number;
        opportunityScore: number;
        executionCredibilityScore: number;
        executiveSummary: string;
        strengths: string[];
        risks: string[];
        redFlags: string[];
      };
      documentation: { narrative: string };
      funding?: { totalRaisedUsd: number; stage: string };
    };
  }): EmbedBuilder {
    const { analysis } = result;
    const gradeColors: Record<string, number> = {
      A: 0x57f287,
      B: 0x5865f2,
      C: 0xfee75c,
      D: 0xed4245,
    };

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${analysis.projectId} Analysis`)
      .setColor(gradeColors[analysis.rating.finalGrade] || 0x5865f2)
      .setDescription(analysis.rating.executiveSummary)
      .addFields(
        {
          name: 'Final Grade',
          value: `**${analysis.rating.finalGrade}**`,
          inline: true,
        },
        {
          name: 'Narrative',
          value: analysis.documentation.narrative,
          inline: true,
        },
        {
          name: 'Scores',
          value: [
            `Consistency: ${analysis.rating.consistencyScore}/100`,
            `Opportunity: ${analysis.rating.opportunityScore}/100`,
            `Execution: ${analysis.rating.executionCredibilityScore}/100`,
          ].join('\n'),
          inline: false,
        }
      );

    if (analysis.funding) {
      embed.addFields({
        name: 'Funding',
        value: `$${this.formatNumber(analysis.funding.totalRaisedUsd)} (${analysis.funding.stage})`,
        inline: true,
      });
    }

    if (analysis.rating.strengths.length > 0) {
      embed.addFields({
        name: 'Strengths',
        value: analysis.rating.strengths.slice(0, 3).map((s) => `• ${s}`).join('\n'),
        inline: false,
      });
    }

    if (analysis.rating.redFlags.length > 0) {
      embed.addFields({
        name: '⚠️ Red Flags',
        value: analysis.rating.redFlags.map((f) => `• ${f}`).join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Alpha Screener' }).setTimestamp();

    return embed;
  }

  private formatNumber(num: number): string {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }
}
