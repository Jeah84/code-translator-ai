import { load, dump } from 'js-yaml';

export function formatJson(input: string, indent = 2): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}
export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}
export function formatYaml(input: string, indent = 2): string {
  return dump(load(input) as object, { indent, lineWidth: -1 });
}
export function minifyYaml(input: string): string {
  return dump(load(input) as object, { indent: 2, flowLevel: -1 });
}
export function jsonToYaml(input: string, indent = 2): string {
  return dump(JSON.parse(input), { indent, lineWidth: -1 });
}
export function yamlToJson(input: string, indent = 2): string {
  return JSON.stringify(load(input), null, indent);
}
