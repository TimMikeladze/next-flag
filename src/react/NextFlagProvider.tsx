import { createContext, useEffect, useState } from 'react';
import { GetFeatures, NextFlagProviderProps } from '../types';
import { getFeatures } from '../client';

export const NextFlagContext = createContext<GetFeatures | undefined>(
  undefined
);

export const NextFlagProvider = (props: NextFlagProviderProps) => {
  const [loading, setLoading] = useState(false);

  const [features, setFeatures] = useState<GetFeatures>([]);

  const [error, setError] = useState<Error>();

  useEffect(() => {
    setLoading(true);
    getFeatures(props)
      .then((result) => {
        setFeatures(result);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props.endpoint, props.project, props.requestInit, props.environment]);

  if (loading) {
    return null;
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error(`NextFlag Error: ${error.message}`);
  }

  return (
    <NextFlagContext.Provider value={features}>
      {props.children}
    </NextFlagContext.Provider>
  );
};
