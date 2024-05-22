import { useContext, useEffect, useState } from 'react';
import { GetFeatures, UseNextFlagHookProps } from '../types';
import { getFeatures, isEnabled } from '../client';
import { NextFlagContext } from './NextFlagProvider';

export const useNextFlag = (props: UseNextFlagHookProps = {}) => {
  const context = useContext(NextFlagContext);

  const [loading, setLoading] = useState(!context);

  const [features, setFeatures] = useState<GetFeatures>(context || []);

  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!context) {
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
    }
  }, [props.endpoint, props.project, props.requestInit]);

  const isFeatureEnabled = (feature: string | string[]) =>
    isEnabled(feature, features);

  return { loading, features, error, isFeatureEnabled };
};
