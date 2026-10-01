import { openWebsite, OpenWebsiteParams, OpenWebsiteResult } from './openWebsite';

export type OpenUrlParams = OpenWebsiteParams;
export type OpenUrlResult = OpenWebsiteResult;

export function openUrl(params: OpenUrlParams): OpenUrlResult {
  return openWebsite(params);
}
