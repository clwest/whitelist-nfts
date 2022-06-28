import { Contract, providers, utils} from "ethers";
import Head from "next/head";
import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // keep track of if a users wallet is connected
  const [walletConnected, setWalletConnected] = useState(false);
  // track if presale has started 
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presale has ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading set to true while mining
  const [loading, setLoading] = useState(false);
  // check if current wallet is owner
  const [isOwner, setIsOwner] = useState(false);
  // tracks NFTs minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0")
  // Connect to MM
  const web3ModalRef = useRef();


  // Presale mint
  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      // Create an instance of the contract with a signer
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      )
      const tx = await whitelistContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for transaction to be mined
      await tx.wait();
      setLoading(false);
      window.alert("You seccesfully minted a Crypto Dev")
    } catch (err) {
      console.error(err)
    }
  }

  // Mint NFTs after presale ends
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // create a new instance of the contract with a signer
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      //' call the mint function
      const tx = await whitelistContract.mint({
        // parse 0.01 to a string using utils libarry
        value: utils.parseEther("0.01")
      });
      setLoading(true);
      // wait for transaction to get mined
      await tx.wait()
      setLoading(false);
      window.alert("You minted a Crypto Dev NFT");
    } catch (err) {
      console.error(err);
    }
  }

  const connectWallet = async () => {
    try {
      // get provider
      await getProviderOrSigner()
      setWalletConnected(true);
    } catch (err) {
      console.error(err)
    }
  }

  // start Presale for NFTs
  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // start the presale
      const tx = await whitelistContract.startPresale()
      setLoading(true);
      // wait for transaction to be mined
      await tx.wait()
      setLoading(false);
      // set presale start to trye
      await checkIfPresaleStarted()
    } catch (err) {
      console.error(err)
    }
  };

  // check if presale has started by queing the presaleStarted 
  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // call presale started
      const _presaleStarted = await nftContract.presaleStarted()
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err)
      return false;
    }
  } 

  // Check if presale has ended
  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      // access NFT 
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // call presale end
      const _presaleEnded = await nftContract.presaleEnded();

      // _presale ended is a Big number
      // Date.now()/1000 returns the current time in seconds
      // if _presaleEnded <= current time presale has ended
      const hasEnded = _presaleEnded.It(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _owner = await nftContract.owner();

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message)
    }
  }

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // call tokenIds from contract
      const _tokenIds = await nftContract.tokenIds();
      // convert to a big number string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err)
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // throws error if user is not on the Rinkeby network
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please make sure you are connected to the Rinkeby Network!");
      throw new Error("Change to the Rinkeby Network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  // useEffects are used to track state changes of the website

  useEffect(() => {
    // Create in Instance of Web3
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProdiver: false,
      })
      connectWallet();

      // Check if presale started
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded()
      }

      getTokenIdsMinted()

      const presaleEndedIntervale = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded()
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval)
          }
        }

      }, 5 * 1000)

      // set interval to get the number of tokenIds minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted()
      }, 5 * 1000)
    }
  }, [walletConnected])


  // Buttons based on state of Dapp

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      )
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>
    }
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>

      );
    }
    // Alert if presale hasn't started yet
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}> Presale has not started yet! </div>
        </div>

      )
    }
    // if presale has started but not ended
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!! If your address is whitelisted mint a NFT!
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 
          </button>
        </div>
      );
    }

    // Allow public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Minting is open to the Public!!
        </button>

      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}> Welcome to Crypto Devs</h1>
          <div className={styles.description}>
            Is an NFT collection for developers in Crypto
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
          </div>
          <div>
            <img className={styles.image} src="../cryptodevs/0.svg" />
          </div>
        </div>
        <footer className={styles.footer}>
          Made with &#10084; by some Donkey that loves web3!
        </footer>
      </div>
  )
}