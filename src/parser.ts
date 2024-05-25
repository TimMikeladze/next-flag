/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
import { parse } from '@textlint/markdown-to-ast';
import { spaceSlug } from 'space-slug';
import { Feature, Features } from './types';

interface Node {
  children?: Node[];
  depth?: number;
  raw: string;

  type: string;
}

export const parseMarkdown = (markdown: string): Features => {
  const ast = parse(markdown);

  const isFeatureBlock = (node: Node) =>
    node?.type === 'Header' && node?.depth === 2;

  const isEnabled = (node: Node) =>
    (node?.type === 'List' || node?.type === 'ListItem') &&
    node?.raw.toLowerCase().trim().startsWith('- [x]');

  const isConditionsBlock = (node: Node) =>
    node?.type === 'Header' &&
    node?.raw.toLowerCase().trim() === '#### conditions' &&
    node?.depth === 4;

  const isEnvironmentsBlock = (node: Node) =>
    node?.type === 'Header' &&
    node?.raw.toLowerCase().startsWith('### ') &&
    node?.depth === 3;

  const isList = (node: Node) => node?.type === 'List';

  const cleanStartingHash = (text: string) => text.replace(/^#+\s*/, '');

  const cleanStartingCheckbox = (text: string) =>
    text.replace(/- \[x\]\s*/, '').replace(/- \[\s+\]\s*/, '');

  const features: Features = {};

  let currentFeature: Feature | null = null;

  for (
    let featureIndex = 0;
    featureIndex < ast.children.length;
    featureIndex++
  ) {
    if (!isFeatureBlock(ast.children[featureIndex])) {
      if (isConditionsBlock(ast.children[featureIndex])) {
        let conditionsBlockIndex = featureIndex + 1;
        while (isList(ast.children[conditionsBlockIndex])) {
          for (
            let conditionIndex = 0;
            conditionIndex <
            (ast.children[conditionsBlockIndex] as Node).children!.length;
            conditionIndex++
          ) {
            const conditionNode = (ast.children[conditionsBlockIndex] as Node)
              .children?.[conditionIndex];
            if (!conditionNode) {
              continue;
            }
            const conditionName = cleanStartingCheckbox(conditionNode.raw);
            const conditionSlug = spaceSlug([conditionName]);
            const conditionEnabled = isEnabled(conditionNode);
            if (currentFeature) {
              currentFeature.conditions[conditionSlug] = {
                name: conditionName,
                enabled: conditionEnabled,
              };
            }
          }
          conditionsBlockIndex++;
        }
      }

      if (isEnvironmentsBlock(ast.children[featureIndex])) {
        const environmentName = cleanStartingHash(
          ast.children[featureIndex].raw
        );
        const environmentSlug = spaceSlug([environmentName]);
        if (currentFeature) {
          currentFeature.environments[environmentSlug] = {
            name: environmentName,
            enabled: false,
          };
        }
        let environmentsBlockIndex = featureIndex + 1;
        while (isList(ast.children[environmentsBlockIndex])) {
          for (
            let environmentIndex = 0;
            environmentIndex <
            (ast.children[environmentsBlockIndex] as Node).children!.length;
            environmentIndex++
          ) {
            const environmentNode = (
              ast.children[environmentsBlockIndex] as Node
            ).children?.[environmentIndex];
            if (!environmentNode) {
              continue;
            }
            const environmentEnabled = isEnabled(environmentNode);
            if (currentFeature) {
              currentFeature.environments[environmentSlug] = {
                name: environmentName,
                enabled: environmentEnabled,
              };
            }
          }
          environmentsBlockIndex++;
        }
      }

      continue;
    }
    const featureName = cleanStartingHash(ast.children[featureIndex].raw);
    const featureSlug = spaceSlug([featureName]);
    features[featureSlug] = {
      name: featureName,
      environments: {},
      conditions: {},
      enabled: false,
    };
    currentFeature = features[featureSlug];
    let featureBlockIndex = featureIndex + 1;
    while (isList(ast.children[featureBlockIndex] as Node)) {
      const node = ast.children[featureBlockIndex] as Node;
      const enabled = isEnabled(node);
      if (currentFeature) {
        currentFeature.enabled = enabled;
      }
      featureBlockIndex++;
    }
  }

  return features;
};
