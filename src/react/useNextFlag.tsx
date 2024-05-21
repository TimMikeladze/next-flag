import { useEffect, useState } from 'react';
import { GetFeatures, UseNextFlagHookProps } from '../types';

export const useNextFlag = (props: UseNextFlagHookProps = {}) => {
  const url = props.endpoint || '/api/next-flag';

  const [loading, setLoading] = useState(false);

  const [features, setFeatures] = useState<GetFeatures>([]);

  const [error, setError] = useState<Error>();

  const isEnabled = (feature: string | string[]) => {
    if (features.length === 0) {
      return false;
    }
    const array = Array.isArray(feature) ? feature : [feature];
    return array.every((x) => features.includes(x));
  };

  useEffect(() => {
    setLoading(true);
    fetch(url, props.requestInit)
      .then((res) => res.json())
      .then((data) => {
        setFeatures(data);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  return { loading, features, error, isEnabled };
};
