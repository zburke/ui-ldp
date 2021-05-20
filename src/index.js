import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import { Loading, NavList, NavListItem, NavListSection, Paneset, Pane } from '@folio/stripes-components';
import loadConfig from './util/loadConfig';
import { LdpContext } from './LdpContext';
import BigError from './components/QueryBuilder/BigError';
import QueryBuilderRoute from './routes/QueryBuilderRoute';
import LogsRoute from './routes/LogsRoute';
import Settings from './settings';

const LdpConfig = {};

const Ldp = (props) => {
  const { actAs, stripes, match } = props;

  const [configLoaded, setConfigLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    loadConfig(stripes, LdpConfig, setConfigLoaded, setError);
  }, [stripes, stripes.okapi]);

  if (error) return <BigError message={error} />;
  if (!configLoaded) return <Loading size="xlarge" />;

  return (
    <LdpContext.Provider value={LdpConfig}>
      {actAs === 'settings' ?
        <Settings {...props} /> :
        <Paneset>
          <Pane defaultWidth="15%">
            <NavList>
              <NavListSection activeLink={window.location.pathname}>
                <NavListItem to={`${match.path}`}>Query Builder</NavListItem>
                {/* <NavListItem to={`${match.path}/logs`}>Logs</NavListItem> */}
              </NavListSection>
            </NavList>
          </Pane>

          <Switch>
            <Route
              path={match.path}
              exact
              render={(props2) => <QueryBuilderRoute {...props2} okapi={stripes.okapi} />}
            />
            <Route
              path={`${match.path}/logs`}
              exact
              render={(props2) => <LogsRoute {...props2} okapi={stripes.okapi} />}
            />
          </Switch>
        </Paneset>
      }
    </LdpContext.Provider>
  );
};

Ldp.propTypes = {
  match: PropTypes.object.isRequired,
  actAs: PropTypes.string.isRequired,
  stripes: PropTypes.shape({
    okapi: PropTypes.shape({
      url: PropTypes.string,
      tenant: PropTypes.string,
      token: PropTypes.string,
    }),
    connect: PropTypes.func
  })
};

export default Ldp;
