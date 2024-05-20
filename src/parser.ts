export interface Condition {
  enabled: boolean;
  name: string;
}

export interface Environment {
  conditions: Condition[];
  enabled: boolean;
  name: string;
}

export interface Feature {
  enabled: boolean;
  environments: Environment[];
  name: string;
}

export interface FlatFeature {
  condition?: string;
  conditionEnabled?: boolean;
  environment?: string;

  environmentEnabled?: boolean;

  feature: string;

  featureEnabled?: boolean;
}

export interface ParsedData {
  features: Feature[];
}

// export const parseMarkdown = (markdown: string): ParsedData => {
//   const lines = markdown.split('\n').filter((line) => line.trim() !== '');
//   const parsedData: ParsedData = { features: [] };

//   let currentFeature: Feature | null = null;
//   let currentEnvironment: Environment | null = null;

//   lines.forEach((line) => {
//     const trimmedLine = line.trim();
//     const level = line.search(/\S|$/); // Get indentation level

//     if (level === 0) {
//       // Top-level: Feature
//       if (!trimmedLine.startsWith('- [')) {
//         throw new Error(`Invalid format at top level: ${trimmedLine}`);
//       }
//       currentFeature = {
//         name: trimmedLine.slice(6),
//         enabled:
//           trimmedLine.startsWith('- [x]') || trimmedLine.startsWith('- [X]'),
//         environments: [],
//       };
//       parsedData.features.push(currentFeature);
//       currentEnvironment = null;
//     } else if (level === 2 && currentFeature) {
//       // Second-level: Environment
//       if (!trimmedLine.startsWith('- [')) {
//         throw new Error(`Invalid format at environment level: ${trimmedLine}`);
//       }
//       currentEnvironment = {
//         name: trimmedLine.slice(6),
//         enabled:
//           trimmedLine.startsWith('- [x]') || trimmedLine.startsWith('- [X]'),
//         conditions: [],
//       };
//       currentFeature.environments.push(currentEnvironment);
//     } else if (level === 4 && currentEnvironment) {
//       if (trimmedLine.length) {
//         // Third-level: Condition
//         if (!trimmedLine.startsWith('- [')) {
//           throw new Error(`Invalid format at condition level: ${trimmedLine}`);
//         }
//         const condition: Condition = {
//           name: trimmedLine.slice(6),
//           enabled:
//             trimmedLine.startsWith('- [x]') || trimmedLine.startsWith('- [X]'),
//         };
//         currentEnvironment.conditions.push(condition);
//       }
//     } else {
//       throw new Error(`Unexpected indentation or format: ${trimmedLine}`);
//     }
//   });

//   // Validate the parsed data
//   if (parsedData.features.length === 0) {
//     throw new Error('No top-level features found.');
//   }

//   parsedData.features.forEach((feature) => {
//     if (feature.environments.length === 0) {
//       throw new Error(`Feature "${feature.name}" has no environments.`);
//     }
//   });

//   return parsedData;
// };

export const parseMarkdown = (markdown: string): ParsedData => {
  const lines = markdown.split('\n').filter((line) => line.trim() !== '');
  const parsedData: ParsedData = { features: [] };

  let currentFeature: Feature | null = null;
  let currentEnvironment: Environment | null = null;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('## ')) {
      // Top-level: Feature
      const featureName = trimmedLine.slice(3).trim();
      currentFeature = {
        name: featureName,
        enabled: false,
        environments: [],
      };
      parsedData.features.push(currentFeature);
      currentEnvironment = null;
    } else if (trimmedLine === '- [ ] Enabled' && currentFeature) {
      // Feature enabled checkbox
      currentFeature.enabled = false;
    } else if (trimmedLine === '- [x] Enabled' && currentFeature) {
      // Feature enabled checkbox
      currentFeature.enabled = true;
    } else if (trimmedLine.startsWith('### ') && currentFeature) {
      // Second-level: Environment
      const environmentName = trimmedLine.slice(4).trim();
      currentEnvironment = {
        name: environmentName,
        enabled: false,
        conditions: [],
      };
      currentFeature.environments.push(currentEnvironment);
    } else if (trimmedLine === '- [ ] Enabled' && currentEnvironment) {
      // Environment enabled checkbox
      currentEnvironment.enabled = false;
    } else if (trimmedLine === '- [x] Enabled' && currentEnvironment) {
      // Environment enabled checkbox
      currentEnvironment.enabled = true;
    } else if (trimmedLine === '#### Conditions' && currentEnvironment) {
      // Conditions heading, do nothing
    } else if (trimmedLine.startsWith('- [ ]') && currentEnvironment) {
      // Condition
      const conditionName = trimmedLine.slice(6).trim();
      const condition: Condition = {
        name: conditionName,
        enabled: false,
      };
      currentEnvironment.conditions.push(condition);
    } else if (trimmedLine.startsWith('- [x]') && currentEnvironment) {
      // Condition
      const conditionName = trimmedLine.slice(6).trim();
      const condition: Condition = {
        name: conditionName,
        enabled: true,
      };
      currentEnvironment.conditions.push(condition);
    }
  });

  return parsedData;
};

export const getFlatFeatures = (parsedData: ParsedData): FlatFeature[] => {
  const flatFeatures: FlatFeature[] = [];

  parsedData.features.forEach((feature) => {
    feature.environments.forEach((environment) => {
      if (environment.conditions?.length) {
        environment.conditions.forEach((condition) => {
          flatFeatures.push({
            feature: feature.name,
            featureEnabled: feature.enabled,
            environment: environment.name,
            environmentEnabled: environment.enabled,
            condition: condition.name,
            conditionEnabled: condition.enabled,
          });
        });
      } else {
        flatFeatures.push({
          feature: feature.name,
          featureEnabled: feature.enabled,
          environment: environment.name,
          environmentEnabled: environment.enabled,
        });
      }
    });
  });

  return flatFeatures;
};

export const getEnabledFeaturesForEnvironment = (
  flatFeatures: FlatFeature[],
  environment: string
): FlatFeature[] =>
  flatFeatures.filter(
    (feature) =>
      feature.environment === environment &&
      feature.environmentEnabled &&
      (!feature.condition || feature.conditionEnabled)
  );
