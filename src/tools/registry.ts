import { getCurrentTime, GetCurrentTimeParams } from './definitions/getCurrentTime';
import { getCurrentDate, GetCurrentDateParams } from './definitions/getCurrentDate';
import { calculate, CalculatorParams } from './definitions/calculator';
import { openWebsite, OpenWebsiteParams } from './definitions/openWebsite';
import { openUrl, OpenUrlParams } from './definitions/openUrl';
import { webSearch, WebSearchParams } from './definitions/webSearch';
import { openApplication, OpenApplicationParams } from './definitions/openApplication';
import { getSystemInformation } from './definitions/systemInformation';
import { getBatteryStatus } from './definitions/batteryStatus';
import { getVolume, setVolume, muteVolume } from './definitions/volumeControl';

export type ToolPermissionLevel = 'SAFE' | 'CONFIRMATION_REQUIRED' | 'DANGEROUS';

export interface ToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolParametersSchema {
  type: string;
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  displayName: string;
  description: string;
  category: 'system' | 'math' | 'web' | 'browser' | 'hardware';
  icon: string;
  permission: ToolPermissionLevel;
  parameters: ToolParametersSchema;
  execute: (params: TParams, confirmed?: boolean) => Promise<TResult> | TResult;
  formatCallHuman: (params: TParams) => string;
  formatResultHuman: (result: TResult) => string;
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // ----------------------------------------------------
    // STEP 5 SAFE CONVERSATIONAL & UTILITY TOOLS
    // ----------------------------------------------------

    // 1. get_current_time (SAFE)
    this.register({
      name: 'get_current_time',
      displayName: 'Current Time',
      description: "Returns the user's current local time and timezone.",
      category: 'system',
      icon: 'Clock',
      permission: 'SAFE',
      parameters: {
        type: 'OBJECT',
        properties: {
          timezone: {
            type: 'STRING',
            description: 'Optional IANA timezone string, e.g. "Asia/Kolkata", "America/New_York".',
          },
        },
      },
      execute: (params: GetCurrentTimeParams) => getCurrentTime(params),
      formatCallHuman: () => 'Checking local time',
      formatResultHuman: (res) => (res.success ? `${res.time} (${res.timezone})` : 'Time check failed'),
    });

    // 2. get_current_date (SAFE)
    this.register({
      name: 'get_current_date',
      displayName: 'Current Date',
      description: 'Returns the current local date, day of week, and year.',
      category: 'system',
      icon: 'Calendar',
      permission: 'SAFE',
      parameters: {
        type: 'OBJECT',
        properties: {
          timezone: {
            type: 'STRING',
            description: 'Optional IANA timezone string.',
          },
        },
      },
      execute: (params: GetCurrentDateParams) => getCurrentDate(params),
      formatCallHuman: () => 'Checking local date',
      formatResultHuman: (res) => (res.success ? `${res.date}` : 'Date check failed'),
    });

    // 3. calculator (SAFE)
    this.register({
      name: 'calculator',
      displayName: 'Calculator',
      description:
        'Perform basic and scientific mathematical calculations (arithmetic, percentages, powers, square roots). Never use eval.',
      category: 'math',
      icon: 'Calculator',
      permission: 'SAFE',
      parameters: {
        type: 'OBJECT',
        properties: {
          expression: {
            type: 'STRING',
            description: 'The mathematical expression to evaluate, e.g. "1250 * 0.18", "sqrt(144)", "45% of 800"',
          },
        },
        required: ['expression'],
      },
      execute: (params: CalculatorParams) => calculate(params),
      formatCallHuman: (params) => params?.expression || 'Calculate expression',
      formatResultHuman: (res) => (res.success ? `${res.result}` : `Error: ${res.error}`),
    });

    // 4. open_website (CONFIRMATION_REQUIRED)
    this.register({
      name: 'open_website',
      displayName: 'Open Website',
      description:
        'Open a safe website URL (e.g. google.com, youtube.com, github.com) in a new browser tab. Requires user confirmation.',
      category: 'browser',
      icon: 'Globe',
      permission: 'CONFIRMATION_REQUIRED',
      parameters: {
        type: 'OBJECT',
        properties: {
          url: {
            type: 'STRING',
            description: 'The safe web URL or domain to open, e.g. "https://youtube.com" or "github.com"',
          },
        },
        required: ['url'],
      },
      execute: (params: OpenWebsiteParams) => openWebsite(params),
      formatCallHuman: (params) => params?.url || 'Open website',
      formatResultHuman: (res) =>
        res.success
          ? `Opened ${res.domain || res.url}`
          : res.cancelled
          ? 'Cancelled by user'
          : `Failed: ${res.error}`,
    });

    // 5. open_url (CONFIRMATION_REQUIRED - Alias for open_website)
    this.register({
      name: 'open_url',
      displayName: 'Open URL',
      description:
        'Open a verified HTTP/HTTPS web address in a new browser tab. Requires user confirmation.',
      category: 'browser',
      icon: 'ExternalLink',
      permission: 'CONFIRMATION_REQUIRED',
      parameters: {
        type: 'OBJECT',
        properties: {
          url: {
            type: 'STRING',
            description: 'The HTTP/HTTPS website URL to open.',
          },
        },
        required: ['url'],
      },
      execute: (params: OpenUrlParams) => openUrl(params),
      formatCallHuman: (params) => params?.url || 'Open URL',
      formatResultHuman: (res) =>
        res.success ? `Opened ${res.domain || res.url}` : res.cancelled ? 'Cancelled by user' : `Failed: ${res.error}`,
    });

    // 6. web_search (SAFE)
    this.register({
      name: 'web_search',
      displayName: 'Web Search',
      description: 'Search the web for up-to-date information, news, or articles.',
      category: 'web',
      icon: 'Search',
      permission: 'SAFE',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: {
            type: 'STRING',
            description: 'The search query to look up on the web.',
          },
        },
        required: ['query'],
      },
      execute: (params: WebSearchParams) => webSearch(params),
      formatCallHuman: (params) => `Search: "${params?.query}"`,
      formatResultHuman: (res) => (res.success ? 'Results retrieved' : res.error || 'Search unavailable'),
    });

    // ----------------------------------------------------
    // STEP 6 LOCAL COMPUTER / SYSTEM CONTROL TOOLS
    // ----------------------------------------------------

    // 7. open_application (CONFIRMATION_REQUIRED)
    this.register({
      name: 'open_application',
      displayName: 'Open Application',
      description:
        'Open an approved application installed on the user computer (e.g. Chrome, VS Code, Notepad, Calculator, Terminal). Requires user confirmation. Arbitrary shell commands are strictly blocked.',
      category: 'system',
      icon: 'AppWindow',
      permission: 'CONFIRMATION_REQUIRED',
      parameters: {
        type: 'OBJECT',
        properties: {
          application: {
            type: 'STRING',
            description:
              'The name of the approved application to open (e.g. "chrome", "vscode", "notepad", "calculator", "terminal").',
          },
        },
        required: ['application'],
      },
      execute: (params: OpenApplicationParams, confirmed?: boolean) => openApplication(params, confirmed),
      formatCallHuman: (params) => `Open ${params?.application || 'Application'}`,
      formatResultHuman: (res) =>
        res.success
          ? res.message || `${res.application} opened`
          : res.cancelled
          ? 'Cancelled by user'
          : `Failed: ${res.error}`,
    });

    // 8. get_system_information (SAFE)
    this.register({
      name: 'get_system_information',
      displayName: 'System Information',
      description:
        'Retrieve safe system specifications: operating system, OS version, CPU name, CPU usage, RAM usage, total RAM, and available RAM. Never exposes sensitive credentials.',
      category: 'system',
      icon: 'Cpu',
      permission: 'SAFE',
      parameters: {
        type: 'OBJECT',
        properties: {},
      },
      execute: () => getSystemInformation(),
      formatCallHuman: () => 'Querying system specs',
      formatResultHuman: (res) =>
        res.success
          ? `${res.operatingSystem} • ${res.ram?.formatted || 'RAM OK'} • CPU ${res.cpu?.usagePercent ?? 0}%`
          : res.error || 'System query failed',
    });

    // 9. get_battery_status (SAFE)
    this.register({
      name: 'get_battery_status',
      displayName: 'Battery Status',
      description: 'Retrieve current battery percentage, charging state, or AC power status.',
      category: 'hardware',
      icon: 'BatteryCharging',
      permission: 'SAFE',
      parameters: {
        type: 'OBJECT',
        properties: {},
      },
      execute: () => getBatteryStatus(),
      formatCallHuman: () => 'Checking battery status',
      formatResultHuman: (res) =>
        res.success
          ? res.percentage !== null && res.percentage !== undefined
            ? `${res.percentage}% (${res.status})`
            : res.message || 'AC Power (Desktop)'
          : res.error || 'Battery check failed',
    });

    // 10. get_volume (SAFE)
    this.register({
      name: 'get_volume',
      displayName: 'System Volume',
      description: 'Retrieve the current system audio volume percentage (0-100) and mute status.',
      category: 'hardware',
      icon: 'Volume2',
      permission: 'SAFE',
      parameters: {
        type: 'OBJECT',
        properties: {},
      },
      execute: () => getVolume(),
      formatCallHuman: () => 'Checking audio volume',
      formatResultHuman: (res) => (res.success ? res.formatted || `${res.volume}%` : res.error || 'Volume check failed'),
    });

    // 11. set_volume (CONFIRMATION_REQUIRED)
    this.register({
      name: 'set_volume',
      displayName: 'Set Volume',
      description:
        'Adjust the computer system volume to a percentage level between 0 and 100. Requires user confirmation.',
      category: 'hardware',
      icon: 'Volume1',
      permission: 'CONFIRMATION_REQUIRED',
      parameters: {
        type: 'OBJECT',
        properties: {
          level: {
            type: 'NUMBER',
            description: 'The target volume percentage from 0 to 100.',
          },
        },
        required: ['level'],
      },
      execute: (params: { level: number }, confirmed?: boolean) => setVolume(params, confirmed),
      formatCallHuman: (params) => `Set volume to ${params?.level}%`,
      formatResultHuman: (res) =>
        res.success
          ? res.message || `Volume set to ${res.volume}%`
          : res.cancelled
          ? 'Cancelled by user'
          : `Failed: ${res.error}`,
    });

    // 12. mute_volume (CONFIRMATION_REQUIRED)
    this.register({
      name: 'mute_volume',
      displayName: 'Mute / Unmute Audio',
      description: 'Mute or unmute the system audio output. Requires user confirmation.',
      category: 'hardware',
      icon: 'VolumeX',
      permission: 'CONFIRMATION_REQUIRED',
      parameters: {
        type: 'OBJECT',
        properties: {
          muted: {
            type: 'BOOLEAN',
            description: 'True to mute system audio, false to unmute.',
          },
        },
        required: ['muted'],
      },
      execute: (params: { muted: boolean }, confirmed?: boolean) => muteVolume(params, confirmed),
      formatCallHuman: (params) => (params?.muted ? 'Mute computer audio' : 'Unmute computer audio'),
      formatResultHuman: (res) =>
        res.success
          ? res.message || (res.muted ? 'Audio muted' : 'Audio unmuted')
          : res.cancelled
          ? 'Cancelled by user'
          : `Failed: ${res.error}`,
    });
  }

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Generates Gemini SDK compliant FunctionDeclaration objects
   */
  getGeminiFunctionDeclarations() {
    return this.getAll().map((tool) => {
      const mappedProps: Record<string, any> = {};
      for (const [key, prop] of Object.entries(tool.parameters.properties)) {
        mappedProps[key] = {
          type: prop.type,
          description: prop.description,
        };
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'OBJECT',
          properties: mappedProps,
          required: tool.parameters.required || [],
        },
      };
    });
  }
}

export const toolRegistry = new ToolRegistry();
