// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.10;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MintableERC20 is ERC20 {
    constructor() ERC20("Mint", "MINT") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
