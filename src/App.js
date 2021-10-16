import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import openseaLogo from "./assets/opensea.png";
import { css } from "@emotion/react";
import {ethers} from 'ethers';
import React, {useEffect, useState} from "react";
import { ENGINE_METHOD_CIPHERS } from 'constants';
import myEpicNft from './utils/MyEpicNFT.json';
import useWindowSize from 'react-use/lib/useWindowSize';
import Confetti from 'react-confetti';
import BarLoader from "react-spinners/BarLoader";

const CONTRACT_ADDRESS = "0x139ac92c08Ac164b47D56F94e19b5F114012264b";
// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "https://testnets.opensea.io/assets/squarenft-nk1xlvfo6u";
const TOTAL_MINT_COUNT = 50;



const App = () => {

  const [currentAddress, setCurrentAddress] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [currentLink, setCurrentLink] = useState("");
  const [countMinted, setCountMinted] = useState(0);
  const [minted, setMinted] = useState(false);
  const { width, height } = useWindowSize();
  const [currentOpenSeaLink, setCurrentOpenSeaLink] = useState("");
  const override = css`
    display: block;
    margin-top: 50px;
    margin-left: auto;
    margin-right: auto;
    border-color: red;
  `;

  

  const checkWallet = async () => {
    const {ethereum} = window;

    if (!ethereum){
      console.log('Need to have metamask');
      return;
    }else{
      console.log('We have ethereum object', ethereum);
    }

    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({method:'eth_accounts'});

    if (accounts.length !== 0){
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setupEventListener();
      setCurrentAddress(account);
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
    } else {
      console.log("No authorized account found")
    }
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4"; 
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;
      if (!ethereum){
        alert("Get MetaMask");
        return;
      }

      const accounts = await ethereum.request({method:"eth_requestAccounts"});
      console.log("Connected", accounts[0]);
      setCurrentAddress(accounts[0]);
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener()
    } catch (error){
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          // alert(`Hey there! We've minted your NFT and sent it to your wallet. 
          // It may be blank right now. It can take a max of 10 min to show up on OpenSea. 
          // Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
          setCurrentOpenSeaLink(`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNFT = async () => {
    
    try {
      const {ethereum} = window;

      if (ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas..")
        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Mining... please wait")
        await nftTxn.wait();
        console.log(`Mined, see transaction : https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        setLoading(false);
        setCurrentLink(`https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        setMinted(true);
      } else {
        console.lof("Ethereum objecy doesn't exist");
      }
    } catch (error){
      console.log(error)
    }
  }

  const askContractForMintCount = async () => {
    try {
      const {ethereum} = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS,myEpicNft.abi, signer);

        let countValue = await connectedContract.getTotalMintedNFT();
        return countValue.toNumber();
      } else {
        console.log("Ethereum object doesn't exist")
      }
    } catch(error){
      console.log(error);
    }
  }

  useEffect(async () => {
    const count = await askContractForMintCount();
    checkWallet();
    setCountMinted(count);
  }, [])

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMinting = () => {
    setLoading(true);
    setMinted(false);
    askContractToMintNFT();
  }

  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAddress === "" ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
              Connect to wallet
            </button>
          ) : (
            <><button disabled={isLoading} onClick={renderMinting} className="cta-button connect-wallet-button">
                {isLoading ? 'Minting...' : 'Mint NFTs'}
              </button>
              <br />
              <BarLoader color={"#36D7B7"} loading={isLoading} css={override} size={200} /></>
          )}
        </div>
        {minted ? (
          <div className="link-container">
            <Confetti
              width={width}
              height={height}
            />
            <button
              onClick={() => {
                window.open(currentLink, "_blank");
              }}
              className="cta-button connect-wallet-button"
            >🔗 See on Etherscan</button>
            <br />
            <br />
            <button
              onClick={() => {
                window.open(currentOpenSeaLink, "_blank");
              }}
              className="cta-button connect-wallet-button"
            >🌊 See OpenSea Collection</button>
          </div>
        ) : (
          ""
        )}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
