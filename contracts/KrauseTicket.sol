// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.10;
import {ERC1155} from "@rari-capital/solmate/src/tokens/ERC1155.sol";

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract KrauseTickets is ERC1155, IERC721Receiver {
    event Exchanged(
        address exchanger,
        uint256 legacyTokenId,
        address legacyContract
    );

    string public constant upperLevelUri =
        "https://mirror-api.com/editions/custom/krause-house-crowdfund/1";
    uint256 public constant upperLevelId = 0;
    address public immutable legacyUpperLevel;

    string public constant clubLevelUri =
        "https://mirror-api.com/editions/crowdfunded/v3/metadata";
    uint256 public constant clubLevelId = 1;
    address public immutable legacyClubLevel;

    string public constant courtsideUri =
        "https://mirror-api.com/editions/crowdfunded/v3/metadata";
    uint256 public constant courtsideId = 2;
    address public immutable legacyCourtside;

    constructor(
        address _legacyUpperLevel,
        address _legacyClubLevel,
        address _legacyCourtside
    ) {
        legacyUpperLevel = _legacyUpperLevel;
        legacyClubLevel = _legacyClubLevel;
        legacyCourtside = _legacyCourtside;
    }

    function uri(uint256 id) public pure override returns (string memory) {
        if (id == upperLevelId) {
            return upperLevelUri;
        } else if (id == clubLevelId) {
            return clubLevelUri;
        } else if (id == courtsideId) {
            return courtsideUri;
        } else {
            return "";
        }
    }

    /// @notice Callback for receiving an ERC721 mints a ticket if the token was a legacy NFT
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) {
        if (msg.sender == legacyUpperLevel) {
            _exchangeUpperLevel(from);
        } else if (msg.sender == legacyClubLevel) {
            _exchangeClubLevel(from);
        } else if (msg.sender == legacyCourtside) {
            _exchangeCourtside(from);
        } else {
            return this.onERC721Received.selector;
        }

        emit Exchanged(from, tokenId, msg.sender);
        return this.onERC721Received.selector;
    }

    /// @notice Mint an upper level ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeUpperLevel(address to) internal {
        _mint(to, upperLevelId, 1, "");
    }

    /// @notice Mint a club level ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeClubLevel(address to) internal {
        _mint(to, clubLevelId, 1, "");
    }

    /// @notice Mint a courtside ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeCourtside(address to) internal {
        _mint(to, courtsideId, 1, "");
    }
}
