import {
  Navigate,
  type NavigateProps,
  generatePath,
  useLocation,
  useParams,
} from 'react-router-dom';

export function NavigateToUrlSafePath({
  to,
  replace,
  state,
}: Omit<NavigateProps, 'to' | 'relative'> & { to: string }) {
  const { '*': splatPath, ...params } = useParams();

  return (
    <Navigate
      to={generatePath(to, { ...params, path: splatPath ?? '' })}
      relative="route"
      replace={replace}
      state={state}
    />
  );
}

export function RedirectAgaveToTapis({
  replace,
  state,
}: Omit<NavigateProps, 'to' | 'relative'>) {
  const location = useLocation();
  return (
    <Navigate
      to={{
        pathname: location.pathname.replace(/^\/agave(?=\/|$)/, '/tapis'),
        search: location.search,
        hash: location.hash,
      }}
      replace={replace}
      state={state}
    />
  );
}
