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
    error FailedToBurn(string tokenType, uint256 tokenId);
    error NotApproved(string tokenType, uint256 tokenId);

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

    function _exchangeUpperLevel(address from) internal {
        _mint(from, upperLevelId, 1, "");
    }

    function _exchangeClubLevel(address from) internal {
        _mint(from, clubLevelId, 1, "");
    }

    function _exchangeCourtside(address from) internal {
        _mint(from, courtsideId, 1, "");
    }
}
