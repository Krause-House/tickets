// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.10;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MintableERC721 is ERC721 {
    constructor() ERC721("Mint", "MINT") {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
