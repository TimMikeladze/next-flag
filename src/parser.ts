import { spaceSlug } from 'space-slug';
import { Condition, Environment, Feature, Features } from './types';

export const parseMarkdown = (markdown: string): Features => {
  const lines = markdown.split('\n');
  const features: Features = {};
  let currentFeature: Feature | null = null;
  let currentEnvironment: Environment | null = null;
  let currentConditions: Record<string, Condition> = {};
  let featureEnabled = false;
  let environmentEnabled = false;
  let conditionsEnabled = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('## ')) {
      // New feature section
      const featureName = line.substring(3).trim();
      const slug = spaceSlug([featureName]);
      currentFeature = {
        name: featureName,
        slug,
        enabled: featureEnabled,
        environments: {},
      };
      features[slug] = currentFeature;
      // Reset environment and conditions for new feature
      currentEnvironment = null;
      currentConditions = {};
      featureEnabled = false;
    } else if (line.startsWith('### ')) {
      // New environment section within the current feature
      const environmentName = spaceSlug([line.substring(4).trim()]);
      currentEnvironment = {
        name: environmentName,
        enabled: environmentEnabled,
        conditions: {},
      };
      if (currentFeature) {
        currentFeature.environments[environmentName] = currentEnvironment;
      }
      // Reset conditions for new environment
      currentConditions = {};
      environmentEnabled = false;
    } else if (line.startsWith('#### Conditions')) {
      // Conditions section, no additional processing needed
      // Reset conditions for new conditions section
      currentConditions = {};
      conditionsEnabled = false;
    } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
      // Handle checkbox lines
      const enabled = line.startsWith('- [x]');
      const item = line.substring(6).trim();

      if (currentEnvironment && !item.startsWith('Condition ')) {
        // Toggle environment enabled state
        currentEnvironment.enabled = enabled;
        environmentEnabled = enabled;
      } else if (currentFeature && !currentEnvironment) {
        // Toggle feature enabled state
        currentFeature.enabled = enabled;
        featureEnabled = enabled;
      } else if (
        currentEnvironment &&
        item.startsWith('Condition ') &&
        conditionsEnabled
      ) {
        // Add condition to the current environment if conditions section is enabled
        const conditionName = item.substring(11).trim();
        const conditionSlug = spaceSlug([conditionName]);
        currentConditions[conditionSlug] = {
          name: conditionName,
          enabled,
        };
        currentEnvironment.conditions = currentConditions;
      }
      // Check if conditions section is enabled
      if (item === 'Conditions' && (currentEnvironment || currentFeature)) {
        conditionsEnabled = enabled;
      }
    }
  }

  return features;
};
