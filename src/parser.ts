/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
import { parse } from '@textlint/markdown-to-ast';
import { spaceSlug } from 'space-slug';
import { Environment, Feature, Features } from './types';

interface Node {
  children?: Node[];
  depth?: number;
  raw: string;

  type: string;
}

export const parseMarkdown = (markdown: string): Features => {
  const ast = parse(markdown);

  const isFeatureBlock = (node: Node) =>
    node.type === 'Header' && node.depth === 2;

  const isEnabled = (node: Node) =>
    (node.type === 'List' || node.type === 'ListItem') &&
    node.raw.toLowerCase().trim().startsWith('- [x]');

  const isConditionsBlock = (node: Node) =>
    node.type === 'Header' &&
    node.raw.toLowerCase().trim() === '#### conditions' &&
    node.depth === 4;

  const isEnvironmentsBlock = (node: Node) =>
    node.type === 'Header' &&
    node.raw.toLowerCase().startsWith('### ') &&
    node.depth === 3;

  const cleanStartingCheckbox = (text: string) =>
    text.replace(/- \[x\]\s*/, '');

  const isList = (node: Node) => node.type === 'List';

  const cleanStartingHash = (text: string) => text.replace(/^#+\s*/, '');

  const features: Features = {};

  let currentFeature: Feature | null = null;
  let currentEnvironment: Environment | null = null;
  let inConditions = false;
  let inEnvironments = false;

  for (let i = 0; i < ast.children.length; i++) {
    const node = ast.children[i] as Node;
    if (isFeatureBlock(node)) {
      const featureName = cleanStartingHash(node.raw);
      const featureSlug = spaceSlug([featureName]);
      features[featureSlug] = {
        name: featureName,
        enabled: false,
        environments: {},
        conditions: {},
      };
      currentFeature = features[featureSlug];
    } else if (currentFeature) {
      if (isEnabled(node) && !inConditions && !inEnvironments) {
        currentFeature.enabled = true;
        continue;
      }
      if (isConditionsBlock(node)) {
        inConditions = true;
        currentEnvironment = null;
        continue;
      }
      if (inConditions && !inEnvironments) {
        if (isList(node)) {
          (node as Node).children?.forEach((item) => {
            const enabled = isEnabled(item);
            const conditionName = spaceSlug([cleanStartingCheckbox(item.raw)]);
            if (currentFeature) {
              currentFeature.conditions[conditionName] = {
                name: conditionName,
                enabled,
              };
            }
          });
        } else {
          inConditions = false;
        }
      }
      if (!inConditions) {
        if (isEnvironmentsBlock(node)) {
          inEnvironments = true;
          const slug = spaceSlug([cleanStartingHash(node.raw)]);
          currentEnvironment = {
            name: cleanStartingHash(node.raw),
            enabled: isEnabled(node),
          };
          currentFeature.environments[slug] = currentEnvironment;
        } else if (currentEnvironment && isList(node)) {
          (node as Node).children?.forEach((item) => {
            const enabled = isEnabled(item);
            const environmentName = spaceSlug([
              cleanStartingCheckbox(item.raw),
            ]);
            if (currentFeature) {
              currentFeature.environments[environmentName] = {
                name: environmentName,
                enabled,
              };
            }
          });
        } else {
          inEnvironments = false;
        }
      }
    }
  }

  return features;
};
