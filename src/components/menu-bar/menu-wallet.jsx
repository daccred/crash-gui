import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import { connect, disconnect } from "get-starknet";


import Button from '../button/button.jsx'
import { useConnectWallet } from "../../lib/web3/context/ConnectContext.jsx";
import { connectWallet, disconnectWallet } from "../../lib/web3/api/ConnectAPI.js";

import styles from './menu-bar.css';



function WalletConnector() {
  const { dispatch, connection } = useConnectWallet();


  async function onConnect() {
    const response = await connectWallet(dispatch, connect);
    if (!response) return;
  }

  async function onDisconnect() {
    await disconnectWallet(dispatch, disconnect);
  }
  return (
    <>
      {connection ? (

        <Button
          className={classNames(
            styles.menuBarItem,
            styles.hoverable,
            styles.mystuffButton
          )}
          iconClassName={styles.communityButtonIcon}
          onClick={onDisconnect}
        >
          <FormattedMessage
            defaultMessage="Disconnect Wallet"
            description="Label to disconnect stark wallet"
            id="gui.menuBar.disconnectWallet"
          />
        </Button>
      ) : (


        <Button
          className={classNames(
            styles.menuBarItem,
            styles.hoverable,
            styles.mystuffButton
          )}
          iconClassName={styles.communityButtonIcon}
          onClick={onConnect}

        >
          <FormattedMessage
            defaultMessage="Connect Wallet"
            description="Label for stark compatible wallet"
            id="gui.menuBar.connectWallet"
          />
        </Button>
      )}
    </>

  );
}

export default WalletConnector;
