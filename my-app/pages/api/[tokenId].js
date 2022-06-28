export default function handler(req, res) {
    // get tokenId from query params
    const tokenId = req.query.tokenId;

    // Pulling images from github (this is not decenterlized!)
    const image_url = "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";

    // sending metadata for a Crypto Dev nft
    // and making the metadata compatiable with Opensea

    res.status(200).json({
        name: "Crypto Dev #" + tokenId,
        description: "Crypto Dev is a collection of developers in crypto",
        image: image_url + tokenId + ".svg"
    })


}